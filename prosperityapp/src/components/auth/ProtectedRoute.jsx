import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';

// ── Bypass de autenticación para desarrollo ───────────────────────────────────
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

const ProtectedRoute = ({ children }) => {
  if (DEV_BYPASS) return children;

  const { user, supabaseUser, loadingAuth, noBusinessFound, signOutAll } = useBusiness();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // ── Authenticated but no business/role found → block access ──
  if ((user || supabaseUser) && noBusinessFound) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-bg-secondary border border-border-main rounded-2xl p-8 shadow-2xl text-center">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h1 className="text-xl font-bold text-text-main mb-2">Acceso no autorizado</h1>
          <p className="text-text-muted text-sm mb-4">
            Tu cuenta <strong className="text-text-main">{supabaseUser?.email}</strong> no está
            asociada a ningún comercio registrado en AgendiApp.
          </p>
          <p className="text-text-muted text-xs mb-6">
            Si eres dueño de un comercio, necesitas suscribirte primero.
            Si eres colaborador, pide a tu administrador que te registre.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={async () => {
                await signOutAll();
                window.location.href = '/';
              }}
              className="btn-golden px-6 py-2.5 font-semibold"
            >
              Cerrar sesión
            </button>
            <a
              href="/"
              className="px-6 py-2.5 border border-border-main rounded-lg text-text-main text-sm hover:bg-bg-main transition-colors inline-flex items-center"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Logged in via Supabase Auth
  if (user || supabaseUser) return children;

  // ── Login handler (unified: owner + collaborator via Supabase Auth) ────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: sbErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sbErr) {
        if (sbErr.message?.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos. Verifica tus datos.');
        } else {
          setError(sbErr.message || 'Error al iniciar sesión');
        }
      }
      // BusinessContext.onAuthStateChange will handle role detection automatically
    } catch (err) {
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app',
        },
      });
      if (oauthErr) setError('Error al iniciar sesión con Google');
    } catch {
      setError('Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-bg-secondary border border-border-main rounded-2xl p-8 shadow-2xl">
        {/* Logo / Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-main">AgendiApp</h1>
          <p className="text-text-muted text-sm mt-1">Inicia sesión para continuar</p>
          <p className="text-text-muted text-xs mt-2 opacity-60">
            Administradores, colaboradores y clientes usan el mismo acceso
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-4 py-2.5 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
          />
          {/* Password with show/hide toggle */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 pr-10 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a10.05 10.05 0 011.875.175M15 12a3 3 0 11-6 0 3 3 0 016 0zm5.54-5.46l-14 14" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-golden py-2.5 font-semibold disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Google OAuth via Supabase */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-main"></div>
          </div>
          <div className="relative flex justify-center text-xs text-text-muted">
            <span className="bg-bg-secondary px-2">o</span>
          </div>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2.5 border border-border-main rounded-lg text-text-main text-sm hover:bg-bg-main transition-colors"
        >
          Continuar con Google
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
