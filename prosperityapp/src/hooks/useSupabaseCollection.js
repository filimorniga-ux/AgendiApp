import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';
import { COLLECTION_TO_TABLE, rowToCamel, fieldToColumn } from '../supabase/tableMap';
import { useData } from '../context/DataContext';

/**
 * Hook que reemplaza useCollection (Firebase) con Supabase.
 * Mantiene la misma API: { data, loading, error }
 *
 * @param {string} tableName - nombre de la tabla en Supabase (snake_case)
 * @param {Array} filters    - array de objetos { field, op, value } (opcional)
 */
export const useSupabaseCollection = (tableNameInput, filters = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const { businessId } = useData();

  const tableName = COLLECTION_TO_TABLE[tableNameInput] || tableNameInput;

  useEffect(() => {
    if (!businessId) {
      // Sin business_id no podemos filtrar, esperar
      setLoading(false);
      setData([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        let query = supabase
          .from(tableName)
          .select('*')
          .eq('business_id', businessId);

        // Apply filters: array de objetos { field, op, value }
        if (Array.isArray(filters)) {
          filters.forEach(f => {
            if (f.field && f.op && f.value !== undefined) {
              query = query.filter(f.field, f.op, f.value);
            }
          });
        }

        // Orden por defecto: más reciente primero
        query = query.order('created_at', { ascending: false });

        const { data: rows, error: err } = await query;

        if (!isMounted) return;
        if (err) throw err;

        // Convertir snake_case → camelCase para compatibilidad con componentes
        setData((rows || []).map(rowToCamel));
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.warn(`[useSupabaseCollection] ${tableName}:`, err);
        setError('No se pudieron cargar los datos.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Real-time via Supabase Realtime
    channelRef.current = supabase
      .channel(`realtime:${tableName}:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          // Refetch al recibir cualquier cambio
          fetchData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tableName, businessId, JSON.stringify(filters)]);

  return { data, loading, error };
};
