// ===== src/context/DataContext.jsx — Solo colecciones Supabase =====
import React, { createContext, useContext, useState, useMemo } from 'react';
import { useSupabaseCollection } from '../hooks/useSupabaseCollection';
import { useBusiness } from './BusinessContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // businessId, user, realRole y loadingAuth vienen de BusinessProvider (capa externa)
  const { businessId, user, realRole, loadingAuth } = useBusiness();

  // ── Rol simulado para pruebas de UI ────────────────────────────
  const [simulatedRole, setSimulatedRole]   = useState(null);
  const updateRoleSimulation = (role) => setSimulatedRole(role);
  const userRole = simulatedRole || realRole;

  // ── Moneda global ───────────────────────────────────────────────
  const [currentLocale,         setCurrentLocale]         = useState('es-CL');
  const [currentCurrencySymbol, setCurrentCurrencySymbol] = useState('$');
  const setCurrentCurrency = (locale, symbol) => {
    setCurrentLocale(locale);
    setCurrentCurrencySymbol(symbol);
  };

  // ── Colecciones Supabase ────────────────────────────────────────
  // useSupabaseCollection lee businessId desde BusinessContext (proveído
  // por BusinessProvider, que es el PADRE de DataProvider en el árbol)
  const { data: clients,            loading: loadingClients }   = useSupabaseCollection('clients');
  const { data: collaborators,      loading: loadingCollabs }   = useSupabaseCollection('collaborators', [], { column: 'display_order', ascending: true });
  const { data: services,           loading: loadingServices }  = useSupabaseCollection('services');
  const { data: technicalInventory, loading: loadingTech }      = useSupabaseCollection('technical_inventory');
  const { data: retailInventory,    loading: loadingRetail }    = useSupabaseCollection('retail_inventory');
  const { data: config,             loading: loadingConfig }    = useSupabaseCollection('config');
  const { data: movements,          loading: loadingMovements } = useSupabaseCollection('movements');

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
    businessId,
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