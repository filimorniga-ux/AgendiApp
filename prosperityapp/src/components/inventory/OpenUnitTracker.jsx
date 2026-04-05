/**
 * OpenUnitTracker.jsx
 * Componente para rastrear unidades abiertas de productos fraccionados.
 * Muestra unidades en uso y permite marcarlas como "Agotado" con un botón.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/client';
import { useBusiness } from '../../context/BusinessContext';
import { Droplets, Plus, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function OpenUnitTracker({ productId, unitSize, unitOfMeasure, lots }) {
  const { businessId } = useBusiness();
  const [openUnits, setOpenUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingUnit, setOpeningUnit] = useState(false);

  const fetchOpenUnits = useCallback(async () => {
    if (!businessId || !productId) return;
    try {
      const { data, error } = await supabase
        .from('open_units')
        .select('*')
        .eq('business_id', businessId)
        .eq('product_id', productId)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setOpenUnits(data || []);
    } catch (err) {
      console.error('[OpenUnitTracker] fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, productId]);

  useEffect(() => {
    fetchOpenUnits();
  }, [fetchOpenUnits]);

  const activeLots = (lots || []).filter(l => l.status === 'active' && l.quantity_remaining > 0);
  const inUseUnits = openUnits.filter(u => u.status === 'in_use');
  const depletedUnits = openUnits.filter(u => u.status === 'depleted');

  // Abrir nueva unidad (descuenta 1 del lote con más stock)
  const handleOpenUnit = async () => {
    if (activeLots.length === 0) {
      toast.error('No hay unidades en lotes activos para abrir');
      return;
    }
    setOpeningUnit(true);
    try {
      // Tomar del lote con stock — sin FIFO obligatorio
      const lot = activeLots[0];
      const newRemaining = lot.quantity_remaining - 1;

      // Descontar del lote
      await supabase
        .from('inventory_lots')
        .update({
          quantity_remaining: newRemaining,
          status: newRemaining <= 0 ? 'depleted' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lot.id);

      // Crear registro de unidad abierta
      await supabase
        .from('open_units')
        .insert({
          business_id: businessId,
          product_id: productId,
          lot_id: lot.id,
          total_capacity: unitSize || 1000,
          unit_of_measure: unitOfMeasure || 'ml',
          status: 'in_use',
          opened_at: new Date().toISOString(),
          notes: `Abierta del lote ${lot.lot_number || lot.id.slice(0, 8)}`,
        });

      // Registrar movimiento
      await supabase
        .from('stock_movements')
        .insert({
          business_id: businessId,
          product_id: productId,
          product_name: '',
          amount: 1,
          movement_type: 'open_unit',
          reason: `Unidad abierta del lote ${lot.lot_number || ''}`,
          lot_id: lot.id,
          inventory_type: 'technical',
        });

      toast.success('✅ Unidad abierta correctamente');
      await fetchOpenUnits();
    } catch (err) {
      console.error('[OpenUnitTracker] open:', err);
      toast.error('Error al abrir unidad');
    } finally {
      setOpeningUnit(false);
    }
  };

  // Marcar como agotada
  const handleMarkDepleted = async (unitId) => {
    try {
      await supabase
        .from('open_units')
        .update({
          status: 'depleted',
          depleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', unitId);

      toast.success('Unidad marcada como agotada');
      await fetchOpenUnits();
    } catch (err) {
      console.error('[OpenUnitTracker] deplete:', err);
      toast.error('Error al marcar como agotada');
    }
  };

  if (loading) return null;

  return (
    <div className="open-unit-tracker">
      <div className="open-unit-header">
        <div className="open-unit-title">
          <Droplets className="w-4 h-4" style={{ color: '#3b82f6' }} />
          <span>Unidades abiertas ({inUseUnits.length} en uso)</span>
        </div>
        <button
          onClick={handleOpenUnit}
          disabled={openingUnit || activeLots.length === 0}
          className="open-unit-btn-open"
          title={activeLots.length === 0 ? 'No hay stock en lotes activos' : 'Abrir nueva unidad'}
        >
          <Plus className="w-3.5 h-3.5" />
          {openingUnit ? 'Abriendo…' : 'Abrir unidad'}
        </button>
      </div>

      {/* Unidades en uso */}
      {inUseUnits.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '8px 0', opacity: 0.6 }}>
          No hay unidades abiertas actualmente
        </p>
      )}

      {inUseUnits.map(unit => (
        <div key={unit.id} className="open-unit-card">
          <div className="open-unit-info">
            <Droplets className="w-4 h-4" style={{ color: '#3b82f6' }} />
            <div>
              <div className="open-unit-capacity">
                {unit.total_capacity} {unit.unit_of_measure}
              </div>
              <div className="open-unit-date">
                <Clock className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                Abierta: {new Date(unit.opened_at).toLocaleDateString('es-CL')}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleMarkDepleted(unit.id)}
            className="open-unit-btn-deplete"
          >
            <CheckCircle2 className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '4px' }} />
            Agotado
          </button>
        </div>
      ))}

      {/* Historial de agotadas (colapsable) */}
      {depletedUnits.length > 0 && (
        <details style={{ marginTop: '6px' }}>
          <summary style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', cursor: 'pointer', opacity: 0.6 }}>
            {depletedUnits.length} unidad{depletedUnits.length !== 1 ? 'es' : ''} agotada{depletedUnits.length !== 1 ? 's' : ''}
          </summary>
          {depletedUnits.map(unit => (
            <div key={unit.id} className="open-unit-card open-unit-card--depleted" style={{ marginTop: '4px' }}>
              <div className="open-unit-info">
                <div>
                  <div className="open-unit-capacity" style={{ opacity: 0.5 }}>
                    {unit.total_capacity} {unit.unit_of_measure}
                  </div>
                  <div className="open-unit-date">
                    Agotada: {unit.depleted_at ? new Date(unit.depleted_at).toLocaleDateString('es-CL') : '—'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Agotada</span>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

export default OpenUnitTracker;
