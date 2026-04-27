import React, { createContext, useContext, useState, useMemo } from 'react';
import { useBusiness } from '../BusinessContext';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const { realRole } = useBusiness();
  const [simulatedRole, setSimulatedRole] = useState(null);

  const updateRoleSimulation = (role) => setSimulatedRole(role);
  const userRole = simulatedRole || realRole;

  const value = useMemo(() => ({
    userRole,
    simulatedRole,
    realRole,
    updateRoleSimulation
  }), [userRole, simulatedRole, realRole]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
