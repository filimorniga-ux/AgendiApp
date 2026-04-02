// ===== INICIO: src/App.jsx (Sprint 108 — Performance: Lazy Loading) =====
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { BusinessProvider } from './context/BusinessContext';
import { DataProvider } from './context/DataContext';
import { Toaster } from 'react-hot-toast';
import PWAInstallBanner from './components/PWAInstallBanner';
import OfflineIndicator from './components/OfflineIndicator';

// Layout — siempre presente, no lazy (es el shell)
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// ── Lazy imports — cada módulo se carga sólo cuando se navega a él ──────────
const AgendaCalendario    = lazy(() => import('./components/agenda/AgendaCalendario'));
const DashboardPage       = lazy(() => import('./pages/DashboardPage'));
const CajaDiariaPage      = lazy(() => import('./pages/CajaDiariaPage'));
const ClientesPage        = lazy(() => import('./pages/ClientesPage'));
const ClientDetailPage    = lazy(() => import('./pages/ClientDetailPage'));
const ColaboradoresPage   = lazy(() => import('./pages/ColaboradoresPage'));
const NominasPage         = lazy(() => import('./pages/NominasPage'));
const PayrollHistoryPage  = lazy(() => import('./pages/PayrollHistoryPage'));
const PayrollDetailPage   = lazy(() => import('./pages/PayrollDetailPage'));
const CierresMensualesPage = lazy(() => import('./pages/CierresMensualesPage'));
const PreciosPage         = lazy(() => import('./pages/PreciosPage'));
const InventarioPage      = lazy(() => import('./pages/InventarioPage'));
const StockMovementsPage  = lazy(() => import('./pages/StockMovementsPage'));
const GiftCardPage        = lazy(() => import('./pages/GiftCardPage'));
const ConfiguracionPage   = lazy(() => import('./pages/ConfiguracionPage'));
const PedidosPage         = lazy(() => import('./pages/PedidosPage'));
const ReportsPage         = lazy(() => import('./pages/ReportsPage'));
const MigrationPage       = lazy(() => import('./pages/MigrationPage'));
const RecepcionPage       = lazy(() => import('./pages/RecepcionPage.jsx'));
const WebsiteApp          = lazy(() => import('./pages/Website/App'));

// Fallback de carga — spinner mínimo que no añade peso al bundle inicial
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      background: 'var(--color-bg-main, #131317)',
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '3px solid #2d2d3a',
        borderTopColor: '#D4A853',
        animation: 'spin 0.7s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const PlaceholderPage = ({ title }) => (
  <h1 className="p-8 text-3xl font-bold text-text-main">{title}</h1>
);

function App() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <DataProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#2d3748',
                color: '#e2e8f0',
                border: '1px solid #4a5568',
              },
            }}
          />
          <PWAInstallBanner />
          <OfflineIndicator />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/app" replace />} />

                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AgendaCalendario />} />
                  <Route path="dashboard"               element={<DashboardPage />} />
                  <Route path="caja"                    element={<CajaDiariaPage />} />
                  <Route path="pedidos"                 element={<PedidosPage />} />
                  <Route path="clientes"                element={<ClientesPage />} />
                  <Route path="clientes/:id"            element={<ClientDetailPage />} />
                  <Route path="colaboradores"           element={<ColaboradoresPage />} />
                  <Route path="nomina"                  element={<NominasPage />} />
                  <Route path="nomina/historial"        element={<PayrollHistoryPage />} />
                  <Route path="nomina/historial/:id"    element={<PayrollDetailPage />} />
                  <Route path="cierres"                 element={<CierresMensualesPage />} />
                  <Route path="precios"                 element={<PreciosPage />} />
                  <Route path="inventario"              element={<InventarioPage />} />
                  <Route path="inventario/auditoria"    element={<StockMovementsPage />} />
                  <Route path="recepcion"               element={<RecepcionPage />} />
                  <Route path="giftcards"               element={<GiftCardPage />} />
                  <Route path="configuracion"           element={<ConfiguracionPage />} />
                  <Route path="reportes"                element={<ReportsPage />} />
                  <Route path="migration"               element={<MigrationPage />} />
                  <Route path="*"                       element={<PlaceholderPage title="404: Página no encontrada" />} />
                </Route>

                <Route path="/website/*" element={<WebsiteApp />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </DataProvider>
      </BusinessProvider>
    </ThemeProvider>
  );
}

export default App;
// ===== FIN: src/App.jsx =====