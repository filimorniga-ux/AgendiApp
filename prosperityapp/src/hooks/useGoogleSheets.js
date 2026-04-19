import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useBusiness } from '../context/BusinessContext';

/**
 * Hook to manage Google Sheets integration for the current business.
 * Provides connection status, URL, sync actions, and error handling.
 */
export function useGoogleSheets() {
  const { businessId } = useBusiness();
  const [syncData, setSyncData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current sync status
  const fetchSyncStatus = useCallback(async () => {
    if (!businessId) return;
    try {
      const { data, error: fetchErr } = await supabase
        .from('google_sheets_sync')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      setSyncData(data);
    } catch (err) {
      console.warn('Error fetching Sheets sync status:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // Helper to call the Edge Function
  const callSheetsSync = async (action, extraPayload = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('sheets-sync', {
      body: {
        action,
        business_id: businessId,
        ...extraPayload,
      },
    });

    if (error) {
      console.error('Edge Function Error Object:', error);
      
      // If it's a 500 error from our catch block, we might have context inside error.context
      let msg = error.message || 'Error invocando la función Deno';
      if (error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          if (body.details) msg = `${msg} - ${body.details}`;
        } catch (e) {}
      }
      
      throw new Error(msg);
    }

    if (data && data.success === false) {
      console.error('Edge Function returned error payload:', data);
      throw new Error(data.details || data.error || 'Error desconocido sincronizando con Google Sheets');
    }

    return data;
  };

  /**
   * Connect Google Sheets — uses an existing spreadsheet URL
   */
  const connectSheets = async (spreadsheetUrl) => {
    setError(null);
    setActionLoading(true);
    try {
      const result = await callSheetsSync('create', { spreadsheet_url: spreadsheetUrl });
      await fetchSyncStatus();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Sync all data now
   */
  const syncNow = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const result = await callSheetsSync('full-sync');
      await fetchSyncStatus();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Disconnect Google Sheets (stops syncing, doesn't delete the sheet)
   */
  const disconnect = async () => {
    setError(null);
    setActionLoading(true);
    try {
      await callSheetsSync('disconnect');
      setSyncData(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    // State
    isConnected: !!syncData,
    spreadsheetUrl: syncData?.spreadsheet_url || null,
    sharedEmail: syncData?.shared_email || null,
    lastSyncedAt: syncData?.last_synced_at || null,
    syncStatus: syncData?.sync_status || null,
    loading,
    actionLoading,
    error,

    // Actions
    connectSheets,
    syncNow,
    disconnect,
    refresh: fetchSyncStatus,
  };
}
