import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { exportToExcel } from '../../lib/exportUtils';
import { exportToPDF } from '../../lib/exportPDFUtils';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const formatCurrency = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0);

export default function CashSessionsHistoryTab() {
  const { t } = useTranslation();
  const { data: sessions, loading } = useSupabaseCollection('cashSessions');

  const dataForExcel = useMemo(() => {
    if (!sessions) return [];
    return sessions.map(s => ({
      'Fecha': new Date(s.createdAt).toLocaleString('es-CL'),
      'Tipo': s.type.toUpperCase(),
      'Efectivo Físico': s.actualCash,
      'Efectivo Sistema': s.expectedCash,
      'Diferencia': s.difference,
      'Ventas Totales': s.totalSales,
      'Gastos Totales': s.totalExpenses,
      'Observaciones': s.observations || ''
    }));
  }, [sessions]);

  useEffect(() => { feather.replace(); }, [sessions]);

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Cargando historial...</div>;
  }

  const handleExportExcel = () => {
    exportToExcel(dataForExcel, 'Historial_Arqueos_Cierres');
  };

  const handleExportPDF = () => {
    exportToPDF(
      dataForExcel, 
      'Historial_Arqueos_Cierres', 
      'Reporte de Arqueos y Cierres de Caja'
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Historial de Arqueos y Cierres</h2>
          <p className="text-text-muted">Revisa las sesiones de caja pasadas registradas en el sistema.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-lg border border-border-main bg-green-600/10 text-green-500 hover:bg-green-600/20 transition-colors flex items-center gap-2"
          >
            <i data-feather="file-text" className="w-4 h-4"></i>
            <span>Excel</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg border border-border-main bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-colors flex items-center gap-2"
          >
            <i data-feather="file" className="w-4 h-4"></i>
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border-main rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-tertiary border-b border-border-main text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold text-right">Efectivo Sistema</th>
                <th className="p-4 font-semibold text-right">Físico (Declarado)</th>
                <th className="p-4 font-semibold text-right">Diferencia</th>
                <th className="p-4 font-semibold text-center">Obs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main text-text-main">
              {sessions?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-muted">No hay sesiones de caja registradas</td>
                </tr>
              ) : (
                sessions?.map((session) => (
                  <tr key={session.id} className="hover:bg-bg-tertiary/50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-sm">
                      {new Date(session.createdAt).toLocaleString('es-CL')}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase ${
                        session.type === 'cierre' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {session.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(session.expectedCash)}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(session.actualCash)}</td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${session.difference < 0 ? 'text-red-400' : session.difference > 0 ? 'text-green-400' : ''}`}>
                        {formatCurrency(session.difference)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {session.observations ? (
                        <button title={session.observations} className="text-text-muted hover:text-accent">
                          <i data-feather="message-circle" className="w-4 h-4"></i>
                        </button>
                      ) : (
                        <span className="text-text-muted opacity-50">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
