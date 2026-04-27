import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';
import { useBusiness } from '../BusinessContext';
import { useRole } from './RoleContext';

const AppointmentsContext = createContext();

export const AppointmentsProvider = ({ children }) => {
  const { user } = useBusiness();
  const { userRole } = useRole();

  const appointmentsConstraints = useMemo(() => {
    if (!user || !userRole) return [];
    if (['admin', 'owner'].includes(userRole)) return [];
    return [{ field: 'collaborator_id', op: 'eq', value: user.id }];
  }, [user, userRole]);

  const { data: appointments, loading, error } = useSupabaseCollection('appointments', appointmentsConstraints);

  const value = useMemo(() => ({
    appointments,
    loading,
    error
  }), [appointments, loading, error]);

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within a AppointmentsProvider');
  }
  return context;
};
