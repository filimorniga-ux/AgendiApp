/**
 * ClosureStep.jsx
 * Paso 6: Resumen final + observaciones + guardar.
 * Ejecuta la transacción completa en Supabase:
 *  1. Crear/actualizar proveedor
 *  2. Crear reception en invoice_receptions
 *  3. Insertar reception_items
 *  4. Crear/actualizar productos en inventario (retail/technical)
 *  5. Insertar stock_movements (entrada)
 *  6. Actualizar precios si se confirmó
 */
import { useState } from 'react';
import { supabase } from '../../supabase/client.js';
import { useBusiness } from '../../context/BusinessContext.jsx';

const STATUS_OPTIONS = [
  { value: 'complete',  label: '✅ Completo',           color: '#22c55e' },
  { value: 'partial',   label: '⚠️  Con faltantes',      color: '#f59e0b' },
  { value: 'damaged',   label: '🛠️  Con daños',           color: '#f97316' },
  { value: 'rejected',  label: '❌ Rechazado',           color: '#ef4444' },
];

export default function ClosureStep({ sessionData, onFinished }) {
  const { supplier: supplierData, supplierId, mode: supplierMode,
          items, extraItems, extraDecisions, extraTypes, linkedProducts, priceDecisions,
          invoice } = sessionData;
  const { businessId } = useBusiness();

  const [receptionStatus, setReceptionStatus] = useState('complete');
  const [observations, setObservations]        = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Calcular totales
  const totalInvoiced  = items.reduce((s, it) => s + (it.totalCost || it.unitCost * it.quantityInvoiced || 0), 0);
  const totalReceived  = items.reduce((s, it) => s + (it.unitCost * (it.quantityReceived ?? it.quantityInvoiced) || 0), 0);
  const newProducts    = items.filter(it => it.isNewProduct);
  const discrepant     = items.filter(it => ['partial', 'missing', 'damaged'].includes(it.status));

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    setError('');

    try {
      // ── 1. Proveedor ──────────────────────────────────────────────
      let resolvedSupplierId = supplierId;

      if (supplierMode === 'new') {
        const { data: newSupplier, error: supErr } = await supabase
          .from('suppliers')
          .insert({
            business_id:      businessId,
            nombre:           supplierData.razonSocial,
            nombre_fantasia:  supplierData.nombreFantasia,
            rut:              supplierData.rut,
            email:            supplierData.email,
            telefono:         supplierData.telefono,
            direccion:        supplierData.direccion,
            country_code:     supplierData.country_code || 'CL',
          })
          .select('id')
          .single();
        if (supErr) throw supErr;
        resolvedSupplierId = newSupplier.id;
      } else if (supplierMode === 'update' && supplierId) {
        await supabase.from('suppliers').update({
          nombre:           supplierData.razonSocial,
          nombre_fantasia:  supplierData.nombreFantasia,
          rut:              supplierData.rut,
          email:            supplierData.email,
          telefono:         supplierData.telefono,
          direccion:        supplierData.direccion,
        }).eq('id', supplierId);
      }

      // ── 2. Crear recepción ────────────────────────────────────────
      const { data: reception, error: recErr } = await supabase
        .from('invoice_receptions')
        .insert({
          business_id:     businessId,
          supplier_id:     resolvedSupplierId,
          invoice_number:  invoice?.invoiceNumber || '',
          invoice_date:    invoice?.invoiceDate   || null,
          folio:           invoice?.folio         || '',
          raw_source:      sessionData.raw_source || 'manual',
          status:          receptionStatus,
          observations,
          total_invoiced:  totalInvoiced,
          total_received:  totalReceived,
        })
        .select('id')
        .single();
      if (recErr) throw recErr;
      const receptionId = reception.id;

      // ── 3. Insertar líneas ────────────────────────────────────────
      // ── 3. Crear nuevos productos en inventario ANTES de las líneas de recepción ──
      for (const it of newProducts) {
        if (!it.inventoryType) continue;
        const table = it.inventoryType === 'technical' ? 'technical_inventory' : 'retail_inventory';
        const { data: newProd, error: invErr } = await supabase.from(table).insert({
          business_id:    businessId,
          nombre:         it.description,
          barcode:        it.barcode        || null,
          sku_proveedor:  it.skuProveedor   || null,
          costo:          it.unitCost,
          stock:          0, // Inicializar en 0, el stock se ajustará con el movimiento de stock
        }).select('id').single();

        if (invErr) {
          console.warn('[ClosureStep] Error creando producto:', it.description, invErr.message);
        } else {
          it.inventoryId = newProd.id;
        }
      }

      // Crear productos extra o vincularlos a existentes ANTES de las líneas de recepción
      if (extraItems && extraItems.length > 0) {
        for (let i = 0; i < extraItems.length; i++) {
          const decision = extraDecisions?.[i] || 'ignore';
          const ex = extraItems[i];

          if (decision === 'create') {
            const invType = extraTypes?.[i] || 'retail';
            const table = invType === 'technical' ? 'technical_inventory' : 'retail_inventory';

            const { data: newExtraProd, error: exInvErr } = await supabase.from(table).insert({
              business_id:    businessId,
              nombre:         ex.description,
              barcode:        ex.barcode || null,
              costo:          0, // Inicializar en 0, se puede editar luego en inventario
              stock:          0, // Inicializar en 0, el stock se ajustará con el movimiento de stock
            }).select('id').single();

            if (exInvErr) {
              console.warn('[ClosureStep] Error creando producto extra:', ex.description, exInvErr.message);
            } else {
              ex.inventoryId = newExtraProd.id;
              ex.inventoryType = invType;
            }
          } else if (decision === 'link') {
            const linkedProd = linkedProducts?.[i];
            if (linkedProd) {
              ex.inventoryId = linkedProd.id;
              ex.inventoryType = linkedProd.inventoryType;
            }
          }
        }
      }

      // ── 4. Insertar líneas ────────────────────────────────────────
      const receptionItemsData = items.map(it => ({
        reception_id:       receptionId,
        business_id:        businessId,
        inventory_id:       it.inventoryId   || null,
        inventory_type:     it.inventoryType || null,
        description:        it.description,
        barcode:            it.barcode        || null,
        sku_proveedor:      it.skuProveedor   || null,
        quantity_invoiced:  it.quantityInvoiced,
        quantity_received:  it.quantityReceived ?? it.quantityInvoiced,
        unit_cost:          it.unitCost,
        total_cost:         it.totalCost || it.unitCost * it.quantityInvoiced,
        iva_pct:            it.ivaPct || 19,
        status:             it.status || 'received',
        is_new_product:     it.isNewProduct || false,
        observations:       it.observations || null,
      }));

      // Agregar extraItems a reception_items
      if (extraItems && extraItems.length > 0) {
        extraItems.forEach((ex, i) => {
          const decision = extraDecisions?.[i] || 'ignore';
          if (decision === 'ignore') return;

          receptionItemsData.push({
            reception_id:       receptionId,
            business_id:        businessId,
            inventory_id:       ex.inventoryId || null,
            inventory_type:     ex.inventoryType || null,
            description:        ex.description,
            barcode:            ex.barcode || null,
            sku_proveedor:      null,
            quantity_invoiced:  0,
            quantity_received:  ex.qty,
            unit_cost:          0,
            total_cost:         0,
            iva_pct:            19,
            status:             decision === 'return' ? 'returned' : 'extra',
            is_new_product:     decision === 'create',
            observations:       `Ítem extra no facturado (${decision})`,
          });
        });
      }

      const { error: itemsErr } = await supabase.from('reception_items').insert(receptionItemsData);
      if (itemsErr) throw itemsErr;

      // ── 5. Actualizar precios si se confirmó ──────────────────────
      for (const it of items.filter(i => i.priceChanged && i.inventoryId)) {
        const decision = priceDecisions?.[it.description];
        if (decision !== 'update') continue;
        const table = it.inventoryType === 'technical' ? 'technical_inventory' : 'retail_inventory';
        await supabase.from(table).update({ costo: it.unitCost }).eq('id', it.inventoryId);
      }

      // ── 6. Movimientos de stock ───────────────────────────────────
      const movements = items
        .filter(it => it.inventoryId && (it.quantityReceived ?? it.quantityInvoiced) > 0)
        .map(it => ({
          business_id:    businessId,
          inventory_id:   it.inventoryId,
          inventory_type: it.inventoryType,
          type:           'entrada',
          quantity:       it.quantityReceived ?? it.quantityInvoiced,
          reason:         `Recepción pedido #${invoice?.folio || receptionId.slice(0, 8)}`,
          reference_id:   receptionId,
        }));

      if (extraItems && extraItems.length > 0) {
        extraItems.forEach((ex, i) => {
          const decision = extraDecisions?.[i] || 'ignore';
          if ((decision === 'create' || decision === 'link') && ex.inventoryId) {
            movements.push({
              business_id:    businessId,
              inventory_id:   ex.inventoryId,
              inventory_type: ex.inventoryType,
              type:           'entrada',
              quantity:       ex.qty,
              reason:         `Recepción pedido #${invoice?.folio || receptionId.slice(0, 8)} (Ítem extra)`,
              reference_id:   receptionId,
            });
          }
        });
      }

      if (movements.length > 0) {
        await supabase.from('stock_movements').insert(movements);
      }

      onFinished(receptionId);
    } catch (err) {
      console.error('[ClosureStep]', err);
      setError('Error al guardar: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = STATUS_OPTIONS.find(s => s.value === receptionStatus) || STATUS_OPTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Resumen de la recepción */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total facturado',   val: `$${totalInvoiced.toLocaleString()}`,  color: '#3b82f6' },
          { label: 'Total recibido',    val: `$${totalReceived.toLocaleString()}`,   color: '#22c55e' },
          { label: 'Productos nuevos',  val: newProducts.length,                     color: '#f59e0b' },
          { label: 'Con discrepancias', val: discrepant.length,                      color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)', textAlign: 'center', border: `1px solid ${s.color}33` }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Estado del pedido */}
      <div>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
          Estado del pedido
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setReceptionStatus(opt.value)}
              style={{
                padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: 'none',
                background: receptionStatus === opt.value ? opt.color : opt.color + '22',
                color: receptionStatus === opt.value ? '#fff' : opt.color,
                border: `1px solid ${opt.color}55`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
          Observaciones generales
        </label>
        <textarea
          value={observations}
          onChange={e => setObservations(e.target.value)}
          placeholder="Ej: Caja llegó abierta. Faltaron 3 unidades que el transportista confirmó quedarán en próximo envío."
          rows={3}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#ef444422', border: '1px solid #ef444444', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Botón guardar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ padding: '12px 36px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? '⏳ Guardando…' : '💾 Confirmar recepción'}
        </button>
      </div>
    </div>
  );
}
