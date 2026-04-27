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
import { safeNum } from '../../lib/mathUtils';

const STATUS_OPTIONS = [
  { value: 'complete',  label: '✅ Completo',           themeColor: 'success' },
  { value: 'partial',   label: '⚠️  Con faltantes',      themeColor: 'warning' },
  { value: 'damaged',   label: '🛠️  Con daños',           themeColor: 'orange' },
  { value: 'rejected',  label: '❌ Rechazado',           themeColor: 'error' },
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
  const totalInvoiced  = Math.round(items.reduce((s, it) => s + safeNum(it.totalCost || (safeNum(it.unitCost) * safeNum(it.quantityInvoiced))), 0));
  const totalReceived  = Math.round(items.reduce((s, it) => s + (safeNum(it.unitCost) * safeNum(it.quantityReceived ?? it.quantityInvoiced)), 0));
  const newProducts    = items.filter(it => it.isNewProduct);
  const discrepant     = items.filter(it => ['partial', 'missing', 'damaged'].includes(it.status));

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    setError('');

    try {
      // Preparar payload para el RPC (transacción atómica)
      const rpcPayload = {
        p_business_id: businessId,
        p_supplier_mode: supplierMode,
        p_supplier_id: supplierId,
        p_supplier_data: supplierData,
        p_invoice_data: {
          invoiceNumber: invoice?.invoiceNumber || '',
          invoiceDate: invoice?.invoiceDate || '',
          folio: invoice?.folio || '',
          raw_source: sessionData.raw_source || 'manual'
        },
        p_reception_status: receptionStatus,
        p_observations: observations,
        p_total_invoiced: totalInvoiced,
        p_total_received: totalReceived,

        p_items: [
          ...items.map(it => ({
            inventoryId: it.inventoryId || '',
            inventoryType: it.inventoryType,
            description: it.description,
            barcode: it.barcode,
            skuProveedor: it.skuProveedor,
            quantityInvoiced: it.quantityInvoiced,
            quantityReceived: it.quantityReceived,
            unitCost: it.unitCost,
            totalCost: it.totalCost,
            ivaPct: it.ivaPct,
            status: it.status,
            isNewProduct: !!it.isNewProduct,
            updatePrice: !!(it.priceChanged && priceDecisions?.[it.description] === 'update'),
            observations: it.observations
          })),
          ...(extraItems || []).map((ex, i) => {
            const decision = extraDecisions?.[i] || 'ignore';
            if (decision === 'ignore') return null;

            let invId = ex.inventoryId || '';
            let invType = ex.inventoryType || 'retail';

            if (decision === 'link') {
              const linked = linkedProducts?.[i];
              if (linked) {
                invId = linked.id;
                invType = linked.inventoryType;
              }
            } else if (decision === 'create') {
              invType = extraTypes?.[i] || 'retail';
            }

            return {
              inventoryId: invId,
              inventoryType: invType,
              description: ex.description,
              barcode: ex.barcode || '',
              skuProveedor: '',
              quantityInvoiced: 0,
              quantityReceived: ex.qty,
              unitCost: 0,
              totalCost: 0,
              ivaPct: 19,
              status: decision === 'return' ? 'returned' : 'extra',
              isNewProduct: decision === 'create',
              updatePrice: false,
              observations: `Ítem extra no facturado (${decision})`
            };
          }).filter(Boolean)
        ]
      };

      const { data: receptionId, error: rpcErr } = await supabase.rpc('process_reception_transaction', rpcPayload);

      if (rpcErr) throw rpcErr;

      onFinished(receptionId);
    } catch (err) {
      console.error('[ClosureStep]', err);
      setError('Error al guardar: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="recepcion-step-body recepcion-gap-1-5rem">
      {/* Resumen de la recepción */}
      <div className="recepcion-closure-grid">
        {[
          { label: 'Total facturado',   val: `$${totalInvoiced.toLocaleString()}`,  themeColor: 'info' },
          { label: 'Total recibido',    val: `$${totalReceived.toLocaleString()}`,   themeColor: 'success' },
          { label: 'Productos nuevos',  val: newProducts.length,                     themeColor: 'warning' },
          { label: 'Con discrepancias', val: discrepant.length,                      themeColor: 'error' },
        ].map(s => (
          <div key={s.label} className={`recepcion-closure-card recepcion-closure-card--${s.themeColor}`}>
            <div className={`recepcion-closure-val recepcion-closure-val--${s.themeColor}`}>{s.val}</div>
            <div className="recepcion-closure-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Estado del pedido */}
      <div>
        <label className="recepcion-field-label recepcion-block-mb-05">
          Estado del pedido
        </label>
        <div className="recepcion-status-selector">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setReceptionStatus(opt.value)}
              className={`recepcion-status-btn recepcion-status-btn--${opt.themeColor} ${receptionStatus === opt.value ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="recepcion-field-label recepcion-block-mb-05">
          Observaciones generales
        </label>
        <textarea
          className="recepcion-textarea"
          value={observations}
          onChange={e => setObservations(e.target.value)}
          placeholder="Ej: Caja llegó abierta. Faltaron 3 unidades que el transportista confirmó quedarán en próximo envío."
          rows={3}
        />
      </div>

      {error && (
        <div className="recepcion-error">
          ⚠️ {error}
        </div>
      )}

      {/* Botón guardar */}
      <div className="recepcion-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`recepcion-btn-primary recepcion-btn-save ${saving ? 'saving' : ''}`}
        >
          {saving ? '⏳ Guardando…' : '💾 Confirmar recepción'}
        </button>
      </div>
    </div>
  );
}
