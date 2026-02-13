// ===== INICIO: src/pages/CajaDiariaPage.jsx (Sprint 90) =====
import React, { useMemo, useEffect, useState, useRef } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import MovementModal from '../components/modals/MovementModal';
import PinModal from '../components/modals/PinModal';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import DailyReportTemplate from '../components/reports/DailyReportTemplate';
import PrintPreviewModal from '../components/modals/PrintPreviewModal';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const SummaryCard = ({ title, value, icon, colorClass = 'text-accent' }) => (
  <div className="bg-bg-secondary p-4 rounded-lg border border-border-main flex-1 min-w-[150px]">
    <div className="flex items-center gap-2">
      <i data-feather={icon} className={`w-5 h-5 ${colorClass}`}></i>
      <p className="text-sm text-text-muted">{title}</p>
    </div>
    <p className={`text-2xl font-bold mt-2 ${colorClass} text-text-main`}>{formatCurrency(value)}</p>
  </div>
);

const DailyColumn = ({ title, icon, movements, accentClass = 'border-t-gray-500', onEditItem, onHeaderClick = null }) => {
  const { t } = useTranslation();
  const total = useMemo(() =>
    movements.reduce((sum, m) => sum + m.amount, 0),
    [movements]
  );
  const headerClasses = `p-4 border-b border-border-main ${onHeaderClick ? 'cursor-pointer hover:bg-bg-tertiary' : ''}`;

  return (
    <div className={`w-72 flex-shrink-0 bg-bg-secondary rounded-lg border border-border-main shadow-md border-t-4 ${accentClass}`}>
      <div className={headerClasses} onClick={onHeaderClick}>
        <div className="flex items-center gap-3">
          <i data-feather={icon} className="w-6 h-6 text-accent"></i>
          <h3 className="font-bold text-lg text-text-main">{title}</h3>
        </div>
        <p className="font-bold text-2xl mt-2 text-text-main">{formatCurrency(total)}</p>
      </div>
      <ul className="p-2 space-y-1 max-h-96 overflow-y-auto">
        {movements.map(m => (
          <li key={m.id} className="flex justify-between items-center p-2 rounded-md hover:bg-bg-tertiary group">
            <span className="text-sm text-text-secondary flex-1 truncate pr-2">{m.description}</span>
            <span className={`text-sm font-semibold ${m.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(m.amount)}
            </span>
            <button onClick={() => onEditItem(m)} className="p-1 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              <i data-feather="edit-2" className="w-4 h-4"></i>
            </button>
          </li>
        ))}
        {movements.length === 0 && (<p className="text-sm text-text-muted py-4 text-center">{t('dashboard.noData')}</p>)}
      </ul>
    </div>
  );
};

const CajaDiariaPage = () => {
  const { t } = useTranslation();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [preselectedCollab, setPreselectedCollab] = useState(null);
  const [sortBy, setSortBy] = useState('custom'); // 'custom' | 'alphabetical'
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { movements, collaborators, isLoading, config, user } = useData();
  const componentRef = useRef();

  const todayStr = new Date().toISOString().split('T')[0];
  // Usar la clave de idioma para el formato de fecha (es-CL / en-US)
  const todayFormatted = new Date().toLocaleDateString(t('dailyCash.dateLocale'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const summary = useMemo(() => {
    if (!movements) return {
      transfers: [], cards: [], expenses: [], advances: [], sales: [], services: [], propinas: [], ventasGC: [], pagosGC: [],
      totalServicios: 0, totalVentas: 0, totalPropinas: 0, totalVentasGC: 0, totalPagosGC: 0, totalTarjetas: 0, totalTransferencias: 0,
      totalGastos: 0, totalAdelantos: 0, efectivoEnCaja: 0
    };
    const dailyMovements = movements.filter(m =>
      m.date.toDate().toISOString().split('T')[0] === todayStr
    );
    const services = dailyMovements.filter(m => m.type === 'Servicio' || m.type === 'Cita');
    const sales = dailyMovements.filter(m => m.type === 'Venta');
    const propinas = dailyMovements.filter(m => m.type === 'Propina');
    const ventasGC = dailyMovements.filter(m => m.type === 'VentaGiftCard');
    const expenses = dailyMovements.filter(m => m.type === 'Gasto');
    const advances = dailyMovements.filter(m => m.type === 'Adelanto');
    const pagosGC = dailyMovements.filter(m => m.type === 'PagoGiftCard');
    const totalServicios = services.reduce((sum, m) => sum + m.amount, 0);
    const totalVentas = sales.reduce((sum, m) => sum + m.amount, 0);
    const totalPropinas = propinas.reduce((sum, m) => sum + m.amount, 0);
    const totalVentasGC = ventasGC.reduce((sum, m) => sum + m.amount, 0);
    const incomeMovements = [...services, ...sales, ...propinas, ...ventasGC];
    const totalTarjetas = incomeMovements.filter(m => m.paymentMethod === 'Tarjeta').reduce((sum, m) => sum + m.amount, 0);
    const totalTransferencias = incomeMovements.filter(m => m.paymentMethod === 'Transferencia').reduce((sum, m) => sum + m.amount, 0);
    const totalGastos = expenses.reduce((sum, m) => sum + m.amount, 0);
    const totalAdelantos = advances.reduce((sum, m) => sum + m.amount, 0);
    const totalPagosGC = pagosGC.reduce((sum, m) => sum + m.amount, 0);
    const efectivoEnCaja = (totalServicios + totalVentas + totalPropinas + totalVentasGC) - totalTarjetas - totalTransferencias + totalGastos + totalAdelantos + totalPagosGC;

    return {
      transfers: incomeMovements.filter(m => m.paymentMethod === 'Transferencia'),
      cards: incomeMovements.filter(m => m.paymentMethod === 'Tarjeta'),
      expenses, advances, sales, services, propinas, ventasGC, pagosGC, dailyMovements,
      totalServicios, totalVentas, totalPropinas, totalVentasGC, totalPagosGC: Math.abs(totalPagosGC), totalTarjetas, totalTransferencias,
      totalGastos: Math.abs(totalGastos),
      totalAdelantos: Math.abs(totalAdelantos),
      efectivoEnCaja
    };
  }, [movements, todayStr]);

  // Ordenar colaboradores según preferencia
  const sortedCollaborators = useMemo(() => {
    if (!collaborators) return [];
    const activeCollaborators = collaborators.filter(c => c.status === 'active');

    if (sortBy === 'custom') {
      // Ordenar por displayOrder (menor a mayor), fallback alfabético si no tienen displayOrder
      return [...activeCollaborators].sort((a, b) => {
        const orderA = a.displayOrder ?? 999;
        const orderB = b.displayOrder ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Ordenar alfabéticamente
      return [...activeCollaborators].sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [collaborators, sortBy]);

  useEffect(() => { feather.replace(); });

  const reactToPrintFn = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `CajaDiaria_${new Date().toISOString().split('T')[0]}`,
  });

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  const handleConfirmPrint = async () => {
    setIsPreviewOpen(false);
    await new Promise(resolve => setTimeout(resolve, 200));

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      alert('En dispositivos móviles, usa el menú de compartir de tu navegador para guardar como PDF o imprimir');
    }

    reactToPrintFn();
  };

  const handleEditClick = (movement) => { setItemToEdit(movement); setIsPinModalOpen(true); };
  const handlePinSuccess = () => { setIsPinModalOpen(false); setIsMovementModalOpen(true); };
  const handleOpenCreateModal = () => { setItemToEdit(null); setPreselectedCollab(null); setIsMovementModalOpen(true); };
  const handleCollabClick = (collaborator) => { setItemToEdit(null); setPreselectedCollab(collaborator); setIsMovementModalOpen(true); };
  const handleCloseMovementModal = () => { setIsMovementModalOpen(false); setItemToEdit(null); setPreselectedCollab(null); };

  if (isLoading) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-1">
        <div>
          <h2 className="text-3xl font-bold text-text-main">{t('dailyCash.title')}</h2>
          <p className="text-text-muted">{todayFormatted}</p>
        </div>
        <div className="flex gap-3">
          {/* Botón de Imprimir Cierre */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg border border-border-main bg-accent text-accent-text hover:bg-accent/90 transition-colors flex items-center gap-2 font-semibold"
            title={t('dailyCash.printClosure') || 'Imprimir Cierre de Caja'}
          >
            <i data-feather="printer" className="w-5 h-5"></i>
            <span>{t('dailyCash.printBtn') || 'Imprimir Cierre'}</span>
          </button>

          {/* Botón de Ordenar */}
          <button
            onClick={() => setSortBy(prev => prev === 'custom' ? 'alphabetical' : 'custom')}
            className="px-4 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2"
            title={sortBy === 'custom' ? 'Cambiar a orden alfabético' : 'Cambiar a orden personalizado'}
          >
            <i data-feather="sliders" className="w-4 h-4"></i>
            <span className="hidden sm:inline text-sm">{sortBy === 'custom' ? 'Orden Personalizado' : 'Orden A-Z'}</span>
          </button>

          {/* Botón de Registrar */}
          <button onClick={handleOpenCreateModal} className="btn-golden flex items-center">
            <i data-feather="plus" className="mr-2 h-5 w-5"></i>
            <span>{t('dailyCash.registerBtn')}</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard title={t('dailyCash.cashInBox')} value={summary.efectivoEnCaja} icon="archive" colorClass="text-green-400" />
        <SummaryCard title={t('dailyCash.cards.services')} value={summary.totalServicios} icon="scissors" />
        <SummaryCard title={t('dailyCash.cards.sales')} value={summary.totalVentas} icon="shopping-bag" />
        <SummaryCard title={t('dailyCash.cards.tips')} value={summary.totalPropinas} icon="gift" />
        <SummaryCard title={t('dailyCash.cards.giftcards')} value={summary.totalVentasGC} icon="credit-card" colorClass="text-blue-400" />
        <SummaryCard title={t('dailyCash.cards.cards')} value={summary.totalTarjetas} icon="credit-card" />
        <SummaryCard title={t('dailyCash.cards.transfers')} value={summary.totalTransferencias} icon="smartphone" />
        <SummaryCard title={t('dailyCash.cards.gcPayments')} value={summary.totalPagosGC} icon="credit-card" colorClass="text-red-400" />
        <SummaryCard title={t('dailyCash.cards.expenses')} value={summary.totalGastos} icon="arrow-down-circle" colorClass="text-red-400" />
        <SummaryCard title={t('dailyCash.cards.advances')} value={summary.totalAdelantos} icon="dollar-sign" colorClass="text-yellow-400" />
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden py-4 px-1">
        <div className="flex space-x-4 h-full">
          {sortedCollaborators.map(col => {
            const collabMovements = summary.dailyMovements.filter(m => m.collaboratorId === col.id && (m.type === 'Servicio' || m.type === 'Cita'));
            return (
              <DailyColumn
                key={col.id} title={col.name} icon="user" movements={collabMovements}
                accentClass="border-t-yellow-400"
                onEditItem={handleEditClick}
                onHeaderClick={() => handleCollabClick(col)}
              />
            );
          })}
          <DailyColumn title={t('dailyCash.columns.transfers')} icon="smartphone" movements={summary.transfers} accentClass="border-t-cyan-400" onEditItem={handleEditClick} />
          <DailyColumn title={t('dailyCash.columns.cards')} icon="credit-card" movements={summary.cards} accentClass="border-t-blue-400" onEditItem={handleEditClick} />
          <DailyColumn title={t('dailyCash.columns.sales')} icon="shopping-bag" movements={summary.sales} accentClass="border-t-purple-400" onEditItem={handleEditClick} />
          <DailyColumn title={t('dailyCash.columns.giftcards')} movements={summary.ventasGC} icon="credit-card" accentClass="border-t-blue-400" onEditItem={handleEditClick} />
          <DailyColumn title={t('dailyCash.columns.gcPayments')} movements={summary.pagosGC} icon="credit-card" accentClass="border-t-red-400" onEditItem={handleEditClick} />
          <DailyColumn title={t('dailyCash.columns.tips')} icon="gift" movements={summary.propinas} accentClass="border-t-pink-400" onEditItem={handleEditClick} />
          <DailyColumn title={t('dailyCash.columns.expenses')} icon="arrow-down-circle" movements={summary.expenses} accentClass="border-t-red-500" onEditItem={handleEditClick} />
          <DailyColumn title={t('dailyCash.columns.advances')} icon="dollar-sign" movements={summary.advances} accentClass="border-t-orange-400" onEditItem={handleEditClick} />
        </div>
      </div>
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={handleCloseMovementModal}
        movementToEdit={itemToEdit}
        preselectedCollab={preselectedCollab}
      />
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Componente oculto para imprimir */}
      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPrint={handleConfirmPrint}
        title={t('dailyCash.printBtn')}
      >
        <div className="flex justify-center bg-white p-4">
          {/* Render DailyReportTemplate visible for preview */}
          <DailyReportTemplate
            data={summary}
            config={config}
          />
        </div>
      </PrintPreviewModal>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <DailyReportTemplate
          ref={componentRef}
          data={summary}
          config={config}
        />
      </div>
    </div>
  );
};

export default CajaDiariaPage;
// ===== FIN: src/pages/CajaDiariaPage.jsx =====