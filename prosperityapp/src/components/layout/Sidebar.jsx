// ===== INICIO: src/components/layout/Sidebar.jsx (collapsible + live logo + collaborator mode) =====
import React, { useContext, useState, useEffect } from 'react';
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

// ── Reloj en tiempo real ────────────────────────────────────────────────────
const LiveClock = ({ collapsed }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const timeShort = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-bg-tertiary/60 border border-border-main/40 w-full">
        <span className="text-accent font-bold text-xs tabular-nums leading-none">{timeShort}</span>
      </div>
    );
  }

  return (
    <div className="px-2 py-2.5 rounded-lg bg-bg-tertiary/60 border border-border-main/40 text-center">
      <p className="text-text-main font-bold text-xl tabular-nums tracking-tight leading-none">{timeStr}</p>
      <p className="text-text-muted text-xs mt-0.5 capitalize">{dateStr}</p>
    </div>
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
      window.location.href = '/';
    } catch (error) {
      console.warn('Error al cerrar sesión:', error);
      toast.error(t('common.error') || 'Error al cerrar sesión');
    }
  };

  // ── Link item (handles collapsed icon-only mode) ─────────────────────────
  const SidebarLink = ({ to, icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      onClick={isMobile && onClose ? onClose : undefined}
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
          className="flex-shrink-0 rounded-full overflow-hidden bg-bg-tertiary flex items-center justify-center border-2 border-accent/30"
          style={{ width: 40, height: 40 }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${brandName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            /* Placeholder con inicial */
            <span className="text-accent font-bold text-lg select-none">
              {brandName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Nombre del negocio (oculto cuando colapsado) */}
        {!collapsed && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-base font-bold text-text-main leading-tight truncate">
              {brandName}
            </h1>
            <p className="text-accent text-xs truncate">Suite</p>
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
        {/* Reloj siempre visible */}
        <LiveClock collapsed={collapsed} />
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
            className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
          >
            <Icon name="log-out" size={18} />
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full p-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="log-out" size={16} />
            <span className="font-semibold text-sm">{t('sidebar.logout') || 'Cerrar Sesión'}</span>
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