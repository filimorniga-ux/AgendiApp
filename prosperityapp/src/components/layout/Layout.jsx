// ===== INICIO: src/components/layout/Layout.jsx =====
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavigationBar from './BottomNavigationBar';
import { useData } from '../../context/DataContext';
import { Menu } from 'lucide-react';
import '../../styles/mobile.css';

const GlobalLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-lg font-semibold text-text-muted">Cargando datos maestros...</p>
  </div>
);

const Layout = () => {
  const { isLoading } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location?.pathname]);

  // Prevent body scroll when sidebar/overlay open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  return (
    <div
      id="app"
      className="grid h-screen bg-bg-main text-text-main"
      style={{
        gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr',
      }}
    >
      {/* ── Sidebar overlay (mobile) ── */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <div
        id="sidebar"
        className={sidebarOpen ? 'open' : ''}
        style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : '-280px',
          width: '280px',
          height: '100%',
          zIndex: 50,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        } : {}}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      </div>

      {/* ── Main content ── */}
      <main
        className="flex flex-col overflow-hidden"
        style={{
          padding: isMobile ? '0' : undefined,
        }}
      >
        {/* Mobile top bar with hamburger */}
        {isMobile && (
          <div className="mobile-topbar">
            <button
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={sidebarOpen}
              style={{
                position: 'relative',
                top: 'auto',
                left: 'auto',
                display: 'flex',
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        <div
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{
            padding: isMobile ? '0 16px 16px' : '1.5rem 2rem 2.5rem',
          }}
        >
          {isLoading ? <GlobalLoader /> : <Outlet />}
        </div>
      </main>

      {/* ── Bottom Navigation (mobile only) ── */}
      <BottomNavigationBar />
    </div>
  );
};

export default Layout;
// ===== FIN: src/components/layout/Layout.jsx =====
