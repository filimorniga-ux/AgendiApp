// ===== INICIO: src/pages/PayrollDetailPage.jsx (Sprint 92) =====
import React, { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { useDocument } from '../hooks/useDocument';
import { useParams, Link } from 'react-router-dom';
import DetailModal from '../components/modals/DetailModal';
import { useTranslation } from 'react-i18next';

const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const PayrollRow = ({ label, value, className = '', isClickable = false, onClick = () => { } }) => (
  <div
    className={`flex justify-between items-center py-2 border-b border-border-main/50 ${className} ${isClickable ? 'cursor-pointer hover:bg-bg-tertiary -mx-2 px-2 rounded-md' : ''}`}
    onClick={isClickable ? onClick : null}
  >
    <span className="text-sm text-text-muted flex items-center">
      {label}
      {isClickable && <i data-feather="chevron-down" className="w-4 h-4 ml-1.5 text-text-muted"></i>}
    </span>
    <span className={`font-semibold ${className} text-text-main`}>{formatCurrency(value)}</span>
  </div>
);

const PayrollDetailPage = () => {
  const { t } = useTranslation();
  const { id: closingId } = useParams();
  const { document: closing, loading } = useDocument('payrollClosings', closingId);
  const { isLoading: isDataLoading } = useData();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', items: [] });

  useEffect(() => {
    feather.replace();
  }, [closing, isDetailModalOpen]);

  const handleShowDetails = (title, items) => {
    setModalContent({ title, items });
    setIsDetailModalOpen(true);
  };

  if (loading || isDataLoading) {
    return null;
  }

  if (!closing) {
    return (
      <div className="h-full flex flex-col">
        <Link to="/app/nomina/historial" className="flex items-center gap-2 text-accent mb-4">
          <i data-feather="arrow-left" className="w-4 h-4"></i>
          {t('payroll.backToHistory')}
        </Link>
        <h1 className="text-2xl font-bold text-red-500 p-8">{t('common.error')}</h1>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <Link to="/app/nomina/historial" className="flex items-center gap-2 text-accent mb-4">
          <i data-feather="arrow-left" className="w-4 h-4"></i>
          {t('payroll.backToHistory')}
        </Link>
        <h2 className="text-3xl font-bold text-text-main">{closing.name}</h2>
        <p className="text-text-muted">
          {t('payroll.table.date')}: {closing.createdAt ? new Date(closing.createdAt.seconds * 1000).toLocaleDateString('es-CL') : t('common.na')} |
          {t('payroll.table.range')}: {closing.dateRange}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(closing.summary || []).map(collabData => (
            <div key={collabData.collaboratorId} className="bg-bg-secondary rounded-lg border border-border-main shadow-lg flex flex-col">
              <div className="p-4 border-b border-border-main">
                <h3 className="font-bold text-xl text-text-main">{collabData.collaboratorName}</h3>
              </div>
              <div className="p-4 space-y-2 flex-grow">
                <PayrollRow label={t('payroll.cards.gross')} value={collabData.totalServices} isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.gross')}: ${collabData.collaboratorName}`, collabData.detail.serviceItems)} />
                <PayrollRow label={t('payroll.cards.techCost')} value={collabData.totalTechCost} className="text-red-400" isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.techCost')}: ${collabData.collaboratorName}`, collabData.detail.techCostItems)} />
                <PayrollRow label={t('payroll.cards.tax')} value={collabData.taxAmount} className="text-red-400" />
                <div className="flex justify-between items-center py-2 border-b border-border-main font-semibold">
                  <span className="text-sm text-text-muted">{t('payroll.cards.netBase')}</span>
                  <span className="text-text-main">{formatCurrency(collabData.baseNet)}</span>
                </div>
                <PayrollRow label={t('payroll.cards.participation')} value={collabData.participation} className="text-green-400" />
                <PayrollRow label={t('payroll.cards.commission')} value={collabData.totalSalesCommissions} className="text-green-400" isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.commission')}: ${collabData.collaboratorName}`, collabData.detail.salesCommissionItems)} />
                <PayrollRow label={t('payroll.cards.tips')} value={collabData.totalPropinas} className="text-green-400" isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.tips')}: ${collabData.collaboratorName}`, collabData.detail.propinaItems)} />
                <PayrollRow label={t('payroll.cards.advances')} value={collabData.totalAdvances} className={collabData.totalAdvances >= 0 ? 'text-green-400' : 'text-yellow-400'} isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.advances')}: ${collabData.collaboratorName}`, collabData.detail.advanceItems)} />
              </div>
              <div className="bg-bg-main/50 p-4 rounded-b-lg mt-auto">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg uppercase text-text-muted">{t('payroll.cards.finalPay')}</span>
                  <span className="font-bold text-2xl text-accent">{formatCurrency(collabData.finalPayment)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={modalContent.title}
        items={modalContent.items}
      />
    </div>
  );
};
export default PayrollDetailPage;
// ===== FIN: src/pages/PayrollDetailPage.jsx =====