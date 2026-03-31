import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useTranslation } from 'react-i18next';
import { exportToExcel } from '../../lib/exportUtils';
import { exportToPDF } from '../../lib/exportPDFUtils';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';
import { parseDate } from '../../lib/dateUtils';
import { useData } from '../../context/DataContext';

const formatCurrency = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0);

export default function TechnicalConsumptionTab() {
  const { t } = useTranslation();
  const { technicalInventory, collaborators } = useData();
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [selectedCollab, setSelectedCollab] = useState('Todos');

  // Request all stock_movements for technical inventory
  const filters = useMemo(() => [
    { field: 'inventory_type', op: 'eq', value: 'technical' },
    // Salidas ('out') representan consumos. Pero también podríamos incluir 'in' si quieren ver "Mermas" (que también son out). 
    { field: 'type', op: 'eq', value: 'out' }
  ], []);
  
  const { data: stockMovements, loading } = useSupabaseCollection('stockMovements', filters);

  useEffect(() => { feather.replace(); });

  const filteredMovements = useMemo(() => {
    if (!stockMovements) return [];
    
    return stockMovements.filter(m => {
      // Filtrar por rango de fechas
      const mDate = parseDate(m.date || m.createdAt).toISOString().split('T')[0];
      if (mDate < dateRange.start || mDate > dateRange.end) return false;
      
      // Filtrar por colaborador 
      if (selectedCollab !== 'Todos' && m.userId !== selectedCollab) return false; 
      // Nota: En stockMovements el userId suele ser el ID del negocio o colaborador, o reason.
      // Dependerá de la estructura real, asumo que `reason` incluye colaborador si fue consumo.
      
      return true;
    }).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [stockMovements, dateRange, selectedCollab]);

  const formattedData = useMemo(() => {
    if (!filteredMovements) return [];
    return filteredMovements.map(m => {
      const prod = technicalInventory?.find(p => p.id === m.productId);
      const prodName = prod ? prod.name : 'Desc.';
      return {
        'Fecha y Hora': new Date(m.createdAt || m.date).toLocaleString('es-CL'),
        'Producto': prodName,
        'Cant. Consumida': m.quantity,
        'Costo Unitario': m.costPerUnit || 0,
        'Costo Total': (m.quantity * (m.costPerUnit || 0)),
        'Tipo': m.type.toUpperCase(),
        'Motivo': m.reason || 'N/A',
        'Responsable/Colaborador': m.userId || 'Sistema'
      };
    });
  }, [filteredMovements, technicalInventory]);

  const handleExportExcel = () => {
    if (formattedData.length === 0) return;
    exportToExcel(formattedData, `Consumo_${dateRange.start}_al_${dateRange.end}`);
  };

  const handleExportPDF = () => {
    if (formattedData.length === 0) return;
    exportToPDF(
      formattedData, 
      `Consumo_${dateRange.start}_al_${dateRange.end}`,
      `Reporte de Consumo Técnico (${dateRange.start} al ${dateRange.end})`
    );
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Cargando consumo técnico...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Historial de Consumo Técnico</h2>
          <p className="text-text-muted">Desglose de productos de salón usados, mermas y salidas.</p>
        </div>
        
        <div className="flex gap-4 items-center flex-wrap bg-bg-secondary p-3 rounded-lg border border-border-main shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Desde:</span>
            <input 
              type="date" 
              className="bg-bg-tertiary border border-border-main rounded px-2 py-1 text-text-main focus:outline-accent"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Hasta:</span>
            <input 
              type="date" 
              className="bg-bg-tertiary border border-border-main rounded px-2 py-1 text-text-main focus:outline-accent"
              value={dateRange.end}
              min={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          {/* Si implementaste colaboradores en el stockMovement */}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-lg border border-border-main bg-green-600/10 text-green-500 hover:bg-green-600/20 transition-colors flex items-center gap-2 font-semibold shadow-md"
          >
            <i data-feather="file-text" className="w-5 h-5"></i>
            <span>Excel</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg border border-border-main bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-colors flex items-center gap-2 font-semibold shadow-md"
          >
            <i data-feather="file" className="w-5 h-5"></i>
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border-main rounded-lg overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-tertiary border-b border-border-main text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold text-right">Cantidad</th>
                <th className="p-4 font-semibold text-right">Costo Est. Total</th>
                <th className="p-4 font-semibold">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main text-text-main">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-text-muted">No se ha registrado consumo en este rango (asegúrate de registrar mermas o salidas en Inventario)</td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const prod = technicalInventory?.find(p => p.id === m.productId);
                  const prodName = prod ? prod.name : 'Desconocido';
                  const totalCost = (m.quantity || 1) * (m.costPerUnit || 0);

                  return (
                    <tr key={m.id} className="hover:bg-bg-tertiary/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(m.createdAt || m.date).toLocaleString('es-CL')}
                      </td>
                      <td className="p-4 font-semibold">
                        {prodName}
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex px-2 py-1 bg-red-500/10 text-red-500 rounded font-bold border border-red-500/20">
                          - {m.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-right text-text-secondary">
                        {totalCost > 0 ? formatCurrency(totalCost) : '-'}
                      </td>
                      <td className="p-4 text-text-secondary">
                        {m.reason || 'Consumo Diario / Salida'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
