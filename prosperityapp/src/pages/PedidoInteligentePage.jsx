/**
 * PedidoInteligentePage.jsx
 * Módulo de sugerencias de pedidos basado en historial de ventas.
 * Filtros: período, horizonte, proveedor, categoría, stock.
 * Exportación a Excel y PDF.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useSmartOrdering, PERIOD_OPTIONS, HORIZON_OPTIONS } from '../hooks/useSmartOrdering';
import { useData } from '../context/DataContext';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';
import { ShoppingCart, TrendingUp, AlertTriangle, FileSpreadsheet, FileText, Package, Filter, RefreshCw } from 'lucide-react';

const formatCurrency = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v || 0);

const PedidoInteligentePage = () => {
  const { suggestions, loading, error, calculate } = useSmartOrdering();
  const { technicalInventory, retailInventory } = useData();

  // Filtros
  const [period, setPeriod] = useState('month');
  const [horizon, setHorizon] = useState('month');
  const [stockFilter, setStockFilter] = useState('needed');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Categorías disponibles
  const categories = useMemo(() => {
    const cats = [
      ...(technicalInventory || []).map(p => p.category),
      ...(retailInventory || []).map(p => p.category),
    ].filter(Boolean);
    return [...new Set(cats)].sort();
  }, [technicalInventory, retailInventory]);

  // Calcular al montar y cuando cambian filtros
  useEffect(() => {
    calculate({ period, horizon, dateFrom, dateTo, filter: stockFilter, inventoryTypeFilter, categoryFilter });
  }, []);

  const handleRecalculate = () => {
    calculate({ period, horizon, dateFrom, dateTo, filter: stockFilter, inventoryTypeFilter, categoryFilter });
  };

  // Totales
  const totalItems = suggestions.length;
  const totalCost = suggestions.reduce((s, x) => s + x.estimatedCost, 0);
  const criticalCount = suggestions.filter(s => s.isCritical).length;
  const zeroCount = suggestions.filter(s => s.isZero).length;

  // Exportar
  const exportColumns = [
    { key: 'name', header: 'Producto', width: 28 },
    { key: 'brand', header: 'Marca', width: 16 },
    { key: 'category', header: 'Categoría', width: 14 },
    { key: 'inventoryType', header: 'Tipo', width: 10 },
    { key: 'stockCurrent', header: 'Stock Actual', width: 12, format: 'number' },
    { key: 'stockMin', header: 'Stock Mín.', width: 12, format: 'number' },
    { key: 'avgDailyUsage', header: 'Uso/día', width: 10, format: 'number' },
    { key: 'suggestedQty', header: 'Cant. Sugerida', width: 14, format: 'number' },
    { key: 'costPerUnit', header: 'Costo/u', width: 12, format: 'currency' },
    { key: 'estimatedCost', header: 'Costo Est.', width: 14, format: 'currency' },
  ];

  const handleExportExcel = () => {
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label || period;
    const horizonLabel = HORIZON_OPTIONS.find(h => h.key === horizon)?.label || horizon;
    exportToExcel({
      data: suggestions.map(s => ({ ...s, avgDailyUsage: +s.avgDailyUsage.toFixed(2) })),
      columns: exportColumns,
      filename: `pedido_inteligente_${new Date().toISOString().slice(0, 10)}`,
      title: 'Pedido Inteligente — Sugerencias de Compra',
      subtitle: `Período: ${periodLabel} | Horizonte: ${horizonLabel}`,
      summary: [
        { label: 'Total productos', value: totalItems },
        { label: 'Costo estimado total', value: totalCost, format: 'currency' },
        { label: 'Productos stock 0', value: zeroCount },
        { label: 'Productos críticos', value: criticalCount },
      ],
    });
  };

  const handleExportPDF = () => {
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label || period;
    const horizonLabel = HORIZON_OPTIONS.find(h => h.key === horizon)?.label || horizon;
    exportToPDF({
      data: suggestions.map(s => ({ ...s, avgDailyUsage: +s.avgDailyUsage.toFixed(2) })),
      columns: exportColumns,
      filename: `pedido_inteligente_${new Date().toISOString().slice(0, 10)}`,
      title: 'Pedido Inteligente — Sugerencias de Compra',
      subtitle: `Período: ${periodLabel} | Horizonte: ${horizonLabel}`,
      summary: [
        { label: 'Total productos', value: totalItems },
        { label: 'Costo estimado total', value: totalCost, format: 'currency' },
        { label: 'Productos stock 0', value: zeroCount },
        { label: 'Productos críticos', value: criticalCount },
      ],
      orientation: 'landscape',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main flex items-center gap-2">
            <ShoppingCart className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
            Pedido Inteligente
          </h2>
          <p className="text-sm text-text-muted mt-1">Sugerencias de compra basadas en tu historial de ventas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-bg-secondary rounded-lg border border-border-main p-4 mb-4 animate-fadeInUp">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-main mb-3">
          <Filter className="w-4 h-4" /> Parámetros de cálculo
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Período de análisis</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm">
              {PERIOD_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Horizonte de pedido</label>
            <select value={horizon} onChange={e => setHorizon(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm">
              {HORIZON_OPTIONS.map(h => <option key={h.key} value={h.key}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Filtro de stock</label>
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm">
              <option value="all">Todos</option>
              <option value="needed">Solo necesitan reposición</option>
              <option value="critical">Stock crítico</option>
              <option value="zero">Stock 0</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Tipo inventario</label>
            <select value={inventoryTypeFilter} onChange={e => setInventoryTypeFilter(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm">
              <option value="all">Todos</option>
              <option value="technical">Técnico</option>
              <option value="retail">Retail</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Categoría</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm">
              <option value="all">Todas</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleRecalculate} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-accent text-accent-text font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Calculando…' : 'Calcular'}
            </button>
          </div>
        </div>

        {/* Rango personalizado */}
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Desde</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Hasta</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Productos a pedir', value: totalItems, icon: Package, color: '#3b82f6' },
          { label: 'Costo estimado', value: formatCurrency(totalCost), icon: ShoppingCart, color: '#d4a017' },
          { label: 'Stock 0', value: zeroCount, icon: AlertTriangle, color: '#ef4444' },
          { label: 'Stock crítico', value: criticalCount, icon: TrendingUp, color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-bg-secondary rounded-lg border border-border-main p-3 animate-fadeInUp">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              <span className="text-xs text-text-muted">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla de sugerencias */}
      <div className="flex-grow overflow-y-auto pb-24 sm:pb-4">
        <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
              <tr>
                <th className="p-3 font-semibold">Producto</th>
                <th className="p-3 font-semibold text-center">Tipo</th>
                <th className="p-3 font-semibold text-right">Stock</th>
                <th className="p-3 font-semibold text-right">Min.</th>
                <th className="p-3 font-semibold text-right">Uso/día</th>
                <th className="p-3 font-semibold text-right">Ventas</th>
                <th className="p-3 font-semibold text-center">Sugerido</th>
                <th className="p-3 font-semibold text-right">Costo/u</th>
                <th className="p-3 font-semibold text-right">Costo Est.</th>
                <th className="p-3 font-semibold">Análisis</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map(s => (
                <tr
                  key={s.productId}
                  className={`border-b border-border-main text-sm transition-colors ${
                    s.isZero ? 'bg-red-500/10 border-l-2 border-l-red-500' :
                    s.isCritical ? 'bg-amber-500/10 border-l-2 border-l-amber-500' :
                    'hover:bg-bg-tertiary'
                  }`}
                >
                  <td className="p-3">
                    <div className="font-semibold text-text-main">{s.name}</div>
                    <div className="text-xs text-text-muted">{s.brand} · {s.category}</div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.inventoryType === 'technical'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {s.inventoryType === 'technical' ? 'Técnico' : 'Retail'}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-bold ${s.isZero ? 'text-red-500' : s.isCritical ? 'text-amber-500' : 'text-text-main'}`}>
                    {s.stockCurrent}
                  </td>
                  <td className="p-3 text-right text-text-muted">{s.stockMin}</td>
                  <td className="p-3 text-right text-text-main font-mono">{s.avgDailyUsage.toFixed(1)}</td>
                  <td className="p-3 text-right text-text-muted">{s.totalExits}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${
                      s.suggestedQty > 0
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-bg-tertiary text-text-muted'
                    }`}>
                      {s.suggestedQty}
                    </span>
                  </td>
                  <td className="p-3 text-right text-text-muted">{formatCurrency(s.costPerUnit)}</td>
                  <td className="p-3 text-right font-bold text-accent">{formatCurrency(s.estimatedCost)}</td>
                  <td className="p-3 text-xs text-text-muted max-w-[200px] truncate" title={s.reasoning}>
                    {s.reasoning || '—'}
                  </td>
                </tr>
              ))}
              {suggestions.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-text-muted">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No hay sugerencias</p>
                    <p className="text-sm opacity-60">Ajusta los filtros o el período de análisis</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default PedidoInteligentePage;
