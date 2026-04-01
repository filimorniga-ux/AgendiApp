/**
 * OrderReviewStep.jsx
 * Paso 3: Revisión de líneas del pedido.
 * Cruza cada ítem con el inventario existente.
 * Permite edición inline, asignar tipo de inventario, y marcar ítems nuevos.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client.js';
import { useBusiness } from '../../context/BusinessContext.jsx';

const STATUS_ICONS = {
  found_retail:    { icon: '🛍️', label: 'Retail',       color: '#22c55e' },
  found_technical: { icon: '🔧', label: 'Técnico',      color: '#3b82f6' },
  new:             { icon: '🆕', label: 'Nuevo',         color: '#f59e0b' },
  price_changed:   { icon: '⚠️',  label: 'Precio cambió',color: '#f97316' },
};

export default function OrderReviewStep({ items: initialItems, onNext }) {
  const { businessId } = useBusiness();
  const [items, setItems]     = useState(initialItems || []);
  const [matches, setMatches] = useState({}); // { idx: { type, product, priceChanged } }
  const [loading, setLoading] = useState(true);

  // Cruzar cada ítem con inventarios
  useEffect(() => {
    async function matchItems() {
      if (!businessId) return;
      const results = {};

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const bc   = item.barcode?.trim();
        const sku  = item.skuProveedor?.trim();
        const desc = item.description?.trim();

        let found = null;
        let type  = null;

        // Buscar por barcode o SKU en retail_inventory
        if (bc || sku) {
          const query = supabase.from('retail_inventory').select('*')
            .eq('business_id', businessId);
          if (bc)  query.or(`barcode.eq.${bc},sku_proveedor.eq.${sku || ''}`);
          else if (sku) query.eq('sku_proveedor', sku);
          const { data } = await query.limit(1).maybeSingle();
          if (data) { found = data; type = 'retail'; }
        }

        // Si no encontró, buscar en technical_inventory
        if (!found && (bc || sku)) {
          const query2 = supabase.from('technical_inventory').select('*')
            .eq('business_id', businessId);
          if (bc)  query2.or(`barcode.eq.${bc},sku_proveedor.eq.${sku || ''}`);
          else if (sku) query2.eq('sku_proveedor', sku);
          const { data: data2 } = await query2.limit(1).maybeSingle();
          if (data2) { found = data2; type = 'technical'; }
        }

        // Si tampoco, buscar por descripción (coincidencia parcial)
        if (!found && desc) {
          const { data: byName } = await supabase.from('retail_inventory')
            .select('*').eq('business_id', businessId)
            .ilike('nombre', `%${desc.substring(0, 20)}%`)
            .limit(1).maybeSingle();
          if (byName) { found = byName; type = 'retail'; }
        }

        const prevCost = found?.costo ?? found?.precio_costo ?? null;
        const priceChanged = found && prevCost !== null && prevCost !== item.unitCost;

        results[i] = { found, type, priceChanged, prevCost };
      }

      setMatches(results);
      setLoading(false);
    }

    matchItems();
  }, [businessId]);

  const updateItem = (idx, key, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };

  const handleNext = () => {
    const enriched = items.map((it, i) => ({
      ...it,
      inventoryId:   matches[i]?.found?.id || null,
      inventoryType: it.inventoryType || matches[i]?.type || null,
      isNewProduct:  !matches[i]?.found,
      priceChanged:  matches[i]?.priceChanged || false,
      prevCost:      matches[i]?.prevCost || null,
    }));
    onNext(enriched);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
      🔍 Cruzando ítems con inventario…
    </div>
  );

  return (
    <div className="recepcion-step-body">
      {/* Resumen */}
      <div className="recepcion-summary-row">
        {[
          { label: 'Total ítems', val: items.length, color: 'var(--color-text-main)' },
          { label: 'Encontrados', val: Object.values(matches).filter(m => m?.found).length, color: '#22c55e' },
          { label: 'Nuevos', val: Object.values(matches).filter(m => !m?.found).length, color: '#f59e0b' },
          { label: 'Precio diferente', val: Object.values(matches).filter(m => m?.priceChanged).length, color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="recepcion-summary-card">
            <div className="recepcion-summary-val" style={{ color: s.color }}>{s.val}</div>
            <div className="recepcion-summary-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla de ítems */}
      <div className="recepcion-table-wrap">
        <table className="recepcion-table">
          <thead>
            <tr>
              {['Estado', 'Descripción', 'Cód. Barras', 'SKU Prov.', 'Cant.', 'Costo Unit.', 'IVA%', 'Inventario'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const match = matches[idx];
              const statusKey = !match?.found ? 'new'
                              : match.priceChanged ? 'price_changed'
                              : match.type === 'technical' ? 'found_technical'
                              : 'found_retail';
              const statusInfo = STATUS_ICONS[statusKey];

              return (
                <tr key={idx}>
                  {/* Estado */}
                  <td>
                    <span
                      className="recepcion-status-badge"
                      style={{ background: statusInfo.color + '18', color: statusInfo.color, border: `1px solid ${statusInfo.color}33` }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                    {match?.priceChanged && (
                      <div style={{ fontSize: '0.7rem', color: '#f97316', marginTop: '2px' }}>
                        ${match.prevCost?.toLocaleString()} → ${item.unitCost?.toLocaleString()}
                      </div>
                    )}
                  </td>

                  {/* Descripción editable */}
                  <td style={{ minWidth: '160px' }}>
                    <input
                      className="recepcion-table-input"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                    />
                  </td>

                  {/* Código de barras */}
                  <td>
                    <input
                      className="recepcion-table-input"
                      value={item.barcode || ''}
                      onChange={e => updateItem(idx, 'barcode', e.target.value)}
                      placeholder="—"
                      style={{ width: '110px' }}
                    />
                  </td>

                  {/* SKU proveedor */}
                  <td>
                    <input
                      className="recepcion-table-input"
                      value={item.skuProveedor || ''}
                      onChange={e => updateItem(idx, 'skuProveedor', e.target.value)}
                      placeholder="—"
                      style={{ width: '90px' }}
                    />
                  </td>

                  {/* Cantidad */}
                  <td>
                    <input
                      className="recepcion-table-input-num"
                      type="number"
                      value={item.quantityInvoiced}
                      onChange={e => updateItem(idx, 'quantityInvoiced', parseFloat(e.target.value) || 0)}
                      style={{ width: '60px' }}
                    />
                  </td>

                  {/* Costo unitario */}
                  <td>
                    <input
                      className="recepcion-table-input-num"
                      type="number"
                      value={item.unitCost}
                      onChange={e => updateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                      style={{ width: '90px' }}
                    />
                  </td>

                  {/* IVA% */}
                  <td>
                    <input
                      className="recepcion-table-input-num"
                      type="number"
                      value={item.ivaPct}
                      onChange={e => updateItem(idx, 'ivaPct', parseFloat(e.target.value) || 19)}
                      style={{ width: '50px' }}
                    />
                  </td>

                  {/* Tipo inventario (solo para productos nuevos) */}
                  <td>
                    {!match?.found ? (
                      <select
                        className="recepcion-select"
                        value={item.inventoryType || ''}
                        onChange={e => updateItem(idx, 'inventoryType', e.target.value)}
                      >
                        <option value="">Seleccionar…</option>
                        <option value="retail">🛍️ Retail</option>
                        <option value="technical">🔧 Técnico</option>
                      </select>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {match.type === 'retail' ? '🛍️ Retail' : '🔧 Técnico'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="recepcion-actions">
        <button onClick={handleNext} className="recepcion-btn-primary">
          Siguiente →
        </button>
      </div>
    </div>
  );
}
