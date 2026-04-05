/**
 * useSmartOrdering.js
 * Algoritmo de pedido inteligente basado en historial de ventas.
 * Sin lead time (simplificado para salones).
 * Calcula sugerencias de reposición por producto.
 */
import { useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useBusiness } from '../context/BusinessContext';

// Períodos predefinidos (en días)
export const PERIOD_OPTIONS = [
  { key: 'week',    label: 'Última semana',    days: 7 },
  { key: 'month',   label: 'Último mes',       days: 30 },
  { key: 'quarter', label: 'Últimos 3 meses',  days: 90 },
  { key: 'semester',label: 'Últimos 6 meses',  days: 180 },
  { key: 'year',    label: 'Último año',        days: 365 },
  { key: 'custom',  label: 'Rango personalizado', days: 0 },
];

export const HORIZON_OPTIONS = [
  { key: 'week',    label: 'Para 1 semana',    days: 7 },
  { key: 'biweek',  label: 'Para 2 semanas',   days: 14 },
  { key: 'month',   label: 'Para 1 mes',       days: 30 },
  { key: 'quarter', label: 'Para 3 meses',     days: 90 },
  { key: 'semester',label: 'Para 6 meses',     days: 180 },
];

/**
 * @returns {Object} { suggestions, loading, error, calculate }
 */
export function useSmartOrdering() {
  const { businessId } = useBusiness();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Ejecutar el cálculo de sugerencias
   * @param {Object} params
   * @param {string} params.period - key del período de análisis
   * @param {string} params.horizon - key del horizonte de pedido
   * @param {string} params.dateFrom - para rango custom
   * @param {string} params.dateTo - para rango custom
   * @param {number} params.safetyFactor - factor de seguridad (default 0.15)
   * @param {string} params.filter - 'all' | 'critical' | 'zero'
   * @param {string} params.inventoryTypeFilter - 'all' | 'technical' | 'retail'
   * @param {string} params.supplierFilter - supplier_id o 'all'
   * @param {string} params.categoryFilter - categoría o 'all'
   */
  const calculate = useCallback(async ({
    period = 'month',
    horizon = 'month',
    dateFrom,
    dateTo,
    safetyFactor = 0.15,
    filter = 'all',
    inventoryTypeFilter = 'all',
    supplierFilter = 'all',
    categoryFilter = 'all',
  } = {}) => {
    if (!businessId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Determinar rango de fechas para el análisis
      const periodDef = PERIOD_OPTIONS.find(p => p.key === period);
      const horizonDef = HORIZON_OPTIONS.find(h => h.key === horizon);
      const horizonDays = horizonDef?.days || 30;

      let analysisStart, analysisEnd;
      if (period === 'custom' && dateFrom && dateTo) {
        analysisStart = dateFrom;
        analysisEnd = dateTo;
      } else {
        const days = periodDef?.days || 30;
        analysisEnd = new Date().toISOString().slice(0, 10);
        analysisStart = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      }

      const daysDiff = Math.max(1, Math.ceil(
        (new Date(analysisEnd) - new Date(analysisStart)) / 86400000
      ));

      // 2. Obtener movimientos de salida del período
      const { data: movements, error: movErr } = await supabase
        .from('stock_movements')
        .select('product_id, amount, inventory_type')
        .eq('business_id', businessId)
        .eq('movement_type', 'salida')
        .gte('created_at', analysisStart)
        .lte('created_at', analysisEnd + 'T23:59:59');

      if (movErr) throw movErr;

      // Agrupar salidas por producto
      const exitsByProduct = {};
      (movements || []).forEach(m => {
        const key = m.product_id;
        if (!exitsByProduct[key]) exitsByProduct[key] = 0;
        exitsByProduct[key] += Number(m.amount || 0);
      });

      // 3. Obtener todos los productos
      const [techRes, retailRes] = await Promise.all([
        inventoryTypeFilter === 'retail' ? { data: [] } :
          supabase.from('technical_inventory').select('id, name, brand, category, stock_current, stock_min, cost_per_unit, default_supplier_id, sell_mode').eq('business_id', businessId),
        inventoryTypeFilter === 'technical' ? { data: [] } :
          supabase.from('retail_inventory').select('id, name, brand, category, stock_current, stock_min, cost_price, sale_price, default_supplier_id').eq('business_id', businessId),
      ]);

      // 4. Calcular sugerencias
      const allSuggestions = [];

      // Procesar técnicos
      (techRes.data || []).forEach(p => {
        const totalExits = exitsByProduct[p.id] || 0;
        const avgDaily = totalExits / daysDiff;
        const stockCurrent = Number(p.stock_current || 0);
        const stockMin = Number(p.stock_min || 3);

        // Fórmula: cantidad_base + seguridad - stock_actual
        const qtyBase = avgDaily * horizonDays;
        const safety = qtyBase * safetyFactor;
        const suggested = Math.ceil(qtyBase + safety - stockCurrent);

        const reasoning = avgDaily > 0
          ? `Ventas: ${totalExits} en ${daysDiff}d (${avgDaily.toFixed(1)}/día). Stock: ${stockCurrent}. Para ${horizonDays}d necesitas ~${Math.ceil(qtyBase + safety)}.`
          : stockCurrent <= stockMin
            ? `Sin ventas registradas pero stock (${stockCurrent}) ≤ mínimo (${stockMin}).`
            : null;

        if (suggested <= 0 && stockCurrent > stockMin && filter !== 'all') return;

        allSuggestions.push({
          productId: p.id,
          name: p.name,
          brand: p.brand || '',
          category: p.category || '',
          inventoryType: 'technical',
          stockCurrent,
          stockMin,
          avgDailyUsage: avgDaily,
          totalExits,
          suggestedQty: Math.max(0, suggested),
          costPerUnit: Number(p.cost_per_unit || 0),
          estimatedCost: Math.max(0, suggested) * Number(p.cost_per_unit || 0),
          supplierId: p.default_supplier_id,
          isZero: stockCurrent === 0,
          isCritical: stockCurrent <= stockMin,
          reasoning,
        });
      });

      // Procesar retail
      (retailRes.data || []).forEach(p => {
        const totalExits = exitsByProduct[p.id] || 0;
        const avgDaily = totalExits / daysDiff;
        const stockCurrent = Number(p.stock_current || 0);
        const stockMin = Number(p.stock_min || 3);

        const qtyBase = avgDaily * horizonDays;
        const safety = qtyBase * safetyFactor;
        const suggested = Math.ceil(qtyBase + safety - stockCurrent);

        const reasoning = avgDaily > 0
          ? `Ventas: ${totalExits} en ${daysDiff}d (${avgDaily.toFixed(1)}/día). Stock: ${stockCurrent}. Para ${horizonDays}d necesitas ~${Math.ceil(qtyBase + safety)}.`
          : stockCurrent <= stockMin
            ? `Sin ventas registradas pero stock (${stockCurrent}) ≤ mínimo (${stockMin}).`
            : null;

        if (suggested <= 0 && stockCurrent > stockMin && filter !== 'all') return;

        allSuggestions.push({
          productId: p.id,
          name: p.name,
          brand: p.brand || '',
          category: p.category || '',
          inventoryType: 'retail',
          stockCurrent,
          stockMin,
          avgDailyUsage: avgDaily,
          totalExits,
          suggestedQty: Math.max(0, suggested),
          costPerUnit: Number(p.cost_price || 0),
          estimatedCost: Math.max(0, suggested) * Number(p.cost_price || 0),
          supplierId: p.default_supplier_id,
          isZero: stockCurrent === 0,
          isCritical: stockCurrent <= stockMin,
          reasoning,
        });
      });

      // 5. Aplicar filtros
      let filtered = allSuggestions;

      if (filter === 'critical') {
        filtered = filtered.filter(s => s.isCritical);
      } else if (filter === 'zero') {
        filtered = filtered.filter(s => s.isZero);
      } else if (filter === 'needed') {
        filtered = filtered.filter(s => s.suggestedQty > 0);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(s => s.category === categoryFilter);
      }

      // Ordenar: stock 0 primero, luego crítico, luego por sugerido desc
      filtered.sort((a, b) => {
        if (a.isZero !== b.isZero) return a.isZero ? -1 : 1;
        if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
        return b.suggestedQty - a.suggestedQty;
      });

      setSuggestions(filtered);
    } catch (err) {
      console.error('[useSmartOrdering]', err);
      setError(err.message || 'Error al calcular sugerencias');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  return {
    suggestions,
    loading,
    error,
    calculate,
  };
}
