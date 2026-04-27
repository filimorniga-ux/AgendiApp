/**
 * PhysicalReceptionStep.jsx
 * Paso 4: Verificación física de la mercancía recibida.
 * Modo Manual: el usuario ingresa cantidad recibida por ítem.
 * Modo Scanner: usa el BarcodeScanner para confirmar ítems escaneando.
 */
import { useState } from 'react';
import { BarcodeScanner } from '../barcode/BarcodeScanner.jsx';
import { safeNum } from '../../lib/mathUtils';

const ITEM_STATUS_OPTIONS = [
  { value: 'received', label: '✅ Recibido',       themeColor: 'success' },
  { value: 'partial',  label: '⚠️  Parcial',        themeColor: 'warning' },
  { value: 'missing',  label: '❌ Faltante',        themeColor: 'error' },
  { value: 'damaged',  label: '🛠️  Dañado',          themeColor: 'orange' },
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

      let finalVal = val;
      if (key === 'quantityReceived') {
        const invoiced = safeNum(it.quantityInvoiced);
        // Regla de negocio: Máximo 10 unidades sobre lo facturado
        finalVal = Math.min(safeNum(val), invoiced + 10);
      }

      const updated = { ...it, [key]: finalVal };
      // Auto-calcular status por cantidad
      if (key === 'quantityReceived') {
        if (finalVal <= 0)              updated.status = 'missing';
        else if (finalVal < it.quantityInvoiced) updated.status = 'partial';
        else                       updated.status = 'received';
      }
      return updated;
    }));
  };

  const handleBlur = (idx, val) => {
    const num = safeNum(val);
    updateItem(idx, 'quantityReceived', Number(num.toFixed(4)));
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
    <div className="recepcion-step-body">
      {/* Selector de modo */}
      <div className="recepcion-mode-toggle">
        <span className="recepcion-mode-label">Modo de verificación:</span>
        {[{ id: 'manual', icon: '✏️', label: 'Manual' }, { id: 'scanner', icon: '📷', label: 'Escáner' }].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`recepcion-mode-btn ${mode === m.id ? 'active' : ''}`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Scanner activo */}
      {mode === 'scanner' && (
        <div className="recepcion-scanner-area">
          <BarcodeScanner onScan={handleScannedBarcode} active={true} mode="camera" />
          {scannedIdx !== null && (
            <div className="recepcion-scan-confirmed">
              ✅ Escaneado: {items[scannedIdx]?.description}
            </div>
          )}
        </div>
      )}

      {/* Resumen */}
      <div className="recepcion-summary-row">
        {Object.entries(summary).map(([k, v]) => {
          const s = ITEM_STATUS_OPTIONS.find(s => s.value === k);
          return (
            <div key={k} className={`recepcion-summary-card recepcion-summary-card--${s.themeColor}`}>
              <div className={`recepcion-summary-val recepcion-summary-val--${s.themeColor}`}>{v}</div>
              <div className={`recepcion-summary-label recepcion-summary-label--${s.themeColor}`}>{s.label.split(' ')[1]}</div>
            </div>
          );
        })}
        {extraItems.length > 0 && (
          <div className="recepcion-summary-card recepcion-summary-card--purple">
            <div className="recepcion-summary-val recepcion-summary-val--purple">{extraItems.length}</div>
            <div className="recepcion-summary-label recepcion-summary-label--purple">Extra(s)</div>
          </div>
        )}
      </div>

      {/* Tabla de ítems */}
      <div className="recepcion-table-wrap">
        <table className="recepcion-table">
          <thead>
            <tr>
              {['Producto', 'Facturado', 'Recibido', 'Estado', 'Observación'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const statusInfo = ITEM_STATUS_OPTIONS.find(s => s.value === item.status) || ITEM_STATUS_OPTIONS[0];
              const isHighlighted = scannedIdx === idx;
              return (
                <tr key={idx} className={isHighlighted ? 'recepcion-tr-highlight' : ''}>
                  <td>
                    <div className="recepcion-font-600">{item.description}</div>
                    {item.barcode && <div className="recepcion-text-072rem recepcion-text-muted">🔖 {item.barcode}</div>}
                  </td>
                  <td className="recepcion-text-center recepcion-font-600">{item.quantityInvoiced}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="recepcion-table-input-num recepcion-table-input-physical"
                      value={item.quantityReceived ?? item.quantityInvoiced}
                      onChange={e => updateItem(idx, 'quantityReceived', parseFloat(e.target.value) || 0)}
                      onBlur={e => handleBlur(idx, e.target.value)}
                      disabled={mode === 'scanner'}
                    />
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={e => updateItem(idx, 'status', e.target.value)}
                      className={`recepcion-select recepcion-select--${statusInfo.themeColor}`}
                    >
                      {ITEM_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="recepcion-table-input"
                      value={item.observations || ''}
                      onChange={e => updateItem(idx, 'observations', e.target.value)}
                      placeholder="Opcional…"
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
        <div className="recepcion-extras-section">
          <h4 className="recepcion-extras-title">
            🔮 Ítems recibidos NO incluidos en la factura
          </h4>
          {extraItems.map((ex, i) => (
            <div key={i} className="recepcion-text-085rem recepcion-text-main">
              • {ex.description} × {ex.qty}
            </div>
          ))}
          <p className="recepcion-extras-hint">
            En el siguiente paso podrás crear estos productos o marcarlos para devolución.
          </p>
        </div>
      )}

      <div className="recepcion-actions">
        <button onClick={handleNext} className="recepcion-btn-primary">
          Siguiente →
        </button>
      </div>
    </div>
  );
}
