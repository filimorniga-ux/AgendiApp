import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';
import { COLLECTION_TO_TABLE, rowToCamel, fieldToColumn } from '../supabase/tableMap';

/**
 * Hook que reemplaza useCollection (Firebase) con Supabase.
 * Mantiene la misma API: { data, loading, error }
 *
 * @param {string} collectionName   - Nombre Firestore (ej: 'collaborators')
 * @param {string|Array} constraints - string = orderBy field | array = ignored for now
 * @param {string|null} businessId  - UUID del business para filtrar
 * @param {Object} extraFilters     - Filtros adicionales {column: value}
 */
export const useSupabaseCollection = (
  collectionName,
  constraints = [],
  businessId = null,
  extraFilters = {}
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const tableName = COLLECTION_TO_TABLE[collectionName] || collectionName;

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

        // Aplicar filtros extra (ej: solo citas del colaborador)
        for (const [col, val] of Object.entries(extraFilters)) {
          query = query.eq(col, val);
        }

        // orderBy a partir del string constraints
        if (typeof constraints === 'string' && constraints) {
          const col = fieldToColumn(constraints);
          query = query.order(col, { ascending: true });
        } else {
          // Orden por defecto: más reciente primero
          query = query.order('created_at', { ascending: false });
        }

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
  }, [tableName, businessId, typeof constraints === 'string' ? constraints : JSON.stringify(constraints), JSON.stringify(extraFilters)]);

  return { data, loading, error };
};
