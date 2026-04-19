/**
 * PWAInstallBanner.jsx
 * 
 * Banner elegante que aparece cuando el navegador dispara el evento
 * 'beforeinstallprompt', invitando al usuario a instalar AgendiApp.
 * Se oculta automáticamente a las 48h o cuando el user acepta/rechaza.
 */
import { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible]               = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya rechazó el banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 1000 * 60 * 60 * 48) {
      return; // Silencio por 48h tras rechazo
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(90vw, 420px)',
      }}
      className="bg-bg-secondary border border-border-main rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-slide-up"
    >
      {/* Ícono */}
      <img
        src="/pwa-192x192.png"
        alt="AgendiApp icon"
        className="w-12 h-12 rounded-xl flex-shrink-0"
      />

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-text-main font-semibold text-sm leading-tight">
          Instalar AgendiApp
        </p>
        <p className="text-text-muted text-xs mt-0.5 leading-snug">
          Añade la app a tu dispositivo para acceso rápido y modo offline.
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="bg-accent text-accent-text text-xs font-bold px-3 py-1.5 rounded-lg hover:brightness-90 transition-all"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-text-muted text-xs px-3 py-1 rounded-lg hover:bg-bg-tertiary transition-all"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
