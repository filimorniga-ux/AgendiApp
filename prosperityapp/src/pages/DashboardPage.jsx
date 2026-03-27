// ===== INICIO: src/pages/DashboardPage.jsx (Con i18n) =====
import React, { useEffect, useState, useMemo, useRef } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { useCollection } from '../hooks/useCollection';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Link } from 'react-router-dom';
import DetailModal from '../components/modals/DetailModal';
import PrintPreviewModal from '../components/modals/PrintPreviewModal';
import DashboardPrintTemplate from '../components/reports/DashboardPrintTemplate';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('es-CL');
};

// --- Componente de Tarjeta (Tema Corregido) ---
const SummaryCard = ({ title, value, icon, colorClass = 'text-accent' }) => (
  <div className="bg-bg-secondary p-4 rounded-lg border border-border-main flex-1 min-w-[150px]">
    <div className="flex items-center gap-2">
      <i data-feather={icon} className={`w-5 h-5 ${colorClass}`}></i>
      <p className="text-sm text-text-muted">{title}</p>
    </div>
    <p className={`text-2xl font-bold mt-2 ${colorClass}`}>{formatCurrency(value)}</p>
  </div>
);

// --- Pestaña 1: Análisis Diario (Con i18n) ---
const TabDiario = () => {
  const { t } = useTranslation();
  const { movements, collaborators, isLoading, config } = useData();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const componentRef = useRef();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const summary = useMemo(() => {
    if (!movements || !collaborators) return {
      totalServicios: 0, totalVentas: 0, totalEfectivo: 0, totalTarjetas: 0,
      totalTransferencias: 0, totalGastos: 0, totalAdelantos: 0,
      totalCostoTecnico: 0, ranking: []
    };
    const dailyMovements = movements.filter(m =>
      m.date.toDate().toISOString().split('T')[0] === todayStr
    );
    const totalServicios = dailyMovements.filter(m => m.type === 'Servicio').reduce((s, m) => s + m.amount, 0);
    const totalVentas = dailyMovements.filter(m => m.type === 'Venta').reduce((s, m) => s + m.amount, 0);
    const totalGastos = dailyMovements.filter(m => m.type === 'Gasto').reduce((s, m) => s + m.amount, 0);
    const totalAdelantos = dailyMovements.filter(m => m.type === 'Adelanto').reduce((s, m) => s + m.amount, 0);
    const totalCostoTecnico = dailyMovements
      .filter(m => m.type === 'Servicio')
      .reduce((s, m) => s + (m.technicalCost || 0), 0);
    const totalEfectivo = dailyMovements.filter(m => m.paymentMethod === 'Efectivo').reduce((s, m) => s + m.amount, 0);
    const totalTarjetas = dailyMovements.filter(m => m.paymentMethod === 'Tarjeta').reduce((s, m) => s + m.amount, 0);
    const totalTransferencias = dailyMovements.filter(m => m.paymentMethod === 'Transferencia').reduce((s, m) => s + m.amount, 0);
    const ranking = (collaborators || [])
      .filter(c => c.status === 'active')
      .map(collab => {
        const serviceCount = dailyMovements.filter(m =>
          m.collaboratorId === collab.id && m.type === 'Servicio'
        ).length;
        return {
          id: collab.id,
          name: collab.name,
          serviceCount: serviceCount,
        };
      })
      .filter(c => c.serviceCount > 0)
      .sort((a, b) => b.serviceCount - a.serviceCount);
    return {
      totalServicios, totalVentas, totalEfectivo, totalTarjetas,
      totalTransferencias, totalGastos, totalAdelantos,
      totalCostoTecnico, ranking
    };
  }, [movements, collaborators, todayStr]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Resumen_Diario_${todayStr}`,
  });

  useEffect(() => {
    feather.replace();
  }, [summary]);

  const handleConfirmPrint = async () => {
    setIsPreviewOpen(false);

    // Small delay to ensure modal closes
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      // For mobile devices with Web Share API, offer to share
      try {
        alert('En dispositivos móviles, usa el menú de compartir de tu navegador para guardar como PDF o imprimir');
      } catch (err) {
        console.info('Share not supported');
      }
    }

    // Try to print
    handlePrint();
  };

  if (isLoading) return null;

  return (
    <>
      <div className="space-y-6">
        {/* Print Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2"
          >
            <i data-feather="printer" className="h-5 w-5"></i>
            <span>{t('dashboard.printDaily')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title={t('dashboard.cards.services')} value={summary.totalServicios} icon="scissors" />
          <SummaryCard title={t('dashboard.cards.sales')} value={summary.totalVentas} icon="shopping-bag" />
          <SummaryCard title={t('dashboard.cards.expenses')} value={summary.totalGastos} icon="arrow-down-circle" colorClass="text-red-400" />
          <SummaryCard title={t('dashboard.cards.techCost')} value={summary.totalCostoTecnico} icon="tool" colorClass="text-yellow-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title={t('dashboard.cards.cash')} value={summary.totalEfectivo} icon="dollar-sign" colorClass="text-green-400" />
          <SummaryCard title={t('dashboard.cards.cards')} value={summary.totalTarjetas} icon="credit-card" colorClass="text-green-400" />
          <SummaryCard title={t('dashboard.cards.transfers')} value={summary.totalTransferencias} icon="smartphone" colorClass="text-green-400" />
          <SummaryCard title={t('dashboard.cards.advances')} value={summary.totalAdelantos} icon="chevrons-down" colorClass="text-red-400" />
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-main">
          <h3 className="text-xl font-bold text-text-main mb-4">{t('dashboard.ranking')}</h3>
          <ul className="space-y-3">
            {summary.ranking.map((collab, index) => (
              <li key={collab.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded">
                <span className="font-semibold text-text-main">#{index + 1} {collab.name}</span>
                <span className="text-accent font-bold">{collab.serviceCount} {t('dashboard.cards.services')}</span>
              </li>
            ))}
            {summary.ranking.length === 0 && <p className="text-text-muted">{t('dashboard.noData')}</p>}
          </ul>
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPrint={handleConfirmPrint}
        title={t('dashboard.printDaily')}
      >
        <DashboardPrintTemplate
          type="diario"
          data={summary}
          config={config}
          filterInfo={`Fecha: ${todayFormatted}`}
          forPreview={true}
        />
      </PrintPreviewModal>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <DashboardPrintTemplate
          ref={componentRef}
          type="diario"
          data={summary}
          config={config}
          filterInfo={`Fecha: ${todayFormatted}`}
        />
      </div>
    </>
  );
};

// --- Helpers de Fecha (sin cambios) ---
const toISODateString = (date) => {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .split("T")[0];
};
const getDatesForCurrentWeek = () => {
  const dates = []; const now = new Date(); const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};
const getDatesForCurrentMonth = () => {
  const dates = []; const now = new Date(); const year = now.getFullYear();
  const month = now.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(new Date(year, month, i));
  }
  return dates;
};

// --- Pestaña 2: Nóminas (Con i18n) ---
const TabNominas = () => {
  const { t } = useTranslation();
  const { movements, isLoading, config } = useData();
  const [selectedDates, setSelectedDates] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const componentRef = useRef();

  const summary = useMemo(() => {
    if (!movements) return {
      totalProduccion: 0, totalEfectivo: 0, totalTarjetas: 0,
      totalTransferencias: 0, totalGastos: 0, totalAdelantos: 0
    };
    const selectedDateStrings = selectedDates.map(toISODateString);
    const filteredMovements = movements.filter(m => {
      const moveDateStr = m.date.toDate().toISOString().split('T')[0];
      return selectedDateStrings.includes(moveDateStr);
    });
    const totalProduccion = filteredMovements
      .filter(m => m.type === 'Servicio' || m.type === 'Venta' || m.type === 'Propina')
      .reduce((s, m) => s + m.amount, 0);
    const totalGastos = filteredMovements.filter(m => m.type === 'Gasto').reduce((s, m) => s + m.amount, 0);
    const totalAdelantos = filteredMovements.filter(m => m.type === 'Adelanto').reduce((s, m) => s + m.amount, 0);
    const incomeMovements = filteredMovements.filter(m => m.type === 'Servicio' || m.type === 'Venta' || m.type === 'Propina');
    const totalEfectivo = incomeMovements.filter(m => m.paymentMethod === 'Efectivo').reduce((s, m) => s + m.amount, 0);
    const totalTarjetas = incomeMovements.filter(m => m.paymentMethod === 'Tarjeta').reduce((s, m) => s + m.amount, 0);
    const totalTransferencias = incomeMovements.filter(m => m.paymentMethod === 'Transferencia').reduce((s, m) => s + m.amount, 0);
    return {
      totalProduccion, totalEfectivo, totalTarjetas,
      totalTransferencias, totalGastos, totalAdelantos
    };
  }, [movements, selectedDates]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Analisis_Nomina_${new Date().toISOString().split('T')[0]}`,
  });

  const handleConfirmPrint = async () => {
    setIsPreviewOpen(false);
    await new Promise(resolve => setTimeout(resolve, 200));

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      alert('En dispositivos móviles, usa el menú de compartir de tu navegador para guardar como PDF o imprimir');
    }

    handlePrint();
  };

  const getFilterInfo = () => {
    if (selectedDates.length === 0) return 'Sin período seleccionado';
    if (selectedDates.length === 1) {
      return `Fecha: ${selectedDates[0].toLocaleDateString('es-CL')}`;
    }
    const sortedDates = [...selectedDates].sort((a, b) => a - b);
    return `Período: ${sortedDates[0].toLocaleDateString('es-CL')} - ${sortedDates[sortedDates.length - 1].toLocaleDateString('es-CL')}`;
  };

  useEffect(() => {
    feather.replace();
  }, [summary, selectedDates]);

  const handleDateChange = (date) => {
    const dateString = toISODateString(date);
    const dateIndex = selectedDates.findIndex(d => toISODateString(d) === dateString);
    if (dateIndex > -1) {
      setSelectedDates(prev => prev.filter((_, i) => i !== dateIndex));
    } else {
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month' && selectedDates.some(d => toISODateString(d) === toISODateString(date))) {
      return 'react-calendar-tile-selected';
    }
    return null;
  };

  if (isLoading) return null;
  return (
    <>
      <div className="space-y-6">
        {/* Print Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2"
          >
            <i data-feather="printer" className="h-5 w-5"></i>
            <span>{t('dashboard.printNominas')}</span>
          </button>
        </div>

        <div className="bg-bg-secondary p-4 rounded-lg border border-border-main">
          <h3 className="text-xl font-bold text-text-main mb-4">{t('dashboard.tabs.period')}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setSelectedDates(getDatesForCurrentWeek())} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
              <i data-feather="calendar" className="w-4 h-4"></i> {t('dashboard.tabs.daily')}
            </button>
            <button onClick={() => setSelectedDates(getDatesForCurrentMonth())} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
              <i data-feather="calendar" className="w-4 h-4"></i> {t('dashboard.tabs.period')}
            </button>
            <button onClick={() => setSelectedDates([])} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
              <i data-feather="x" className="w-4 h-4"></i> {t('common.cancel')}
            </button>
          </div>
          <Calendar
            onChange={handleDateChange}
            value={null}
            tileClassName={tileClassName}
            locale="es-ES"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard title={t('dashboard.cards.produced')} value={summary.totalProduccion} icon="bar-chart-2" colorClass="text-green-400" />
          <SummaryCard title={t('dashboard.cards.cash')} value={summary.totalEfectivo} icon="dollar-sign" />
          <SummaryCard title={t('dashboard.cards.cards')} value={summary.totalTarjetas} icon="credit-card" />
          <SummaryCard title={t('dashboard.cards.transfers')} value={summary.totalTransferencias} icon="smartphone" />
          <SummaryCard title={t('dashboard.cards.expenses')} value={summary.totalGastos} icon="arrow-down-circle" colorClass="text-red-400" />
          <SummaryCard title={t('dashboard.cards.advances')} value={summary.totalAdelantos} icon="chevrons-down" colorClass="text-red-400" />
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPrint={handleConfirmPrint}
        title={t('dashboard.printNominas')}
      >
        <DashboardPrintTemplate
          type="nominas"
          data={summary}
          config={config}
          filterInfo={getFilterInfo()}
          forPreview={true}
        />
      </PrintPreviewModal>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <DashboardPrintTemplate
          ref={componentRef}
          type="nominas"
          data={summary}
          config={config}
          filterInfo={getFilterInfo()}
        />
      </div>
    </>
  );
};

// --- Pestaña 3: Cierres (Con i18n) ---
const TabCierres = () => {
  const { t } = useTranslation();
  const { data: closings, loading } = useCollection('monthlyClosings', 'id');
  const { config } = useData();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const componentRef = useRef();

  const summary = useMemo(() => {
    if (!closings) return { totalRepartido: 0, totalAhorros: 0, totalIngresos: 0 };
    let totalRepartido = 0;
    let totalAhorros = 0;
    let totalIngresos = 0;
    closings.forEach(cierre => {
      totalRepartido += (cierre.totalToDistribute || 0);
      totalAhorros += (cierre.totalSavings || 0);
      totalIngresos += (cierre.totalIncome || 0);
    });
    return { totalRepartido, totalAhorros, totalIngresos };
  }, [closings]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Analisis_Cierres_${new Date().toISOString().split('T')[0]}`,
  });

  const handleConfirmPrint = async () => {
    setIsPreviewOpen(false);
    await new Promise(resolve => setTimeout(resolve, 200));

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      alert('En dispositivos móviles, usa el menú de compartir de tu navegador para guardar como PDF o imprimir');
    }

    handlePrint();
  };

  const closingsData = (closings || []).map(c => ({
    name: c.id,
    date: formatDate(c.createdAt),
    total: c.totalToDistribute || 0
  }));

  useEffect(() => {
    feather.replace();
  }, [closings]);

  if (loading) return null;
  return (
    <>
      <div className="space-y-6">
        {/* Print Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2"
          >
            <i data-feather="printer" className="h-5 w-5"></i>
            <span>{t('dashboard.printCierres')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title={t('dashboard.cards.income')} value={summary.totalIngresos} icon="bar-chart-2" colorClass="text-green-400" />
          <SummaryCard title={t('dashboard.cards.distributed')} value={summary.totalRepartido} icon="award" />
          <SummaryCard title={t('dashboard.cards.savings')} value={summary.totalAhorros} icon="shield" colorClass="text-yellow-400" />
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-main">
          <h3 className="text-xl font-bold text-text-main mb-4">{t('dashboard.tabs.closings')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-text-muted border-b-2 border-border-main">
                <tr>
                  <th className="p-2">{t('sidebar.monthlyClosing')} (ID)</th>
                  <th className="p-2 text-right">{t('dashboard.cards.income')}</th>
                  <th className="p-2 text-right">{t('dashboard.cards.expenses')}</th>
                  <th className="p-2 text-right">{t('dashboard.cards.savings')}</th>
                  <th className="p-2 text-right">{t('dashboard.cards.distributed')}</th>
                  <th className="p-2 text-center">{t('common.edit')}</th>
                </tr>
              </thead>
              <tbody>
                {(closings || []).map(cierre => (
                  <tr key={cierre.id} className="border-b border-border-main text-sm hover:bg-bg-tertiary">
                    <td className="p-2 font-semibold text-text-main">{cierre.id}</td>
                    <td className="p-2 text-right text-green-400">{formatCurrency(cierre.totalIncome)}</td>
                    <td className="p-2 text-right text-red-400">{formatCurrency(cierre.totalOutgoings)}</td>
                    <td className="p-2 text-right text-yellow-400">{formatCurrency(cierre.totalSavings)}</td>
                    <td className="p-2 text-right font-bold text-accent">{formatCurrency(cierre.totalToDistribute)}</td>
                    <td className="p-2 text-center">
                      <Link
                        to={`/cierres-mensuales/${cierre.id}`}
                        className="p-2 bg-bg-main rounded-md hover:bg-bg-tertiary inline-block"
                        title={t('sidebar.monthlyClosing')}
                      >
                        <i data-feather="eye" className="w-4 h-4"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {closings && closings.length === 0 && <p className="text-text-muted text-center p-4">{t('dashboard.noData')}</p>}
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPrint={handleConfirmPrint}
        title={t('dashboard.printCierres')}
      >
        <DashboardPrintTemplate
          type="cierres"
          data={{ closings: closingsData }}
          config={config}
          filterInfo="Todos los cierres mensuales"
          forPreview={true}
        />
      </PrintPreviewModal>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <DashboardPrintTemplate
          ref={componentRef}
          type="cierres"
          data={{ closings: closingsData }}
          config={config}
          filterInfo="Todos los cierres mensuales"
        />
      </div>
    </>
  );
};

// --- Pestaña 4: Clientes (Con i18n) ---
const TabClientes = () => {
  const { t } = useTranslation();
  const { movements, clients, collaborators, isLoading, config } = useData();
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
  const [filterType, setFilterType] = useState('month');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', items: [] });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const componentRef = useRef();

  useEffect(() => {
    handleDateFilter('month');
  }, []);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Analisis_Clientes_${new Date().toISOString().split('T')[0]}`,
  });

  const handleConfirmPrint = async () => {
    setIsPreviewOpen(false);
    await new Promise(resolve => setTimeout(resolve, 200));

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      alert('En dispositivos móviles, usa el menú de compartir de tu navegador para guardar como PDF o imprimir');
    }

    handlePrint();
  };

  const getFilterLabel = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (filterType === 'day') return `Día: ${dateRange.start.toLocaleDateString('es-CL', options)}`;
    if (filterType === 'week') return `Semana: ${dateRange.start.toLocaleDateString('es-CL')} - ${dateRange.end.toLocaleDateString('es-CL')}`;
    if (filterType === 'month') return `Mes: ${dateRange.start.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}`;
    if (filterType === 'year') return `Año: ${dateRange.start.getFullYear()}`;
    return 'Período personalizado';
  };

  const handleShowDetails = (title, items) => {
    setModalContent({ title, items });
    setIsDetailModalOpen(true);
  };
  const handleDateFilter = (type) => {
    setFilterType(type);
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    if (type === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
    }
    setDateRange({ start, end });
  };
  const clientSummary = useMemo(() => {
    if (!movements || !clients || !collaborators) return [];
    const filteredMovements = movements.filter(m => {
      const moveDate = m.date.toDate();
      return moveDate >= dateRange.start && moveDate <= dateRange.end && (m.type === 'Servicio' || m.type === 'Venta');
    });
    const clientData = {};
    for (const move of filteredMovements) {
      const clientName = move.client;
      if (clientName === 'Cliente Ocasional') continue;
      if (!clientData[clientName]) {
        clientData[clientName] = {
          totalSpent: 0,
          visits: new Set(),
          services: [],
          products: [],
        };
      }
      clientData[clientName].totalSpent += move.amount;
      clientData[clientName].visits.add(move.date.toDate().toISOString().split('T')[0]);
      if (move.type === 'Servicio') {
        const collabName = move.collaboratorName || collaborators.find(c => c.id === move.collaboratorId)?.name || 'Salón';
        clientData[clientName].services.push({
          id: move.id,
          description: move.description,
          collaboratorName: collabName,
          productsUsed: move.productsUsed || []
        });
      } else if (move.type === 'Venta') {
        clientData[clientName].products.push(move.description);
      }
    }
    return Object.entries(clientData)
      .map(([name, data]) => ({
        name: name,
        clientId: clients.find(c => c.name === name)?.id,
        totalSpent: data.totalSpent,
        visitCount: data.visits.size,
        services: data.services,
        products: data.products,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [movements, clients, collaborators, dateRange]);
  useEffect(() => {
    if (!isLoading) feather.replace();
  }, [clientSummary, isLoading, isDetailModalOpen]);
  if (isLoading) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 bg-bg-tertiary p-4 rounded-lg border border-border-main">
        <select onChange={(e) => handleDateFilter(e.target.value)} value={filterType} className="bg-bg-main border border-border-main rounded p-2">
          <option value="day">{t('dashboard.tabs.daily')}</option>
          <option value="week">{t('dashboard.tabs.period')}</option>
          <option value="month">{t('sidebar.monthlyClosing')}</option>
          <option value="year">{t('dashboard.tabs.period')}</option>
        </select>
      </div>
      <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bg-tertiary text-xs uppercase text-text-muted">
            <tr>
              <th className="p-3 font-semibold">{t('sidebar.clients')}</th>
              <th className="p-3 font-semibold text-center">{t('dashboard.cards.visits')}</th>
              <th className="p-3 font-semibold text-right">{t('dashboard.cards.expenses')}</th>
              <th className="p-3 font-semibold">{t('dashboard.cards.services')}</th>
              <th className="p-3 font-semibold">{t('dashboard.cards.sales')}</th>
            </tr>
          </thead>
          <tbody>
            {clientSummary.map(client => (
              <tr key={client.name} className="border-b border-border-main text-sm hover:bg-bg-tertiary">
                <td className="p-3 text-text-main font-semibold">
                  <Link to={`/clientes/${client.clientId}`} className="hover:text-accent flex items-center gap-2">
                    {client.name} <i data-feather="link" className="w-4 h-4"></i>
                  </Link>
                </td>
                <td className="p-3 text-center font-bold text-lg">{client.visitCount}</td>
                <td className="p-3 text-right font-semibold text-accent">{formatCurrency(client.totalSpent)}</td>
                <td className="p-3 text-xs text-text-secondary max-w-xs">
                  {client.services.length > 0 ? (
                    <ul className="space-y-1">
                      {client.services.map(service => (
                        <li key={service.id} className="flex items-center justify-between">
                          <span className="truncate">
                            {service.description} (con {service.collaboratorName})
                          </span>
                          {service.productsUsed.length > 0 && (
                            <button
                              className="p-1 text-accent hover:bg-bg-tertiary rounded-md ml-2 flex-shrink-0"
                              title={t('inventory.table.product')}
                              onClick={() => handleShowDetails(
                                `${t('inventory.table.product')}: ${service.description}`,
                                service.productsUsed.map(p => ({
                                  description: `${p.quantity}${p.unit} ${p.name}`,
                                  amount: 0
                                }))
                              )}
                            >
                              <i data-feather="box" className="w-4 h-4"></i>
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : 'N/A'}
                </td>
                <td className="p-3 text-xs text-text-secondary max-w-xs truncate" title={client.products.join(', ')}>
                  {client.products.length > 0 ? client.products.join(', ') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientSummary.length === 0 && <p className="text-text-muted text-center p-4">{t('dashboard.noData')}</p>}
      </div>
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={modalContent.title}
        items={modalContent.items}
      />
    </div>
  );
}

// --- Componente Principal de la Página (Con i18n) ---
const DashboardPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('diario');

  return (
    <>
      <h1 className="text-3xl font-bold text-text-main mb-6">{t('dashboard.title')}</h1>

      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <div className="flex rounded-md bg-bg-main p-1">
          <button
            onClick={() => setActiveTab('diario')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'diario' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.tabs.daily')}
          </button>
          <button
            onClick={() => setActiveTab('nominas')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'nominas' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.tabs.period')}
          </button>
          <button
            onClick={() => setActiveTab('cierres')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'cierres' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.tabs.closings')}
          </button>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'clientes' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('dashboard.tabs.clients')}
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        {activeTab === 'diario' && <TabDiario />}
        {activeTab === 'nominas' && <TabNominas />}
        {activeTab === 'cierres' && <TabCierres />}
        {activeTab === 'clientes' && <TabClientes />}
      </div>
    </>
  );
};
export default DashboardPage;
// ===== FIN: src/pages/DashboardPage.jsx (Con i18n) =====