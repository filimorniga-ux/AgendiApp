/**
 * DiscrepancyStep.jsx
 * Paso 5: Gestión de discrepancias.
 * - Ítems faltantes o dañados → observación
 * - Ítems extra (no en factura) → crear producto nuevo O marcar para devolución
 * - Alerta de cambio de precio → confirmar o rechazar actualización
 */
import { useState, useMemo } from 'react';
import SearchableDropdown from '../ui/SearchableDropdown.jsx';
import { useData } from '../../context/DataContext.jsx';

export default function DiscrepancyStep({ items, extraItems, onNext }) {
  const { retailInventory, technicalInventory } = useData();
  const discrepant = items.filter(it => ['partial', 'missing', 'damaged'].includes(it.status));
  const priceChanged = items.filter(it => it.priceChanged);

  const [extraDecisions, setExtraDecisions] = useState(
    (extraItems || []).reduce((acc, ex, i) => ({ ...acc, [i]: 'return' }), {})
  );
  const [extraTypes, setExtraTypes] = useState(
    (extraItems || []).reduce((acc, ex, i) => ({ ...acc, [i]: 'retail' }), {})
  );
  const [linkedProducts, setLinkedProducts] = useState({});
  const [priceDecisions, setPriceDecisions] = useState(
    priceChanged.reduce((acc, it) => ({ ...acc, [it.description]: 'update' }), {})
  );

  const allProducts = useMemo(() => {
    const retail = (retailInventory || []).map(p => ({ ...p, inventoryType: 'retail', name: `🛍️ ${p.nombre}` }));
    const tech = (technicalInventory || []).map(p => ({ ...p, inventoryType: 'technical', name: `🔧 ${p.nombre}` }));
    return [...retail, ...tech];
  }, [retailInventory, technicalInventory]);

  const hasAnything = discrepant.length > 0 || (extraItems?.length || 0) > 0 || priceChanged.length > 0;

  const handleNext = () => {
    onNext({
      extraDecisions,   // { idx: 'create' | 'link' | 'return' | 'ignore' }
      extraTypes,       // { idx: 'retail' | 'technical' }
      linkedProducts,   // { idx: { id, inventoryType, name, ... } }
      priceDecisions,   // { description: 'update' | 'keep' }
    });
  };

  if (!hasAnything) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h3 style={{ color: 'var(--text-main)', margin: 0 }}>¡Sin discrepancias!</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>El pedido llegó completo y en orden.</p>
        <button onClick={() => onNext({ extraDecisions: {}, priceDecisions: {} })} className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 600 }}>
          Continuar →
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Discrepancias de cantidad */}
      {discrepant.length > 0 && (
        <section>
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Ítems con cantidad incorrecta o daño ({discrepant.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {discrepant.map((item, i) => {
              const statusColors = { partial: '#f59e0b', missing: '#ef4444', damaged: '#f97316' };
              const color = statusColors[item.status] || '#f59e0b';
              return (
                <div key={i} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: color + '11', border: `1px solid ${color}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.description}</span>
                    <div style={{ fontSize: '0.8rem', color }}>
                      Facturado: {item.quantityInvoiced} · Recibido: {item.quantityReceived}
                      {item.status === 'damaged' && ' · Dañado'}
                    </div>
                    {item.observations && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📝 {item.observations}</div>}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.8rem', background: color + '22', color, border: `1px solid ${color}55`, fontWeight: 600 }}>
                    {item.status === 'partial' ? '⚠️ Parcial' : item.status === 'missing' ? '❌ Faltante' : '🛠️ Dañado'}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
            Estos ítems quedarán registrados con su estado real. Puedes usarlos para reclamos al proveedor o transportista.
          </p>
        </section>
      )}

      {/* Cambio de precios */}
      {priceChanged.length > 0 && (
        <section>
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💰 Cambio de precio de costo ({priceChanged.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {priceChanged.map((item, i) => (
              <div key={i} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#f9731611', border: '1px solid #f9731633', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.description}</span>
                  <div style={{ fontSize: '0.82rem', color: '#f97316' }}>
                    Precio anterior: <strong>${item.prevCost?.toLocaleString()}</strong> → Nuevo: <strong>${item.unitCost?.toLocaleString()}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[['update', '✅ Actualizar precio'], ['keep', '🔒 Mantener anterior']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setPriceDecisions(p => ({ ...p, [item.description]: val }))}
                      style={{
                        padding: '4px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', border: 'none', fontWeight: 600,
                        background: priceDecisions[item.description] === val ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: priceDecisions[item.description] === val ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ítems extra (no estaban en la factura) */}
      {(extraItems?.length || 0) > 0 && (
        <section>
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔮 Ítems extra recibidos no incluidos en la factura ({extraItems.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {extraItems.map((ex, i) => (
              <div key={i} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#a855f711', border: '1px solid #a855f733', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ex.description}</span>
                  <div style={{ fontSize: '0.8rem', color: '#a855f7' }}>Cantidad: {ex.qty}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[['create', '➕ Crear'], ['link', '🔗 Vincular'], ['return', '🔁 Devolver'], ['ignore', '✖️ Ignorar']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setExtraDecisions(p => ({ ...p, [i]: val }))}
                      style={{
                        padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', border: 'none', fontWeight: 600,
                        background: extraDecisions[i] === val ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: extraDecisions[i] === val ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {label}
                    </button>
                  ))}

                  {extraDecisions[i] === 'create' && (
                    <select
                      value={extraTypes[i]}
                      onChange={e => setExtraTypes(p => ({ ...p, [i]: e.target.value }))}
                      style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-main)', color: 'var(--text-main)'
                      }}
                    >
                      <option value="retail">🛍️ Retail</option>
                      <option value="technical">🔧 Técnico</option>
                    </select>
                  )}

                  {extraDecisions[i] === 'link' && (
                    <div style={{ width: '250px' }}>
                      <SearchableDropdown
                        items={allProducts}
                        placeholder="Buscar producto existente..."
                        onSelect={item => setLinkedProducts(p => ({ ...p, [i]: item }))}
                        initialValue={linkedProducts[i]}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleNext} className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 600 }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}
