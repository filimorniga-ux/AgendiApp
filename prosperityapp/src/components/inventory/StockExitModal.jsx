/**
 * StockExitModal.jsx
 * Modal de salida de mercancía (desde bodega o vitrina).
 */
import { useState, useContext } from 'react';
import { supabase } from '../../supabase/client';
import { BusinessContext } from '../../context/BusinessContext';
import PinModal from '../modals/PinModal';

const EXIT_REASONS = [
  { value: 'uso_servicio', label: '🔧 Uso en servicio' },
  { value: 'venta',        label: '💰 Venta directa' },
  { value: 'merma',        label: '🗑️ Merma / vencimiento' },
  { value: 'prestamo',     label: '🤝 Préstamo' },
  { value: 'otro',         label: '📝 Otro' },
];

export function StockExitModal({ product, inventoryType, onClose, onSuccess }) {
  const { businessId } = useContext(BusinessContext);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('uso_servicio');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPinForMerma, setShowPinForMerma] = useState(false);

  const table = inventoryType === 'technical' ? 'technical_inventory' : 'retail_inventory';
  const currentStock = product?.stock_current ?? 0;
  const newStock = Math.max(0, currentStock - Number(qty));
  const isInsufficient = Number(qty) > currentStock;

  async function handleConfirm(pinNotes = null, authData = null) {
    if (qty <= 0 || isInsufficient) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Descontar del inventario
      const { error: updErr } = await supabase
        .from(table)
        .update({ stock_current: newStock, updated_at: new Date().toISOString() })
        .eq('id', product.id);
      if (updErr) throw updErr;

      // 2. Registrar movimiento
      const authorText = authData ? `[Autorizado por: ${authData.name}]` : `[Autorizado]`;
      const finalNotes = pinNotes ? `${authorText} ${pinNotes}${notes ? ' | ' + notes : ''}` : (notes || null);
      const { error: movErr } = await supabase
        .from('stock_movements')
        .insert({
          business_id:    businessId,
          product_id:     product.id,
          product_name:   product.name,
          amount:         -Number(qty),
          new_stock:      newStock,
          movement_type:  'exit',
          inventory_type: inventoryType,
          barcode:        product.barcode ?? null,
          reason:         EXIT_REASONS.find(r => r.value === reason)?.label ?? reason,
          notes:          finalNotes,
        });
      if (movErr) throw movErr;

      // 3. Si fue merma, registrar en audit_log
      if (reason === 'merma') {
        await supabase.from('audit_log').insert({
          business_id: businessId,
          action: 'stock_shrinkage',
          entity_table: table,
          entity_id: product.id,
          notes: finalNotes,
          details: { product_name: product.name, qty: Number(qty), previous_stock: currentStock, new_stock: newStock, author_id: authData?.id || null },
        }).catch(console.warn);
      }

      onSuccess?.({ product, newStock, qty: Number(qty) });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Error al registrar salida.');
    } finally {
      setLoading(false);
    }
  }

  // Gate: si es merma, pedir PIN primero
  function handleConfirmClick() {
    if (reason === 'merma') {
      setShowPinForMerma(true);
    } else {
      handleConfirm();
    }
  }

  return (
    <div className="bc-modal-overlay modal-backdrop" role="dialog" aria-modal="true" aria-label="Salida de mercancía">
      <div className="bc-modal modal-content">
        <div className="bc-modal__header bc-modal__header--exit">
          <span className="bc-modal__icon">📤</span>
          <h2>Salida de Mercancía</h2>
          <button onClick={onClose} className="bc-modal__close" aria-label="Cerrar">✕</button>
        </div>

        <div className="bc-modal__product-card">
          <span className="bc-modal__inv-badge bc-modal__inv-badge--exit">
            {inventoryType === 'technical' ? 'Técnico' : 'Retail'}
          </span>
          <p className="bc-modal__product-name">{product?.name}</p>
          {product?.brand && <p className="bc-modal__product-brand">{product.brand}</p>}
          {product?.barcode && <p className="bc-modal__product-code">🔖 {product.barcode}</p>}
        </div>

        <div className="bc-modal__stock-row">
          <div className="bc-modal__stock-item">
            <span className="bc-modal__stock-label">Stock actual</span>
            <span className="bc-modal__stock-value">{currentStock}</span>
          </div>
          <span className="bc-modal__stock-arrow">→</span>
          <div className="bc-modal__stock-item bc-modal__stock-item--new">
            <span className="bc-modal__stock-label">Stock nuevo</span>
            <span className={`bc-modal__stock-value ${isInsufficient ? 'bc-modal__stock-value--danger' : 'bc-modal__stock-value--exit'}`}>
              {isInsufficient ? '⚠️ Insuficiente' : newStock}
            </span>
          </div>
        </div>

        <div className="bc-modal__fields">
          <label className="bc-modal__label">
            Cantidad a retirar
            <input
              type="number" min="1" max={currentStock} value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className={`bc-modal__input ${isInsufficient ? 'bc-modal__input--error' : ''}`}
              autoFocus
            />
            {isInsufficient && (
              <span className="bc-modal__field-error">Stock insuficiente (disponible: {currentStock})</span>
            )}
          </label>

          <label className="bc-modal__label">
            Motivo de salida
            <select value={reason} onChange={e => setReason(e.target.value)} className="bc-modal__input bc-modal__select">
              {EXIT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>

          <label className="bc-modal__label">
            Notas (opcional)
            <input
              type="text" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
              className="bc-modal__input"
            />
          </label>
        </div>

        {error && <p className="bc-modal__error">{error}</p>}

        <div className="bc-modal__actions">
          <button onClick={onClose} className="bc-modal__btn bc-modal__btn--cancel" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={handleConfirmClick}
            className="bc-modal__btn bc-modal__btn--exit"
            disabled={loading || qty <= 0 || isInsufficient}
          >
            {loading ? 'Guardando…' : `📤 Retirar ${qty} unid.`}
          </button>
        </div>

        {/* PinModal para mermas */}
        <PinModal
          isOpen={showPinForMerma}
          operation="stock_shrinkage"
          onClose={() => setShowPinForMerma(false)}
          onSuccess={({ notes: pinNotes, authData }) => {
            setShowPinForMerma(false);
            handleConfirm(pinNotes, authData);
          }}
        />
      </div>
    </div>
  );
}
