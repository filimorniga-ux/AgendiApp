/**
 * QuickCreateProductModal.jsx
 * Modal de creación rápida cuando el código escaneado no existe en ningún inventario.
 * Pre-llena barcode y supplier_sku con el código leído.
 */
import { useState, useContext } from 'react';
import { supabase } from '../../supabase/client';
import { BusinessContext } from '../../context/BusinessContext';

const UNITS = ['ml', 'gr', 'oz', 'lt', 'kg', 'unidad', 'caja', 'paquete'];

export function QuickCreateProductModal({ barcode, onClose, onCreated }) {
  const { businessId } = useContext(BusinessContext);
  const [invType, setInvType] = useState('retail');
  const [form, setForm] = useState({
    name:         '',
    brand:        '',
    category:     '',
    barcode:      barcode ?? '',
    supplier_sku: '',
    cost_price:   0,
    sale_price:   0,
    cost_per_unit: 0,
    stock_current: 0,
    stock_min:    0,
    unit:         'ml',
    unit_size:    '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleCreate() {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    setLoading(true);
    setError(null);
    try {
      const table = invType === 'technical' ? 'technical_inventory' : 'retail_inventory';
      const payload = {
        business_id:   businessId,
        name:          form.name.trim(),
        brand:         form.brand.trim() || null,
        category:      form.category.trim() || null,
        barcode:       form.barcode.trim() || null,
        supplier_sku:  form.supplier_sku.trim() || null,
        stock_current: Number(form.stock_current) || 0,
        stock_min:     Number(form.stock_min) || 0,
        is_active:     true,
      };

      if (invType === 'retail') {
        payload.cost_price  = Number(form.cost_price)  || 0;
        payload.sale_price  = Number(form.sale_price)  || 0;
      } else {
        payload.cost_per_unit = Number(form.cost_per_unit) || 0;
        payload.unit          = form.unit;
        payload.unit_size     = Number(form.unit_size)  || null;
      }

      const { data, error: insErr } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();

      if (insErr) throw insErr;
      onCreated?.({ product: data, inventoryType: invType });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Error al crear el producto.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bc-modal-overlay" role="dialog" aria-modal="true" aria-label="Crear producto">
      <div className="bc-modal bc-modal--wide">
        <div className="bc-modal__header bc-modal__header--create">
          <span className="bc-modal__icon">➕</span>
          <h2>Nuevo Producto</h2>
          <p className="bc-modal__subtitle">Código leído: <code>{barcode}</code></p>
          <button onClick={onClose} className="bc-modal__close" aria-label="Cerrar">✕</button>
        </div>

        {/* Tipo de inventario */}
        <div className="bc-modal__toggle-row">
          {[['retail','🛍️ Retail'],['technical','🔬 Técnico']].map(([v, l]) => (
            <button
              key={v}
              className={`bc-modal__toggle-btn ${invType === v ? 'bc-modal__toggle-btn--active' : ''}`}
              onClick={() => setInvType(v)}
              type="button"
            >
              {l}
            </button>
          ))}
        </div>

        <div className="bc-modal__fields bc-modal__fields--grid">
          <label className="bc-modal__label bc-modal__label--full">
            Nombre del producto <span className="bc-modal__required">*</span>
            <input type="text" value={form.name} onChange={set('name')} className="bc-modal__input" autoFocus />
          </label>

          <label className="bc-modal__label">
            Marca
            <input type="text" value={form.brand} onChange={set('brand')} className="bc-modal__input" />
          </label>

          <label className="bc-modal__label">
            Categoría
            <input type="text" value={form.category} onChange={set('category')} className="bc-modal__input" />
          </label>

          <label className="bc-modal__label">
            Código de barras
            <input type="text" value={form.barcode} onChange={set('barcode')} className="bc-modal__input" />
          </label>

          <label className="bc-modal__label">
            SKU Proveedor
            <input type="text" value={form.supplier_sku} onChange={set('supplier_sku')} className="bc-modal__input" />
          </label>

          <label className="bc-modal__label">
            Stock inicial
            <input type="number" min="0" value={form.stock_current} onChange={set('stock_current')} className="bc-modal__input" />
          </label>

          <label className="bc-modal__label">
            Stock mínimo
            <input type="number" min="0" value={form.stock_min} onChange={set('stock_min')} className="bc-modal__input" />
          </label>

          {invType === 'retail' ? (
            <>
              <label className="bc-modal__label">
                Costo de compra
                <input type="number" min="0" value={form.cost_price} onChange={set('cost_price')} className="bc-modal__input" />
              </label>
              <label className="bc-modal__label">
                Precio de venta
                <input type="number" min="0" value={form.sale_price} onChange={set('sale_price')} className="bc-modal__input" />
              </label>
            </>
          ) : (
            <>
              <label className="bc-modal__label">
                Costo por unidad
                <input type="number" min="0" value={form.cost_per_unit} onChange={set('cost_per_unit')} className="bc-modal__input" />
              </label>
              <label className="bc-modal__label">
                Unidad de medida
                <select value={form.unit} onChange={set('unit')} className="bc-modal__input bc-modal__select">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
              <label className="bc-modal__label">
                Tamaño por unidad
                <input type="number" min="0" value={form.unit_size} onChange={set('unit_size')} className="bc-modal__input" placeholder="Ej: 500 (ml)" />
              </label>
            </>
          )}
        </div>

        {error && <p className="bc-modal__error">{error}</p>}

        <div className="bc-modal__actions">
          <button onClick={onClose} className="bc-modal__btn bc-modal__btn--cancel" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleCreate} className="bc-modal__btn bc-modal__btn--confirm" disabled={loading || !form.name.trim()}>
            {loading ? 'Creando…' : '✅ Crear Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
