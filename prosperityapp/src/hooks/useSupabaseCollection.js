import { useState, useEffect, useRef, useContext } from 'react';
import { supabase }         from '../supabase/client';
import { COLLECTION_TO_TABLE, rowToCamel, retailRowToCamel } from '../supabase/tableMap';
import { BusinessContext }  from '../context/BusinessContext';
import { cacheRows, readCachedRows } from '../lib/localDb';

/**
 * Hook que lee una collection de Supabase con soporte Offline-First.
 *
 * Estrategia:
 *  1. Si hay red  → fetch de Supabase, guarda resultados en IndexedDB (caché local).
 *  2. Si no hay red → lee los datos previamente cacheados desde IndexedDB.
 *  3. Al reconectar → re-fetch automático desde Supabase + actualización de caché.
 *
 * API compatible con el hook anterior: { data, loading, error, isOffline }
 *
 * @param {string} tableNameInput  - tabla Supabase o alias colección Firestore
 * @param {Array}  filters         - [{ field, op, value }] (opcional)
 * @param {Object} orderBy         - { column, ascending } (opcional)
 */
export const useSupabaseCollection = (tableNameInput, filters = [], orderBy = null) => {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const channelRef                = useRef(null);

  const businessCtx = useContext(BusinessContext);
  const businessId  = businessCtx?.businessId ?? null;
  const tableName   = COLLECTION_TO_TABLE[tableNameInput] || tableNameInput;

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      setData([]);
      return;
    }

    const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

    let isMounted = true;
    setLoading(true);

    const xform = tableName === 'retail_inventory' ? retailRowToCamel : rowToCamel;

    // ── FETCH ONLINE ────────────────────────────────────────────────────────
    const fetchFromSupabase = async () => {
      try {
        let rows;

        if (DEV_BYPASS) {
          // En DEV_BYPASS: usar RPC que combina set_config + SELECT en una sola
          // transacción para evitar el problema del connection pooler de Supabase
          const { data: rpcData, error: rpcErr } = await supabase.rpc(
            'fetch_table_with_business_id',
            { p_table: tableName, p_business_id: businessId }
          );
          if (rpcErr) throw rpcErr;
          rows = rpcData || [];
        } else {
          // Flujo normal (producción con Supabase Auth)
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

          const { data: qRows, error: err } = await query;
          if (err) throw err;
          rows = qRows || [];
        }

        if (!isMounted) return;

        const transformed = rows.map(r => xform(r));

        // ── Guardar en IndexedDB ──────────────────────────────────────────
        await cacheRows(tableName, businessId, transformed);

        setData(transformed);
        setIsOffline(false);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        // Si hay error de red, intentar servir desde caché
        if (!navigator.onLine) {
          await loadFromCache();
        } else {
          console.warn(`[useSupabaseCollection] ${tableName}:`, err);
          setError('No se pudieron cargar los datos.');
          setData([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // ── FALLBACK OFFLINE: leer desde IndexedDB ───────────────────────────
    const loadFromCache = async () => {
      try {
        const cached = await readCachedRows(tableName, businessId);
        if (!isMounted) return;
        setData(cached || []);
        setIsOffline(true);
        setError(null);
        console.info(`[useSupabaseCollection] 📦 Sirviendo "${tableName}" desde caché offline (${cached?.length ?? 0} items)`);
      } catch (cacheErr) {
        if (!isMounted) return;
        setData([]);
        setError('Sin conexión y sin datos en caché.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // ── Decidir qué hacer según estado de red ───────────────────────────
    if (navigator.onLine) {
      fetchFromSupabase();
    } else {
      loadFromCache();
    }

    // ── Listener de reconexión ───────────────────────────────────────────
    const handleOnline = () => {
      if (isMounted) {
        console.info(`[useSupabaseCollection] 🌐 Reconectado — re-fetching "${tableName}"`);
        fetchFromSupabase();
      }
    };
    window.addEventListener('online', handleOnline);

    // ── Suscripción Realtime (solo cuando hay red) ───────────────────────
    if (navigator.onLine) {
      channelRef.current = supabase
        .channel(`realtime:${tableName}:${businessId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: tableName,
          filter: `business_id=eq.${businessId}`,
        }, () => fetchFromSupabase())
        .subscribe();
    }

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, businessId, JSON.stringify(filters), JSON.stringify(orderBy)]);

  return { data, loading, error, isOffline };
};
