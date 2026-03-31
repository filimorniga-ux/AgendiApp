// ===== INICIO: src/pages/NominasPage.jsx (Sprint - Plantillas de Nómina) =====
import React, { useMemo, useEffect, useState, useRef } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import DetailModal from '../components/modals/DetailModal';
import ClosePeriodoModal from '../components/modals/ClosePeriodoModal';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { sbCreate } from '../supabase/db';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import * as XLSX from 'xlsx';
import PrintPreviewModal from '../components/modals/PrintPreviewModal';
import { parseDate } from '../lib/dateUtils';
import PayrollActionsModal from '../components/modals/PayrollActionsModal';
import PayrollPrintTemplate from '../components/reports/PayrollPrintTemplate';
import { useReactToPrint } from 'react-to-print';
import { calculatePayroll, DEFAULT_TEMPLATE_STEPS } from '../lib/payrollEngine';
import TemplatesTab from '../components/nominas/TemplatesTab';

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toISODateString = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];

const getDatesForCurrentWeek = () => {
  const dates = [];
  const now   = new Date();
  const day   = now.getDay();
  const diff  = now.getDate() - day + (day === 0 ? -6 : 1);
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
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const days  = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= days; i++) dates.push(new Date(year, month, i));
  return dates;
};

// ─── Fila de detalle en tarjeta ───────────────────────────────────────────────
const PayrollRow = ({ label, value, color = 'neutral', isSubtotal = false, isClickable = false, onClick, formatCurrency }) => {
  const colorCls = color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : 'text-text-main';
  return (
    <>
      {isSubtotal && <hr className="border-border-main/50 my-1" />}
      <div
        className={`flex justify-between items-center py-2 border-b border-border-main/50 ${isClickable ? 'cursor-pointer hover:bg-bg-tertiary -mx-2 px-2 rounded-md' : ''}`}
        onClick={isClickable ? onClick : undefined}
      >
        <span className={`text-sm flex items-center gap-1 ${isSubtotal ? 'font-semibold text-text-main' : 'text-text-muted'}`}>
          {label}
          {isClickable && <i data-feather="chevron-down" className="w-3 h-3" />}
        </span>
        <span className={`font-semibold ${colorCls}`}>{formatCurrency(value)}</span>
      </div>
    </>
  );
};

// ─── Tarjeta de colaborador (usa motor dinámico) ──────────────────────────────
const CollaboratorCard = ({ col, filteredMovements, activeSteps, config, onShowDetail, formatCurrency }) => {
  const collaboratorMovements  = filteredMovements.filter(m => m.collaboratorId === col.id);
  const serviceItems           = collaboratorMovements.filter(m => m.type === 'Servicio');
  const techCostItems          = serviceItems.filter(m => (m.technicalCost || 0) > 0).map(m => ({
    id: m.id, description: `Costo de: ${m.description}`, amount: -(m.technicalCost || 0), date: m.date,
  }));
  const advanceItems           = collaboratorMovements.filter(m => m.type === 'Adelanto');
  const salesCommissionItems   = collaboratorMovements.filter(m => m.type === 'ComisionVenta');
  const propinaItems           = collaboratorMovements.filter(m => m.type === 'ComisionPropina');

  const defaultSettings = { taxGeneral: 19, taxOverrides: {} };
  const foundSettings   = config?.find(c => c.id === 'settings');
  const settings        = { ...defaultSettings, ...foundSettings };

  const colData = {
    totalServices:        serviceItems.reduce((s, m) => s + (m.amount || 0), 0),
    totalTechCost:        techCostItems.reduce((s, m) => s + Math.abs(m.amount || 0), 0),
    totalAdvances:        advanceItems.reduce((s, m) => s + (m.amount || 0), 0),
    totalSalesCommissions: salesCommissionItems.reduce((s, m) => s + (m.amount || 0), 0),
    totalPropinas:        propinaItems.reduce((s, m) => s + (m.amount || 0), 0),
    commissionPercent:    col.commissionPercent || 0,
    taxPercent:           settings.taxOverrides?.[col.id] || settings.taxGeneral,
  };

  const { rows, finalPayment } = useMemo(
    () => calculatePayroll(colData, activeSteps.filter(s => s.enabled)),
    [activeSteps, colData.totalServices, colData.totalTechCost]
  );

  const detailMap = {
    gross:       serviceItems,
    tech_cost:   techCostItems,
    commissions: salesCommissionItems,
    tips:        propinaItems,
    advances:    advanceItems,
  };

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-main shadow-lg flex flex-col">
      <div className="p-4 border-b border-border-main">
        <h3 className="font-bold text-xl text-text-main">{col.name}</h3>
      </div>
      <div className="p-4 space-y-0.5 flex-grow">
        {rows.map(row => (
          <PayrollRow
            key={row.id}
            label={row.label}
            value={Math.abs(row.value)}
            color={row.color}
            isSubtotal={row.isSubtotal}
            isClickable={!!detailMap[row.id]?.length}
            onClick={() => detailMap[row.id] && onShowDetail(`${row.label}: ${col.name}`, detailMap[row.id])}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>
      <div className="bg-bg-main/50 p-4 rounded-b-lg mt-auto">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg uppercase text-text-muted">Pago Final</span>
          <span className="font-bold text-2xl text-accent">{formatCurrency(finalPayment)}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const NominasPage = () => {
  const { t } = useTranslation();
  const { movements, collaborators, config, isLoading, businessId } = useData();
  const { formatCurrency } = useCurrencyFormat();

  const [tab,           setTab]           = useState('nomina'); // 'nomina' | 'plantillas'
  const [selectedDates, setSelectedDates] = useState([]);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [isCloseOpen,   setIsCloseOpen]   = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [modalContent,  setModalContent]  = useState({ title: '', items: [] });

  // Plantilla activa desde Supabase
  const [activeTemplate, setActiveTemplate] = useState(null); // { steps, overrides: {colId: steps} }
  const [loadingTmpl,    setLoadingTmpl]    = useState(true);

  const componentRef = useRef();
  const [printCollabId, setPrintCollabId]  = useState(null);
  const [isPreviewOpen, setIsPreviewOpen]  = useState(false);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Nomina_${new Date().toISOString().split('T')[0]}`,
  });

  // ── Cargar plantilla default + overrides desde Supabase ──────────────────
  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      setLoadingTmpl(true);
      try {
        if (DEV_BYPASS) {
          await supabase.rpc('set_config', { setting: 'app.business_id', value: businessId, is_local: false });
        }
        const [{ data: tmpl }, { data: ovr }] = await Promise.all([
          supabase.from('payroll_templates').select('*').eq('business_id', businessId).eq('is_default', true).maybeSingle(),
          supabase.from('collaborator_template_overrides').select('*').eq('business_id', businessId),
        ]);
        const overrideMap = {};
        (ovr || []).forEach(o => { overrideMap[o.collaborator_id] = o.steps; });
        setActiveTemplate({
          globalSteps: tmpl?.steps || DEFAULT_TEMPLATE_STEPS,
          overrides:   overrideMap,
        });
      } finally {
        setLoadingTmpl(false);
      }
    };
    load();
  }, [businessId, tab]); // recarga si cambia de tab (volvió de editar plantilla)

  // ── Movimientos filtrados ───────────────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    const dateStrings = selectedDates.map(toISODateString);
    return movements.filter(m => {
      const str = parseDate(m.date).toISOString().split('T')[0];
      return dateStrings.length > 0 && dateStrings.includes(str);
    });
  }, [movements, selectedDates]);

  const activeCollabs = useMemo(() => (collaborators || []).filter(c => c.status === 'active'), [collaborators]);

  // Summary para ClosePeriodo / Export (cálculo rápido con motor)
  const payrollCards = useMemo(() => {
    if (!activeTemplate) return [];
    return activeCollabs.map(col => {
      const steps = activeTemplate.overrides?.[col.id] || activeTemplate.globalSteps;
      const collaboratorMovements = filteredMovements.filter(m => m.collaboratorId === col.id);
      const serviceItems          = collaboratorMovements.filter(m => m.type === 'Servicio');
      const techCostItems         = serviceItems.filter(m => (m.technicalCost || 0) > 0).map(m => ({
        id: m.id, description: `Costo de: ${m.description}`, amount: -(m.technicalCost || 0), date: m.date,
      }));
      const advanceItems          = collaboratorMovements.filter(m => m.type === 'Adelanto');
      const salesCommissionItems  = collaboratorMovements.filter(m => m.type === 'ComisionVenta');
      const propinaItems          = collaboratorMovements.filter(m => m.type === 'ComisionPropina');
      const defaultSettings       = { taxGeneral: 19, taxOverrides: {} };
      const foundSettings         = config?.find(c => c.id === 'settings');
      const settings              = { ...defaultSettings, ...foundSettings };
      const colData = {
        totalServices:         serviceItems.reduce((s, m) => s + (m.amount || 0), 0),
        totalTechCost:         techCostItems.reduce((s, m) => s + Math.abs(m.amount || 0), 0),
        totalAdvances:         advanceItems.reduce((s, m) => s + (m.amount || 0), 0),
        totalSalesCommissions: salesCommissionItems.reduce((s, m) => s + (m.amount || 0), 0),
        totalPropinas:         propinaItems.reduce((s, m) => s + (m.amount || 0), 0),
        commissionPercent:     col.commissionPercent || 0,
        taxPercent:            settings.taxOverrides?.[col.id] || settings.taxGeneral,
      };
      const { finalPayment } = calculatePayroll(colData, steps.filter(s => s.enabled));
      return {
        id: col.id, name: col.name, finalPayment,
        serviceItems, advanceItems, salesCommissionItems, propinaItems,
        ...colData,
      };
    });
  }, [activeCollabs, filteredMovements, activeTemplate, config]);

  const dateRangeString = useMemo(() => {
    if (!selectedDates.length) return t('payroll.customPeriod');
    const first = new Date(Math.min(...selectedDates.map(d => d.getTime())));
    const last  = new Date(Math.max(...selectedDates.map(d => d.getTime())));
    return `${first.toLocaleDateString('es-CL')} - ${last.toLocaleDateString('es-CL')}`;
  }, [selectedDates, t]);

  const summary = { payrollCards, dateRangeString };

  useEffect(() => { feather.replace(); }, [tab, selectedDates, payrollCards, isDetailOpen]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDateChange = (date) => {
    const str = toISODateString(date);
    setSelectedDates(prev =>
      prev.some(d => toISODateString(d) === str)
        ? prev.filter(d => toISODateString(d) !== str)
        : [...prev, date]
    );
  };

  const tileClassName = ({ date, view }) =>
    view === 'month' && selectedDates.some(d => toISODateString(d) === toISODateString(date))
      ? 'react-calendar-tile-selected'
      : null;

  const handleShowDetails = (title, items) => { setModalContent({ title, items }); setIsDetailOpen(true); };

  const handleSavePayrollClosing = async (closingName) => {
    if (!closingName.trim()) { toast.error(t('payroll.errors.nameRequired')); return; }
    try {
      const closingData = {
        name: closingName,
        date_range: dateRangeString,
        selected_dates: selectedDates.map(toISODateString),
        summary: payrollCards.map(c => ({
          collaboratorId: c.id, collaboratorName: c.name,
          totalServices: c.totalServices || 0, totalTechCost: c.totalTechCost || 0,
          totalAdvances: c.totalAdvances || 0, totalSalesCommissions: c.totalSalesCommissions || 0,
          totalPropinas: c.totalPropinas || 0, finalPayment: c.finalPayment || 0,
        })),
      };
      const { error } = await sbCreate('payrollClosings', closingData, businessId);
      if (error) throw error;
      toast.success(t('payroll.successClose'));
      setIsCloseOpen(false);
    } catch (err) { console.warn(err); toast.error(t('common.error')); }
  };

  const handleExportExcel = (collaboratorId) => {
    try {
      const wb       = XLSX.utils.book_new();
      const dateStr  = dateRangeString.replace(/\//g, '-');
      const cards    = collaboratorId ? payrollCards.filter(c => c.id === collaboratorId) : payrollCards;
      const wsSummary = XLSX.utils.json_to_sheet(cards.map(c => ({
        Colaborador: c.name, Servicios: c.totalServices, Costo_Tecnico: c.totalTechCost,
        Adelantos: c.totalAdvances, Comisiones: c.totalSalesCommissions,
        Propinas: c.totalPropinas, Pago_Final: c.finalPayment,
      })));
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
      XLSX.writeFile(wb, `Nomina_${collaboratorId ? 'Detallada' : 'General'}_${dateStr}.xlsx`);
      toast.success(t('reports.exportSuccess'));
    } catch (e) { console.warn(e); toast.error(t('common.error')); }
  };

  const handleAction = (type, collaboratorId) => {
    if (type === 'print') { setPrintCollabId(collaboratorId); setIsPreviewOpen(true); }
    else if (type === 'export') handleExportExcel(collaboratorId);
  };

  if (isLoading || loadingTmpl) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-text-main">{t('sidebar.payroll')}</h2>
        <p className="text-text-muted">{t('payroll.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg-secondary rounded-xl p-1 border border-border-main w-fit">
        {[
          { key: 'nomina',     icon: 'dollar-sign', label: 'Nómina'     },
          { key: 'plantillas', icon: 'sliders',     label: 'Plantillas' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-accent text-accent-text shadow-md'
                : 'text-text-muted hover:text-text-main hover:bg-bg-tertiary'
            }`}
          >
            <i data-feather={icon} className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Nómina ── */}
      {tab === 'nomina' && (
        <div className="flex flex-col gap-6">
          {/* Controles de fecha */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSelectedDates(getDatesForCurrentWeek())} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
                <i data-feather="calendar" className="w-4 h-4" /> {t('payroll.thisWeek')}
              </button>
              <button onClick={() => setSelectedDates(getDatesForCurrentMonth())} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
                <i data-feather="calendar" className="w-4 h-4" /> {t('payroll.thisMonth')}
              </button>
              <button onClick={() => setSelectedDates([])} className="btn-golden bg-bg-tertiary text-text-muted text-sm py-2 px-3 flex items-center gap-2">
                <i data-feather="x" className="w-4 h-4" /> {t('payroll.clear')}
              </button>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setIsActionsOpen(true)} disabled={!payrollCards.length}
                  className="btn-golden bg-blue-600 text-white text-sm py-2 px-3 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:bg-blue-700">
                  <i data-feather="settings" className="w-4 h-4" />
                  <span className="hidden md:inline">{t('payroll.actionsBtn')}</span>
                </button>
                <Link to="/app/nomina/historial" className="btn-golden bg-bg-main/50 text-text-muted text-sm py-2 px-3 flex items-center gap-2">
                  <i data-feather="archive" className="w-4 h-4" /> {t('payroll.historyBtn')}
                </Link>
                <button onClick={() => setIsCloseOpen(true)} disabled={!selectedDates.length}
                  className="btn-golden flex-shrink-0 flex items-center text-sm py-2 px-3 disabled:opacity-50">
                  <i data-feather="check-circle" className="mr-2 h-4 w-4" /> {t('payroll.closePeriodBtn')}
                </button>
              </div>
            </div>
            <div className="bg-bg-secondary p-4 rounded-lg border border-border-main">
              <Calendar onChange={handleDateChange} value={null} selectRange={false} tileClassName={tileClassName} className="react-calendar-gema" />
            </div>
          </div>

          {/* Tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeCollabs.map(col => (
              <CollaboratorCard
                key={col.id}
                col={col}
                filteredMovements={filteredMovements}
                activeSteps={activeTemplate?.overrides?.[col.id] || activeTemplate?.globalSteps || DEFAULT_TEMPLATE_STEPS}
                config={config}
                onShowDetail={handleShowDetails}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
          {!activeCollabs.length && !isLoading && (
            <div className="bg-bg-secondary rounded-lg p-8 text-center text-text-muted">
              <p>{t('dashboard.noData')}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Plantillas ── */}
      {tab === 'plantillas' && <TemplatesTab />}

      {/* Modales */}
      <DetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={modalContent.title} items={modalContent.items} />
      <ClosePeriodoModal isOpen={isCloseOpen} onClose={() => setIsCloseOpen(false)} onSave={handleSavePayrollClosing} summaryData={payrollCards} dateRangeString={dateRangeString} />
      <PayrollActionsModal isOpen={isActionsOpen} onClose={() => setIsActionsOpen(false)} collaborators={payrollCards} onAction={handleAction} />
      <PrintPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onPrint={() => { setIsPreviewOpen(false); setTimeout(handlePrint, 200); }} title={t('payroll.print.title')}>
        <div className="flex justify-center bg-white p-4">
          <PayrollPrintTemplate summary={summary} selectedCollaboratorId={printCollabId} config={config} forPreview={true} />
        </div>
      </PrintPreviewModal>
      <div style={{ display: 'none' }}>
        <PayrollPrintTemplate ref={componentRef} summary={summary} selectedCollaboratorId={printCollabId} config={config} />
      </div>
    </>
  );
};

export default NominasPage;
// ===== FIN: src/pages/NominasPage.jsx =====