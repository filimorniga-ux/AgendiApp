// ===== INICIO: src/components/layout/Layout.jsx (collapsible sidebar) =====
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavigationBar from './BottomNavigationBar';
import FloatingTimerWidget from '../timer/FloatingTimerWidget';
import { Menu } from 'lucide-react';
import '../../styles/mobile.css';
import { useAppConfig } from '../../context/collections/ConfigContext';

const GlobalLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-lg font-semibold text-text-muted">Cargando datos maestros...</p>
  </div>
);

const Layout = () => {
  const {
    brandName,
    loading: loadingAppConfig
  } = useAppConfig();

  const isLoading = loadingAppConfig;
  const location = useLocation();

  // ── Scroll detection for topbar depth ───────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const mainCont = document.getElementById('main-content');
    if (!mainCont) return;
    const handleScroll = () => setScrolled(mainCont.scrollTop > 10);
    mainCont.addEventListener('scroll', handleScroll);
    return () => mainCont.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Mobile drawer state ──────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── Desktop collapsed state (persisted in localStorage) ─────────────────
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location?.pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  // Desktop sidebar width: 256px expanded, 72px collapsed (icons only)
  const desktopSidebarWidth = collapsed ? '72px' : '256px';

  return (
    <div
      id="app"
      className="flex h-screen bg-bg-main text-text-main overflow-hidden"
    >
      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {isMobile ? (
        /* Mobile: slide-in drawer */
        (<div
          id="sidebar"
          className={sidebarOpen ? 'sidebar-open' : ''}
        >
          <Sidebar
            collapsed={false}
            onToggleCollapse={() => {}}
            onClose={() => setSidebarOpen(false)}
            isMobile={true}
          />
        </div>)
      ) : (
        /* Desktop: collapsible sidebar */
        (<div
          id="sidebar"
          style={{
            width: desktopSidebarWidth,
            flexShrink: 0,
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
            isMobile={false}
          />
        </div>)
      )}
      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile top bar with hamburger */}
        {isMobile && (
          <div className={`mobile-topbar transition-all duration-300 ${scrolled ? 'shadow-xl border-border-main/50 bg-bg-secondary/95 backdrop-blur-md' : 'bg-bg-main'}`}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-toggle-inline"
              aria-label="Open Sidebar"
            >
              <Menu size={20} className="text-text-main" />
            </button>

            <div className="flex-1 flex justify-center items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f6e05e] to-[#d4a853] flex items-center justify-center shadow-lg">
                <span className="text-[#1a202c] font-black text-xs">$</span>
              </div>
              <h1 className="text-lg font-black text-text-main tracking-tighter uppercase">
                {brandName || 'AgendiApp'}
              </h1>
            </div>

            {/* Timer Widget para la barra superior móvil */}
            <FloatingTimerWidget variant="topbar" />
          </div>
        )}

        <div
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{
            padding: isMobile ? '0 16px 80px' : '1.5rem 2rem 2.5rem',
          }}
        >
          {isLoading ? <GlobalLoader /> : (
            <div key={location.pathname} className="animate-fadeInUp h-full">
              <Outlet />
            </div>
          )}
        </div>
      </main>
      {/* ── Bottom Navigation (mobile only) ─────────────────────────────── */}
      <BottomNavigationBar />
      {/* ── Timer Widget (floating - Desktop only) ─────────────────────── */}
      {!isMobile && <FloatingTimerWidget variant="floating" />}
    </div>
  );
};

export default Layout;
// ===== FIN: src/components/layout/Layout.jsx =====
