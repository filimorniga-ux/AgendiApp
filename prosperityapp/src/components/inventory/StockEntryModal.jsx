/**
 * StockEntryModal.jsx
 * Modal de recepción de mercancía (entrada de stock).
 * Se abre después de escanear un código de barras existente en el inventario.
 */
import { useState, useContext } from 'react';
import { supabase } from '../../supabase/client';
import { BusinessContext } from '../../context/BusinessContext';

export function StockEntryModal({ product, inventoryType, onClose, onSuccess }) {
  const { businessId } = useContext(BusinessContext);
  const [qty, setQty] = useState(1);
  const [costPrice, setCostPrice] = useState(product?.cost_price ?? product?.cost_per_unit ?? 0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const table = inventoryType === 'technical' ? 'technical_inventory' : 'retail_inventory';
  const costField = inventoryType === 'technical' ? 'cost_per_unit' : 'cost_price';
  const currentStock = product?.stock_current ?? 0;
  const newStock = currentStock + Number(qty);

  async function handleConfirm() {
    if (qty <= 0) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Actualizar stock del producto
      const update = {
        stock_current: newStock,
        updated_at: new Date().toISOString(),
      };
      if (Number(costPrice) > 0) update[costField] = Number(costPrice);

      const { error: updErr } = await supabase
        .from(table)
        .update(update)
        .eq('id', product.id);
      if (updErr) throw updErr;

      // 2. Registrar movimiento en stock_movements
      const { error: movErr } = await supabase
        .from('stock_movements')
        .insert({
          business_id:    businessId,
          product_id:     product.id,
          product_name:   product.name,
          amount:         Number(qty),
          new_stock:      newStock,
          movement_type:  'entry',
          inventory_type: inventoryType,
          barcode:        product.barcode ?? null,
          reason:         'Recepción de mercancía',
          notes:          notes || null,
        });
      if (movErr) throw movErr;

      onSuccess?.({ product, newStock, qty: Number(qty) });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Error al registrar entrada.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bc-modal-overlay modal-backdrop" role="dialog" aria-modal="true" aria-label="Entrada de mercancía">
      <div className="bc-modal modal-content">
        <div className="bc-modal__header bc-modal__header--entry">
          <span className="bc-modal__icon">📦</span>
          <h2>Entrada de Mercancía</h2>
          <button onClick={onClose} className="bc-modal__close" aria-label="Cerrar">✕</button>
        </div>

        <div className="bc-modal__product-card">
          <span className="bc-modal__inv-badge bc-modal__inv-badge--entry">
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
            <span className="bc-modal__stock-value bc-modal__stock-value--new">{newStock}</span>
          </div>
        </div>

        <div className="bc-modal__fields">
          <label className="bc-modal__label">
            Cantidad a ingresar
            <input
              type="number" min="1" value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="bc-modal__input"
              autoFocus
            />
          </label>

          <label className="bc-modal__label">
            Costo de compra por unidad
            <div className="bc-modal__input-prefix">
              <span>$</span>
              <input
                type="number" min="0" value={costPrice}
                onChange={e => setCostPrice(Number(e.target.value))}
                className="bc-modal__input bc-modal__input--prefixed"
              />
            </div>
          </label>

          <label className="bc-modal__label">
            Notas (opcional)
            <input
              type="text" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Factura #123, proveedor X..."
              className="bc-modal__input"
            />
          </label>
        </div>

        {error && <p className="bc-modal__error">{error}</p>}

        <div className="bc-modal__actions">
          <button onClick={onClose} className="bc-modal__btn bc-modal__btn--cancel" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleConfirm} className="bc-modal__btn bc-modal__btn--confirm" disabled={loading || qty <= 0}>
            {loading ? 'Guardando…' : `✅ Ingresar ${qty} unid.`}
          </button>
        </div>
      </div>
    </div>
  );
}
