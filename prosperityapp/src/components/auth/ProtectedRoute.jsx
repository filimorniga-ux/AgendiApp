import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';

const ProtectedRoute = ({ children }) => {
  const { supabaseUser, loadingAuth } = useBusiness();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Logged in (Supabase)
  if (supabaseUser) return children;

  // ── Login handlers ────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: sbErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sbErr) throw sbErr;
    } catch (err) {
      console.error("Login exception:", err);
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch {
      setError('Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-bg-main overflow-hidden page-enter">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="absolute top-[10%] left-[10%] w-[50vw] max-w-[500px] aspect-square bg-accent opacity-[0.05] lg:opacity-[0.08] rounded-full blur-[120px] animate-pulseSoft"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[45vw] max-w-[450px] aspect-square bg-accent opacity-[0.04] lg:opacity-[0.06] rounded-full blur-[100px] animate-pulseSoft" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-sm glass-panel bg-bg-secondary border border-border-main rounded-3xl p-8 md:p-10 shadow-2xl modal-content">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-tertiary mb-4 shadow-sm border border-border-main rotate-3 hover:rotate-0 transition-transform duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">AgendiApp</h1>
          <p className="text-text-muted text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 ml-1">Correo electrónico</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              </span>
              <input
                type="email"
                placeholder="Ej. correo@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-input border border-border-input text-text-main placeholder-text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 ml-1">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg-input border border-border-input text-text-main placeholder-text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
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
          </div>

          {error && <p className="text-red-400 text-xs text-center animate-bounceIn">{error}</p>}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-golden btn-press py-3 font-semibold rounded-xl disabled:opacity-50 mt-2"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-main"></div>
          </div>
          <div className="relative flex justify-center text-xs text-text-muted">
            <span className="bg-bg-secondary px-3">o continúa con</span>
          </div>
        </div>
        
        <button
          onClick={handleGoogle}
          className="w-full py-2.5 flex items-center justify-center gap-3 border border-border-main rounded-xl text-text-main text-sm font-medium hover:bg-bg-tertiary transition-colors btn-press"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
