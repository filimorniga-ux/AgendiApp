// ===== INICIO: src/hooks/useMonthlyRecords.js =====
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';

/**
 * Reemplaza la implementación Firebase (onSnapshot) con Supabase Realtime.
 * Lee monthly_closings (para `partners`) y monthly_closing_records (para `records`).
 *
 * @param {string} yearMonth - formato 'YYYY-MM'
 */
export const useMonthlyRecords = (yearMonth) => {
  const [records, setRecords] = useState([]);
  const [partners, setPartners] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelClosingRef = useRef(null);
  const channelRecordsRef = useRef(null);

  useEffect(() => {
    if (!yearMonth) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // 1. Leer monthly_closings para obtener los partners del período
        const { data: closingRow, error: closingErr } = await supabase
          .from('monthly_closings')
          .select('*')
          .eq('period', yearMonth)
          .maybeSingle();

        if (closingErr) throw closingErr;
        setPartners(closingRow?.partners || []);

        // 2. Leer monthly_closing_records ordenados por fecha desc
        const { data: recordRows, error: recordsErr } = await supabase
          .from('monthly_closing_records')
          .select('*')
          .eq('period', yearMonth)
          .order('date', { ascending: false });

        if (recordsErr) throw recordsErr;
        setRecords(recordRows || []);
      } catch (err) {
        console.warn('[useMonthlyRecords]', err);
        setError('Error cargando registros mensuales.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime: escuchar cambios en monthly_closings para este período
    channelClosingRef.current = supabase
      .channel(`monthly_closings:${yearMonth}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'monthly_closings',
        filter: `period=eq.${yearMonth}`,
      }, fetchData)
      .subscribe();

    // Realtime: escuchar cambios en monthly_closing_records para este período
    channelRecordsRef.current = supabase
      .channel(`monthly_closing_records:${yearMonth}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'monthly_closing_records',
        filter: `period=eq.${yearMonth}`,
      }, fetchData)
      .subscribe();

    return () => {
      if (channelClosingRef.current) {
        supabase.removeChannel(channelClosingRef.current);
        channelClosingRef.current = null;
      }
      if (channelRecordsRef.current) {
        supabase.removeChannel(channelRecordsRef.current);
        channelRecordsRef.current = null;
      }
    };
  }, [yearMonth]);

  return { records, partners, loading, error };
};
// ===== FIN: src/hooks/useMonthlyRecords.js =====