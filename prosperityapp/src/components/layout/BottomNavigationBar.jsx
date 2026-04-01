import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  DollarSign,
  Users,
  Package,
  MoreHorizontal,
  X,
  Calendar,
  UserCheck,
  Tag,
  Gift,
  BarChart2,
  Settings,
  Truck,
} from 'lucide-react';
import './BottomNavigationBar.css';

// ── Primary tabs (always visible in Bottom Nav) ─────────────────────────────
const PRIMARY_TABS = [
  { to: '/app', icon: Calendar, label: 'Inicio', end: true },
  { to: '/app/caja', icon: DollarSign, label: 'Caja' },
  { to: '/app/clientes', icon: Users, label: 'Clientes' },
  { to: '/app/inventario', icon: Package, label: 'Inventario' },
  { to: '/app/mas', icon: MoreHorizontal, label: 'Más', isMas: true },
];

// ── "Más" menu items ─────────────────────────────────────────────────────────
const MAS_ITEMS = [
  { to: '/app/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/app/colaboradores', icon: UserCheck, label: 'Colaboradores' },
  { to: '/app/nomina', icon: DollarSign, label: 'Nómina' },
  { to: '/app/precios', icon: Tag, label: 'Catálogo y Precios' },
  { to: '/app/recepcion', icon: Truck, label: 'Recepción Pedidos' },
  { to: '/app/giftcards', icon: Gift, label: 'Gift Cards' },
  { to: '/app/cierres', icon: BarChart2, label: 'Cierres Mensuales' },
  { to: '/app/reportes', icon: BarChart2, label: 'Reportes' },
  { to: '/app/configuracion', icon: Settings, label: 'Configuración' },
];

const BottomNavigationBar = () => {
  const [masOpen, setMasOpen] = useState(false);
  const navigate = useNavigate();

  const handleMasClick = () => setMasOpen((v) => !v);
  const handleMasItemClick = (to) => {
    setMasOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* ── "Más" overlay drawer (slides up) ── */}
      {masOpen && (
        <div className="mas-overlay" onClick={() => setMasOpen(false)}>
          <div
            className="mas-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mas-drawer__handle" />
            <div className="mas-drawer__header">
              <span className="mas-drawer__title">Más módulos</span>
              <button
                className="mas-drawer__close"
                onClick={() => setMasOpen(false)}
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="mas-drawer__list">
              {MAS_ITEMS.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <button
                    className="mas-drawer__item"
                    onClick={() => handleMasItemClick(to)}
                  >
                    <span className="mas-drawer__item-icon">
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                    <span className="mas-drawer__item-label">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Bottom Navigation Bar ── */}
      <nav className="bottom-nav" aria-label="Navegación principal">
        <ul className="bottom-nav__items">
          {PRIMARY_TABS.map(({ to, icon: Icon, label, end, isMas }) => {
            if (isMas) {
              return (
                <li key="mas" className="bottom-nav__item-wrap">
                  <button
                    className={`bottom-nav__item ${masOpen ? 'active' : ''}`}
                    onClick={handleMasClick}
                    aria-label="Más módulos"
                    aria-expanded={masOpen}
                  >
                    <Icon className="bottom-nav__icon" size={22} strokeWidth={1.8} />
                    <span className="bottom-nav__label">{label}</span>
                  </button>
                </li>
              );
            }
            return (
              <li key={to} className="bottom-nav__item-wrap">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `bottom-nav__item${isActive ? ' active' : ''}`
                  }
                  onClick={() => setMasOpen(false)}
                >
                  <Icon className="bottom-nav__icon" size={22} strokeWidth={1.8} />
                  <span className="bottom-nav__label">{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default BottomNavigationBar;
