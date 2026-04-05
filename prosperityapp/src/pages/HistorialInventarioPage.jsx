/**
 * HistorialInventarioPage.jsx
 * Historial completo de inventario con:
 * - Kardex por producto
 * - Historial de movimientos con filtros de fecha
 * - Filtros preestablecidos y rango personalizado
 * - Exportación a Excel y PDF
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { useBusiness } from '../context/BusinessContext';
import { useData } from '../context/DataContext';
import {
  exportToExcel, exportToPDF,
  KARDEX_COLUMNS, LOTS_COLUMNS, CRITICAL_STOCK_COLUMNS, VALUATION_COLUMNS
} from '../lib/exportUtils';
import {
  ClipboardList, Calendar, FileSpreadsheet, FileText, Search,
  Filter, ArrowDownCircle, ArrowUpCircle, Package, TrendingDown, TrendingUp
} from 'lucide-react';

const formatCurrency = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v || 0);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CL') : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('es-CL') : '—';

// Filtros de fecha preestablecidos
const DATE_PRESETS = [
  { key: 'today',     label: 'Hoy',          days: 0 },
  { key: 'yesterday', label: 'Ayer',         days: 1 },
  { key: 'week',      label: 'Última semana', days: 7 },
  { key: 'month',     label: 'Último mes',    days: 30 },
  { key: 'quarter',   label: 'Últimos 3 meses', days: 90 },
  { key: 'semester',  label: 'Últimos 6 meses', days: 180 },
  { key: 'year',      label: 'Último año',    days: 365 },
  { key: 'all',       label: 'Todo',          days: 9999 },
  { key: 'custom',    label: 'Personalizado', days: 0 },
];

// Tabs de reporte
const REPORT_TABS = [
  { key: 'movements', label: 'Movimientos',      icon: ClipboardList },
  { key: 'kardex',    label: 'Kardex',            icon: TrendingDown },
  { key: 'lots',      label: 'Lotes',             icon: Package },
  { key: 'critical',  label: 'Stock Crítico',     icon: TrendingDown },
  { key: 'valuation', label: 'Valorización',      icon: TrendingUp },
];

const HistorialInventarioPage = () => {
  const { businessId } = useBusiness();
  const { technicalInventory, retailInventory } = useData();

  const [activeTab, setActiveTab] = useState('movements');
  const [movements, setMovements] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [datePreset, setDatePreset] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'ingreso' | 'salida' | 'all'
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [kardexProductId, setKardexProductId] = useState('');

  // Todos los productos para selección de kardex
  const allProducts = useMemo(() => [
    ...(technicalInventory || []).map(p => ({ ...p, inventoryType: 'technical' })),
    ...(retailInventory || []).map(p => ({ ...p, inventoryType: 'retail' })),
  ].sort((a, b) => a.name?.localeCompare(b.name)), [technicalInventory, retailInventory]);

  // Resolver rango de fechas
  const getDateRange = useCallback(() => {
    if (datePreset === 'custom') {
      return { from: dateFrom, to: dateTo };
    }
    const def = DATE_PRESETS.find(p => p.key === datePreset);
    const days = def?.days ?? 30;
    const to = new Date().toISOString().slice(0, 10);
    if (days === 9999) return { from: '2020-01-01', to };
    if (days === 0) {
      // "Hoy"
      return { from: to, to };
    }
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    return { from, to };
  }, [datePreset, dateFrom, dateTo]);

  // Fetch movimientos
  const fetchMovements = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      let query = supabase
        .from('stock_movements')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59')
        .order('created_at', { ascending: false })
        .limit(500);

      if (typeFilter !== 'all') query = query.eq('movement_type', typeFilter);
      if (inventoryTypeFilter !== 'all') query = query.eq('inventory_type', inventoryTypeFilter);

      const { data, error } = await query;
      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      console.error('[Historial] fetch movements:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, getDateRange, typeFilter, inventoryTypeFilter]);

  // Fetch lotes
  const fetchLots = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_lots')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLots(data || []);
    } catch (err) {
      console.error('[Historial] fetch lots:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Auto-fetch cuando cambia tab o filtros
  useEffect(() => {
    if (activeTab === 'movements' || activeTab === 'kardex') {
      fetchMovements();
    } else if (activeTab === 'lots') {
      fetchLots();
    } else {
      setLoading(false);
    }
  }, [activeTab, fetchMovements, fetchLots]);

  // Datos filtrados por búsqueda
  const filteredMovements = useMemo(() => {
    let items = movements;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m =>
        (m.product_name || '').toLowerCase().includes(q) ||
        (m.reason || '').toLowerCase().includes(q)
      );
    }
    // Kardex: filtrar por un solo producto
    if (activeTab === 'kardex' && kardexProductId) {
      items = items.filter(m => m.product_id === kardexProductId);
    }
    return items;
  }, [movements, searchQuery, activeTab, kardexProductId]);

  // Datos de stock crítico
  const criticalItems = useMemo(() =>
    allProducts
      .filter(p => {
        const stock = p.stockUnits ?? p.stock ?? p.stock_current ?? 0;
        const min = p.minStock ?? p.stock_min ?? 3;
        return stock <= min;
      })
      .map(p => ({
        name: p.name,
        brand: p.brand || '',
        category: p.category || '',
        inventoryType: p.inventoryType === 'technical' ? 'Técnico' : 'Retail',
        stockCurrent: p.stockUnits ?? p.stock ?? 0,
        stockMin: p.minStock ?? p.stock_min ?? 3,
        deficit: Math.max(0, (p.minStock ?? p.stock_min ?? 3) - (p.stockUnits ?? p.stock ?? 0)),
      }))
      .sort((a, b) => b.deficit - a.deficit),
    [allProducts]
  );

  // Datos de valorización
  const valuationItems = useMemo(() =>
    allProducts.map(p => {
      const stock = p.stockUnits ?? p.stock ?? 0;
      const cost = p.collabCost ?? p.cost ?? p.cost_per_unit ?? 0;
      return {
        name: p.name,
        brand: p.brand || '',
        category: p.category || '',
        inventoryType: p.inventoryType === 'technical' ? 'Técnico' : 'Retail',
        stockCurrent: stock,
        costPerUnit: cost,
        totalValue: stock * cost,
      };
    }).filter(p => p.stockCurrent > 0)
      .sort((a, b) => b.totalValue - a.totalValue),
    [allProducts]
  );

  const totalValuation = valuationItems.reduce((s, i) => s + i.totalValue, 0);

  // ── Exportaciones ──────────────────────────────────────────
  const handleExport = (format) => {
    const exportFn = format === 'excel' ? exportToExcel : exportToPDF;
    const dateLabel = datePreset !== 'custom'
      ? DATE_PRESETS.find(p => p.key === datePreset)?.label
      : `${dateFrom} — ${dateTo}`;

    if (activeTab === 'movements' || activeTab === 'kardex') {
      const exportData = filteredMovements.map(m => ({
        date: m.created_at,
        type: m.movement_type === 'ingreso' ? '📥 Entrada' : '📤 Salida',
        reason: m.reason || '',
        lotNumber: m.lot_id ? m.lot_id.slice(0, 8) : '',
        supplierName: '',
        invoiceNumber: '',
        amount: m.amount,
        newStock: '',
        costPerUnit: 0,
        productName: m.product_name || '',
      }));

      const titleText = activeTab === 'kardex'
        ? `Kardex — ${allProducts.find(p => p.id === kardexProductId)?.name || 'Producto'}`
        : 'Historial de Movimientos';

      exportFn({
        data: exportData,
        columns: KARDEX_COLUMNS,
        filename: `${activeTab}_${new Date().toISOString().slice(0, 10)}`,
        title: titleText,
        subtitle: `Período: ${dateLabel}`,
        summary: [
          { label: 'Total movimientos', value: exportData.length },
          { label: 'Total entradas', value: exportData.filter(d => d.type.includes('Entrada')).length },
          { label: 'Total salidas', value: exportData.filter(d => d.type.includes('Salida')).length },
        ],
      });
    } else if (activeTab === 'lots') {
      exportFn({
        data: lots.map(l => ({
          lotNumber: l.lot_number || '',
          productName: l.product_name || l.product_id?.slice(0, 8) || '',
          supplierName: l.supplier_name || '',
          invoiceNumber: l.invoice_number || '',
          purchaseDate: l.purchase_date,
          receptionDate: l.reception_date,
          quantityInitial: l.quantity_initial,
          quantityRemaining: l.quantity_remaining,
          costPerUnit: l.cost_per_unit || 0,
          status: l.status === 'active' ? 'Activo' : 'Agotado',
        })),
        columns: LOTS_COLUMNS,
        filename: `lotes_${new Date().toISOString().slice(0, 10)}`,
        title: 'Reporte de Lotes',
        subtitle: `Total: ${lots.length} lotes`,
      });
    } else if (activeTab === 'critical') {
      exportFn({
        data: criticalItems,
        columns: CRITICAL_STOCK_COLUMNS,
        filename: `stock_critico_${new Date().toISOString().slice(0, 10)}`,
        title: 'Reporte de Stock Crítico',
        subtitle: `${criticalItems.length} productos por debajo del mínimo`,
      });
    } else if (activeTab === 'valuation') {
      exportFn({
        data: valuationItems,
        columns: VALUATION_COLUMNS,
        filename: `valorizacion_${new Date().toISOString().slice(0, 10)}`,
        title: 'Valorización de Inventario',
        subtitle: `Total: ${formatCurrency(totalValuation)}`,
        summary: [
          { label: 'Valor total en stock', value: totalValuation, format: 'currency' },
          { label: 'Total productos', value: valuationItems.length },
        ],
      });
    }
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main flex items-center gap-2">
            <ClipboardList className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
            Historial de Inventario
          </h2>
          <p className="text-sm text-text-muted mt-1">Reportes, kardex, lotes y valorización</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('excel')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto mb-4 bg-bg-secondary rounded-lg border border-border-main p-1">
        {REPORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-accent text-accent-text'
                : 'text-text-muted hover:text-text-main hover:bg-bg-tertiary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros compartidos */}
      {(activeTab === 'movements' || activeTab === 'kardex') && (
        <div className="bg-bg-secondary rounded-lg border border-border-main p-4 mb-4 animate-fadeInUp">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-text-muted" />
            <div className="flex items-center gap-1 overflow-x-auto">
              {DATE_PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setDatePreset(p.key)}
                  className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                    datePreset === p.key
                      ? 'bg-accent text-accent-text'
                      : 'bg-bg-tertiary text-text-muted hover:text-text-main'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {datePreset === 'custom' && (
              <>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Desde</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Hasta</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs text-text-muted mb-1">Tipo de movimiento</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm">
                <option value="all">Todos</option>
                <option value="ingreso">Entradas</option>
                <option value="salida">Salidas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-2.5 text-text-muted" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Producto o motivo…" className="w-full pl-8 bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm" />
              </div>
            </div>
          </div>

          {/* Selector de producto para Kardex */}
          {activeTab === 'kardex' && (
            <div className="mt-3">
              <label className="block text-xs text-text-muted mb-1">Producto para Kardex</label>
              <select value={kardexProductId} onChange={e => setKardexProductId(e.target.value)} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm">
                <option value="">— Seleccionar producto —</option>
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.brand || 'Sin marca'}) [{p.inventoryType === 'technical' ? 'Técnico' : 'Retail'}]</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Contenido */}
      <div className="flex-grow overflow-y-auto pb-24 sm:pb-4">
        {loading ? (
          <div className="bg-bg-secondary rounded-lg border border-border-main p-12 text-center text-text-muted animate-pulse">
            Cargando datos…
          </div>
        ) : (
          <>
            {/* === MOVIMIENTOS === */}
            {(activeTab === 'movements' || activeTab === 'kardex') && (
              <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Tipo</th>
                      <th className="p-3 text-right">Cantidad</th>
                      <th className="p-3">Motivo</th>
                      <th className="p-3 text-center">Inventario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map(m => (
                      <tr key={m.id} className="border-b border-border-main text-sm hover:bg-bg-tertiary transition-colors">
                        <td className="p-3 text-text-muted text-xs">{formatDateTime(m.created_at)}</td>
                        <td className="p-3 text-text-main font-semibold">{m.product_name || '—'}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.movement_type === 'ingreso'
                              ? 'bg-green-500/20 text-green-400'
                              : m.movement_type === 'open_unit'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}>
                            {m.movement_type === 'ingreso' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                            {m.movement_type === 'open_unit' ? 'Apertura' : m.movement_type === 'ingreso' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-text-main">{m.amount}</td>
                        <td className="p-3 text-text-muted text-xs">{m.reason || '—'}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            m.inventory_type === 'technical' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {m.inventory_type === 'technical' ? 'Técnico' : 'Retail'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredMovements.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-text-muted">
                          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="font-semibold">Sin movimientos</p>
                          <p className="text-sm opacity-60">No se encontraron movimientos para los filtros seleccionados</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* === LOTES === */}
            {activeTab === 'lots' && (
              <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
                    <tr>
                      <th className="p-3">Lote</th>
                      <th className="p-3">Proveedor</th>
                      <th className="p-3">Factura</th>
                      <th className="p-3 text-center">F. Compra</th>
                      <th className="p-3 text-center">F. Recepción</th>
                      <th className="p-3 text-right">Inicial</th>
                      <th className="p-3 text-right">Actual</th>
                      <th className="p-3 text-right">Costo/u</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map(l => (
                      <tr key={l.id} className={`border-b border-border-main text-sm ${l.status === 'depleted' ? 'opacity-50' : 'hover:bg-bg-tertiary'} transition-colors`}>
                        <td className="p-3 text-text-main font-semibold">{l.lot_number || '—'}</td>
                        <td className="p-3 text-text-muted">{l.supplier_name || '—'}</td>
                        <td className="p-3 text-text-muted">{l.invoice_number || '—'}</td>
                        <td className="p-3 text-center text-text-muted text-xs">{formatDate(l.purchase_date)}</td>
                        <td className="p-3 text-center text-text-muted text-xs">{formatDate(l.reception_date)}</td>
                        <td className="p-3 text-right text-text-main">{l.quantity_initial}</td>
                        <td className="p-3 text-right font-bold text-text-main">{l.quantity_remaining}</td>
                        <td className="p-3 text-right text-text-muted">{formatCurrency(l.cost_per_unit)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {l.status === 'active' ? 'Activo' : 'Agotado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* === STOCK CRÍTICO === */}
            {activeTab === 'critical' && (
              <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
                <div className="p-3 border-b border-border-main bg-red-500/5">
                  <span className="text-sm font-bold text-red-400 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    {criticalItems.length} producto{criticalItems.length !== 1 ? 's' : ''} por debajo del stock mínimo
                  </span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Marca</th>
                      <th className="p-3 text-center">Tipo</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-right">Mínimo</th>
                      <th className="p-3 text-right">Déficit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalItems.map((p, i) => (
                      <tr key={i} className={`border-b border-border-main text-sm ${p.stockCurrent === 0 ? 'bg-red-500/10' : 'hover:bg-bg-tertiary'} transition-colors`}>
                        <td className="p-3 text-text-main font-semibold">{p.name}</td>
                        <td className="p-3 text-text-muted">{p.brand}</td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-400">{p.inventoryType}</span>
                        </td>
                        <td className={`p-3 text-right font-bold ${p.stockCurrent === 0 ? 'text-red-500' : 'text-amber-500'}`}>{p.stockCurrent}</td>
                        <td className="p-3 text-right text-text-muted">{p.stockMin}</td>
                        <td className="p-3 text-right font-bold text-red-400">{p.deficit}</td>
                      </tr>
                    ))}
                    {criticalItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-text-muted">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="font-semibold text-green-400">Todo en orden</p>
                          <p className="text-sm opacity-60">Todos los productos están por encima de su stock mínimo</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* === VALORIZACIÓN === */}
            {activeTab === 'valuation' && (
              <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
                <div className="p-3 border-b border-border-main bg-accent/5">
                  <span className="text-sm font-bold text-accent flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Valor total en inventario: {formatCurrency(totalValuation)}
                  </span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Marca</th>
                      <th className="p-3 text-center">Tipo</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-right">Costo/u</th>
                      <th className="p-3 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuationItems.map((p, i) => (
                      <tr key={i} className="border-b border-border-main text-sm hover:bg-bg-tertiary transition-colors">
                        <td className="p-3 text-text-main font-semibold">{p.name}</td>
                        <td className="p-3 text-text-muted">{p.brand}</td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-400">{p.inventoryType}</span>
                        </td>
                        <td className="p-3 text-right text-text-main font-bold">{p.stockCurrent}</td>
                        <td className="p-3 text-right text-text-muted">{formatCurrency(p.costPerUnit)}</td>
                        <td className="p-3 text-right font-bold text-accent">{formatCurrency(p.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistorialInventarioPage;
