import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const ClientsContext = createContext();

export const ClientsProvider = ({ children }) => {
  const { data: clients, loading, error } = useSupabaseCollection('clients');

  const value = useMemo(() => ({
    clients,
    loading,
    error
  }), [clients, loading, error]);

  return (
    <ClientsContext.Provider value={value}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};
