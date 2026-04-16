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

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sheets-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          business_id: businessId,
          ...extraPayload,
        }),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || `Error ${res.status}`);
    }
    return result;
  };

  /**
   * Connect Google Sheets — creates a new spreadsheet and shares it
   */
  const connectSheets = async (email) => {
    setError(null);
    setActionLoading(true);
    try {
      const result = await callSheetsSync('create', { shared_email: email });
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
