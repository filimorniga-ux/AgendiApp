// ===== INICIO: src/context/DataContext.jsx =====
import React, { createContext, useContext, useMemo } from 'react';
import { useCollection } from '../hooks/useCollection';
import { auth, db } from '../firebase/config'; // Importar auth y db
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, where, orderBy } from 'firebase/firestore';

// 1. Crear el Contexto
const DataContext = createContext();

// 2. Crear el "Proveedor" (El "Cerebro")
export const DataProvider = ({ children }) => {
  // 3. Cargar TODAS las colecciones principales UNA SOLA VEZ
  const [user, setUser] = React.useState(null);
  const [realRole, setRealRole] = React.useState(null); // Store the REAL role from DB
  const [simulatedRole, setSimulatedRole] = React.useState(null); // Store the SIMULATED role
  const [loadingAuth, setLoadingAuth] = React.useState(true);

  // Derived userRole: Simulated takes precedence over Real
  const userRole = simulatedRole || realRole;

  const updateRoleSimulation = (role) => {
    setSimulatedRole(role);
  };

  // Global Currency State
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
            setRealRole('client'); // Default role
          }
        } catch (error) {
          console.warn("Error fetching user role:", error);
        }
      } else {
        setRealRole(null);
        setSimulatedRole(null); // Reset simulation on logout
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const { data: clients, loading: loadingClients } = useCollection('clients');
  const { data: collaborators, loading: loadingCollabs } = useCollection('collaborators', 'displayOrder');
  const { data: services, loading: loadingServices } = useCollection('services');
  const { data: technicalInventory, loading: loadingTech } = useCollection('technicalInventory');
  const { data: retailInventory, loading: loadingRetail } = useCollection('retailInventory');
  const { data: config, loading: loadingConfig } = useCollection('config');
  const { data: movements, loading: loadingMovements } = useCollection('movements');

  // 3.1. Cargar CITAS con seguridad (Filtro por Rol)
  const appointmentsConstraints = useMemo(() => {
    if (!user || !userRole) return []; // Si no hay usuario, no cargar nada (o array vacío)

    if (['admin', 'owner'].includes(userRole)) {
      // Admin/Owner: Ver todo (podríamos limitar por fecha si son muchas)
      return [];
    } else {
      // Staff/Stylist: Solo sus citas
      return [where('stylistId', '==', user.uid)];
    }
  }, [user, userRole]);

  const { data: appointments, loading: loadingAppointments } = useCollection('appointments', appointmentsConstraints);

  // 4. Determinar si la app está "lista"
  const isLoading =
    loadingClients ||
    loadingCollabs ||
    loadingServices ||
    loadingTech ||
    loadingRetail ||
    loadingConfig ||
    loadingConfig ||
    loadingMovements ||
    loadingAppointments ||
    loadingAuth; // Incluimos loadingAuth

  // 5. Crear el objeto de valor que compartiremos
  const value = useMemo(() => ({
    isLoading,
    clients,
    collaborators,
    services,
    technicalInventory,
    retailInventory,
    config,
    movements,
    appointments,
    user,
    userRole,
    realRole, // Export realRole if needed for UI checks
    updateRoleSimulation, // Export the updater
    loadingAuth,
    // Global Currency
    currentLocale,
    currentCurrencySymbol,
    setCurrentCurrency,
    // (Podemos añadir datos filtrados/calculados aquí más tarde)

  }), [
    isLoading,
    clients,
    collaborators,
    services,
    technicalInventory,
    retailInventory,
    config,
    movements,
    appointments,
    user,
    userRole,
    realRole,
    simulatedRole, // Add to dependency array
    loadingAuth,
    // Global Currency
    currentLocale,
    currentCurrencySymbol,
    setCurrentCurrency,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// 6. Crear un hook personalizado para consumir los datos fácilmente
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};
// ===== FIN: src/context/DataContext.jsx =====