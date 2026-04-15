/**
 * NewTimerModal — Modal para crear un nuevo temporizador
 */
import React, { useState } from 'react';
import { useTimers } from '../../context/TimerContext';
import { useTranslation } from 'react-i18next';

const PRESETS = [
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '25 min', seconds: 1500 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '60 min', seconds: 3600 },
];

const NewTimerModal = ({ isOpen, onClose }) => {
  const { addTimer } = useTimers();
  const { t } = useTranslation();
  const [clientName, setClientName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [notifyReception, setNotifyReception] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const durationSeconds = selectedPreset
    ? selectedPreset.seconds
    : customMinutes
      ? parseInt(customMinutes) * 60
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (durationSeconds <= 0) return;

    setLoading(true);
    await addTimer({
      clientName: clientName.trim() || null,
      durationSeconds,
      notifyReception,
    });
    setLoading(false);

    // Reset
    setClientName('');
    setSelectedPreset(null);
    setCustomMinutes('');
    setNotifyReception(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-bg-secondary rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border-main w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-main/60">
          <div>
            <h3 className="text-lg font-bold text-text-main">⏱️ Nuevo Timer</h3>
            <p className="text-text-muted text-xs mt-0.5">Asigna un temporizador para tu cliente</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-tertiary text-text-muted hover:text-text-main transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">
              Cliente (opcional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Nombre del cliente..."
              className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-main text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-2">
              Duración
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => { setSelectedPreset(preset); setCustomMinutes(''); }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                    ${selectedPreset?.seconds === preset.seconds
                      ? 'bg-accent text-accent-text shadow-md scale-105'
                      : 'bg-bg-tertiary text-text-muted border border-border-main/50 hover:border-accent/40 hover:text-text-main'
                    }`}
                >
                  {preset.label}
                </button>
              ))}
              {/* Custom input */}
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={e => { setCustomMinutes(e.target.value); setSelectedPreset(null); }}
                  placeholder="Otro"
                  className={`w-full py-2.5 px-2 rounded-xl text-sm font-bold text-center transition-all duration-200 appearance-none
                    ${customMinutes
                      ? 'bg-accent text-accent-text shadow-md border-accent'
                      : 'bg-bg-tertiary text-text-muted border border-border-main/50 hover:border-accent/40'
                    } focus:outline-none focus:ring-2 focus:ring-accent/50`}
                />
              </div>
            </div>
          </div>

          {/* Notify Reception Toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary/60 border border-border-main/50 cursor-pointer hover:border-accent/30 transition-all"
            onClick={() => setNotifyReception(!notifyReception)}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📡</span>
              <div>
                <p className="text-sm font-semibold text-text-main">Notificar a recepción</p>
                <p className="text-xs text-text-muted">La alarma sonará también en recepción</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5
              ${notifyReception ? 'bg-accent' : 'bg-bg-tertiary border border-border-main'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200
                ${notifyReception ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={durationSeconds <= 0 || loading}
            className="w-full py-3.5 rounded-xl font-bold text-accent-text bg-gradient-to-r from-accent to-accent/80 shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? 'Iniciando...' : `Iniciar Timer${durationSeconds > 0 ? ` — ${Math.floor(durationSeconds / 60)} min` : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTimerModal;
