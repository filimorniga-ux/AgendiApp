// ===== INICIO: src/pages/NominasPage.jsx (Sprint 93 - Fix NaN) =====
import React, { useMemo, useEffect, useState } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import DetailModal from '../components/modals/DetailModal';
import ClosePeriodoModal from '../components/modals/ClosePeriodoModal';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import * as XLSX from 'xlsx';
import PrintPreviewModal from '../components/modals/PrintPreviewModal';



const PayrollRow = ({ label, value, className = '', isClickable = false, onClick = () => { }, formatCurrency }) => (
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

const toISODateString = (date) => {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .split("T")[0];
};

const getDatesForCurrentWeek = () => {
  const dates = [];
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Lunes
  const monday = new Date(now.setDate(diff));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const getDatesForCurrentMonth = () => {
  const dates = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(new Date(year, month, i));
  }
  return dates;
};

import PayrollActionsModal from '../components/modals/PayrollActionsModal';
import PayrollPrintTemplate from '../components/reports/PayrollPrintTemplate';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const NominasPage = () => {
  const { t } = useTranslation();
  const { movements, collaborators, config, isLoading } = useData();
  const { formatCurrency } = useCurrencyFormat();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', items: [] });
  const [selectedDates, setSelectedDates] = useState([]);

  // Print Ref and State
  const componentRef = useRef();
  const [printCollaboratorId, setPrintCollaboratorId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Nomina_${new Date().toISOString().split('T')[0]}`,
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

  const summary = useMemo(() => {
    if (!movements || !collaborators || !config) {
      return { payrollCards: [], dateRangeString: '' };
    }
    const defaultSettings = { taxGeneral: 19, taxOverrides: {} };
    const foundSettings = config.find(c => c.id === 'settings');
    const settings = { ...defaultSettings, ...foundSettings };
    const selectedDateStrings = selectedDates.map(toISODateString);

    const filteredMovements = movements.filter(m => {
      const moveDateStr = m.date.toDate().toISOString().split('T')[0];
      // Option B: If no date selected, show 0 (don't include any movements)
      return selectedDateStrings.length > 0 && selectedDateStrings.includes(moveDateStr);
    });

    const payrollCards = (collaborators || [])
      .filter(c => c.status === 'active')
      .map(col => {
        const collaboratorMovements = filteredMovements.filter(m => m.collaboratorId === col.id);
        const serviceItems = collaboratorMovements.filter(m => m.type === 'Servicio');
        const techCostItems = serviceItems.filter(m => (m.technicalCost || 0) > 0).map(m => ({ id: m.id, description: `Costo de: ${m.description}`, amount: -(m.technicalCost || 0), date: m.date, productsUsed: m.productsUsed || [] }));
        const advanceItems = collaboratorMovements.filter(m => m.type === 'Adelanto');

        const salesCommissionItems = collaboratorMovements.filter(m => m.type === 'ComisionVenta');
        const propinaItems = collaboratorMovements.filter(m => m.type === 'ComisionPropina');

        const totalSalesCommissions = salesCommissionItems.reduce((s, m) => s + (m.amount || 0), 0);
        const totalPropinas = propinaItems.reduce((s, m) => s + (m.amount || 0), 0);
        const totalServices = serviceItems.reduce((s, m) => s + (m.amount || 0), 0);
        const totalTechCost = techCostItems.reduce((s, m) => s + Math.abs(m.amount || 0), 0);
        const totalAdvances = advanceItems.reduce((s, m) => s + (m.amount || 0), 0);

        const taxPercent = settings.taxOverrides?.[col.id] || settings.taxGeneral;
        const base = totalServices - totalTechCost;
        const taxAmount = base * (taxPercent / 100);
        const net = base - taxAmount;
        const participation = net * (col.commissionPercent / 100);

        const finalPayment = participation + totalAdvances + totalSalesCommissions + totalPropinas;

        return {
          id: col.id, name: col.name, totalServices, totalTechCost, taxAmount,
          baseNet: net, participation, totalAdvances, totalSalesCommissions, totalPropinas, finalPayment,
          techCostItems, advanceItems, salesCommissionItems, serviceItems, propinaItems,
          commissionPercent: col.commissionPercent // Added for reference
        };
      });

    let dateRangeString = t('payroll.customPeriod');
    if (selectedDates.length > 0) {
      const firstDate = new Date(Math.min.apply(null, selectedDates.map(d => d.getTime())));
      const lastDate = new Date(Math.max.apply(null, selectedDates.map(d => d.getTime())));
      dateRangeString = `${firstDate.toLocaleDateString('es-CL')} - ${lastDate.toLocaleDateString('es-CL')}`;
    }
    return { payrollCards, dateRangeString };
  }, [movements, collaborators, config, selectedDates, t]);

  useEffect(() => { feather.replace(); }, [summary, isDetailModalOpen, isCloseModalOpen, selectedDates, isActionsModalOpen]);

  const handleAction = (type, collaboratorId) => {
    if (type === 'print') {
      setPrintCollaboratorId(collaboratorId);
      setIsPreviewOpen(true); // Open preview instead of printing immediately
    } else if (type === 'export') {
      handleExportExcel(collaboratorId);
    }
  };

  const handleExportExcel = (collaboratorId) => {
    try {
      const wb = XLSX.utils.book_new();
      const dateStr = summary.dateRangeString.replace(/\//g, '-');

      const cardsToExport = collaboratorId
        ? summary.payrollCards.filter(c => c.id === collaboratorId)
        : summary.payrollCards;

      // 1. Summary Sheet
      const summaryData = cardsToExport.map(c => ({
        Colaborador: c.name,
        Servicios: c.totalServices,
        Costo_Tecnico: c.totalTechCost,
        Impuestos: c.taxAmount,
        Base_Neta: c.baseNet,
        Participacion: c.participation,
        Comisiones_Venta: c.totalSalesCommissions,
        Propinas: c.totalPropinas,
        Adelantos: c.totalAdvances,
        Pago_Final: c.finalPayment
      }));
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      // 2. Detailed Sheets
      const allServices = [];
      const allSales = [];
      const allAdvances = [];

      cardsToExport.forEach(c => {
        // Services
        if (c.serviceItems) {
          c.serviceItems.forEach(s => {
            allServices.push({
              Colaborador: c.name,
              Fecha: s.date?.toDate?.()?.toLocaleDateString() || 'N/A',
              Cliente: s.client || 'N/A',
              Servicio: s.description,
              Monto: s.amount,
              Costo_Tecnico: s.technicalCost || 0,
              Productos_Usados: (s.productsUsed || []).map(p => `${p.quantity}${p.unit} ${p.name}`).join(', ')
            });
          });
        }
        // Sales
        if (c.salesCommissionItems) {
          c.salesCommissionItems.forEach(s => {
            allSales.push({
              Colaborador: c.name,
              Fecha: s.date?.toDate?.()?.toLocaleDateString() || 'N/A',
              Cliente: s.client || 'N/A',
              Producto: s.description,
              Comision: s.amount
            });
          });
        }
        // Advances
        if (c.advanceItems) {
          c.advanceItems.forEach(a => {
            allAdvances.push({
              Colaborador: c.name,
              Fecha: a.date?.toDate?.()?.toLocaleDateString() || 'N/A',
              Descripcion: a.description,
              Monto: a.amount
            });
          });
        }
      });

      if (allServices.length > 0) {
        const wsServices = XLSX.utils.json_to_sheet(allServices);
        XLSX.utils.book_append_sheet(wb, wsServices, "Detalle_Servicios");
      }
      if (allSales.length > 0) {
        const wsSales = XLSX.utils.json_to_sheet(allSales);
        XLSX.utils.book_append_sheet(wb, wsSales, "Detalle_Ventas");
      }
      if (allAdvances.length > 0) {
        const wsAdvances = XLSX.utils.json_to_sheet(allAdvances);
        XLSX.utils.book_append_sheet(wb, wsAdvances, "Detalle_Adelantos");
      }

      XLSX.writeFile(wb, `Nomina_${collaboratorId ? 'Detallada' : 'General'}_${dateStr}.xlsx`);
      toast.success(t('reports.exportSuccess'));
    } catch (error) {
      console.warn("Error exporting payroll detail:", error);
      toast.error(t('common.error'));
    }
  };

  const handleShowDetails = (title, items) => {
    setModalContent({ title, items });
    setIsDetailModalOpen(true);
  };

  const handleSavePayrollClosing = async (closingName) => {
    if (!closingName.trim()) {
      toast.error(t('payroll.errors.nameRequired'));
      return;
    }
    try {
      const closingData = {
        name: closingName,
        dateRange: summary.dateRangeString,
        selectedDatesISO: selectedDates.map(toISODateString),
        createdAt: serverTimestamp(),
        summary: summary.payrollCards.map(collab => ({
          collaboratorId: collab.id,
          collaboratorName: collab.name,
          totalServices: collab.totalServices || 0,
          totalTechCost: collab.totalTechCost || 0,
          taxAmount: collab.taxAmount || 0,
          baseNet: collab.baseNet || 0,
          participation: collab.participation || 0,
          totalAdvances: collab.totalAdvances || 0,
          totalSalesCommissions: collab.totalSalesCommissions || 0,
          totalPropinas: collab.totalPropinas || 0,
          finalPayment: collab.finalPayment || 0,
          detail: {
            serviceItems: (collab.serviceItems || []).map(m => ({ desc: m.description, amount: m.amount })),
            techCostItems: (collab.techCostItems || []).map(m => ({ desc: m.description, amount: m.amount })),
            advanceItems: (collab.advanceItems || []).map(m => ({ desc: m.description, amount: m.amount })),
            salesCommissionItems: (collab.salesCommissionItems || []).map(m => ({ desc: m.description, amount: m.amount })),
            propinaItems: (collab.propinaItems || []).map(m => ({ desc: m.description, amount: m.amount })),
          }
        })),
      };

      await addDoc(collection(db, 'payrollClosings'), closingData);
      toast.success(t('payroll.successClose'));
      setIsCloseModalOpen(false);
    } catch (error) {
      console.warn("Error saving payroll closing:", error);
      toast.error(t('common.error'));
    }
  };

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
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-text-main">{t('sidebar.payroll')}</h2>
        <p className="text-text-muted">{t('payroll.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setSelectedDates(getDatesForCurrentWeek())} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
              <i data-feather="calendar" className="w-4 h-4"></i> {t('payroll.thisWeek')}
            </button>
            <button onClick={() => setSelectedDates(getDatesForCurrentMonth())} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
              <i data-feather="calendar" className="w-4 h-4"></i> {t('payroll.thisMonth')}
            </button>
            <button onClick={() => setSelectedDates([])} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
              <i data-feather="x" className="w-4 h-4"></i> {t('payroll.clear')}
            </button>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setIsActionsModalOpen(true)}
                disabled={summary.payrollCards.length === 0}
                className="btn-golden bg-blue-600 text-white text-sm py-2 px-3 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:bg-blue-700"
                title={t('payroll.actionsBtn')}
              >
                <i data-feather="settings" className="w-4 h-4"></i>
                <span className="hidden md:inline">{t('payroll.actionsBtn')}</span>
              </button>

              <Link
                to="/app/nomina/historial"
                className="btn-golden bg-bg-main/50 text-text-muted text-sm py-2 px-3 flex items-center gap-2"
              >
                <i data-feather="archive" className="w-4 h-4"></i> {t('payroll.historyBtn')}
              </Link>
              <button
                onClick={() => setIsCloseModalOpen(true)}
                disabled={selectedDates.length === 0}
                className="btn-golden flex-shrink-0 flex items-center text-sm py-2 px-3 disabled:opacity-50"
              >
                <i data-feather="check-circle" className="mr-2 h-4 w-4"></i>
                <span>{t('payroll.closePeriodBtn')}</span>
              </button>
            </div>
          </div>
          <div className="bg-bg-secondary p-4 rounded-lg border border-border-main">
            <Calendar
              onChange={handleDateChange}
              value={null}
              selectRange={false}
              tileClassName={tileClassName}
              className="react-calendar-gema"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(summary.payrollCards || []).map(collabData => (
              <div key={collabData.id} className="bg-bg-secondary rounded-lg border border-border-main shadow-lg flex flex-col">
                <div className="p-4 border-b border-border-main">
                  <h3 className="font-bold text-xl text-text-main">{collabData.name}</h3>
                </div>
                <div className="p-4 space-y-2 flex-grow">
                  <PayrollRow label={t('payroll.cards.gross')} value={collabData.totalServices} isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.gross')}: ${collabData.name}`, collabData.serviceItems)} formatCurrency={formatCurrency} />
                  <PayrollRow label={t('payroll.cards.techCost')} value={collabData.totalTechCost} className="text-red-400" isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.techCost')}: ${collabData.name}`, collabData.techCostItems)} formatCurrency={formatCurrency} />
                  <PayrollRow label={t('payroll.cards.tax')} value={collabData.taxAmount} className="text-red-400" formatCurrency={formatCurrency} />
                  <div className="flex justify-between items-center py-2 border-b border-border-main font-semibold">
                    <span className="text-sm text-text-muted">{t('payroll.cards.netBase')}</span>
                    <span className="text-text-main">{formatCurrency(collabData.baseNet)}</span>
                  </div>
                  <PayrollRow label={t('payroll.cards.participation')} value={collabData.participation} className="text-green-400" formatCurrency={formatCurrency} />
                  <PayrollRow label={t('payroll.cards.commission')} value={collabData.totalSalesCommissions} className="text-green-400" isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.commission')}: ${collabData.name}`, collabData.salesCommissionItems)} formatCurrency={formatCurrency} />
                  <PayrollRow label={t('payroll.cards.tips')} value={collabData.totalPropinas} className="text-green-400" isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.tips')}: ${collabData.name}`, collabData.propinaItems)} formatCurrency={formatCurrency} />
                  <PayrollRow label={t('payroll.cards.advances')} value={collabData.totalAdvances} className={collabData.totalAdvances >= 0 ? 'text-green-400' : 'text-yellow-400'} isClickable={true} onClick={() => handleShowDetails(`${t('payroll.cards.advances')}: ${collabData.name}`, collabData.advanceItems)} formatCurrency={formatCurrency} />
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
          {summary.payrollCards.length === 0 && !isLoading && (
            <div className="bg-bg-secondary rounded-lg p-8 text-center text-text-muted">
              <p>{t('dashboard.noData')}</p>
            </div>
          )}
        </div>
      </div>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={modalContent.title}
        items={modalContent.items}
      />
      <ClosePeriodoModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSave={handleSavePayrollClosing}
        summaryData={summary.payrollCards}
        dateRangeString={summary.dateRangeString}
      />

      <PayrollActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
        collaborators={summary.payrollCards}
        onAction={handleAction}
      />

      {/* Hidden Print Template */}
      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPrint={handleConfirmPrint}
        title={t('payroll.print.title')}
      >
        <div className="flex justify-center bg-white p-4">
          {/* Render PayrollPrintTemplate visible for preview */}
          <PayrollPrintTemplate
            summary={summary}
            selectedCollaboratorId={printCollaboratorId}
            config={config}
            forPreview={true}
          />
        </div>
      </PrintPreviewModal>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <PayrollPrintTemplate
          ref={componentRef}
          summary={summary}
          selectedCollaboratorId={printCollaboratorId}
          config={config}
        />
      </div>
    </>
  );
};
export default NominasPage;
// ===== FIN: src/pages/NominasPage.jsx (Sprint 93) =====