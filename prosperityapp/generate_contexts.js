const fs = require('fs');
const path = require('path');

const dir = 'src/context/collections';

const templates = [
  {
    name: 'ClientsContext.jsx',
    code: `import React, { createContext, useContext } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const ClientsContext = createContext();

export const ClientsProvider = ({ children }) => {
  const { data: clients, loading, error } = useSupabaseCollection('clients');
  return (
    <ClientsContext.Provider value={{ clients, loading, error }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error('useClients debe usarse dentro de ClientsProvider');
  return ctx;
};
`
  },
  {
    name: 'CollaboratorsContext.jsx',
    code: `import React, { createContext, useContext } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const CollaboratorsContext = createContext();

export const CollaboratorsProvider = ({ children }) => {
  const { data: collaborators, loading, error } = useSupabaseCollection('collaborators', [], { column: 'display_order', ascending: true });
  return (
    <CollaboratorsContext.Provider value={{ collaborators, loading, error }}>
      {children}
    </CollaboratorsContext.Provider>
  );
};

export const useCollaborators = () => {
  const ctx = useContext(CollaboratorsContext);
  if (!ctx) throw new Error('useCollaborators debe usarse dentro de CollaboratorsProvider');
  return ctx;
};
`
  },
  {
    name: 'ServicesContext.jsx',
    code: `import React, { createContext, useContext } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const ServicesContext = createContext();

export const ServicesProvider = ({ children }) => {
  const { data: services, loading, error } = useSupabaseCollection('services');
  return (
    <ServicesContext.Provider value={{ services, loading, error }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices debe usarse dentro de ServicesProvider');
  return ctx;
};
`
  },
  {
    name: 'MovementsContext.jsx',
    code: `import React, { createContext, useContext } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const MovementsContext = createContext();

export const MovementsProvider = ({ children }) => {
  const { data: movements, loading, error } = useSupabaseCollection('movements');
  return (
    <MovementsContext.Provider value={{ movements, loading, error }}>
      {children}
    </MovementsContext.Provider>
  );
};

export const useMovements = () => {
  const ctx = useContext(MovementsContext);
  if (!ctx) throw new Error('useMovements debe usarse dentro de MovementsProvider');
  return ctx;
};
`
  },
  {
    name: 'InventoryContext.jsx',
    code: `import React, { createContext, useContext } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const { data: technicalInventory, loading: loadingTech, error: errorTech } = useSupabaseCollection('technical_inventory');
  const { data: retailInventory, loading: loadingRetail, error: errorRetail } = useSupabaseCollection('retail_inventory');
  
  return (
    <InventoryContext.Provider value={{
      technicalInventory, loadingTech, errorTech,
      retailInventory, loadingRetail, errorRetail
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory debe usarse dentro de InventoryProvider');
  return ctx;
};
`
  },
  {
    name: 'ConfigContext.jsx',
    code: `import React, { createContext, useContext, useState, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const { data: config, loading, error } = useSupabaseCollection('config');
  
  const [currentLocale, setCurrentLocale] = useState('es-CL');
  const [currentCurrencySymbol, setCurrentCurrencySymbol] = useState('$');
  
  const setCurrentCurrency = (locale, symbol) => {
    setCurrentLocale(locale);
    setCurrentCurrencySymbol(symbol);
  };

  const brandName = config?.[0]?.brandName || 'AgendiApp';
  const logoUrl = config?.[0]?.logoUrl || null;

  const value = useMemo(() => ({
    config, loading, error,
    brandName, logoUrl,
    currentLocale, currentCurrencySymbol, setCurrentCurrency
  }), [config, loading, error, brandName, logoUrl, currentLocale, currentCurrencySymbol]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useAppConfig debe usarse dentro de ConfigProvider');
  return ctx;
};
`
  },
  {
    name: 'AppointmentsContext.jsx',
    code: `import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';
import { useBusiness } from '../BusinessContext';

const AppointmentsContext = createContext();

export const AppointmentsProvider = ({ children }) => {
  const { user, realRole } = useBusiness();
  const simulatedRole = null; // Removed role simulation globally or we can grab it from somewhere else. 
  // Wait, DataContext had simulatedRole. We'll need to handle it. Let's keep it simple for now, simulatedRole was only used in DataContext.
  
  const appointmentsConstraints = useMemo(() => {
    if (!user || !realRole) return [];
    if (['admin', 'owner'].includes(realRole)) return [];
    return [{ field: 'collaborator_id', op: 'eq', value: user.id }];
  }, [user, realRole]);

  const { data: appointments, loading, error } = useSupabaseCollection('appointments', appointmentsConstraints);
  
  return (
    <AppointmentsContext.Provider value={{ appointments, loading, error }}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error('useAppointments debe usarse dentro de AppointmentsProvider');
  return ctx;
};
`
  },
  {
    name: 'SimulationContext.jsx',
    code: `import React, { createContext, useContext, useState } from 'react';
import { useBusiness } from '../BusinessContext';

const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const { realRole } = useBusiness();
  const [simulatedRole, setSimulatedRole] = useState(null);
  const updateRoleSimulation = (role) => setSimulatedRole(role);
  const userRole = simulatedRole || realRole;

  return (
    <SimulationContext.Provider value={{ simulatedRole, updateRoleSimulation, userRole, realRole }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useRoleSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useRoleSimulation debe usarse dentro de SimulationProvider');
  return ctx;
};
`
  }
];

templates.forEach(t => {
  fs.writeFileSync(path.join(dir, t.name), t.code);
});
