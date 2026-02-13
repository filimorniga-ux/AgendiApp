// ===== INICIO: src/components/layout/Sidebar.jsx (Sprint 108 - Safe Icons) =====
import React, { useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import feather from 'feather-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

// Helper para renderizar iconos de forma segura en React
const Icon = ({ name, className }) => {
  const icon = feather.icons[name];
  if (!icon) return null;

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: icon.toSvg({ class: className }) }}
    />
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { toggleTheme, theme } = useContext(ThemeContext);
  const { t, i18n } = useTranslation();
  const { userRole, config, user } = useData();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';

  // Extraer logo y nombre de la configuración global
  const settings = config?.find(c => c.id === 'settings') || {};
  const brandLogo = settings.logoUrl || "https://placehold.co/40x40/2d3748/f6e05e?text=G";
  const brandName = settings.brandName || "AgendiApp";

  const allModules = [
    { to: "/app", icon: "calendar", tKey: "sidebar.agenda" },
    { to: "/app/dashboard", icon: "home", tKey: "sidebar.dashboard" },
    { to: "/app/caja", icon: "dollar-sign", tKey: "sidebar.dailyCash" },
    { to: "/app/pedidos", icon: "truck", tKey: "orders.title" },
    { to: "/app/clientes", icon: "users", tKey: "sidebar.clients" },
    { to: "/app/colaboradores", icon: "briefcase", tKey: "sidebar.collaborators" },
    { to: "/app/nomina", icon: "clipboard", tKey: "sidebar.payroll" },
    { to: "/app/cierres", icon: "book-open", tKey: "sidebar.monthlyClosing" },
    { to: "/app/precios", icon: "tag", tKey: "sidebar.prices" },
    { to: "/app/inventario", icon: "archive", tKey: "sidebar.inventory" },
    { to: "/app/giftcards", icon: "credit-card", tKey: "sidebar.giftcards" },
    { to: "/app/reportes", icon: "file-text", tKey: "reports.title" },
  ];

  // Roles que tienen acceso completo
  const adminRoles = ['admin', 'owner'];

  // Rutas restringidas para no-admins
  const restrictedPaths = ['/nomina', '/inventario', '/caja', '/colaboradores', '/cierres', '/precios', '/giftcards'];

  const modulesData = allModules.filter(module => {
    if (adminRoles.includes(userRole)) return true;
    return !restrictedPaths.includes(module.to);
  });

  // Eliminamos useEffect con feather.replace() porque ya no es necesario

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <aside className="w-64 bg-bg-secondary p-4 flex flex-col justify-between h-full overflow-y-auto border-r border-border-main">
      <div>
        <header className="mb-8 flex items-center gap-3">
          <img
            id="brand-logo"
            src={brandLogo}
            className="w-10 h-10 rounded-full object-cover"
            alt={`Logo ${brandName}`}
          />
          <div>
            <h1 id="brand-name" className="text-2xl font-bold text-text-main">{brandName}</h1>
            <p className="text-accent text-sm">Suite</p>
          </div>
        </header>

        <nav id="sidebar-nav" className="flex flex-col space-y-2">
          {modulesData.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/app"}
              className={({ isActive }) =>
                `sidebar-link flex items-center space-x-3 p-3 rounded-md transition-colors ${isActive
                  ? 'bg-accent text-accent-text shadow-md'
                  : 'text-text-muted hover:bg-bg-tertiary'
                }`
              }
            >
              <Icon name={link.icon} className="w-5 h-5" />
              <span className="font-medium">{t(link.tKey)}</span>
            </NavLink>
          ))}

          <NavLink
            to="/app/configuracion"
            className={({ isActive }) =>
              `sidebar-link flex items-center space-x-3 p-3 rounded-md transition-colors ${isActive
                ? 'bg-accent text-accent-text shadow-md'
                : 'text-text-muted hover:bg-bg-tertiary'
              }`
            }
          >
            <Icon name="settings" className="w-5 h-5" />
            <span>{t('sidebar.settings')}</span>
          </NavLink>
        </nav>
      </div>

      <footer className="mt-8">
        <div className="flex justify-between items-center mb-4 p-2 bg-bg-tertiary/50 rounded-md border border-border-main/50">
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
            <Icon name={isDarkMode ? 'sun' : 'moon'} className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <button
          onClick={async () => {
            try {
              await signOut(auth);
              toast.success(t('common.logoutSuccess') || 'Sesión cerrada correctamente');
              window.location.href = '/'; // Redirigir a la raíz
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              toast.error(t('common.error') || 'Error al cerrar sesión');
            }
          }}
          className="w-full p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <Icon name="log-out" className="w-4 h-4" />
          <span className="font-semibold">{t('sidebar.logout') || 'Cerrar Sesión'}</span>
        </button>

        <div className="text-xs text-text-muted/40 text-center mt-4">
          <p>Versión 1.2.0</p>
          <p>© 2025 Gema Suite</p>
        </div>
      </footer>
    </aside>
  );
};

export default Sidebar;
// ===== FIN: src/components/layout/Sidebar.jsx =====