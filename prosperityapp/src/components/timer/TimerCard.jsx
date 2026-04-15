/**
 * TimerCard — Tarjeta individual de un timer activo o expirado
 */
import React, { useMemo } from 'react';
import { useTimers } from '../../context/TimerContext';

// Format seconds into MM:SS
function formatTime(seconds) {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Calculate progress percentage
function getProgress(timer) {
  if (!timer._remaining && timer._remaining !== 0) {
    const now = Date.now();
    const endsAt = new Date(timer.ends_at).getTime();
    const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
    return remaining / timer.duration_seconds;
  }
  return (timer._remaining || 0) / timer.duration_seconds;
}

const TimerCard = ({ timer }) => {
  const { cancelTimer, dismissTimer } = useTimers();
  const isExpired = timer.status === 'completed' || timer._remaining === 0;
  const remaining = timer._remaining ?? 0;
  const progress = getProgress(timer);

  const durationLabel = useMemo(() => {
    const mins = Math.floor(timer.duration_seconds / 60);
    return `${mins} min`;
  }, [timer.duration_seconds]);

  // Circle SVG props
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300
      ${isExpired
        ? 'bg-red-500/10 border-red-500/30 animate-pulse'
        : 'bg-bg-tertiary/50 border-border-main/50 hover:border-accent/30'
      }`}
    >
      {/* Circular Progress */}
      <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
        <svg width="64" height="64" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.15)'}
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={isExpired ? '#ef4444' : 'var(--color-accent, #f6e05e)'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isExpired ? 0 : strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isExpired ? (
            <span className="text-red-500 text-lg">⏰</span>
          ) : (
            <span className="text-text-main font-bold text-sm tabular-nums leading-none">
              {formatTime(remaining)}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${isExpired ? 'text-red-400' : 'text-text-main'}`}>
          {timer.client_name || 'Sin cliente'}
        </p>
        <p className="text-text-muted text-xs truncate mt-0.5">
          {timer.created_by_name} · {durationLabel}
        </p>
        {timer.notify_reception && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 mt-1">
            <span>📡</span> Recepción
          </span>
        )}
      </div>

      {/* Action button */}
      {isExpired ? (
        <button
          onClick={() => dismissTimer(timer.id)}
          className="flex-shrink-0 p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
          title="Descartar"
        >
          ✓ OK
        </button>
      ) : (
        <button
          onClick={() => cancelTimer(timer.id)}
          className="flex-shrink-0 p-2 rounded-lg bg-bg-tertiary text-text-muted hover:bg-red-500/20 hover:text-red-400 transition-all"
          title="Cancelar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TimerCard;
