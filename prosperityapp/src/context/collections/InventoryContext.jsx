import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const { data: technicalInventory, loading: loadingTech, error: errorTech } = useSupabaseCollection('technical_inventory');
  const { data: retailInventory, loading: loadingRetail, error: errorRetail } = useSupabaseCollection('retail_inventory');

  const loading = loadingTech || loadingRetail;
  const error = errorTech || errorRetail;

  const value = useMemo(() => ({
    technicalInventory,
    retailInventory,
    loading,
    error
  }), [technicalInventory, retailInventory, loading, error]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within a InventoryProvider');
  }
  return context;
};
