// ===== INICIO: src/components/reports/AdvancedExportModal.jsx =====
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import feather from 'feather-icons';
import { useData } from '../../context/DataContext';
import { useCollection } from '../../hooks/useCollection';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const AdvancedExportModal = ({ onClose }) => {
    const { t } = useTranslation();
    const { clients, collaborators, technicalInventory, retailInventory, config } = useData();

    // State for Period Selection
    const [periodType, setPeriodType] = useState('day'); // day, month, year, custom, payroll, closing
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedPayrollId, setSelectedPayrollId] = useState('');
    const [selectedClosingId, setSelectedClosingId] = useState('');

    // Collections for Dropdowns
    const { data: payrolls } = useCollection('payrollClosings');
    const { data: closings } = useCollection('monthlyClosings');

    const [isExporting, setIsExporting] = useState(false);

    // Helper for icons to avoid feather.replace() DOM conflicts
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

    const handleExport = async () => {
        setIsExporting(true);
        const wb = XLSX.utils.book_new();
        let movements = [];
        let reportTitle = "Reporte";

        try {
            // 1. Fetch Movements based on Period
            let startDate, endDate;
            const movementsRef = collection(db, 'movements');
            let q = query(movementsRef, orderBy('date', 'desc'));

            if (periodType === 'day') {
                startDate = new Date(selectedDate);
                endDate = new Date(selectedDate);
                endDate.setHours(23, 59, 59, 999);
                reportTitle = `Reporte_Diario_${selectedDate}`;
            } else if (periodType === 'month') {
                const [y, m] = selectedMonth.split('-');
                startDate = new Date(y, m - 1, 1);
                endDate = new Date(y, m, 0, 23, 59, 59, 999);
                reportTitle = `Reporte_Mensual_${selectedMonth}`;
            } else if (periodType === 'year') {
                startDate = new Date(selectedYear, 0, 1);
                endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
                reportTitle = `Reporte_Anual_${selectedYear}`;
            } else if (periodType === 'custom') {
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                endDate.setHours(23, 59, 59, 999);
                reportTitle = `Reporte_Personalizado`;
            } else if (periodType === 'payroll') {
                const payroll = payrolls?.find(p => p.id === selectedPayrollId);
                if (payroll) {
                    // Payroll usually has a date range string, we might need to parse it or use its createdAt
                    // For simplicity, we'll try to use the range if available, or just fetch the payroll doc itself
                    // But the requirement is "movements" for that period.
                    // Let's assume we fetch movements within the payroll's range if stored, otherwise we might need to rely on the payroll doc's stored data.
                    // Ideally, payroll closing stores the calculated data. Let's fetch THAT.
                    reportTitle = `Nomina_${payroll.name}`;
                }
            } else if (periodType === 'closing') {
                const closing = closings?.find(c => c.id === selectedClosingId);
                if (closing) {
                    reportTitle = `Cierre_Mensual_${closing.id}`;
                }
            }

            // Fetch logic for movements (Common for time-based)
            if (['day', 'month', 'year', 'custom'].includes(periodType)) {
                q = query(movementsRef, where('date', '>=', startDate), where('date', '<=', endDate), orderBy('date', 'desc'));
                const querySnapshot = await getDocs(q);
                movements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }

            // --- SHEET 1: RESUMEN GERENCIAL ---
            const summaryData = [
                ["Reporte Generado", new Date().toLocaleString()],
                ["Tipo de Reporte", periodType.toUpperCase()],
                ["Título", reportTitle],
                [],
                ["METRICAS FINANCIERAS"],
                ["Total Ingresos", movements.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0)],
                ["Total Egresos", movements.filter(m => m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0)],
                ["Balance Neto", movements.reduce((sum, m) => sum + m.amount, 0)],
                [],
                ["DESGLOSE POR TIPO"],
                ...Object.entries(movements.reduce((acc, m) => {
                    acc[m.type] = (acc[m.type] || 0) + m.amount;
                    return acc;
                }, {})).map(([key, val]) => [key, val])
            ];
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

            // --- SHEET 2: DETALLE FINANCIERO ---
            if (movements.length > 0) {
                const wsFinancial = XLSX.utils.json_to_sheet(movements.map(m => ({
                    Fecha: m.date?.toDate ? m.date.toDate().toLocaleDateString() : m.date,
                    Descripción: m.description,
                    Tipo: m.type,
                    Monto: m.amount,
                    MedioPago: m.paymentMethod,
                    Colaborador: m.collaboratorName || '',
                    Cliente: m.clientName || ''
                })));
                XLSX.utils.book_append_sheet(wb, wsFinancial, "Finanzas");
            }

            // --- SHEET 3: INVENTARIO (Snapshot Actual) ---
            const allInventory = [
                ...(technicalInventory || []).map(i => ({ ...i, Tipo: 'Técnico' })),
                ...(retailInventory || []).map(i => ({ ...i, Tipo: 'Retail' }))
            ];
            if (allInventory.length > 0) {
                const wsInventory = XLSX.utils.json_to_sheet(allInventory.map(i => ({
                    Nombre: i.name,
                    Marca: i.brand,
                    Categoría: i.category,
                    Stock: i.stock || i.stockUnits,
                    Tipo: i.Tipo,
                    PrecioVenta: i.price || 0,
                    Costo: i.cost || 0
                })));
                XLSX.utils.book_append_sheet(wb, wsInventory, "Inventario");
            }

            // --- SHEET 4: CLIENTES ---
            if (clients && clients.length > 0) {
                const wsClients = XLSX.utils.json_to_sheet(clients.map(c => ({
                    Nombre: c.name,
                    Apellido: c.lastName,
                    Teléfono: c.phone,
                    Email: c.email,
                    UltimaVisita: c.lastVisit ? new Date(c.lastVisit.seconds * 1000).toLocaleDateString() : ''
                })));
                XLSX.utils.book_append_sheet(wb, wsClients, "Clientes");
            }

            // --- SHEET 5: COLABORADORES ---
            if (collaborators && collaborators.length > 0) {
                const wsCollabs = XLSX.utils.json_to_sheet(collaborators.map(c => ({
                    Nombre: c.name,
                    Apellido: c.lastName,
                    Rol: c.role,
                    Estado: c.status,
                    ComisionServicio: c.commissionPercent,
                    ComisionVenta: c.commissionSalesPercent
                })));
                XLSX.utils.book_append_sheet(wb, wsCollabs, "Colaboradores");
            }

            // --- SPECIAL: PAYROLL DETAIL ---
            if (periodType === 'payroll' && selectedPayrollId) {
                // Fetch specific payroll doc content if possible, or use calculated logic
                // For now, we'll try to fetch the payroll closing doc which should have the 'details'
                // If not available, we skip or show a message
                // Assuming 'payrollClosings' collection has the data
                const payrollDoc = payrolls.find(p => p.id === selectedPayrollId);
                if (payrollDoc && payrollDoc.details) {
                    const wsPayroll = XLSX.utils.json_to_sheet(payrollDoc.details);
                    XLSX.utils.book_append_sheet(wb, wsPayroll, "Detalle Nomina");
                }
            }

            XLSX.writeFile(wb, `${reportTitle}.xlsx`);
            toast.success("Exportación completada");
            onClose();

        } catch (error) {
            console.warn("Export Error:", error);
            toast.error("Error al exportar datos");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-text-main">Exportación Profesional</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main"><Icon name="x" className="w-6 h-6" /></button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Seleccionar Período</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['day', 'month', 'year', 'custom', 'payroll', 'closing'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setPeriodType(type)}
                                    className={`px-3 py-2 text-xs rounded border ${periodType === type ? 'bg-accent text-accent-text border-accent' : 'bg-bg-tertiary text-text-muted border-border-main'}`}
                                >
                                    {type === 'day' ? 'Día' : type === 'month' ? 'Mes' : type === 'year' ? 'Año' : type === 'custom' ? 'Rango' : type === 'payroll' ? 'Nómina' : 'Cierre Mensual'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Inputs */}
                    <div className="bg-bg-tertiary p-4 rounded border border-border-main">
                        {periodType === 'day' && (
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-bg-main border border-border-main rounded p-2 text-text-main" />
                        )}
                        {periodType === 'month' && (
                            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-bg-main border border-border-main rounded p-2 text-text-main" />
                        )}
                        {periodType === 'year' && (
                            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full bg-bg-main border border-border-main rounded p-2 text-text-main">
                                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        )}
                        {periodType === 'custom' && (
                            <div className="flex gap-2">
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full bg-bg-main border border-border-main rounded p-2 text-text-main" />
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full bg-bg-main border border-border-main rounded p-2 text-text-main" />
                            </div>
                        )}
                        {periodType === 'payroll' && (
                            <select value={selectedPayrollId} onChange={e => setSelectedPayrollId(e.target.value)} className="w-full bg-bg-main border border-border-main rounded p-2 text-text-main">
                                <option value="">Seleccionar Nómina</option>
                                {payrolls?.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.dateRange})</option>
                                ))}
                            </select>
                        )}
                        {periodType === 'closing' && (
                            <select value={selectedClosingId} onChange={e => setSelectedClosingId(e.target.value)} className="w-full bg-bg-main border border-border-main rounded p-2 text-text-main">
                                <option value="">Seleccionar Cierre</option>
                                {closings?.map(c => (
                                    <option key={c.id} value={c.id}>{c.id} (Generado: {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'N/A'})</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-text-muted hover:text-text-main">Cancelar</button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="btn-golden px-6 py-2 flex items-center gap-2"
                    >
                        {isExporting ? 'Generando...' : (
                            <>
                                <Icon name="download" className="w-4 h-4" />
                                Exportar Excel
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedExportModal;
