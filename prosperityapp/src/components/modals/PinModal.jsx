/**
 * PinModal.jsx — Modal unificado de autorización con PIN.
 *
 * Uso:
 *   <PinModal
 *     isOpen={show}
 *     operation="cash_close"          // clave de SENSITIVE_OPERATIONS
 *     onClose={() => setShow(false)}
 *     onSuccess={({ notes }) => { … }}
 *   />
 *
 * El modal:
 *  1. Muestra qué operación se quiere autorizar.
 *  2. Valida el PIN contra el hash bcrypt vía Edge Function manage-pin.
 *  3. Si la operación requiere nota obligatoria → muestra campo de texto.
 *  4. Bloquea tras 3 intentos fallidos (30 s).
 *  5. Devuelve { notes } al callback onSuccess.
 */
import React, { useState, useEffect, useRef } from 'react';
import { getOperationDef } from '../../lib/permissions';
import { supabase } from '../../supabase/client';

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 30_000;

const PinModal = ({ isOpen, onClose, onSuccess, operation = null }) => {
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Definición de la operación (si aplica)
  const opDef = operation ? getOperationDef(operation) : null;
  const requireNote = opDef?.requireNote ?? false;
  const operationLabel = opDef?.label ?? 'Operación Protegida';

  // Reset al abrir
  useEffect(() => {
    let timerId;
    if (isOpen) {
      setPin('');
      setNotes('');
      setError('');
      setIsVerifying(false);
      // No resetear attempts ni blockedUntil (persisten hasta expirar)
      timerId = setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => clearTimeout(timerId);
  }, [isOpen]);

  // Desbloqueo automático
  useEffect(() => {
    if (!blockedUntil) return;
    if (Date.now() >= blockedUntil) {
      setBlockedUntil(null);
      setAttempts(0);
      setError('');
      return;
    }
    const timer = setTimeout(() => {
      setBlockedUntil(null);
      setAttempts(0);
      setError('');
    }, blockedUntil - Date.now());
    return () => clearTimeout(timer);
  }, [blockedUntil]);

  const isBlocked = !!blockedUntil;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked || isVerifying) return;

    // Validar nota obligatoria primero (no gastar llamada al servidor)
    if (requireNote && !notes.trim()) {
      setError('Debes ingresar una nota justificando esta operación.');
      return;
    }

    // Verificar PIN vía Edge Function (bcrypt en servidor)
    setIsVerifying(true);
    try {
      console.log('PinModal calling invoke with pin:', pin);
      const { data, error: fnError } = await supabase.functions.invoke('manage-pin', {
        body: { action: 'verify', pin },
      });
      console.log('PinModal invoke returned:', { data, fnError });

      if (fnError) throw fnError;

      if (!data?.valid) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setBlockedUntil(Date.now() + BLOCK_DURATION_MS);
          setError('Demasiados intentos fallidos. Espera 30 segundos.');
        } else {
          setError(`PIN incorrecto. Intento ${newAttempts}/${MAX_ATTEMPTS}.`);
        }
        setPin('');
        return;
      }

      if (!isMounted.current) return;

      // Éxito
      setError('');
      setAttempts(0);
      onSuccess({ notes: notes.trim() || null });
    } catch (err) {
      if (!isMounted.current) return;
      console.warn('Error al verificar PIN:', err);
      setError(err?.message?.includes('Config not found') ? 'Configuración no encontrada.' : 'Error de conexión. Intenta de nuevo.');
    } finally {
      if (isMounted.current) {
        setIsVerifying(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md modal-backdrop">
      <div className="bg-bg-secondary rounded-xl shadow-2xl border border-border-main w-full max-w-sm mx-4 modal-content overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-border-main bg-accent/5 flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-accent/15 text-accent flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-text-main">Autorización Requerida</h3>
            <p className="text-sm text-accent font-semibold mt-0.5">{operationLabel}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-2xl leading-none p-1">×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* PIN Input */}
          <div>
            <label htmlFor="pin-auth-input" className="block text-sm font-semibold text-text-main mb-2">
              PIN de Seguridad
            </label>
            <input
              ref={inputRef}
              id="pin-auth-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-3 text-center text-2xl tracking-[0.4em] text-text-main focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-40"
              maxLength={6}
              autoComplete="off"
              disabled={isBlocked}
              placeholder="• • • •"
            />
          </div>

          {/* Nota obligatoria */}
          {requireNote && (
            <div>
              <label htmlFor="pin-auth-note" className="block text-sm font-semibold text-text-main mb-2">
                Justificación <span className="text-red-400">*</span>
              </label>
              <textarea
                id="pin-auth-note"
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setError(''); }}
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-3 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                rows={2}
                placeholder="Describe el motivo de esta operación..."
                required
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-tertiary font-semibold transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isBlocked || isVerifying || !pin}
              className="flex-1 btn-golden py-2.5 font-bold disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {isBlocked ? 'Bloqueado…' : isVerifying ? 'Verificando…' : 'Autorizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;