import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const MovementsContext = createContext();

export const MovementsProvider = ({ children }) => {
  const { data: movements, loading, error } = useSupabaseCollection('movements');

  const value = useMemo(() => ({
    movements,
    loading,
    error
  }), [movements, loading, error]);

  return (
    <MovementsContext.Provider value={value}>
      {children}
    </MovementsContext.Provider>
  );
};

export const useMovements = () => {
  const context = useContext(MovementsContext);
  if (context === undefined) {
    throw new Error('useMovements must be used within a MovementsProvider');
  }
  return context;
};
