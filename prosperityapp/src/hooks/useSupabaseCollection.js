import { useState, useEffect, useRef, useContext } from 'react';
import { supabase } from '../supabase/client';
import { COLLECTION_TO_TABLE, rowToCamel, retailRowToCamel } from '../supabase/tableMap';
import { BusinessContext } from '../context/BusinessContext';

/**
 * Hook que reemplaza useCollection (Firebase) con Supabase.
 * Mantiene la misma API: { data, loading, error }
 *
 * Lee businessId desde BusinessContext (contexto ligero separado de DataContext)
 * para evitar dependencia circular cuando se usa dentro del propio DataProvider.
 *
 * Firma compatible con componentes externos:
 *   useSupabaseCollection(table, filters?, orderBy?)
 *
 * @param {string} tableNameInput  - tabla Supabase o alias colección Firestore
 * @param {Array}  filters         - [{ field, op, value }] (opcional)
 * @param {Object} orderBy         - { column, ascending } (opcional)
 */
export const useSupabaseCollection = (tableNameInput, filters = [], orderBy = null) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const channelRef            = useRef(null);

  // BusinessContext: contexto ligero que solo expone businessId
  // Se usa aquí para evitar importar DataContext (que causaría dependencia circular)
  const businessCtx  = useContext(BusinessContext);
  const businessId   = businessCtx?.businessId ?? null;
  const tableName    = COLLECTION_TO_TABLE[tableNameInput] || tableNameInput;

  // Seleccionar el transformer interno (eliminado del outer scope para forzar su uso dentro de useEffect)

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      setData([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      // Seleccionar transformer aquí, dentro del efecto, para garantizar
      // que siempre se use la versión más actualizada
      const xform = tableName === 'retail_inventory' ? retailRowToCamel : rowToCamel;
      try {
        let query = supabase
          .from(tableName)
          .select('*')
          .eq('business_id', businessId);

        if (Array.isArray(filters)) {
          filters.forEach(f => {
            if (f.field && f.op && f.value !== undefined) {
              query = query.filter(f.field, f.op, f.value);
            }
          });
        }

        if (orderBy?.column) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data: rows, error: err } = await query;
        if (!isMounted) return;
        if (err) throw err;
        setData((rows || []).map(r => xform(r)));
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

    channelRef.current = supabase
      .channel(`realtime:${tableName}:${businessId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: tableName,
        filter: `business_id=eq.${businessId}`,
      }, () => fetchData())
      .subscribe();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, businessId, JSON.stringify(filters), JSON.stringify(orderBy)]);

  return { data, loading, error };
};
