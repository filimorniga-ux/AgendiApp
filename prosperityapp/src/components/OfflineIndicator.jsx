/**
 * OfflineIndicator.jsx
 *
 * Banner de estado de red en tiempo real.
 * Aparece en la parte de arriba cuando el dispositivo está offline,
 * y muestra una notificación breve al reconectar.
 *
 * Usa useOnlineStatus() para reaccionar reactivamente a los cambios de red.
 */
import { useState, useEffect, useRef } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getPendingCount } from '../lib/offlineQueue';

export default function OfflineIndicator() {
  const isOnline          = useOnlineStatus();
  const [pendingOps, setPendingOps] = useState(0);
  const [showReconnected, setShowReconnected] = useState(false);
  const prevOnlineRef     = useRef(isOnline);
  const reconnectTimer    = useRef(null);

  // Actualizar count de operaciones pendientes
  useEffect(() => {
    const update = async () => {
      const count = await getPendingCount();
      setPendingOps(count);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Detectar transición offline → online
  useEffect(() => {
    if (prevOnlineRef.current === false && isOnline === true) {
      setShowReconnected(true);
      reconnectTimer.current = setTimeout(() => setShowReconnected(false), 3500);
    }
    prevOnlineRef.current = isOnline;
    return () => clearTimeout(reconnectTimer.current);
  }, [isOnline]);

  // --- Render ---

  // Notificación de reconexión (aparece brevemente)
  if (showReconnected) {
    return (
      <div
        role="status"
        style={{
          position: 'fixed', top: '0.75rem', left: '50%',
          transform: 'translateX(-50%)', zIndex: 99999,
          animation: 'fadeSlideDown 0.3s ease',
        }}
        className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-xl"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        Conexión restaurada
        {pendingOps > 0 && (
          <span className="ml-1 opacity-80 font-normal">
            — sincronizando {pendingOps} cambio{pendingOps !== 1 ? 's' : ''}…
          </span>
        )}
      </div>
    );
  }

  // Banner de modo offline (persiste mientras no hay red)
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
        }}
        className="bg-amber-500 text-amber-950 text-xs font-bold text-center py-1.5 px-4 flex items-center justify-center gap-2 shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        Modo sin conexión — mostrando datos guardados localmente
        {pendingOps > 0 && (
          <span className="ml-2 bg-amber-900/30 rounded px-1.5 py-0.5">
            {pendingOps} cambio{pendingOps !== 1 ? 's' : ''} pendiente{pendingOps !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  return null;
}
