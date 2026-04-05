/**
 * useInventoryLots.js
 * Hook para gestionar lotes de inventario (técnico + retail).
 * Provee: lotes por producto, crear lote, marcar agotado.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { useBusiness } from '../context/BusinessContext';

export function useInventoryLots(productId, inventoryType) {
  const { businessId } = useBusiness();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = useCallback(async () => {
    if (!businessId || !productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_lots')
        .select('*, suppliers(name)')
        .eq('business_id', businessId)
        .eq('product_id', productId)
        .order('reception_date', { ascending: false });

      if (error) throw error;
      setLots(data || []);
    } catch (err) {
      console.error('[useInventoryLots] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, productId]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  /**
   * Crear un nuevo lote al recibir mercancía
   */
  const createLot = useCallback(async ({
    lotNumber,
    supplierId,
    supplierName,
    invoiceNumber,
    purchaseDate,
    receptionDate,
    quantity,
    costPerUnit,
    notes,
  }) => {
    if (!businessId || !productId) throw new Error('Missing businessId or productId');

    const { data, error } = await supabase
      .from('inventory_lots')
      .insert({
        business_id: businessId,
        product_id: productId,
        inventory_type: inventoryType,
        lot_number: lotNumber || `LOTE-${Date.now()}`,
        supplier_id: supplierId || null,
        supplier_name: supplierName || null,
        invoice_number: invoiceNumber || null,
        purchase_date: purchaseDate || null,
        reception_date: receptionDate || new Date().toISOString().slice(0, 10),
        quantity_initial: quantity,
        quantity_remaining: quantity,
        cost_per_unit: costPerUnit || 0,
        status: 'active',
        origin: 'purchase',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Refrescar lista
    await fetchLots();
    return data;
  }, [businessId, productId, inventoryType, fetchLots]);

  /**
   * Descontar cantidad de un lote (al registrar salida o abrir unidad fraccionada)
   */
  const deductFromLot = useCallback(async (lotId, quantity) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) throw new Error('Lote no encontrado');

    const newRemaining = Math.max(0, lot.quantity_remaining - quantity);
    const newStatus = newRemaining <= 0 ? 'depleted' : 'active';

    const { error } = await supabase
      .from('inventory_lots')
      .update({
        quantity_remaining: newRemaining,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lotId);

    if (error) throw error;
    await fetchLots();
    return { newRemaining, newStatus };
  }, [lots, fetchLots]);

  /**
   * Marcar lote como agotado manualmente
   */
  const markDepleted = useCallback(async (lotId) => {
    const { error } = await supabase
      .from('inventory_lots')
      .update({
        quantity_remaining: 0,
        status: 'depleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lotId);

    if (error) throw error;
    await fetchLots();
  }, [fetchLots]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const activeLots = lots.filter(l => l.status === 'active');
    const totalRemaining = activeLots.reduce((s, l) => s + Number(l.quantity_remaining || 0), 0);
    const totalInitial = lots.reduce((s, l) => s + Number(l.quantity_initial || 0), 0);
    const avgCost = activeLots.length > 0
      ? activeLots.reduce((s, l) => s + Number(l.cost_per_unit || 0), 0) / activeLots.length
      : 0;

    return {
      totalLots: lots.length,
      activeLots: activeLots.length,
      totalRemaining,
      totalInitial,
      avgCost,
    };
  }, [lots]);

  return {
    lots,
    loading,
    stats,
    createLot,
    deductFromLot,
    markDepleted,
    refetch: fetchLots,
  };
}

/**
 * Hook para listar TODOS los lotes del negocio (para reportes/historiales)
 */
export function useAllLots(filters = {}) {
  const { businessId } = useBusiness();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('inventory_lots')
        .select('*')
        .eq('business_id', businessId)
        .order('reception_date', { ascending: false });

      if (filters.inventoryType) {
        query = query.eq('inventory_type', filters.inventoryType);
      }
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('reception_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('reception_date', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLots(data || []);
    } catch (err) {
      console.error('[useAllLots] error:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, filters.inventoryType, filters.supplierId, filters.status, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { lots, loading, refetch: fetchAll };
}
