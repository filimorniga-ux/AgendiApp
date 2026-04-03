import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import feather from 'feather-icons';
import { useData } from '../../context/DataContext';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';
import { supabase } from '../../supabase/client';

const formatCurrency = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0);

export default function CashSessionModal({ isOpen, onClose, summaryData, sessionType }) {
  const { t } = useTranslation();
  const { businessId } = useData();
  const [actualCash, setActualCash] = useState(0);
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    feather.replace();
    if (isOpen) {
      setActualCash(0);
      setObservations('');
    }
  }, [isOpen]);

  if (!isOpen || !summaryData) return null;

  const expectedCash = summaryData.efectivoEnCaja || 0;
  const difference = actualCash - expectedCash;
  const isCierre = sessionType === 'cierre';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        business_id: businessId,
        type: sessionType, // 'arqueo' or 'cierre'
        expected_cash: expectedCash,
        actual_cash: actualCash,
        difference: difference,
        total_sales: summaryData.totalVentas + summaryData.totalServicios + summaryData.totalVentasGC,
        total_expenses: summaryData.totalGastos,
        total_advances: summaryData.totalAdelantos,
        observations: observations,
      };

      const { error } = await supabase.from('cash_sessions').insert([payload]);
      
      if (error) throw error;
      
      import('react-hot-toast').then(({ default: toast }) => 
        toast.success(isCierre ? 'Caja cerrada exitosamente' : 'Arqueo registrado')
      );
      
      onClose();
    } catch (err) {
      console.error('Error insertando sesión de caja', err);
      import('react-hot-toast').then(({ default: toast }) => toast.error('Error guardando la información'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-fadeIn">
      <div className="bg-bg-secondary border border-border-main rounded-t-[20px] sm:rounded-xl w-full sm:max-w-lg overflow-hidden shadow-2xl relative animate-slideUp">
        
        {/* Header */}
        <div className={`p-6 border-b border-border-main flex items-start gap-4 ${isCierre ? 'bg-red-500/10' : 'bg-accent/10'}`}>
          <div className={`p-3 rounded-full ${isCierre ? 'bg-red-500/20 text-red-500' : 'bg-accent/20 text-accent'}`}>
            <i data-feather={isCierre ? "lock" : "check-square"} className="w-8 h-8"></i>
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${isCierre ? 'text-red-500' : 'text-text-main'}`}>
              {isCierre ? 'Cierre de Caja' : 'Arqueo Parcial de Caja'}
            </h2>
            <p className="text-text-secondary mt-1 text-sm">
              {isCierre 
                ? 'Finaliza la sesión del día registrando el dinero en caja.' 
                : 'Verifica el saldo físico de la caja en este momento.'}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-red-500 transition-colors">
            <i data-feather="x" className="w-6 h-6"></i>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-bg-secondary p-4 rounded-lg border border-border-main">
            <div>
              <p className="text-sm font-semibold text-text-muted">Efectivo en Sistema</p>
              <p className="text-xs text-text-secondary mt-1">Calculado por AgendiApp</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(expectedCash)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Efectivo Físico (En la Gaveta) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">$</span>
              <input
                type="number"
                required
                className="w-full bg-bg-tertiary border border-border-main rounded-lg py-3 pl-8 pr-4 text-text-main focus:ring-2 focus:ring-accent focus:outline-none font-bold text-lg"
                value={actualCash || ''}
                onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          {actualCash > 0 && (
            <div className={`flex justify-between items-center p-4 rounded-lg border ${difference === 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <div className="flex items-center gap-2">
                <i data-feather={difference === 0 ? "check-circle" : "alert-circle"} className="w-5 h-5"></i>
                <span className="font-semibold">Diferencia:</span>
              </div>
              <span className="font-bold">{formatCurrency(difference)}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Observaciones {difference !== 0 ? '*' : '(Opcional)'}</label>
            <textarea
              required={difference !== 0}
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-3 text-text-main focus:ring-2 focus:ring-accent focus:outline-none"
              rows={3}
              placeholder={difference !== 0 ? "Justifica el sobrante/faltante" : "Notas del cierre/arqueo..."}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-main">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-tertiary font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (difference !== 0 && !observations.trim())}
              className={`px-8 py-2 rounded-lg font-bold text-white transition-colors flex items-center justify-center min-w-[150px] ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' :
                isCierre ? 'bg-red-600 hover:bg-red-500' : 'bg-accent hover:bg-accent/90 text-accent-text'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isCierre ? 'Realizar Cierre' : 'Guardar Arqueo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
