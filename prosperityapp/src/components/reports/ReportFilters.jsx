import React from 'react';
import { useTranslation } from 'react-i18next';
import feather from 'feather-icons';

const ReportFilters = ({
    filters,
    setFilters,
    showDateRange = true,
    showSearch = true,
    showCategory = false,
    categories = []
}) => {
    const { t } = useTranslation();

    const handleDateRangeChange = (e) => {
        const range = e.target.value;
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();

        if (range === 'today') {
            // Start and end are today
        } else if (range === 'week') {
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            startDate.setDate(diff);
        } else if (range === 'month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (range === 'year') {
            startDate = new Date(today.getFullYear(), 0, 1);
        }

        setFilters(prev => ({
            ...prev,
            dateRange: range,
            startDate: startDate,
            endDate: endDate
        }));
    };

    return (
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-main mb-6 flex flex-wrap gap-4 items-end">
            {/* Date Range Selector */}
            {showDateRange && (
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-text-muted mb-1">
                        {t('reports.filters.dateRange') || "Rango de Fechas"}
                    </label>
                    <select
                        value={filters.dateRange}
                        onChange={handleDateRangeChange}
                        className="w-full bg-bg-tertiary border border-border-main rounded-md p-2 text-text-main"
                    >
                        <option value="today">{t('reports.filters.today') || "Hoy"}</option>
                        <option value="week">{t('reports.filters.thisWeek') || "Esta Semana"}</option>
                        <option value="month">{t('reports.filters.thisMonth') || "Este Mes"}</option>
                        <option value="year">{t('reports.filters.thisYear') || "Este Año"}</option>
                        <option value="custom">{t('reports.filters.custom') || "Personalizado"}</option>
                    </select>
                </div>
            )}

            {/* Custom Date Inputs (only if custom is selected) */}
            {filters.dateRange === 'custom' && (
                <>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-text-muted mb-1">
                            {t('reports.filters.startDate') || "Desde"}
                        </label>
                        <input
                            type="date"
                            value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                            className="w-full bg-bg-tertiary border border-border-main rounded-md p-2 text-text-main"
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-text-muted mb-1">
                            {t('reports.filters.endDate') || "Hasta"}
                        </label>
                        <input
                            type="date"
                            value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                            className="w-full bg-bg-tertiary border border-border-main rounded-md p-2 text-text-main"
                        />
                    </div>
                </>
            )}

            {/* Search Input */}
            {showSearch && (
                <div className="flex-[2] min-w-[250px]">
                    <label className="block text-sm font-medium text-text-muted mb-1">
                        {t('reports.filters.search') || "Buscar"}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder={t('reports.filters.searchPlaceholder') || "Nombre, ID, Teléfono..."}
                            className="w-full bg-bg-tertiary border border-border-main rounded-md p-2 pl-10 text-text-main"
                        />
                        <div className="absolute left-3 top-2.5 text-text-muted">
                            <i data-feather="search" className="w-4 h-4"></i>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Select */}
            {showCategory && (
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-text-muted mb-1">
                        {t('reports.filters.category') || "Categoría"}
                    </label>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-bg-tertiary border border-border-main rounded-md p-2 text-text-main"
                    >
                        <option value="all">{t('reports.filters.allCategories') || "Todas"}</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default ReportFilters;
