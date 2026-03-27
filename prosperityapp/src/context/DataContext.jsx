// ===== src/context/DataContext.jsx — Firebase reads + Supabase writes =====
import React, { createContext, useContext, useMemo } from 'react';
import { useCollection } from '../hooks/useCollection';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, where } from 'firebase/firestore';
import { supabase } from '../supabase/client';

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 1. Rol desde Firebase (Firestore legacy)
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setRealRole(userDoc.data().role);
          } else {
            setRealRole('client');
          }
        } catch (err) {
          console.error('[DataContext] Firebase role error:', err);
        }

        // 2. businessId desde Supabase (para escrituras)
        try {
          const { data: sbUser } = await supabase
            .from('users')
            .select('business_id')
            .eq('firebase_uid', currentUser.uid)
            .single();

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
          console.error('[DataContext] Supabase businessId error:', err);
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

  // ── Colecciones Firebase (reads — sin cambio) ──────────────────
  const { data: clients,            loading: loadingClients }     = useCollection('clients');
  const { data: collaborators,      loading: loadingCollabs }     = useCollection('collaborators', 'displayOrder');
  const { data: services,           loading: loadingServices }    = useCollection('services');
  const { data: technicalInventory, loading: loadingTech }        = useCollection('technicalInventory');
  const { data: retailInventory,    loading: loadingRetail }      = useCollection('retailInventory');
  const { data: config,             loading: loadingConfig }      = useCollection('config');
  const { data: movements,          loading: loadingMovements }   = useCollection('movements');

  const appointmentsConstraints = useMemo(() => {
    if (!user || !userRole) return [];
    if (['admin', 'owner'].includes(userRole)) return [];
    return [where('stylistId', '==', user.uid)];
  }, [user, userRole]);

  const { data: appointments, loading: loadingAppointments } = useCollection('appointments', appointmentsConstraints);

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
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
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