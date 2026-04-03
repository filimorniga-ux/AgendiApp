import React, { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { useTranslation } from 'react-i18next';
import CurrentCashTab from '../components/dailyCash/CurrentCashTab';
import CashSessionsHistoryTab from '../components/dailyCash/CashSessionsHistoryTab';
import TransactionsHistoryTab from '../components/dailyCash/TransactionsHistoryTab';
import TechnicalConsumptionTab from '../components/dailyCash/TechnicalConsumptionTab';
import CashSessionModal from '../components/modals/CashSessionModal';
import { useData } from '../context/DataContext';

export default function CajaDiariaPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('current');
  
  // States for Modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionType, setSessionType] = useState('arqueo'); // 'arqueo' or 'cierre'
  const [sessionSummary, setSessionSummary] = useState(null);

  useEffect(() => {
    feather.replace();
  }, [activeTab]);

  const handleOpenSessionModal = (summaryData, type="arqueo") => {
    setSessionSummary(summaryData);
    setSessionType(type);
    setIsSessionModalOpen(true);
  };

  const tabs = [
    { id: 'current', label: 'Caja Actual', icon: 'archive' },
    { id: 'sessions', label: 'Arqueos y Cierres', icon: 'server' },
    { id: 'transactions', label: 'Historial de Transacciones', icon: 'list' },
    { id: 'consumption', label: 'Consumo Técnico', icon: 'activity' }
  ];

  return (
    <div className="h-full flex flex-col pt-2 animate-fadeIn relative overflow-hidden">
      
      {/* HEADER TABS DESKTOP & MOBILE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between px-4 sm:px-6 mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">
            Gestión de Caja y Reportes
          </h1>
          <p className="text-text-muted text-sm sm:text-base">Centro de control financiero y auditoría</p>
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex bg-bg-secondary p-1 rounded-xl border border-border-main w-full md:w-auto overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-accent/20 text-accent shadow-sm shadow-accent/10 border border-accent/30'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-tertiary border border-transparent'
              }`}
            >
              <i data-feather={tab.icon} className="w-4 h-4"></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 lg:pb-6 custom-scrollbar">
        {/* Content con transición al cambiar de tab */}
        <div key={activeTab} className="animate-fadeInUp">
          {activeTab === 'current' && (
             <CurrentCashTab onArqueoClick={handleOpenSessionModal} />
          )}
          {activeTab === 'sessions' && (
             <CashSessionsHistoryTab />
          )}
          {activeTab === 'transactions' && (
             <TransactionsHistoryTab />
          )}
          {activeTab === 'consumption' && (
             <TechnicalConsumptionTab />
          )}
        </div>
      </div>

      {/* MODALS */}
      <CashSessionModal 
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        summaryData={sessionSummary}
        sessionType={sessionType}
      />
    </div>
  );
}