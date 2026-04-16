import React, { useState } from 'react';
import { useGoogleSheets } from '../../hooks/useGoogleSheets';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const IntegrationsTab = () => {
  const { t } = useTranslation();
  const {
    isConnected,
    spreadsheetUrl,
    sharedEmail,
    lastSyncedAt,
    syncStatus,
    loading,
    actionLoading,
    error,
    connectSheets,
    syncNow,
    disconnect,
  } = useGoogleSheets();

  const [email, setEmail] = useState('');
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Ingresa un correo Gmail válido');
      return;
    }
    try {
      await connectSheets(email);
      toast.success('¡Google Sheets conectado exitosamente!');
    } catch (err) {
      if (err.message === 'already_connected') {
        toast.error('Ya tienes un Google Sheet conectado');
      } else {
        toast.error(`Error al conectar: ${err.message}`);
      }
    }
  };

  const handleSync = async () => {
    try {
      await syncNow();
      toast.success('¡Datos sincronizados correctamente!');
    } catch {
      toast.error('Error al sincronizar');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowDisconnectConfirm(false);
      toast.success('Google Sheets desconectado');
    } catch {
      toast.error('Error al desconectar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Sheets Card */}
      <div className="bg-bg-main border border-border-main rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border-main flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#34A853" strokeWidth="1.5" />
              <line x1="3" y1="9" x2="21" y2="9" stroke="#34A853" strokeWidth="1.5" />
              <line x1="3" y1="15" x2="21" y2="15" stroke="#34A853" strokeWidth="1.5" />
              <line x1="9" y1="3" x2="9" y2="21" stroke="#34A853" strokeWidth="1.5" />
              <line x1="15" y1="3" x2="15" y2="21" stroke="#34A853" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              Google Sheets
              {isConnected && (
                <span className="text-xs font-medium bg-green-500/15 text-green-500 px-2 py-0.5 rounded-full">
                  Conectado ✓
                </span>
              )}
            </h3>
            <p className="text-text-muted text-sm mt-0.5">
              Sincroniza todos los datos de tu negocio con un libro de Google Sheets en tiempo real.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {!isConnected ? (
            /* ─── Not Connected State ─── */
            <div>
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-5">
                <p className="text-sm text-text-main font-medium mb-2">📊 ¿Qué obtienes?</p>
                <ul className="text-xs text-text-muted space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Libro con 7 pestañas: Agenda, Caja Diaria, Inventarios, Clientes, Nóminas, Cierres
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Formato corporativo profesional con colores y fórmulas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Sincronización manual con un click
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Ábrelo con tu cuenta personal de Gmail
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Compártelo con tu contador o socios
                  </li>
                </ul>
              </div>

              <form onSubmit={handleConnect} className="space-y-3">
                <label className="block text-sm font-medium text-text-main">
                  Correo Gmail del dueño
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@gmail.com"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-bg-secondary border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                />
                <p className="text-xs text-text-muted">
                  El libro de Google Sheets se compartirá con este correo. Podrás abrirlo desde Google Drive.
                </p>

                {error && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    ❌ {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full btn-golden py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Creando libro y sincronizando datos...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      Conectar Google Sheets
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* ─── Connected State ─── */
            <div className="space-y-4">
              {/* Status Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-bg-secondary rounded-xl p-3.5 border border-border-main">
                  <p className="text-xs text-text-muted mb-1">Correo vinculado</p>
                  <p className="text-sm font-medium text-text-main truncate">{sharedEmail}</p>
                </div>
                <div className="bg-bg-secondary rounded-xl p-3.5 border border-border-main">
                  <p className="text-xs text-text-muted mb-1">Última sincronización</p>
                  <p className="text-sm font-medium text-text-main">
                    {lastSyncedAt
                      ? new Date(lastSyncedAt).toLocaleString('es-CL', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : 'Nunca'}
                  </p>
                </div>
              </div>

              {/* Open Sheet Button */}
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Abrir en Google Sheets
              </a>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSync}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-accent" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                      </svg>
                      Sincronizar ahora
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={actionLoading}
                  className="py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 font-medium text-sm transition-all disabled:opacity-50"
                >
                  Desconectar
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  ❌ {error}
                </p>
              )}

              {/* Disconnect Confirmation Modal */}
              {showDisconnectConfirm && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm text-text-main font-medium mb-1">¿Desconectar Google Sheets?</p>
                  <p className="text-xs text-text-muted mb-3">
                    Se dejará de sincronizar datos. El libro de Google Sheets no se eliminará.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDisconnect}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Desconectando...' : 'Sí, desconectar'}
                    </button>
                    <button
                      onClick={() => setShowDisconnectConfirm(false)}
                      className="px-4 py-2 rounded-lg border border-border-main text-text-main text-sm hover:bg-bg-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-bg-main border border-border-main rounded-2xl p-5">
        <h4 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          ¿Cómo funciona?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-bg-secondary rounded-xl p-3 border border-border-main text-center">
            <div className="text-2xl mb-1">1️⃣</div>
            <p className="text-xs text-text-muted">Ingresa tu Gmail y conecta</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-3 border border-border-main text-center">
            <div className="text-2xl mb-1">2️⃣</div>
            <p className="text-xs text-text-muted">Se crea un libro con todas las pestañas</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-3 border border-border-main text-center">
            <div className="text-2xl mb-1">3️⃣</div>
            <p className="text-xs text-text-muted">Ábrelo desde tu Google Drive</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsTab;
