import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';

/**
 * ResetPasswordPage
 * Allows users to set a new password after clicking the recovery link.
 * The user arrives here already authenticated via the recovery token.
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [sessionChecked, setSessionChecked] = useState(false);

  // Verify user is authenticated (came from recovery link)
  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        // No session means the user didn't come from a valid recovery link
        navigate('/', { replace: true });
      } else {
        setSessionChecked(true);
      }
    };
    checkSession();
    return () => { mounted = false; };
  }, [navigate]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/\d/.test(pwd)) return 'La contraseña debe incluir al menos un número.';
    return '';
  };

  // Only render once session is verified to avoid flash of content
  if (!sessionChecked) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => navigate('/app', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
  };

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
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              ¡Contraseña actualizada!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Redirigiendo a la aplicación...
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
              <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                Nueva Contraseña
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                Establece una contraseña segura para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(246,224,94,0.5)';
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength hints */}
              {newPassword.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <span style={{ color: newPassword.length >= 8 ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                    {newPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                  </span>
                  <span style={{ color: /\d/.test(newPassword) ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                    {/\d/.test(newPassword) ? '✓' : '○'} Al menos un número
                  </span>
                </div>
              )}

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(246,224,94,0.5)';
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
              />

              {error && (
                <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#f6e05e',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(246,224,94,0.39)',
                }}
              >
                {loading ? 'Actualizando...' : 'Establecer contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
