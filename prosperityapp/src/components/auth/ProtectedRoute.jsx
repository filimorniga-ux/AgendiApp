import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { auth } from '../../firebase/config';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const ProtectedRoute = ({ children }) => {
  const { user, loadingAuth } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setError('Correo o contraseña incorrectos');
      } finally {
        setLoading(false);
      }
    };

    const handleGoogle = async () => {
      setError('');
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (err) {
        setError('Error al iniciar sesión con Google');
      }
    };

    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-bg-secondary border border-border-main rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-text-main mb-1">AgendiApp</h1>
          <p className="text-text-muted text-sm mb-6">Inicia sesión para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-golden py-2.5 font-semibold disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-main"></div>
            </div>
            <div className="relative flex justify-center text-xs text-text-muted">
              <span className="bg-bg-secondary px-2">o</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            className="w-full py-2.5 border border-border-main rounded-lg text-text-main text-sm hover:bg-bg-main transition-colors"
          >
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
