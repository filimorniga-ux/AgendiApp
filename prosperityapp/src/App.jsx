// ===== INICIO: src/App.jsx (Sprint 108 — Performance: Lazy Loading) =====
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProviders } from "./context/AppProviders";
import { TimerProvider } from './context/TimerContext';
import { Toaster } from 'react-hot-toast';
import PWAInstallBanner from './components/PWAInstallBanner';
import OfflineIndicator from './components/OfflineIndicator';

// Layout — siempre presente, no lazy (es el shell)
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import ErrorBoundary from './components/ErrorBoundary';

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
const RecepcionPage              = lazy(() => import('./pages/RecepcionPage.jsx'));
const PedidoInteligentePage      = lazy(() => import('./pages/PedidoInteligentePage'));
const HistorialInventarioPage    = lazy(() => import('./pages/HistorialInventarioPage'));
const SubscriptionPage           = lazy(() => import('./pages/SubscriptionPage'));
const ChatPage                   = lazy(() => import('./pages/Chat/ChatPage'));
const WebsiteApp                 = lazy(() => import('./pages/Website/App'));

// Módulos Legales (Meta)
const PrivacyPolicyPage          = lazy(() => import('./pages/Legal/PrivacyPolicyPage'));
const TermsOfServicePage         = lazy(() => import('./pages/Legal/TermsOfServicePage'));
const DataDeletionPage           = lazy(() => import('./pages/Legal/DataDeletionPage'));

// Módulos Públicos (Clientes)
const PublicLayout               = lazy(() => import('./components/public/PublicLayout'));
const PublicAgenda               = lazy(() => import('./pages/Public/PublicAgenda'));
const PublicPrices               = lazy(() => import('./pages/Public/PublicPrices'));
const PublicClientLogin          = lazy(() => import('./pages/Public/PublicClientLogin'));
const PublicHistory              = lazy(() => import('./pages/Public/PublicHistory'));

// Auth pages
const AuthCallbackPage           = lazy(() => import('./pages/AuthCallbackPage'));
const ResetPasswordPage          = lazy(() => import('./pages/ResetPasswordPage'));

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
      <AppProviders>
          <TimerProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-bg-secondary, #1E1E24)',
                color: 'var(--color-text-main, #FFFFFF)',
                border: '1px solid var(--color-border-main, #2d2d3a)',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: 'var(--color-accent, #D4A853)',
                  secondary: 'var(--color-bg-secondary, #1E1E24)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'var(--color-bg-secondary, #1E1E24)',
                },
              },
            }}
          />
          <PWAInstallBanner />
          <OfflineIndicator />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<WebsiteApp />} />

                {/* Rutas Legales (Verificación de Meta) */}
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/data-deletion" element={<DataDeletionPage />} />

                {/* Auth callback routes (email confirmation, password reset) */}
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/auth/update-password" element={<ResetPasswordPage />} />

                {/* Rutas Públicas de Clientes (Multi-tenant) */}
                <Route path="/p/:slug" element={<PublicLayout />}>
                  <Route index element={<Navigate to="reservar" replace />} />
                  <Route path="reservar" element={<PublicAgenda />} />
                  <Route path="precios" element={<PublicPrices />} />
                  <Route path="login" element={<PublicClientLogin />} />
                  <Route path="historial" element={<PublicHistory />} />
                </Route>

                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AgendaCalendario />} />
                  <Route path="nomina"                  element={<NominasPage />} />
                  <Route path="nomina/historial"        element={<PayrollHistoryPage />} />
                  <Route path="nomina/historial/:id"    element={<PayrollDetailPage />} />
                  <Route path="precios"                 element={<PreciosPage />} />
                  
                  {/* Rutas exclusivas para Dueños/Admins */}
                  <Route path="dashboard"               element={<RoleGuard><DashboardPage /></RoleGuard>} />
                  <Route path="chat"                    element={<RoleGuard><ChatPage /></RoleGuard>} />
                  <Route path="caja"                    element={<RoleGuard><CajaDiariaPage /></RoleGuard>} />
                  <Route path="pedidos"                 element={<RoleGuard><PedidosPage /></RoleGuard>} />
                  <Route path="clientes"                element={<RoleGuard><ClientesPage /></RoleGuard>} />
                  <Route path="clientes/:id"            element={<RoleGuard><ClientDetailPage /></RoleGuard>} />
                  <Route path="colaboradores"           element={<RoleGuard><ColaboradoresPage /></RoleGuard>} />
                  <Route path="cierres"                 element={<RoleGuard><CierresMensualesPage /></RoleGuard>} />
                  <Route path="inventario"              element={<RoleGuard><InventarioPage /></RoleGuard>} />
                  <Route path="inventario/auditoria"    element={<RoleGuard><StockMovementsPage /></RoleGuard>} />
                  <Route path="recepcion"               element={<RoleGuard><RecepcionPage /></RoleGuard>} />
                  <Route path="pedido-inteligente"      element={<RoleGuard><PedidoInteligentePage /></RoleGuard>} />
                  <Route path="inventario/historial"    element={<RoleGuard><HistorialInventarioPage /></RoleGuard>} />
                  <Route path="giftcards"               element={<RoleGuard><GiftCardPage /></RoleGuard>} />
                  <Route path="configuracion"           element={<RoleGuard><ConfiguracionPage /></RoleGuard>} />
                  <Route path="reportes"                element={<RoleGuard><ReportsPage /></RoleGuard>} />
                  <Route path="suscripcion"             element={<RoleGuard allowedRoles={['owner']}><SubscriptionPage /></RoleGuard>} />
                  <Route path="*"                       element={<PlaceholderPage title="404: Página no encontrada" />} />
                </Route>

                <Route path="/website/*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
          </TimerProvider>
      </AppProviders>
    </ThemeProvider>
  );
}

export default App;
// ===== FIN: src/App.jsx =====