/**
 * DiscrepancyStep.jsx
 * Paso 5: Gestión de discrepancias.
 * - Ítems faltantes o dañados → observación
 * - Ítems extra (no en factura) → crear producto nuevo O marcar para devolución
 * - Alerta de cambio de precio → confirmar o rechazar actualización
 */
import { useState, useMemo } from 'react';
import SearchableDropdown from '../ui/SearchableDropdown.jsx';
import { useInventory } from '../../context/collections/InventoryContext';

export default function DiscrepancyStep({ items, extraItems, onNext }) {
  const {
    retailInventory,
    technicalInventory
  } = useInventory();
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
      <div className="recepcion-success-card">
        <div className="recepcion-success-icon">🎉</div>
        <h3 className="recepcion-success-title">¡Sin discrepancias!</h3>
        <p className="recepcion-success-text">El pedido llegó completo y en orden.</p>
        <button onClick={() => onNext({ extraDecisions: {}, priceDecisions: {} })} className="recepcion-btn-primary">
          Continuar →
        </button>
      </div>
    );
  }

  return (
    <div className="recepcion-step-body recepcion-gap-1-5rem">

      {/* Discrepancias de cantidad */}
      {discrepant.length > 0 && (
        <section>
          <h3 className="recepcion-section-title">
            ⚠️ Ítems con cantidad incorrecta o daño ({discrepant.length})
          </h3>
          <div className="recepcion-flex-col recepcion-gap-05">
            {discrepant.map((item, i) => {
              const themeColors = { partial: 'warning', missing: 'error', damaged: 'orange' };
              const themeColor = themeColors[item.status] || 'warning';

              return (
                <div key={i} className={`recepcion-disc-card recepcion-disc-card--${themeColor}`}>
                  <div>
                    <span className="recepcion-disc-title">{item.description}</span>
                    <div className={`recepcion-disc-detail recepcion-disc-detail--${themeColor}`}>
                      Facturado: {item.quantityInvoiced} · Recibido: {item.quantityReceived}
                      {item.status === 'damaged' && ' · Dañado'}
                    </div>
                    {item.observations && <div className="recepcion-text-078rem recepcion-text-muted">📝 {item.observations}</div>}
                  </div>
                  <span className={`recepcion-status-badge recepcion-status-badge--${themeColor}`}>
                    {item.status === 'partial' ? '⚠️ Parcial' : item.status === 'missing' ? '❌ Faltante' : '🛠️ Dañado'}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="recepcion-section-hint">
            Estos ítems quedarán registrados con su estado real. Puedes usarlos para reclamos al proveedor o transportista.
          </p>
        </section>
      )}

      {/* Cambio de precios */}
      {priceChanged.length > 0 && (
        <section>
          <h3 className="recepcion-section-title">
            💰 Cambio de precio de costo ({priceChanged.length})
          </h3>
          <div className="recepcion-flex-col recepcion-gap-05">
            {priceChanged.map((item, i) => (
              <div key={i} className="recepcion-disc-card recepcion-disc-card--orange">
                <div>
                  <span className="recepcion-disc-title">{item.description}</span>
                  <div className="recepcion-disc-detail recepcion-disc-detail--orange">
                    Precio anterior: <strong>${item.prevCost?.toLocaleString()}</strong> → Nuevo: <strong>${item.unitCost?.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="recepcion-gap-05-row">
                  {[['update', '✅ Actualizar precio'], ['keep', '🔒 Mantener anterior']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setPriceDecisions(p => ({ ...p, [item.description]: val }))}
                      className={`recepcion-decision-btn ${priceDecisions[item.description] === val ? 'active' : ''}`}
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
          <h3 className="recepcion-section-title">
            🔮 Ítems extra recibidos no incluidos en la factura ({extraItems.length})
          </h3>
          <div className="recepcion-flex-col recepcion-gap-05">
            {extraItems.map((ex, i) => (
              <div key={i} className="recepcion-disc-card recepcion-disc-card--purple">
                <div>
                  <span className="recepcion-disc-title">{ex.description}</span>
                  <div className="recepcion-disc-detail recepcion-disc-detail--purple">Cantidad: {ex.qty}</div>
                </div>
                <div className="recepcion-gap-05-row-wrap">
                  {[['create', '➕ Crear'], ['link', '🔗 Vincular'], ['return', '🔁 Devolver'], ['ignore', '✖️ Ignorar']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setExtraDecisions(p => ({ ...p, [i]: val }))}
                      className={`recepcion-decision-btn ${extraDecisions[i] === val ? 'active' : ''}`}
                    >
                      {label}
                    </button>
                  ))}

                  {extraDecisions[i] === 'create' && (
                    <select
                      className="recepcion-select"
                      value={extraTypes[i]}
                      onChange={e => setExtraTypes(p => ({ ...p, [i]: e.target.value }))}
                    >
                      <option value="retail">🛍️ Retail</option>
                      <option value="technical">🔧 Técnico</option>
                    </select>
                  )}

                  {extraDecisions[i] === 'link' && (
                    <div className="recepcion-w-250">
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

      <div className="recepcion-actions">
        <button onClick={handleNext} className="recepcion-btn-primary">
          Siguiente →
        </button>
      </div>
    </div>
  );
}
