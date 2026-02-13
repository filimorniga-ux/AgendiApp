// ===== INICIO: src/pages/CierresMensualesPage.jsx (Sprint 91) =====
import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useMonthlyRecords } from '../hooks/useMonthlyRecords';
import { useData } from '../context/DataContext';
import MonthlyRecordModal from '../components/modals/MonthlyRecordModal';
import { db } from '../firebase/config';
import { doc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const MonthlyColumn = ({ title, icon, records = [], categoryKey, onEdit, onDelete }) => {
  const filteredRecords = records.filter(r => (r[categoryKey] || 0) !== 0);
  const total = filteredRecords.reduce((sum, r) => sum + (r[categoryKey] || 0), 0);
  const locale = 'es-CL';
  return (
    <div className="bg-bg-secondary rounded-lg p-4 flex flex-col min-w-[380px] lg:min-w-[420px] max-h-[75vh] border border-border-main transition-all duration-300 print:min-w-0 print:max-h-none print:border-gray-300 print:bg-white print:break-inside-avoid">
      <h3 className="font-bold text-lg mb-1 flex items-center text-text-main">
        <i data-feather={icon} className="w-5 h-5 mr-2 text-accent"></i> {title}
      </h3>
      <div className="flex-grow overflow-y-auto pr-2 mt-3">
        <div className="space-y-1">
          {filteredRecords.length > 0 ? filteredRecords.map(record => (
            <div key={record.id} className="grid grid-cols-[auto,1fr,auto,auto] gap-x-2 items-center text-sm p-2 border-b border-border-main/50 hover:bg-bg-tertiary rounded-md group">
              <span className="text-text-muted">{new Date(record.date + 'T00:00:00').toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}</span>
              <span className="truncate text-text-secondary" title={record.description}>{record.description}</span>
              <span className="font-semibold text-right w-20 text-text-main">{formatCurrency(record[categoryKey])}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex print:hidden">
                <button onClick={() => onEdit(record)} className="p-1 text-text-muted hover:text-accent">
                  <i data-feather="edit-2" className="w-3 h-3"></i>
                </button>
                <button onClick={() => onDelete(record)} className="p-1 text-text-muted hover:text-red-400">
                  <i data-feather="trash-2" className="w-3 h-3"></i>
                </button>
              </div>
            </div>
          )) : (
            <p className="text-sm text-text-muted pt-4 italic">Sin movimientos</p>
          )}
        </div>
      </div>
      <div className="border-t border-border-main mt-auto pt-3 text-right">
        <span className="text-text-muted text-xs uppercase tracking-wider">Total: </span>
        <span className="font-bold text-lg text-text-main">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

const CierresMensualesPage = () => {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);

  const { records, partners, loading: loadingMonthly } = useMonthlyRecords(selectedMonth);
  const { config } = useData();

  // Usar useMemo para que las categorías se actualicen al cambiar el idioma
  const monthlyCategories = useMemo(() => ({
    cashUnsealed: { icon: 'sun', title: t('closings.categories.cashUnsealed') },
    cashWeekly: { icon: 'dollar-sign', title: t('closings.categories.cashWeekly') },
    transfers: { icon: 'send', title: t('closings.categories.transfers') },
    cards: { icon: 'credit-card', title: t('closings.categories.cards') },
    partnersAdvances: { icon: 'user-minus', title: t('closings.categories.partnersAdvances') },
    monthlyOutgoings: { icon: 'arrow-up-circle', title: t('closings.categories.monthlyOutgoings') },
    weeklySalesSavings: { icon: 'shield', title: t('closings.categories.weeklySalesSavings') },
    taxSavings: { icon: 'briefcase', title: t('closings.categories.taxSavings') },
    techSavings: { icon: 'tool', title: t('closings.categories.techSavings') },
  }), [t]);

  const summary = useMemo(() => {
    const totals = {};
    Object.keys(monthlyCategories).forEach(key => totals[key] = 0);
    (records || []).forEach(record => {
      Object.keys(monthlyCategories).forEach(key => {
        totals[key] += (parseFloat(record[key]) || 0);
      });
    });
    const totalIncome = totals.cashUnsealed + totals.cashWeekly + totals.transfers + totals.cards;
    const totalOutgoings = totals.partnersAdvances + totals.monthlyOutgoings;
    const totalSavings = totals.weeklySalesSavings + totals.taxSavings + totals.techSavings;
    const totalToDistribute = totalIncome - totalOutgoings - totalSavings;
    const settings = (config && config.find(c => c.id === 'settings')) || { partners: [] };
    const partnersToDisplay = partners !== null ? partners : settings.partners;
    return {
      totalIncome, totalOutgoings, totalSavings, totalToDistribute,
      partnersToDisplay: partnersToDisplay || [],
    };
  }, [records, partners, config, monthlyCategories]);

  useEffect(() => {
    feather.replace();
  }, [records, partners, summary, isModalOpen, loadingMonthly]);

  const handleOpenCreateModal = () => {
    setRecordToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (record) => {
    setRecordToEdit(record);
    setIsModalOpen(true);
  };
  const handleDeleteRecord = async (record) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      const docRef = doc(db, 'monthlyClosings', selectedMonth, 'records', record.id);
      await deleteDoc(docRef);
      toast.success(t('common.success'));
    } catch (error) {
      console.error("Error:", error);
      toast.error(t('common.error'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

      // Sheet 1: Resumen General
      const summaryData = [
        ['CIERRE MENSUAL - ' + monthName.toUpperCase()],
        [''],
        ['INGRESOS'],
        [t('closings.categories.cashUnsealed'), summary.totalIncome > 0 ? records.reduce((s, r) => s + (r.cashUnsealed || 0), 0) : 0],
        [t('closings.categories.cashWeekly'), summary.totalIncome > 0 ? records.reduce((s, r) => s + (r.cashWeekly || 0), 0) : 0],
        [t('closings.categories.transfers'), summary.totalIncome > 0 ? records.reduce((s, r) => s + (r.transfers || 0), 0) : 0],
        [t('closings.categories.cards'), summary.totalIncome > 0 ? records.reduce((s, r) => s + (r.cards || 0), 0) : 0],
        ['TOTAL INGRESOS', summary.totalIncome],
        [''],
        ['EGRESOS'],
        [t('closings.categories.partnersAdvances'), summary.totalOutgoings > 0 ? records.reduce((s, r) => s + (r.partnersAdvances || 0), 0) : 0],
        [t('closings.categories.monthlyOutgoings'), summary.totalOutgoings > 0 ? records.reduce((s, r) => s + (r.monthlyOutgoings || 0), 0) : 0],
        ['TOTAL EGRESOS', summary.totalOutgoings],
        [''],
        ['AHORROS'],
        [t('closings.categories.weeklySalesSavings'), summary.totalSavings > 0 ? records.reduce((s, r) => s + (r.weeklySalesSavings || 0), 0) : 0],
        [t('closings.categories.taxSavings'), summary.totalSavings > 0 ? records.reduce((s, r) => s + (r.taxSavings || 0), 0) : 0],
        [t('closings.categories.techSavings'), summary.totalSavings > 0 ? records.reduce((s, r) => s + (r.techSavings || 0), 0) : 0],
        ['TOTAL AHORROS', summary.totalSavings],
        [''],
        ['TOTAL A DISTRIBUIR', summary.totalToDistribute],
        [''],
        ['DISTRIBUCIÓN DE SOCIOS'],
        ...summary.partnersToDisplay.map(p => [p.name, `${p.percent}%`, summary.totalToDistribute * (p.percent / 100)])
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      // Sheet 2: Detalle por Categoría
      const detailData = [
        ['Fecha', 'Descripción', 'Efectivo Destapado', 'Efectivo Semanal', 'Transferencias', 'Tarjetas',
          'Vales/Adelantos', 'Salidas Mensuales', 'Ahorro Ventas', 'Ahorro Impuestos', 'Ahorro Téc.']
      ];
      records.forEach(r => {
        detailData.push([
          r.date,
          r.description,
          r.cashUnsealed || 0,
          r.cashWeekly || 0,
          r.transfers || 0,
          r.cards || 0,
          r.partnersAdvances || 0,
          r.monthlyOutgoings || 0,
          r.weeklySalesSavings || 0,
          r.taxSavings || 0,
          r.techSavings || 0
        ]);
      });
      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle_Completo");

      // Sheet 3: Detalle por cada categoría (con movimientos individuales)
      Object.entries(monthlyCategories).forEach(([key, data]) => {
        const categoryRecords = records.filter(r => (r[key] || 0) !== 0);
        if (categoryRecords.length > 0) {
          const categoryData = [
            [data.title.toUpperCase()],
            [''],
            ['Fecha', 'Descripción', 'Monto']
          ];
          categoryRecords.forEach(r => {
            categoryData.push([r.date, r.description, r[key]]);
          });
          categoryData.push(['', 'TOTAL', categoryRecords.reduce((s, r) => s + (r[key] || 0), 0)]);

          const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
          XLSX.utils.book_append_sheet(wb, wsCategory, data.title.substring(0, 31));
        }
      });

      XLSX.writeFile(wb, `Cierre_Mensual_${monthName.replace(/\s/g, '_')}.xlsx`);
      toast.success(t('reports.exportSuccess'));
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="h-full flex flex-col print:bg-white print:text-black">
      {/* Print Header */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">Cierre Mensual</h1>
        <p className="text-lg">{new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
        <p className="text-sm text-gray-600">Generado: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-text-main">{t('closings.title')}</h2>
          <p className="text-text-muted">{t('closings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-bg-secondary p-2 rounded-lg border border-border-main print:hidden">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-bg-tertiary border border-border-main rounded p-1 text-text-main focus:outline-none focus:border-accent"
          />
          <button onClick={handleOpenCreateModal} className="btn-golden flex items-center text-sm py-1 px-3">
            <i data-feather="plus" className="w-4 h-4 mr-2"></i>
            <span>{t('closings.addBtn')}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1 bg-bg-tertiary text-text-main border border-border-main rounded hover:bg-bg-main transition-colors"
            title={t('reports.printView')}
          >
            <i data-feather="printer" className="w-4 h-4"></i>
            <span className="hidden md:inline text-sm">{t('reports.printView')}</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title={t('reports.exportExcel')}
          >
            <i data-feather="download" className="w-4 h-4"></i>
            <span className="hidden md:inline text-sm">{t('reports.exportExcel')}</span>
          </button>
        </div>
      </div>

      {loadingMonthly ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted animate-pulse">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">{t('closings.loading')}</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-x-auto pb-4 print:overflow-visible">
            <div className="flex space-x-4 print:grid print:grid-cols-3 print:gap-4">
              {Object.entries(monthlyCategories).map(([key, data]) => (
                <MonthlyColumn
                  key={key}
                  title={data.title}
                  icon={data.icon}
                  records={records}
                  categoryKey={key}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteRecord}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 animate-fade-in">
            <div className="lg:col-span-1 bg-bg-secondary p-6 rounded-lg border-2 border-accent shadow-lg flex flex-col justify-center">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">{t('closings.totalToDistribute')}</h3>
              <p className="text-5xl font-extrabold text-accent mb-6">{formatCurrency(summary.totalToDistribute)}</p>

              <div className="bg-bg-tertiary/30 rounded-lg p-4 space-y-3 border border-border-main">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">{t('closings.totalIncome')}</span>
                  <span className="font-bold text-green-500">{formatCurrency(summary.totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">{t('closings.totalOutgoings')}</span>
                  <span className="font-bold text-red-400">{formatCurrency(summary.totalOutgoings)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border-main pt-2 mt-2">
                  <span className="text-sm text-text-secondary">{t('closings.totalSavings')}</span>
                  <span className="font-bold text-yellow-400">{formatCurrency(summary.totalSavings)}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-bg-secondary p-6 rounded-lg border border-border-main flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                  <i data-feather="users" className="w-5 h-5 text-accent"></i>
                  {t('closings.partnerDistribution')}
                </h3>
              </div>
              <div className="overflow-y-auto flex-grow">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase text-text-muted border-b-2 border-border-main bg-bg-tertiary/20">
                    <tr>
                      <th className="p-3 w-1/2">{t('closings.table.partner')}</th>
                      <th className="p-3 text-center">{t('closings.table.percent')}</th>
                      <th className="p-3 text-right">{t('closings.table.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.partnersToDisplay.map((p, index) => (
                      <tr key={index} className="border-b border-border-main hover:bg-bg-tertiary/50 transition-colors">
                        <td className="p-3 font-bold text-text-main">{p.name}</td>
                        <td className="p-3 text-center text-text-secondary font-mono bg-bg-tertiary/30 rounded m-1">{p.percent}%</td>
                        <td className="p-3 text-right font-bold text-accent text-lg">{formatCurrency(summary.totalToDistribute * (p.percent / 100))}</td>
                      </tr>
                    ))}
                    {summary.partnersToDisplay.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center text-text-muted p-8 italic">
                          {t('closings.noPartners')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <MonthlyRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recordToEdit={recordToEdit}
        yearMonth={selectedMonth}
      />
    </div>
  );
};
export default CierresMensualesPage;
// ===== FIN: src/pages/CierresMensualesPage.jsx =====