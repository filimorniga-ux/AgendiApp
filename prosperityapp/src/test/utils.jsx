import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { BusinessContext } from '../context/BusinessContext';
import { AppProviders } from '../context/AppProviders';

/**
 * Renderizador personalizado para tests.
 * Permite inyectar overrides para el BusinessContext de forma sencilla.
 */
const customRender = (ui, { businessContextValue = {}, route = '/', ...options } = {}) => {
  // Valores por defecto para el BusinessContext
  const defaultBusinessContext = {
    businessId: 'test-business-id',
    user: { uid: 'test-user-id', email: 'test@example.com' },
    realRole: 'owner',
    loadingAuth: false,
    ...businessContextValue,
  };

  const Wrapper = ({ children }) => {
    // Si la ruta no es '/', BrowserRouter inicializa en the current location
    window.history.pushState({}, 'Test page', route);

    return (
      <BrowserRouter>
        <ThemeProvider>
          <BusinessContext.Provider value={defaultBusinessContext}>
            <AppProviders>
              {children}
            </AppProviders>
          </BusinessContext.Provider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-exportar todo lo de testing-library
export * from '@testing-library/react';
// Sobreescribir el render
export { customRender as render };
