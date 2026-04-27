import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const ServicesContext = createContext();

export const ServicesProvider = ({ children }) => {
  const { data: services, loading, error } = useSupabaseCollection('services');

  const value = useMemo(() => ({
    services,
    loading,
    error
  }), [services, loading, error]);

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};
