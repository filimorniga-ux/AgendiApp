/**
 * FloatingTimerWidget — Botón de acceso rápido a los timers
 *
 * Variantes:
 * - 'floating': Siempre visible en la esquina inferior derecha (para Desktop).
 * - 'topbar': Botón icono compacto para integrarse en la barra superior móvil.
 */
import React from 'react';
import { useTimers } from '../../context/TimerContext';
import TimerPanel from './TimerPanel';

const FloatingTimerWidget = ({ variant = 'floating' }) => {
  const { activeCount, expiredCount, hasAlarm, panelOpen, setPanelOpen } = useTimers();
  const totalBadge = activeCount + expiredCount;

  // Renderizado variante 'topbar' (Botón simple con icono adaptado a cabecera móvil)
  if (variant === 'topbar') {
    return (
      <>
        {panelOpen && <TimerPanel onClose={() => setPanelOpen(false)} isMobile />}
        
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300
            ${hasAlarm
              ? 'bg-red-500/10 text-red-500 animate-pulse border border-red-500/20'
              : 'bg-bg-secondary text-text-main border border-border-main hover:bg-bg-tertiary'
            }`}
          aria-label="Temporizadores"
        >
          {/* Timer Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={hasAlarm ? 'text-red-500' : 'text-text-main'}
          >
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M5 3L2 6" />
            <path d="M22 6l-3-3" />
            <line x1="12" y1="1" x2="12" y2="3" />
          </svg>

          {/* Badge */}
          {totalBadge > 0 && (
            <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 border-2 border-bg-main
              ${hasAlarm
                ? 'bg-red-600 text-white animate-bounce'
                : 'bg-accent text-accent-text'
              }`}
            >
              {hasAlarm ? '!' : totalBadge}
            </span>
          )}
        </button>
      </>
    );
  }

  // Renderizado variante 'floating' (FAB redondo tradicional)
  return (
    <>
      {panelOpen && <TimerPanel onClose={() => setPanelOpen(false)} />}

      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className={`fixed z-40 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95
          ${hasAlarm
            ? 'bg-red-500 animate-pulse shadow-red-500/40 hover:bg-red-600'
            : 'bg-accent hover:bg-accent/90 shadow-accent/30'
          }`}
        style={{
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
        }}
        title="Temporizadores"
      >
        {/* Timer Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={hasAlarm ? 'text-white' : 'text-accent-text'}
        >
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" />
          <path d="M5 3L2 6" />
          <path d="M22 6l-3-3" />
          <line x1="12" y1="1" x2="12" y2="3" />
        </svg>

        {/* Badge */}
        {totalBadge > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-xs font-bold px-1
            ${hasAlarm
              ? 'bg-white text-red-600 animate-bounce'
              : 'bg-red-500 text-white'
            }`}
          >
            {hasAlarm ? '⏰' : totalBadge}
          </span>
        )}
      </button>
    </>
  );
};

export default FloatingTimerWidget;
