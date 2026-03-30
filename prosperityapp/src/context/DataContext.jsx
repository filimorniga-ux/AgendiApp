// ===== src/context/DataContext.jsx — Firebase Auth + Supabase writes =====
import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../hooks/useSupabaseCollection';
import { BusinessContext } from './BusinessContext';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../supabase/client';

// Bypass de autenticación — activado con VITE_DEV_BYPASS_AUTH=true en .env
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
// Usuario simulado para el modo bypass (rol 'owner', uid placeholder)
const DEV_USER = DEV_BYPASS ? { uid: 'filimorniga-uid-placeholder', email: 'dev@local.dev' } : null;

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // ── Firebase Auth ──────────────────────────────────────────────
  const [user, setUser] = React.useState(null);
  const [realRole, setRealRole] = React.useState(null);
  const [simulatedRole, setSimulatedRole] = React.useState(null);
  const [loadingAuth, setLoadingAuth] = React.useState(true);

  // ── Supabase: businessId para escrituras ───────────────────────
  const [businessId, setBusinessId] = React.useState(null);

  const userRole = simulatedRole || realRole;
  const updateRoleSimulation = (role) => setSimulatedRole(role);

  // ── Moneda global ──────────────────────────────────────────────
  const [currentLocale, setCurrentLocale] = React.useState('es-CL');
  const [currentCurrencySymbol, setCurrentCurrencySymbol] = React.useState('$');
  const setCurrentCurrency = (locale, symbol) => {
    setCurrentLocale(locale);
    setCurrentCurrencySymbol(symbol);
  };

  // ── Auth Effect ────────────────────────────────────────────────
  React.useEffect(() => {
    // ── Modo bypass: sin Firebase Auth ─────────────────────────
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      setRealRole('owner');
      // Cargar el primer business existente en Supabase
      supabase
        .from('businesses')
        .select('id')
        .limit(1)
        .then(({ data }) => {
          if (data?.[0]?.id) setBusinessId(data[0].id);
          setLoadingAuth(false);
        });
      return; // No suscribirse a Firebase Auth
    }

    // ── Flujo normal con Firebase Auth ─────────────────────────
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 1. Rol + businessId desde Supabase tabla users
        try {
          const { data: sbUser } = await supabase
            .from('users')
            .select('business_id, role')
            .eq('firebase_uid', currentUser.uid)
            .single();

          if (sbUser?.role) setRealRole(sbUser.role);

          if (sbUser?.business_id) {
            setBusinessId(sbUser.business_id);
          } else {
            // Auto-seed: primer login → crear business + user en Supabase
            const { data: biz } = await supabase
              .from('businesses')
              .upsert(
                { owner_uid: currentUser.uid, name: 'Mi Salón' },
                { onConflict: 'owner_uid', ignoreDuplicates: false }
              )
              .select()
              .single();

            if (biz) {
              await supabase.from('users').upsert(
                {
                  business_id: biz.id,
                  firebase_uid: currentUser.uid,
                  email: currentUser.email,
                  role: 'owner',
                },
                { onConflict: 'firebase_uid' }
              );
              setBusinessId(biz.id);
            }
          }
        } catch (err) {
          console.warn('[DataContext] Supabase user error:', err);
        }
      } else {
        setRealRole(null);
        setSimulatedRole(null);
        setBusinessId(null);
      }

      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Colecciones Supabase ─────────────────────────────────────────
  // useSupabaseCollection lee businessId desde BusinessContext (proveído abajo)
  const { data: clients,            loading: loadingClients }     = useSupabaseCollection('clients');
  const { data: collaborators,      loading: loadingCollabs }     = useSupabaseCollection('collaborators', [], { column: 'display_order', ascending: true });
  const { data: services,           loading: loadingServices }    = useSupabaseCollection('services');
  const { data: technicalInventory, loading: loadingTech }        = useSupabaseCollection('technical_inventory');
  const { data: retailInventory,    loading: loadingRetail }      = useSupabaseCollection('retail_inventory');
  const { data: config,             loading: loadingConfig }      = useSupabaseCollection('config');
  const { data: movements,          loading: loadingMovements }   = useSupabaseCollection('movements');

  const appointmentsConstraints = useMemo(() => {
    if (!user || !userRole) return [];
    if (['admin', 'owner'].includes(userRole)) return [];
    return [{ field: 'stylist_id', op: 'eq', value: user.uid }];
  }, [user, userRole]);

  const { data: appointments, loading: loadingAppointments } = useSupabaseCollection('appointments', appointmentsConstraints);

  const isLoading =
    loadingClients || loadingCollabs || loadingServices ||
    loadingTech || loadingRetail || loadingConfig ||
    loadingMovements || loadingAppointments || loadingAuth;

  const value = useMemo(() => ({
    isLoading,
    clients, collaborators, services, technicalInventory,
    retailInventory, config, movements, appointments,
    user, userRole, realRole,
    updateRoleSimulation,
    loadingAuth,
    businessId, // ← nuevo: necesario para escrituras Supabase
    currentLocale, currentCurrencySymbol, setCurrentCurrency,
  }), [
    isLoading, clients, collaborators, services, technicalInventory,
    retailInventory, config, movements, appointments,
    user, userRole, realRole, simulatedRole, loadingAuth,
    businessId, currentLocale, currentCurrencySymbol,
  ]);

  return (
    <BusinessContext.Provider value={{ businessId }}>
      <DataContext.Provider value={value}>
        {children}
      </DataContext.Provider>
    </BusinessContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};
// ===== FIN: src/context/DataContext.jsx =====