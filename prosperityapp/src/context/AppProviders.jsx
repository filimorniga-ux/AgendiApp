import React from 'react';
import { BusinessProvider } from './BusinessContext';
import { RoleProvider } from './collections/RoleContext';
import { ConfigProvider } from './collections/ConfigContext';
import { ClientsProvider } from './collections/ClientsContext';
import { CollaboratorsProvider } from './collections/CollaboratorsContext';
import { ServicesProvider } from './collections/ServicesContext';
import { InventoryProvider } from './collections/InventoryContext';
import { MovementsProvider } from './collections/MovementsContext';
import { AppointmentsProvider } from './collections/AppointmentsContext';

// Este componente envuelve la aplicación con todos los contextos necesarios,
// manteniendo el código limpio en App.jsx / main.jsx
export const AppProviders = ({ children }) => {
  return (
    <BusinessProvider>
      <RoleProvider>
        <ConfigProvider>
          <ClientsProvider>
            <CollaboratorsProvider>
              <ServicesProvider>
                <InventoryProvider>
                  <MovementsProvider>
                    <AppointmentsProvider>
                      {children}
                    </AppointmentsProvider>
                  </MovementsProvider>
                </InventoryProvider>
              </ServicesProvider>
            </CollaboratorsProvider>
          </ClientsProvider>
        </ConfigProvider>
      </RoleProvider>
    </BusinessProvider>
  );
};
