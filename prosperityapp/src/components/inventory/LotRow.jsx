/**
 * LotRow.jsx
 * Componente accordion para mostrar lotes de un producto.
 * Desplegable: muestra historial de lotes con barra de progreso,
 * proveedor, factura, fechas de compra/recepción.
 */
import React, { useState } from 'react';
import { useInventoryLots } from '../../hooks/useInventoryLots';
import { ChevronDown, ChevronUp, Package, FileText, Truck, Calendar, Tag } from 'lucide-react';
import { OpenUnitTracker } from './OpenUnitTracker';

const formatCurrency = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v || 0);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CL') : '—';

export function LotRow({ productId, inventoryType, productName, sellMode, unitSize, unitOfMeasure }) {
  const [isOpen, setIsOpen] = useState(false);
  const { lots, loading, stats } = useInventoryLots(productId, inventoryType);

  return (
    <div className="lot-row-container">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lot-row-toggle"
      >
        <div className="lot-row-toggle-left">
          <Package className="w-3.5 h-3.5" />
          <span className="lot-row-toggle-label">
            {stats.activeLots} lote{stats.activeLots !== 1 ? 's' : ''} activo{stats.activeLots !== 1 ? 's' : ''}
          </span>
          <span className="lot-row-toggle-count">
            ({stats.totalLots} total)
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="lot-row-content" data-testid="lot-row-content">
          {loading ? (
            <div className="lot-row-loading" data-testid="lot-row-loading">
              <div className="skeleton h-8 w-full rounded mb-2" />
              <div className="skeleton h-8 w-full rounded" />
            </div>
          ) : !lots || lots.length === 0 ? (
            <p className="lot-row-empty">Sin lotes registrados</p>
          ) : (
            <div className="lot-row-list">
              {lots.map((lot) => {
                const pct = lot.quantity_initial > 0
                  ? Math.round((lot.quantity_remaining / lot.quantity_initial) * 100)
                  : 0;
                const isDepleted = lot.status === 'depleted';

                return (
                  <div
                    key={lot.id}
                    className={`lot-card ${isDepleted ? 'lot-card--depleted' : ''}`}
                  >
                    {/* Header del lote */}
                    <div className="lot-card-header">
                      <div className="lot-card-id">
                        <Tag className="w-3 h-3" />
                        <span>{lot.lot_number || 'Sin número'}</span>
                        <span className={`lot-badge ${isDepleted ? 'lot-badge--depleted' : 'lot-badge--active'}`}>
                          {isDepleted ? 'Agotado' : 'Activo'}
                        </span>
                      </div>
                      <span className="lot-card-cost">{formatCurrency(lot.cost_per_unit)}/u</span>
                    </div>

                    {/* Detalles */}
                    <div className="lot-card-details">
                      {lot.supplier_name && (
                        <div className="lot-detail">
                          <Truck className="w-3 h-3" />
                          <span>{lot.supplier_name}</span>
                        </div>
                      )}
                      {lot.invoice_number && (
                        <div className="lot-detail">
                          <FileText className="w-3 h-3" />
                          <span>Fact. {lot.invoice_number}</span>
                        </div>
                      )}
                      {lot.purchase_date && (
                        <div className="lot-detail">
                          <Calendar className="w-3 h-3" />
                          <span>Compra: {formatDate(lot.purchase_date)}</span>
                        </div>
                      )}
                      <div className="lot-detail">
                        <Calendar className="w-3 h-3" />
                        <span>Recepción: {formatDate(lot.reception_date)}</span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="lot-progress-container">
                      <div className="lot-progress-bar">
                        <div
                          className={`lot-progress-fill ${
                            pct > 50 ? 'lot-progress--good' :
                            pct > 20 ? 'lot-progress--warning' :
                            'lot-progress--danger'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="lot-progress-text">
                        {lot.quantity_remaining} / {lot.quantity_initial} ({pct}%)
                      </span>
                    </div>

                    {/* Notas */}
                    {lot.notes && (
                      <p className="lot-card-notes">{lot.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OpenUnitTracker para productos fraccionados */}
      {isOpen && sellMode === 'fractional' && (
        <OpenUnitTracker
          productId={productId}
          unitSize={unitSize}
          unitOfMeasure={unitOfMeasure}
          lots={lots}
        />
      )}
    </div>
  );
}

export default LotRow;
