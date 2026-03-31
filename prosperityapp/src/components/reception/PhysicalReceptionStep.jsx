/**
 * PhysicalReceptionStep.jsx
 * Paso 4: Verificación física de la mercancía recibida.
 * Modo Manual: el usuario ingresa cantidad recibida por ítem.
 * Modo Scanner: usa el BarcodeScanner para confirmar ítems escaneando.
 */
import { useState, useRef } from 'react';
import { BarcodeScanner } from '../barcode/BarcodeScanner.jsx';

const ITEM_STATUS_OPTIONS = [
  { value: 'received', label: '✅ Recibido',       color: '#22c55e' },
  { value: 'partial',  label: '⚠️  Parcial',        color: '#f59e0b' },
  { value: 'missing',  label: '❌ Faltante',        color: '#ef4444' },
  { value: 'damaged',  label: '🛠️  Dañado',          color: '#f97316' },
];

export default function PhysicalReceptionStep({ items: initialItems, onNext }) {
  const [mode, setMode]         = useState('manual'); // 'manual' | 'scanner'
  const [items, setItems]       = useState(
    initialItems.map(it => ({ ...it, quantityReceived: it.quantityInvoiced, status: 'pending' }))
  );
  const [extraItems, setExtraItems] = useState([]); // Ítems que llegan y NO están en factura
  const [scannedIdx, setScannedIdx] = useState(null);

  const updateItem = (idx, key, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [key]: val };
      // Auto-calcular status por cantidad
      if (key === 'quantityReceived') {
        if (val <= 0)              updated.status = 'missing';
        else if (val < it.quantityInvoiced) updated.status = 'partial';
        else                       updated.status = 'received';
      }
      return updated;
    }));
  };

  // Modo scanner: buscar ítem por código de barras y marcar como recibido
  const handleScannedBarcode = (barcode) => {
    const idx = items.findIndex(it => it.barcode === barcode);
    if (idx >= 0) {
      setScannedIdx(idx);
      setItems(prev => prev.map((it, i) => i === idx
        ? { ...it, quantityReceived: Math.min((it.quantityReceived || 0) + 1, it.quantityInvoiced + 10), status: 'received' }
        : it
      ));
    } else {
      // Ítem extra no está en factura
      setExtraItems(prev => {
        const existing = prev.find(e => e.barcode === barcode);
        if (existing) {
          return prev.map(e => e.barcode === barcode ? { ...e, qty: e.qty + 1 } : e);
        }
        return [...prev, { barcode, description: `Código: ${barcode}`, qty: 1 }];
      });
    }
  };

  const handleNext = () => {
    // Calcular items con discrepancias
    const finalItems = items.map(it => {
      let status = it.status;
      if (status === 'pending') {
        if ((it.quantityReceived || 0) <= 0)                     status = 'missing';
        else if (it.quantityReceived < it.quantityInvoiced)      status = 'partial';
        else                                                      status = 'received';
      }
      return { ...it, status };
    });
    onNext({ items: finalItems, extraItems });
  };

  const summary = {
    received: items.filter(it => it.status === 'received').length,
    partial:  items.filter(it => it.status === 'partial').length,
    missing:  items.filter(it => it.status === 'missing').length,
    damaged:  items.filter(it => it.status === 'damaged').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Selector de modo */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Modo de verificación:</span>
        {[{ id: 'manual', icon: '✏️', label: 'Manual' }, { id: 'scanner', icon: '📷', label: 'Escáner' }].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding: '6px 18px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: 'none',
              background: mode === m.id ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: mode === m.id ? '#fff' : 'var(--text-muted)',
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Scanner activo */}
      {mode === 'scanner' && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent)' }}>
          <BarcodeScanner onScan={handleScannedBarcode} active={true} mode="camera" />
          {scannedIdx !== null && (
            <div style={{ padding: '0.5rem 1rem', background: '#22c55e22', color: '#22c55e', fontSize: '0.85rem', textAlign: 'center' }}>
              ✅ Escaneado: {items[scannedIdx]?.description}
            </div>
          )}
        </div>
      )}

      {/* Resumen */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(summary).map(([k, v]) => {
          const s = ITEM_STATUS_OPTIONS.find(s => s.value === k);
          return (
            <div key={k} style={{ flex: 1, minWidth: '80px', padding: '0.5rem', borderRadius: '8px', background: s.color + '11', textAlign: 'center', border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{v}</div>
              <div style={{ fontSize: '0.7rem', color: s.color }}>{s.label.split(' ')[1]}</div>
            </div>
          );
        })}
        {extraItems.length > 0 && (
          <div style={{ flex: 1, minWidth: '80px', padding: '0.5rem', borderRadius: '8px', background: '#a855f711', textAlign: 'center', border: '1px solid #a855f733' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#a855f7' }}>{extraItems.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#a855f7' }}>Extra(s)</div>
          </div>
        )}
      </div>

      {/* Tabla de ítems */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-main)' }}>
              {['Producto', 'Facturado', 'Recibido', 'Estado', 'Observación'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const statusInfo = ITEM_STATUS_OPTIONS.find(s => s.value === item.status) || ITEM_STATUS_OPTIONS[0];
              const isHighlighted = scannedIdx === idx;
              return (
                <tr key={idx} style={{
                  borderBottom: '1px solid var(--border-main)',
                  background: isHighlighted ? '#22c55e11' : idx % 2 ? 'var(--bg-secondary)' : 'transparent',
                  transition: 'background 0.4s',
                }}>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                    {item.barcode && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🔖 {item.barcode}</div>}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{item.quantityInvoiced}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <input
                      type="number"
                      min="0"
                      value={item.quantityReceived ?? item.quantityInvoiced}
                      onChange={e => updateItem(idx, 'quantityReceived', parseFloat(e.target.value) || 0)}
                      disabled={mode === 'scanner'}
                      style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--bg-secondary)', color: 'var(--text-main)', textAlign: 'center', fontSize: '0.85rem' }}
                    />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <select
                      value={item.status}
                      onChange={e => updateItem(idx, 'status', e.target.value)}
                      style={{ background: statusInfo.color + '22', color: statusInfo.color, border: `1px solid ${statusInfo.color}55`, borderRadius: '6px', padding: '3px 8px', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {ITEM_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <input
                      value={item.observations || ''}
                      onChange={e => updateItem(idx, 'observations', e.target.value)}
                      placeholder="Opcional…"
                      style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-main)', color: 'var(--text-main)', fontSize: '0.82rem', padding: '2px 0' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ítems extra (no en factura) */}
      {extraItems.length > 0 && (
        <div style={{ padding: '1rem', borderRadius: '10px', background: '#a855f711', border: '1px solid #a855f733' }}>
          <h4 style={{ margin: '0 0 0.5rem', color: '#a855f7', fontSize: '0.9rem' }}>
            🔮 Ítems recibidos NO incluidos en la factura
          </h4>
          {extraItems.map((ex, i) => (
            <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              • {ex.description} × {ex.qty}
            </div>
          ))}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
            En el siguiente paso podrás crear estos productos o marcarlos para devolución.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleNext} className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 600 }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}
