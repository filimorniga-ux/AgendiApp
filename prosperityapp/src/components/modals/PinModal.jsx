// ===== INICIO: src/components/modals/PinModal.jsx =====
import React, { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../../context/DataContext';

const PinModal = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { config } = useData();

  const storedPin = config?.find(c => c.id === 'settings')?.securityPin || '1234';

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => feather.replace(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === storedPin) {
      setError('');
      onSuccess();
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-secondary rounded-lg shadow-xl border border-main w-full max-w-sm modal-content">
        <div className="p-4 border-b border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Requiere Autorización</h3>
          <button onClick={onClose} className="text-text-main/70 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label htmlFor="pin-input" className="block mb-2 font-semibold">PIN de Administrador</label>
          <input
            id="pin-input"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-tertiary border border-border-main rounded p-2 text-center text-2xl tracking-widest"
            maxLength={4}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button type="submit" className="btn-golden w-full mt-6 py-2">
            Autorizar
          </button>
        </form>
      </div>
    </div>
  );
};
export default PinModal;
// ===== FIN: src/components/modals/PinModal.jsx =====