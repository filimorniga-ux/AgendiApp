import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useTranslation } from 'react-i18next';
import { exportToExcel } from '../../lib/exportUtils';
import { exportToPDF } from '../../lib/exportPDFUtils';
import { useData } from '../../context/DataContext';
import { parseDate } from '../../lib/dateUtils';

const formatCurrency = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0);

export default function TransactionsHistoryTab() {
  const { t } = useTranslation();
  const { movements, collaborators } = useData();
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [selectedType, setSelectedType] = useState('Todos');

  useEffect(() => { feather.replace(); });

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    
    return movements.filter(m => {
      // Filtrar por rango de fechas
      const mDate = parseDate(m.date).toISOString().split('T')[0];
      if (mDate < dateRange.start || mDate > dateRange.end) return false;
      
      // Filtrar por tipo
      if (selectedType !== 'Todos' && m.type !== selectedType) return false;
      
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [movements, dateRange, selectedType]);

  const formattedData = useMemo(() => {
    if (!filteredMovements) return [];
    return filteredMovements.map(m => {
      const col = collaborators?.find(c => c.id === m.collaboratorId);
      return {
        'Fecha y Hora': new Date(m.date).toLocaleString('es-CL'),
        'Tipo': m.type,
        'Descripción': m.description,
        'Colaborador': col ? col.name : 'N/A',
        'Método Pago': m.paymentMethod || 'N/A',
        'Monto': m.amount
      };
    });
  }, [filteredMovements, collaborators]);

  const handleExportExcel = () => {
    if (formattedData.length === 0) return;
    exportToExcel(formattedData, `Transacciones_${dateRange.start}_al_${dateRange.end}`);
  };

  const handleExportPDF = () => {
    if (formattedData.length === 0) return;
    exportToPDF(
      formattedData, 
      `Transacciones_${dateRange.start}_al_${dateRange.end}`,
      `Reporte de Transacciones (${dateRange.start} al ${dateRange.end})`
    );
  };

  const types = ['Todos', 'Venta', 'Servicio', 'Cita', 'Gasto', 'Adelanto', 'Propina', 'VentaGiftCard', 'PagoGiftCard'];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Historial de Transacciones</h2>
          <p className="text-text-muted">Filtra y exporta ventas, servicios, gastos y propinas.</p>
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
          <div className="flex items-center gap-2 border-l border-border-main pl-4">
            <span className="text-sm text-text-muted">Tipo:</span>
            <select 
              className="bg-bg-tertiary border border-border-main rounded px-2 py-1 text-text-main focus:outline-accent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
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
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Descripción</th>
                <th className="p-4 font-semibold">Colaborador</th>
                <th className="p-4 font-semibold">Método</th>
                <th className="p-4 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main text-text-main">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-muted">No se encontraron transacciones en este rango</td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isNegative = m.amount < 0;
                  const col = collaborators?.find(c => c.id === m.collaboratorId);
                  return (
                    <tr key={m.id} className="hover:bg-bg-tertiary/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(m.date).toLocaleString('es-CL')}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-bold uppercase bg-bg-tertiary text-text-main border border-border-main">
                          {m.type}
                        </span>
                      </td>
                      <td className="p-4">{m.description}</td>
                      <td className="p-4 text-text-secondary">{col ? col.name : '-'}</td>
                      <td className="p-4 text-text-secondary">
                        {m.paymentMethod === 'Efectivo' && <span className="flex items-center gap-1"><i data-feather="dollar-sign" className="w-3 h-3"></i> Efectivo</span>}
                        {m.paymentMethod === 'Tarjeta' && <span className="flex items-center gap-1"><i data-feather="credit-card" className="w-3 h-3"></i> Tarjeta</span>}
                        {m.paymentMethod === 'Transferencia' && <span className="flex items-center gap-1"><i data-feather="smartphone" className="w-3 h-3"></i> Transf.</span>}
                        {!['Efectivo', 'Tarjeta', 'Transferencia'].includes(m.paymentMethod) && (m.paymentMethod || '-')}
                      </td>
                      <td className={`p-4 text-right font-bold ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(m.amount)}
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
