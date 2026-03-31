-- Function to process a full merchandise reception in a single atomic transaction.
-- If any step fails, the entire transaction is rolled back.

CREATE OR REPLACE FUNCTION process_reception_transaction(
  p_business_id UUID,
  p_supplier_mode TEXT,
  p_supplier_id UUID,
  p_supplier_data JSONB,
  p_invoice_data JSONB,
  p_reception_status TEXT,
  p_observations TEXT,
  p_total_invoiced NUMERIC,
  p_total_received NUMERIC,
  p_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_supplier_id UUID;
  v_reception_id UUID;
  v_item JSONB;
  v_inventory_id UUID;
  v_quantity_received NUMERIC;
BEGIN
  -- 1. Supplier
  IF p_supplier_mode = 'new' THEN
    INSERT INTO suppliers (
      business_id, nombre, nombre_fantasia, rut, email, telefono, direccion, country_code
    ) VALUES (
      p_business_id,
      p_supplier_data->>'razonSocial',
      p_supplier_data->>'nombreFantasia',
      p_supplier_data->>'rut',
      p_supplier_data->>'email',
      p_supplier_data->>'telefono',
      p_supplier_data->>'direccion',
      COALESCE(p_supplier_data->>'country_code', 'CL')
    ) RETURNING id INTO v_supplier_id;
  ELSIF p_supplier_mode = 'update' AND p_supplier_id IS NOT NULL THEN
    UPDATE suppliers SET
      nombre = p_supplier_data->>'razonSocial',
      nombre_fantasia = p_supplier_data->>'nombreFantasia',
      rut = p_supplier_data->>'rut',
      email = p_supplier_data->>'email',
      telefono = p_supplier_data->>'telefono',
      direccion = p_supplier_data->>'direccion'
    WHERE id = p_supplier_id;
    v_supplier_id := p_supplier_id;
  ELSE
    v_supplier_id := p_supplier_id;
  END IF;

  -- 2. Create reception
  INSERT INTO invoice_receptions (
    business_id,
    supplier_id,
    invoice_number,
    invoice_date,
    folio,
    raw_source,
    status,
    observations,
    total_invoiced,
    total_received
  ) VALUES (
    p_business_id,
    v_supplier_id,
    COALESCE(p_invoice_data->>'invoiceNumber', ''),
    NULLIF(p_invoice_data->>'invoiceDate', '')::DATE,
    COALESCE(p_invoice_data->>'folio', ''),
    COALESCE(p_invoice_data->>'raw_source', 'manual'),
    p_reception_status,
    p_observations,
    p_total_invoiced,
    p_total_received
  ) RETURNING id INTO v_reception_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_inventory_id := NULLIF(v_item->>'inventoryId', '')::UUID;
    v_quantity_received := COALESCE((v_item->>'quantityReceived')::NUMERIC, (v_item->>'quantityInvoiced')::NUMERIC);

    -- Create new product if needed
    IF (v_item->>'isNewProduct')::BOOLEAN = true AND v_item->>'inventoryType' IS NOT NULL THEN
      IF v_item->>'inventoryType' = 'technical' THEN
        INSERT INTO technical_inventory (
          business_id, nombre, barcode, sku_proveedor, costo, stock
        ) VALUES (
          p_business_id,
          v_item->>'description',
          v_item->>'barcode',
          v_item->>'skuProveedor',
          (v_item->>'unitCost')::NUMERIC,
          v_quantity_received
        ) RETURNING id INTO v_inventory_id;
      ELSIF v_item->>'inventoryType' = 'retail' THEN
        INSERT INTO retail_inventory (
          business_id, nombre, barcode, sku_proveedor, costo, stock
        ) VALUES (
          p_business_id,
          v_item->>'description',
          v_item->>'barcode',
          v_item->>'skuProveedor',
          (v_item->>'unitCost')::NUMERIC,
          v_quantity_received
        ) RETURNING id INTO v_inventory_id;
      END IF;
    END IF;

    -- Update existing product price if requested
    IF (v_item->>'isNewProduct')::BOOLEAN = false AND (v_item->>'updatePrice')::BOOLEAN = true AND v_inventory_id IS NOT NULL THEN
       IF v_item->>'inventoryType' = 'technical' THEN
         UPDATE technical_inventory SET costo = (v_item->>'unitCost')::NUMERIC WHERE id = v_inventory_id;
       ELSIF v_item->>'inventoryType' = 'retail' THEN
         UPDATE retail_inventory SET costo = (v_item->>'unitCost')::NUMERIC WHERE id = v_inventory_id;
       END IF;
    END IF;

    -- 3. Insert line
    INSERT INTO reception_items (
      reception_id,
      business_id,
      inventory_id,
      inventory_type,
      description,
      barcode,
      sku_proveedor,
      quantity_invoiced,
      quantity_received,
      unit_cost,
      total_cost,
      iva_pct,
      status,
      is_new_product,
      observations
    ) VALUES (
      v_reception_id,
      p_business_id,
      v_inventory_id,
      v_item->>'inventoryType',
      v_item->>'description',
      v_item->>'barcode',
      v_item->>'skuProveedor',
      (v_item->>'quantityInvoiced')::NUMERIC,
      v_quantity_received,
      (v_item->>'unitCost')::NUMERIC,
      COALESCE((v_item->>'totalCost')::NUMERIC, (v_item->>'unitCost')::NUMERIC * (v_item->>'quantityInvoiced')::NUMERIC),
      COALESCE((v_item->>'ivaPct')::NUMERIC, 19),
      COALESCE(v_item->>'status', 'received'),
      COALESCE((v_item->>'isNewProduct')::BOOLEAN, false),
      v_item->>'observations'
    );

    -- 6. Stock movement
    IF v_inventory_id IS NOT NULL AND v_quantity_received > 0 THEN
      INSERT INTO stock_movements (
        business_id,
        inventory_id,
        inventory_type,
        type,
        quantity,
        reason,
        reference_id
      ) VALUES (
        p_business_id,
        v_inventory_id,
        v_item->>'inventoryType',
        'entrada',
        v_quantity_received,
        'Recepción pedido #' || COALESCE(p_invoice_data->>'folio', substring(v_reception_id::TEXT from 1 for 8)),
        v_reception_id::TEXT
      );
    END IF;

  END LOOP;

  RETURN v_reception_id;
END;
$$ LANGUAGE plpgsql;
