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
  const { data: clients,            loading: loadingClients, error: errorClients }   = useSupabaseCollection('clients');
  const { data: collaborators,      loading: loadingCollabs, error: errorCollabs }   = useSupabaseCollection('collaborators', [], { column: 'display_order', ascending: true });
  const { data: services,           loading: loadingServices, error: errorServices }  = useSupabaseCollection('services');
  const { data: technicalInventory, loading: loadingTech, error: errorTech }      = useSupabaseCollection('technical_inventory');
  const { data: retailInventory,    loading: loadingRetail, error: errorRetail }    = useSupabaseCollection('retail_inventory');
  const { data: config,             loading: loadingConfig, error: errorConfig }    = useSupabaseCollection('config');
  const { data: movements,          loading: loadingMovements, error: errorMovements } = useSupabaseCollection('movements');

  const appointmentsConstraints = useMemo(() => {
    if (!user || !userRole) return [];
    if (['admin', 'owner'].includes(userRole)) return [];
    return [{ field: 'stylist_id', op: 'eq', value: user.uid }];
  }, [user, userRole]);

  const { data: appointments, loading: loadingAppointments, error: errorAppointments } = useSupabaseCollection('appointments', appointmentsConstraints);

  const error =
    errorClients || errorCollabs || errorServices ||
    errorTech || errorRetail || errorConfig ||
    errorMovements || errorAppointments || null;

  const isLoading =
    loadingClients || loadingCollabs || loadingServices ||
    loadingTech || loadingRetail || loadingConfig ||
    loadingMovements || loadingAppointments;

  // ── Branding Helpers ───────────────────────────────────────────
  const brandName = config?.[0]?.brandName || 'AgendiApp';
  const logoUrl = config?.[0]?.logoUrl || null;

  const value = useMemo(() => ({
    isLoading,
    error,
    clients, collaborators, services, technicalInventory,
    retailInventory, config, movements, appointments,
    user, userRole, realRole,
    updateRoleSimulation,
    loadingAuth,
    businessId,
    brandName, logoUrl,
    currentLocale, currentCurrencySymbol, setCurrentCurrency,
  }), [
    isLoading, error, clients, collaborators, services, technicalInventory,
    retailInventory, config, movements, appointments,
    user, userRole, realRole, simulatedRole, loadingAuth,
    businessId, brandName, logoUrl, currentLocale, currentCurrencySymbol,
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