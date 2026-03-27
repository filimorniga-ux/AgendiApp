// ===== INICIO: src/pages/PayrollHistoryPage.jsx (Sprint 92) =====
import React, { useEffect, useState, useMemo } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { useSupabaseCollection } from '../hooks/useSupabaseCollection';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const PayrollHistoryPage = () => {
  const { t } = useTranslation();
  const { isLoading: isDataLoading } = useData();
  const { data: closings, loading } = useSupabaseCollection('payroll_closings');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClosings = useMemo(() => {
    if (!closings) return [];

    const sorted = [...closings].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA; // Descendente
    });

    if (!searchTerm) return sorted;

    return sorted.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.dateRange && c.dateRange.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [closings, searchTerm]);

  useEffect(() => {
    if (!loading && !isDataLoading) {
      feather.replace();
    }
  }, [filteredClosings, loading, isDataLoading]);

  if (loading || isDataLoading) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <Link to="/app/nomina" className="flex items-center gap-2 text-accent mb-4">
          <i data-feather="arrow-left" className="w-4 h-4"></i>
          {t('payroll.backToPayroll')}
        </Link>
        <h2 className="text-3xl font-bold text-text-main">{t('payroll.historyTitle')}</h2>
        <p className="text-text-muted">{t('payroll.historySubtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-bg-secondary rounded-lg border border-border-main overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
            <tr>
              <th className="p-3 font-semibold">{t('payroll.table.name')}</th>
              <th className="p-3 font-semibold">{t('payroll.table.range')}</th>
              <th className="p-3 font-semibold">{t('payroll.table.date')}</th>
              <th className="p-3 font-semibold text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(filteredClosings || []).map(closing => (
              <tr key={closing.id} className="border-b border-border-main text-sm hover:bg-bg-tertiary">
                <td className="p-3 text-text-main font-semibold">{closing.name}</td>
                <td className="p-3 text-text-secondary">{closing.dateRange}</td>
                <td className="p-3 text-text-secondary">{closing.createdAt ? formatDate(closing.createdAt) : t('common.na')}</td>
                <td className="p-3 text-right">
                  <Link
                    to={`/app/nomina/historial/${closing.id}`}
                    className="p-1 text-text-muted hover:text-accent"
                    title={t('clients.viewHistory')}
                  >
                    <i data-feather="eye" className="w-4 h-4"></i>
                  </Link>
                </td>
              </tr>
            ))}
            {filteredClosings && filteredClosings.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-text-muted p-8">
                  {t('dashboard.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PayrollHistoryPage;
// ===== FIN: src/pages/PayrollHistoryPage.jsx =====