// ===== INICIO: src/components/layout/Layout.jsx =====
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useData } from '../../context/DataContext';

const GlobalLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-lg font-semibold text-text-muted">Cargando datos maestros...</p>
  </div>
);

const Layout = () => {
  const { isLoading } = useData();

  return (
    <div id="app" className="grid grid-cols-[auto_1fr] h-screen bg-bg-main text-text-main">
      <Sidebar />
      <main className="p-6 sm:p-8 lg:p-10 flex flex-col overflow-hidden">
        <div id="main-content" className="flex-1 overflow-y-auto">
          {isLoading ? <GlobalLoader /> : <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default Layout;
// ===== FIN: src/components/layout/Layout.jsx =====
