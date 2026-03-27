// ===== INICIO: src/pages/StockMovementsPage.jsx (Sprint 97 - Hotfix Ordenamiento) =====
import React, { useEffect, useState, useMemo } from 'react';
import feather from 'feather-icons';
import { useSupabaseCollection } from '../hooks/useSupabaseCollection';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const StockMovementsPage = () => {
  const { t } = useTranslation();
  const { isLoading: isGlobalLoading } = useData();
  // --- BUG CORREGIDO: Eliminamos 'orderBy' para evitar crash ---
  const { data: movements, loading } = useSupabaseCollection('stock_movements');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    
    // Ordenamiento local seguro
    const sorted = [...movements].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA; // Descendente
    });

    if (!searchTerm) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(m => 
      m.productName.toLowerCase().includes(term) ||
      m.reason.toLowerCase().includes(term)
    );
  }, [movements, searchTerm]);

  useEffect(() => {
    if (!loading && !isGlobalLoading) {
      feather.replace();
    }
  }, [filteredMovements, loading, isGlobalLoading]);

  if (loading || isGlobalLoading) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <Link to="/inventario" className="flex items-center gap-2 text-accent mb-4 hover:underline">
          <i data-feather="arrow-left" className="w-4 h-4"></i>
          {t('inventory.title')}
        </Link>
        <h2 className="text-3xl font-bold text-text-main">{t('inventory.audit.title')}</h2>
        <p className="text-text-muted">{t('inventory.audit.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <input 
          type="search" 
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main" 
          placeholder={t('inventory.audit.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
            <tr>
              <th className="p-3 font-semibold">{t('inventory.audit.table.date')}</th>
              <th className="p-3 font-semibold">{t('inventory.audit.table.product')}</th>
              <th className="p-3 font-semibold text-center">{t('inventory.audit.table.type')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.audit.table.amount')}</th>
              <th className="p-3 font-semibold">{t('inventory.audit.table.reason')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.audit.table.newStock')}</th>
            </tr>
          </thead>
          <tbody>
            {(filteredMovements || []).map(move => {
              const isIngreso = move.amount > 0;
              
              return (
                <tr key={move.id} className="border-b border-border-main text-sm hover:bg-bg-tertiary">
                  <td className="p-3 text-text-muted">{formatDate(move.createdAt)}</td>
                  <td className="p-3 text-text-main font-semibold">{move.productName}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isIngreso 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {isIngreso ? t('inventory.audit.typeEntry') : t('inventory.audit.typeExit')}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-bold ${isIngreso ? 'text-green-500' : 'text-red-500'}`}>
                    {move.amount > 0 ? '+' : ''}{move.amount}
                  </td>
                  <td className="p-3 text-text-secondary">{move.reason}</td>
                  <td className="p-3 text-right text-text-main font-mono">{move.newStock}</td>
                </tr>
              );
            })}
            {filteredMovements.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-text-muted p-8">
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

export default StockMovementsPage;
// ===== FIN: src/pages/StockMovementsPage.jsx (Sprint 97) =====
