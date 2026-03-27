// ===== INICIO: src/App.jsx (Sprint 108) =====
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { Toaster } from 'react-hot-toast';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Páginas
import AgendaCalendario from './components/agenda/AgendaCalendario';
import DashboardPage from './pages/DashboardPage';
import CajaDiariaPage from './pages/CajaDiariaPage';
import ClientesPage from './pages/ClientesPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ColaboradoresPage from './pages/ColaboradoresPage';
import NominasPage from './pages/NominasPage';
import PayrollHistoryPage from './pages/PayrollHistoryPage';
import PayrollDetailPage from './pages/PayrollDetailPage';
import CierresMensualesPage from './pages/CierresMensualesPage';
import PreciosPage from './pages/PreciosPage';
import InventarioPage from './pages/InventarioPage';
import StockMovementsPage from './pages/StockMovementsPage';
import GiftCardPage from './pages/GiftCardPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import PedidosPage from './pages/PedidosPage';
import ReportsPage from './pages/ReportsPage';
import MigrationPage from './pages/MigrationPage';
import WebsiteApp from './pages/Website/App';

const PlaceholderPage = ({ title }) => (
  <h1 className="p-8 text-3xl font-bold text-text-main">{title}</h1>
);

function App() {
  return (
    <ThemeProvider>
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
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<WebsiteApp />} />

            <Route path="/app" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<AgendaCalendario />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="caja" element={<CajaDiariaPage />} />
              <Route path="pedidos" element={<PedidosPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="clientes/:id" element={<ClientDetailPage />} />
              <Route path="colaboradores" element={<ColaboradoresPage />} />
              <Route path="nomina" element={<NominasPage />} />
              <Route path="nomina/historial" element={<PayrollHistoryPage />} />
              <Route path="nomina/historial/:id" element={<PayrollDetailPage />} />
              <Route path="cierres" element={<CierresMensualesPage />} />
              <Route path="precios" element={<PreciosPage />} />
              <Route path="inventario" element={<InventarioPage />} />
              <Route path="inventario/auditoria" element={<StockMovementsPage />} />
              <Route path="giftcards" element={<GiftCardPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
              <Route path="reportes" element={<ReportsPage />} />
              <Route path="migration" element={<MigrationPage />} />
              <Route path="*" element={<PlaceholderPage title="404: Página no encontrada" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
// ===== FIN: src/App.jsx =====