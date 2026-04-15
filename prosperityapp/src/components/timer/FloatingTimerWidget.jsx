/**
 * FloatingTimerWidget — Botón flotante de acceso rápido a los timers
 *
 * Siempre visible en la esquina inferior derecha.
 * Muestra badge con timers activos y pulsa en rojo cuando hay alarma.
 */
import React from 'react';
import { useTimers } from '../../context/TimerContext';
import TimerPanel from './TimerPanel';

const FloatingTimerWidget = () => {
  const { activeCount, expiredCount, hasAlarm, panelOpen, setPanelOpen } = useTimers();
  const totalBadge = activeCount + expiredCount;

  return (
    <>
      {/* Panel */}
      {panelOpen && <TimerPanel onClose={() => setPanelOpen(false)} />}

      {/* FAB Button */}
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
