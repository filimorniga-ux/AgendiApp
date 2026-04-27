import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const CollaboratorsContext = createContext();

export const CollaboratorsProvider = ({ children }) => {
  const { data: collaborators, loading, error } = useSupabaseCollection('collaborators', [], { column: 'display_order', ascending: true });

  const value = useMemo(() => ({
    collaborators,
    loading,
    error
  }), [collaborators, loading, error]);

  return (
    <CollaboratorsContext.Provider value={value}>
      {children}
    </CollaboratorsContext.Provider>
  );
};

export const useCollaborators = () => {
  const context = useContext(CollaboratorsContext);
  if (context === undefined) {
    throw new Error('useCollaborators must be used within a CollaboratorsProvider');
  }
  return context;
};
