// ===== src/context/DataContext.jsx =====
import React, { createContext, useContext, useMemo } from 'react';
import { useCollection } from '../hooks/useCollection';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, where } from 'firebase/firestore';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [realRole, setRealRole] = React.useState(null);
  const [simulatedRole, setSimulatedRole] = React.useState(null);
  const [loadingAuth, setLoadingAuth] = React.useState(true);

  const userRole = simulatedRole || realRole;
  const updateRoleSimulation = (role) => setSimulatedRole(role);

  const [currentLocale, setCurrentLocale] = React.useState('es-CL');
  const [currentCurrencySymbol, setCurrentCurrencySymbol] = React.useState('$');
  const setCurrentCurrency = (locale, symbol) => {
    setCurrentLocale(locale);
    setCurrentCurrencySymbol(symbol);
  };

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setRealRole(userDoc.data().role);
          } else {
            console.warn("Usuario autenticado pero sin documento en 'users'");
            setRealRole('client');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setRealRole(null);
        setSimulatedRole(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

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
    currentLocale, currentCurrencySymbol, setCurrentCurrency,
  }), [
    isLoading, clients, collaborators, services, technicalInventory,
    retailInventory, config, movements, appointments,
    user, userRole, realRole, simulatedRole, loadingAuth,
    currentLocale, currentCurrencySymbol,
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