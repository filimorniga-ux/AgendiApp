// ===== INICIO: src/components/layout/Sidebar.jsx (collapsible + live logo + collaborator mode) =====
import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import feather from 'feather-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { useBusiness } from '../../context/BusinessContext';
import toast from 'react-hot-toast';

// Helper para renderizar iconos de feather de forma segura
const Icon = ({ name, size = 20, className = '' }) => {
  const icon = feather.icons[name];
  if (!icon) return null;
  return (
    <span
      className={className}
      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
      dangerouslySetInnerHTML={{ __html: icon.toSvg({ width: size, height: size }) }}
    />
  );
};




/**
 * Sidebar
 *
 * Props:
 *   collapsed          — bool   (desktop only) shows icon-only mode
 *   onToggleCollapse   — fn()   called when user clicks the collapse toggle
 *   isMobile           — bool
 *   onClose            — fn()   called when user closes on mobile
 */
// Módulos solo disponibles para staff
const STAFF_MODULES = ['/app', '/app/nomina', '/app/precios'];

const Sidebar = ({ collapsed = false, onToggleCollapse, isMobile = false, onClose }) => {
  const { toggleTheme, isDark } = useContext(ThemeContext);
  const { t, i18n } = useTranslation();
  const { userRole, config } = useData();
  const { realRole, signOutAll } = useBusiness();
  const navigate = useNavigate();

  // ── Logo y nombre del negocio (reactivo al config del contexto) ──────────
  const settings = config?.[0] || {};
  const brandName = settings.brandName || settings.businessName || 'AgendiApp';
  const logoUrl = settings.logoUrl || null;

  // ── Módulos del menú ─────────────────────────────────────────────────────
  const allModules = [
    { to: '/app',               icon: 'calendar',    tKey: 'sidebar.agenda' },
    { to: '/app/dashboard',     icon: 'home',        tKey: 'sidebar.dashboard' },
    { to: '/app/caja',          icon: 'dollar-sign', tKey: 'sidebar.dailyCash' },
    { to: '/app/pedidos',       icon: 'truck',       tKey: 'orders.title' },
    { to: '/app/clientes',      icon: 'users',       tKey: 'sidebar.clients' },
    { to: '/app/colaboradores', icon: 'briefcase',   tKey: 'sidebar.collaborators' },
    { to: '/app/nomina',        icon: 'clipboard',   tKey: 'sidebar.payroll' },
    { to: '/app/cierres',       icon: 'book-open',   tKey: 'sidebar.monthlyClosing' },
    { to: '/app/precios',       icon: 'tag',         tKey: 'sidebar.prices' },
    { to: '/app/inventario',    icon: 'archive',     tKey: 'sidebar.inventory' },
    { to: '/app/recepcion',              icon: 'package',       tKey: 'sidebar.reception' },
    { to: '/app/pedido-inteligente',     icon: 'shopping-cart', tKey: 'sidebar.smartOrder' },
    { to: '/app/inventario/historial',   icon: 'book',          tKey: 'sidebar.inventoryHistory' },
    { to: '/app/giftcards',     icon: 'credit-card', tKey: 'sidebar.giftcards' },
    { to: '/app/reportes',      icon: 'file-text',   tKey: 'reports.title' },
    { to: '/app/suscripcion',   icon: 'star',        tKey: 'sidebar.subscription' },
    { to: '/app/configuracion', icon: 'settings',    tKey: 'sidebar.settings' },
  ];

  const adminRoles = ['admin', 'owner'];
  const staffRoles = ['staff'];
  const restrictedPaths = ['/nomina', '/inventario', '/caja', '/colaboradores', '/cierres', '/precios', '/giftcards'];

  const modulesData = allModules.filter(module => {
    if (adminRoles.includes(realRole)) return true;
    if (staffRoles.includes(realRole)) return STAFF_MODULES.includes(module.to);
    
    // Fallback if role is empty/unknown but we want basic access
    return !restrictedPaths.some(path => module.to.includes(path));
  });

  const handleLanguageChange = (e) => i18n.changeLanguage(e.target.value);

  const handleLogout = async () => {
    try {
      await signOutAll();
      toast.success(t('common.logoutSuccess') || 'Sesión cerrada correctamente');
    } catch (error) {
      console.warn('Error al cerrar sesión:', error);
      // Still redirect even on error — user wants OUT
    }
    // ALWAYS redirect — no matter what
    window.location.href = '/';
  };

  // ── Ref para preservar scroll del nav ──────────────────────────────────────
  const navRef = useRef(null);
  const scrollPosRef = useRef(0);

  // Guardar posición de scroll antes de navegar
  const handleLinkClick = useCallback((e) => {
    // Guardar scroll position del nav
    if (navRef.current) scrollPosRef.current = navRef.current.scrollTop;
    // Close mobile drawer on navigation
    if (isMobile && onClose) onClose();
    // Prevent browser from auto-scrolling the sidebar by blurring after click
    requestAnimationFrame(() => {
      e.currentTarget?.blur();
      // Restaurar scroll position después del render
      if (navRef.current) navRef.current.scrollTop = scrollPosRef.current;
    });
  }, [isMobile, onClose]);

  // ── Link item (handles collapsed icon-only mode) ─────────────────────────
  const SidebarLink = ({ to, icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      preventScrollReset
      onClick={handleLinkClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `sidebar-link flex items-center gap-3 rounded-md transition-all duration-150 font-medium
         ${collapsed ? 'justify-center p-3' : 'p-3'}
         ${isActive
           ? 'bg-accent text-accent-text shadow-md'
           : 'text-text-muted hover:bg-bg-tertiary hover:text-text-main'
         }`
      }
    >
      <Icon name={icon} size={18} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  return (
    <aside
      className="bg-bg-secondary flex flex-col h-full border-r border-border-main sidebar-glow overflow-y-auto overflow-x-hidden"
      style={{ width: '100%' }}
    >
      {/* ── Header: logo + nombre + toggle ────────────────────────────────── */}
      <header
        className={`flex items-center border-b border-border-main/60 flex-shrink-0
          ${collapsed ? 'flex-col gap-2 p-3 pt-4' : 'gap-3 p-4'}`}
        style={{ minHeight: '72px' }}
      >
        {/* Logo / Avatar */}
        <div
          className={`flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center transition-all duration-500
            ${realRole === 'owner' 
              ? 'bg-gradient-to-br from-[#f6e05e] to-[#d4a853] border-2 border-white/40 shadow-[0_0_15px_rgba(246,224,94,0.4)]' 
              : 'bg-bg-tertiary border-2 border-accent/30'}`}
          style={{ width: 44, height: 44 }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${brandName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            /* Placeholder con inicial */
            <span className={`font-black text-xl select-none ${realRole === 'owner' ? 'text-[#1a202c]' : 'text-accent'}`}>
              {brandName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Nombre del negocio (oculto cuando colapsado) */}
        {!collapsed && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-[17px] font-black tracking-tight text-text-main leading-none truncate mb-1">
              {brandName}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md
                ${realRole === 'owner' 
                  ? 'bg-[#f6e05e]/20 text-[#f6e05e] border border-[#f6e05e]/30 shadow-[0_0_10px_rgba(246,224,94,0.1)]' 
                  : 'bg-accent/10 text-accent border border-accent/20'}`}>
                {realRole === 'owner' ? 'Owner Premium' : realRole || 'Suite'}
              </span>
            </div>
          </div>
        )}

        {/* Botón de colapsar — solo desktop */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className={`p-1.5 rounded-full hover:bg-bg-tertiary text-text-muted hover:text-text-main transition-colors flex-shrink-0
              ${collapsed ? 'mt-1' : ''}`}
          >
            <Icon name={collapsed ? 'chevrons-right' : 'chevrons-left'} size={16} />
          </button>
        )}

        {/* Botón cerrar — solo mobile */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-full hover:bg-bg-tertiary text-text-muted"
          >
            <Icon name="x" size={18} />
          </button>
        )}
      </header>

      {/* ── Navegación ──────────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        id="sidebar-nav"
        className={`flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden
          ${collapsed ? 'p-2' : 'p-3'}`}
      >
        {modulesData.map((link) => (
          <SidebarLink
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={t(link.tKey)}
            end={link.to === '/app'}
          />
        ))}
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className={`flex-shrink-0 border-t border-border-main/60
          ${collapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 space-y-2'}`}
      >
        {/* Idioma + tema (solo en modo expandido) */}
        {!collapsed && (
          <div className="flex justify-between items-center p-2 bg-bg-tertiary/50 rounded-md border border-border-main/50">
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="bg-transparent text-text-muted text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
              <option value="pt">🇧🇷 Português</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="it">🇮🇹 Italiano</option>
              <option value="de">🇩🇪 Deutsch</option>
            </select>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-bg-main transition-colors"
              title={t('sidebar.theme')}
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={16} />
            </button>
          </div>
        )}

        {/* Modo colapsado: solo botones de icono */}
        {collapsed && (
          <>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-bg-tertiary text-text-muted hover:text-text-main transition-colors"
              title={t('sidebar.theme')}
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={18} />
            </button>
          </>
        )}

        {/* Botón cerrar sesión */}
        {collapsed ? (
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-3 rounded-xl hover:bg-red-500 bg-red-500/10 text-red-500 hover:text-white transition-all duration-200 border border-red-500/20 shadow-lg shadow-red-500/5"
          >
            <Icon name="log-out" size={18} />
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-red-500/5 hover:shadow-red-500/20"
          >
            <Icon name="log-out" size={16} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="font-bold text-sm tracking-tight">{t('sidebar.logout') || 'Cerrar Sesión'}</span>
          </button>
        )}

        {!collapsed && (
          <div className="text-xs text-text-muted/40 text-center pt-1">
            <p>Versión 1.2.0</p>
            <p>© 2025 Gema Suite</p>
          </div>
        )}
      </footer>
    </aside>
  );
};

export default Sidebar;
// ===== FIN: src/components/layout/Sidebar.jsx =====