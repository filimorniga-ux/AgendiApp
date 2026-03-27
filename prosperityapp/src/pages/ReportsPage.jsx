import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';
import feather from 'feather-icons';
import ReportFilters from '../components/reports/ReportFilters';
import { useMonthlyRecords } from '../hooks/useMonthlyRecords';

import AdvancedExportModal from '../components/reports/AdvancedExportModal';

// Helper para iconos
const Icon = ({ name, className }) => {
  const icon = feather.icons[name];
  if (!icon) return null;
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: icon.toSvg({ class: className }) }}
    />
  );
};

const ReportsPage = () => {
  const { t } = useTranslation();
  const {
    clients,
    inventory, // Assuming this is combined or we need to handle tech/retail
    technicalInventory,
    retailInventory,
    collaborators,
    movements,
    services,
    config
  } = useData();

  // State
  const [activeTab, setActiveTab] = useState('financial');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'month', // today, week, month, year, custom
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    search: '',
    category: 'all'
  });

  // Hook for Monthly Closings (fetched based on start date's month)
  const selectedMonthISO = filters.startDate.toISOString().substring(0, 7);
  const { records: monthlyRecords, loading: loadingMonthly } = useMonthlyRecords(selectedMonthISO);

  useEffect(() => {
    feather.replace();
  }, [activeTab, filters]);

  // --- FILTERING LOGIC ---

  // 1. Financial (Movements)
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    return movements.filter(m => {
      const date = m.date.toDate();
      const inDateRange = date >= filters.startDate && date <= filters.endDate;
      const matchesSearch = filters.search === '' ||
        m.description.toLowerCase().includes(filters.search.toLowerCase());
      return inDateRange && matchesSearch;
    });
  }, [movements, filters]);

  // 2. Inventory (Tech + Retail)
  const filteredInventory = useMemo(() => {
    const tech = technicalInventory || [];
    const retail = retailInventory || [];
    const allItems = [...tech.map(i => ({ ...i, type: 'technical' })), ...retail.map(i => ({ ...i, type: 'retail' }))];

    return allItems.filter(item => {
      const matchesSearch = filters.search === '' ||
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(filters.search.toLowerCase()));
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      return matchesSearch && matchesCategory;
    });
  }, [technicalInventory, retailInventory, filters]);

  // 3. Clients
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => {
      const matchesSearch = filters.search === '' ||
        c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (c.phone && c.phone.includes(filters.search));
      return matchesSearch;
    });
  }, [clients, filters]);

  // 4. Collaborators
  const filteredCollaborators = useMemo(() => {
    if (!collaborators) return [];
    return collaborators.filter(c => {
      const matchesSearch = filters.search === '' ||
        c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.lastName.toLowerCase().includes(filters.search.toLowerCase());
      return matchesSearch;
    });
  }, [collaborators, filters]);

  // 5. Payroll (Calculated)
  const payrollData = useMemo(() => {
    if (!filteredMovements || !collaborators || !config) return [];

    const defaultSettings = { taxGeneral: 19, taxOverrides: {} };
    const foundSettings = config.find(c => c.id === 'settings');
    const settings = { ...defaultSettings, ...foundSettings };

    return collaborators
      .filter(c => c.status === 'active')
      .map(col => {
        const colMovements = filteredMovements.filter(m => m.collaboratorId === col.id);

        // Calculate totals
        const services = colMovements.filter(m => m.type === 'Servicio').reduce((sum, m) => sum + m.amount, 0);
        const techCost = colMovements.filter(m => m.type === 'Servicio').reduce((sum, m) => sum + (m.technicalCost || 0), 0);
        const salesComm = colMovements.filter(m => m.type === 'ComisionVenta').reduce((sum, m) => sum + m.amount, 0);
        const tips = colMovements.filter(m => m.type === 'ComisionPropina').reduce((sum, m) => sum + m.amount, 0);
        const advances = colMovements.filter(m => m.type === 'Adelanto').reduce((sum, m) => sum + m.amount, 0);

        // Calculate Net
        const taxPercent = settings.taxOverrides?.[col.id] || settings.taxGeneral;
        const base = services - techCost;
        const taxAmount = base * (taxPercent / 100);
        const net = base - taxAmount;
        const participation = net * (col.commissionPercent / 100);
        const finalPayment = participation + advances + salesComm + tips;

        return {
          id: col.id,
          name: `${col.name} ${col.lastName}`,
          services,
          techCost,
          taxAmount,
          participation,
          salesComm,
          tips,
          advances,
          finalPayment
        };
      })
      .filter(p => {
        // Filter by search if needed
        if (filters.search === '') return true;
        return p.name.toLowerCase().includes(filters.search.toLowerCase());
      });
  }, [filteredMovements, collaborators, config, filters.search]);

  // 6. Closings (Monthly Records)
  const filteredClosings = useMemo(() => {
    if (!monthlyRecords) return [];
    return monthlyRecords.filter(r => {
      if (filters.search === '') return true;
      return r.description.toLowerCase().includes(filters.search.toLowerCase());
    });
  }, [monthlyRecords, filters.search]);


  // --- EXPORT LOGIC ---
  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().split('T')[0];

      if (activeTab === 'financial') {
        const ws = XLSX.utils.json_to_sheet(filteredMovements.map(m => ({
          Fecha: m.date.toDate().toLocaleDateString(),
          Descripcion: m.description,
          Monto: m.amount,
          Tipo: m.type,
          MetodoPago: m.paymentMethod,
          Colaborador: m.collaboratorName || 'N/A'
        })));
        XLSX.utils.book_append_sheet(wb, ws, "Finanzas");
      } else if (activeTab === 'inventory') {
        const ws = XLSX.utils.json_to_sheet(filteredInventory.map(i => ({
          Nombre: i.name,
          Marca: i.brand,
          Categoria: i.category,
          Stock: i.stock || i.stockUnits,
          Tipo: i.type
        })));
        XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      } else if (activeTab === 'crm') {
        const ws = XLSX.utils.json_to_sheet(filteredClients);
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
      } else if (activeTab === 'hr') {
        const ws = XLSX.utils.json_to_sheet(filteredCollaborators);
        XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
      } else if (activeTab === 'payroll') {
        const ws = XLSX.utils.json_to_sheet(payrollData);
        XLSX.utils.book_append_sheet(wb, ws, "Nomina_Calculada");
      } else if (activeTab === 'closings') {
        const ws = XLSX.utils.json_to_sheet(filteredClosings);
        XLSX.utils.book_append_sheet(wb, ws, "Cierres_Mensuales");
      }

      XLSX.writeFile(wb, `Reporte_${activeTab}_${dateStr}.xlsx`);
    } catch (error) {
      console.warn("Error exporting:", error);
      alert("Error al exportar");
    }
  };

  // --- FULL BACKUP LOGIC ---
  const handleFullBackup = () => {
    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().split('T')[0];

      // 1. Clients
      if (clients && clients.length > 0) {
        const ws = XLSX.utils.json_to_sheet(clients);
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
      }
      // 2. Inventory
      if (technicalInventory && technicalInventory.length > 0) {
        const ws = XLSX.utils.json_to_sheet(technicalInventory);
        XLSX.utils.book_append_sheet(wb, ws, "Inv_Tecnico");
      }
      if (retailInventory && retailInventory.length > 0) {
        const ws = XLSX.utils.json_to_sheet(retailInventory);
        XLSX.utils.book_append_sheet(wb, ws, "Inv_Retail");
      }
      // 3. Financial
      if (movements && movements.length > 0) {
        const ws = XLSX.utils.json_to_sheet(movements.map(m => ({
          ...m,
          date: m.date?.toDate?.()?.toISOString() || m.date
        })));
        XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
      }
      // 4. HR
      if (collaborators && collaborators.length > 0) {
        const ws = XLSX.utils.json_to_sheet(collaborators);
        XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
      }
      // 5. Services
      if (services && services.length > 0) {
        const ws = XLSX.utils.json_to_sheet(services);
        XLSX.utils.book_append_sheet(wb, ws, "Servicios");
      }

      XLSX.writeFile(wb, `Respaldo_Completo_AgendiApp_${dateStr}.xlsx`);
    } catch (error) {
      console.warn("Error generating full backup:", error);
      alert("Error al generar el respaldo completo.");
    }
  };

  // --- PRINT LOGIC ---
  const handlePrint = () => {
    window.print();
  };

  // --- RENDER HELPERS ---
  const renderFinancialTable = () => (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-tertiary text-text-muted uppercase print:bg-gray-200 print:text-black">
          <tr>
            <th className="p-3">{t('reports.table.date')}</th>
            <th className="p-3">{t('reports.table.description')}</th>
            <th className="p-3">{t('reports.table.type')}</th>
            <th className="p-3 text-right">{t('reports.table.amount')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-main print:divide-gray-300">
          {filteredMovements.map(m => (
            <tr key={m.id} className="hover:bg-bg-tertiary/50 print:hover:bg-transparent">
              <td className="p-3">{m.date.toDate().toLocaleDateString()}</td>
              <td className="p-3">{m.description}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${m.amount > 0 ? 'bg-green-500/20 text-green-500 print:text-green-700 print:bg-transparent' : 'bg-red-500/20 text-red-500 print:text-red-700 print:bg-transparent'
                  }`}>
                  {t(`transactionTypes.${m.type}`, m.type)}
                </span>
              </td>
              <td className={`p-3 text-right font-bold ${m.amount > 0 ? 'text-green-500 print:text-green-700' : 'text-red-500 print:text-red-700'}`}>
                ${m.amount.toLocaleString()}
              </td>
            </tr>
          ))}
          {filteredMovements.length === 0 && (
            <tr><td colSpan="4" className="p-8 text-center text-text-muted">{t('dashboard.noData')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderInventoryTable = () => (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-tertiary text-text-muted uppercase print:bg-gray-200 print:text-black">
          <tr>
            <th className="p-3">{t('reports.table.product')}</th>
            <th className="p-3">{t('reports.table.brand')}</th>
            <th className="p-3">{t('reports.table.category')}</th>
            <th className="p-3 text-center">{t('reports.table.stock')}</th>
            <th className="p-3">{t('reports.table.type')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-main print:divide-gray-300">
          {filteredInventory.map(i => (
            <tr key={i.id} className="hover:bg-bg-tertiary/50 print:hover:bg-transparent">
              <td className="p-3 font-medium">{i.name}</td>
              <td className="p-3 text-text-muted print:text-gray-600">{i.brand}</td>
              <td className="p-3 text-text-muted print:text-gray-600">{i.category}</td>
              <td className="p-3 text-center font-bold">{i.stock || i.stockUnits}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${i.type === 'technical' ? 'bg-blue-500/20 text-blue-500 print:text-blue-700 print:bg-transparent' : 'bg-purple-500/20 text-purple-500 print:text-purple-700 print:bg-transparent'}`}>
                  {t(`reports.inventoryTypes.${i.type}`)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPayrollTable = () => (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-tertiary text-text-muted uppercase print:bg-gray-200 print:text-black">
          <tr>
            <th className="p-3">{t('reports.table.collaborator')}</th>
            <th className="p-3 text-right">{t('reports.table.services')}</th>
            <th className="p-3 text-right">{t('reports.table.techCost')}</th>
            <th className="p-3 text-right">{t('reports.table.commission')}</th>
            <th className="p-3 text-right">{t('reports.table.finalPay')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-main print:divide-gray-300">
          {payrollData.map(p => (
            <tr key={p.id} className="hover:bg-bg-tertiary/50 print:hover:bg-transparent">
              <td className="p-3 font-bold">{p.name}</td>
              <td className="p-3 text-right">${p.services.toLocaleString()}</td>
              <td className="p-3 text-right text-red-400 print:text-red-700">-${p.techCost.toLocaleString()}</td>
              <td className="p-3 text-right text-green-400 print:text-green-700">+${p.participation.toLocaleString()}</td>
              <td className="p-3 text-right font-bold text-accent print:text-black">${p.finalPayment.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderClosingsTable = () => (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-tertiary text-text-muted uppercase print:bg-gray-200 print:text-black">
          <tr>
            <th className="p-3">{t('reports.table.date')}</th>
            <th className="p-3">{t('reports.table.description')}</th>
            <th className="p-3 text-right">{t('reports.table.amount')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-main print:divide-gray-300">
          {filteredClosings.map(r => (
            <tr key={r.id} className="hover:bg-bg-tertiary/50 print:hover:bg-transparent">
              <td className="p-3">{new Date(r.date + 'T00:00:00').toLocaleDateString()}</td>
              <td className="p-3">{r.description}</td>
              <td className="p-3 text-right font-bold">${(parseFloat(r.amount || 0)).toLocaleString()}</td>
            </tr>
          ))}
          {filteredClosings.length === 0 && (
            <tr><td colSpan="3" className="p-8 text-center text-text-muted">{t('dashboard.noData')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const tabs = [
    { id: 'financial', label: t('reports.sections.financial'), icon: 'dollar-sign' },
    { id: 'inventory', label: t('reports.sections.inventory'), icon: 'archive' },
    { id: 'crm', label: t('reports.sections.crm'), icon: 'users' },
    { id: 'hr', label: t('reports.sections.hr'), icon: 'briefcase' },
    { id: 'payroll', label: t('sidebar.payroll'), icon: 'clipboard' },
    { id: 'closings', label: t('sidebar.monthlyClosing'), icon: 'book-open' },
  ];

  return (
    <div className="p-6 h-full flex flex-col bg-bg-main text-text-main overflow-hidden print:overflow-visible print:bg-white print:text-black print:p-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-text-muted">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            title={t('reports.fullBackup')}
          >
            <Icon name="database" className="w-5 h-5" />
            <span className="font-semibold hidden md:inline">{t('reports.fullBackup')}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-main border border-border-main rounded-lg hover:bg-bg-secondary transition-colors shadow-lg"
            title={t('reports.printView')}
          >
            <Icon name="printer" className="w-5 h-5" />
            <span className="font-semibold hidden md:inline">{t('reports.printView')}</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            title={t('reports.exportExcel')}
          >
            <Icon name="download" className="w-5 h-5" />
            <span className="font-semibold hidden md:inline">{t('reports.exportExcel')}</span>
          </button>
        </div>
      </div>

      {/* Print Header (Visible only when printing) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-black">Reporte: {tabs.find(t => t.id === activeTab)?.label}</h1>
        <p className="text-gray-600">Generado el: {new Date().toLocaleDateString()}</p>
        <p className="text-gray-600">Filtros: {filters.dateRange === 'custom' ? `${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}` : t(`reports.filters.${filters.dateRange}`)}</p>
      </div>

      {/* Filters */}
      <div className="print:hidden">
        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          showCategory={activeTab === 'inventory'}
          categories={activeTab === 'inventory' ? [...new Set(filteredInventory.map(i => i.category))] : []}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-4 border-b border-border-main overflow-x-auto print:hidden">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-text-muted hover:text-text-main'
              }`}
          >
            <Icon name={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-bg-secondary rounded-lg border border-border-main overflow-y-auto shadow-inner print:shadow-none print:border-none print:bg-white print:overflow-visible">
        {activeTab === 'financial' && renderFinancialTable()}
        {activeTab === 'inventory' && renderInventoryTable()}
        {activeTab === 'payroll' && renderPayrollTable()}
        {activeTab === 'closings' && renderClosingsTable()}
        {activeTab === 'crm' && (
          <div className="p-4 text-center text-text-muted print:text-black">
            <p>Tabla de Clientes ({filteredClients.length} registros)</p>
            {/* Implement Client Table here similar to others */}
          </div>
        )}
        {activeTab === 'hr' && (
          <div className="p-4 text-center text-text-muted print:text-black">
            <p>Tabla de Colaboradores ({filteredCollaborators.length} registros)</p>
          </div>
        )}
      </div>

      {isExportModalOpen && (
        <AdvancedExportModal onClose={() => setIsExportModalOpen(false)} />
      )}
    </div>
  );
};

export default ReportsPage;
