import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase/client';

/**
 * AuthCallbackPage
 * Handles email confirmation and password reset links from Supabase.
 * 
 * Supabase sends links like:
 *   /auth/callback?token_hash=xxx&type=signup     (email confirmation)
 *   /auth/callback?token_hash=xxx&type=recovery   (password reset)
 *   /auth/callback?token_hash=xxx&type=email       (email change)
 *
 * For PKCE flow, Supabase may also send ?code=xxx which exchangeCodeForSession handles.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const processingRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        // Parse errors from URL params or hash
        const urlError = searchParams.get('error') || new URLSearchParams(window.location.hash.substring(1)).get('error');
        const urlErrorDescription = searchParams.get('error_description') || new URLSearchParams(window.location.hash.substring(1)).get('error_description');

        if (urlError) {
          throw new Error(urlErrorDescription || 'El enlace de verificación es inválido o ha expirado.');
        }

        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const code = searchParams.get('code');

        // PKCE code exchange (used by some Supabase configurations)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // If recovery type, redirect to update password page
          if (type === 'recovery') {
            navigate('/auth/update-password', { replace: true });
            return;
          }

          setStatus('success');
          setTimeout(() => navigate('/app', { replace: true }), 2000);
          return;
        }

        // Token hash verification (magic link / email confirmation)
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          });
          if (error) throw error;

          // If recovery type, redirect to the password update page
          if (type === 'recovery') {
            navigate('/auth/update-password', { replace: true });
            return;
          }

          // Email confirmed — redirect to app
          setStatus('success');
          setTimeout(() => navigate('/app', { replace: true }), 2000);
          return;
        }

        // If there's a hash fragment with access_token (implicit flow)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          // Supabase client automatically processes the hash fragment
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (session) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const event = hashParams.get('type');
            if (event === 'recovery') {
              navigate('/auth/update-password', { replace: true });
              return;
            }
            setStatus('success');
            setTimeout(() => navigate('/app', { replace: true }), 2000);
            return;
          }
        }

        throw new Error('No se encontraron parámetros de autenticación válidos.');
      } catch (err) {
        console.error('Auth callback error:', err);
        setErrorMsg(err.message || 'Error al verificar tu cuenta.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#020617' }}>
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          borderRadius: 24,
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {status === 'processing' && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid rgba(246,224,94,0.2)',
                borderTopColor: '#f6e05e',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto 24px',
              }}
            />
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Verificando tu cuenta...
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Esto tomará solo un momento.
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              ¡Cuenta verificada!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Redirigiendo a la aplicación...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Error de verificación
            </h2>
            <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 24 }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/', { replace: true })}
              style={{
                background: '#f6e05e',
                color: '#0f172a',
                border: 'none',
                borderRadius: 12,
                padding: '12px 32px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
