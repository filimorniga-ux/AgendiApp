/**
 * TimerPanel — Panel deslizable con lista de timers activos y expirados
 */
import React, { useState } from 'react';
import { useTimers } from '../../context/TimerContext';
import TimerCard from './TimerCard';
import NewTimerModal from './NewTimerModal';

const TimerPanel = ({ onClose, isMobile }) => {
  const { activeTimers, expiredTimers, dismissAll, activeCount, expiredCount } = useTimers();
  const [showNewModal, setShowNewModal] = useState(false);
  const allTimers = [...expiredTimers, ...activeTimers];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={`fixed z-40 bg-bg-secondary border border-border-main shadow-2xl overflow-hidden animate-in duration-300 flex flex-col
          ${isMobile ? 'rounded-b-2xl slide-in-from-top-4 sm:rounded-2xl' : 'rounded-t-2xl sm:rounded-2xl slide-in-from-bottom-4'}`}
        style={{
          ...(isMobile ? {
            top: '60px',
            left: '16px',
            right: '16px',
            width: 'calc(100vw - 32px)',
          } : {
            bottom: '88px',
            right: '16px',
            width: 'min(380px, calc(100vw - 32px))',
          }),
          maxHeight: 'min(500px, 70vh)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-main/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <h3 className="text-base font-bold text-text-main">Timers</h3>
            {activeCount > 0 && (
              <span className="bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                {activeCount} activos
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {expiredCount > 0 && (
              <button
                onClick={dismissAll}
                className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
              >
                Limpiar ✓
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-bg-tertiary text-text-muted hover:text-text-main transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timer List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {allTimers.length === 0 ? (
            <div className="text-center py-8 px-4">
              <span className="text-4xl block mb-3">⏱️</span>
              <p className="text-text-muted text-sm font-medium">No hay timers activos</p>
              <p className="text-text-muted/60 text-xs mt-1">
                Crea uno para controlar el tiempo de tus servicios
              </p>
            </div>
          ) : (
            allTimers.map(timer => <TimerCard key={timer.id} timer={timer} />)
          )}
        </div>

        {/* Footer — Add button */}
        <div className="flex-shrink-0 p-3 border-t border-border-main/60">
          <button
            onClick={() => setShowNewModal(true)}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-accent to-accent/80 text-accent-text shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Timer
          </button>
        </div>
      </div>

      {/* New Timer Modal */}
      <NewTimerModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} />
    </>
  );
};

export default TimerPanel;
