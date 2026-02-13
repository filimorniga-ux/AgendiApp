// ===== INICIO: src/components/modals/StockMovementModal.jsx (Sprint 95) =====
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const StockMovementModal = ({ isOpen, onClose, product, movementType, onSave }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReason('');
    }
  }, [isOpen, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error(t('modals.stockMovement.errorAmount'));
      return;
    }
    if (!reason.trim()) {
      toast.error(t('modals.stockMovement.errorReason'));
      return;
    }

    setIsSaving(true);
    try {
      const currentStock = product.stockUnits !== undefined ? product.stockUnits : product.stock;
      const changeAmount = parseFloat(amount);
      const newStock = movementType === 'ingreso' ? currentStock + changeAmount : currentStock - changeAmount;

      if (newStock < 0) {
        toast.error(t('modals.stockMovement.errorNegative'));
        setIsSaving(false);
        return;
      }

      await onSave(product, changeAmount, reason, newStock);
      toast.success(t('modals.stockMovement.success'));
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !product) return null;

  const isIngreso = movementType === 'ingreso';
  const title = isIngreso ? t('modals.stockMovement.titleEntry') : t('modals.stockMovement.titleExit');
  const colorClass = isIngreso ? 'text-green-500' : 'text-red-500';
  const placeholder = isIngreso ? t('modals.stockMovement.reasonPlaceholderEntry') : t('modals.stockMovement.reasonPlaceholderExit');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-md modal-content flex flex-col">

        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className={`text-xl font-bold ${colorClass}`}>{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-2">{t('modals.stockMovement.product')}</p>
            <p className="text-lg font-bold text-text-main">{product.name}</p>
            <p className="text-sm text-text-secondary">
                {t('modals.stockMovement.currentStock')} <span className="font-mono font-bold">{product.stockUnits !== undefined ? product.stockUnits : product.stock}</span>
                {product.unitOfMeasure ? ` ${product.unitOfMeasure}` : ' uds'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{isIngreso ? t('modals.stockMovement.amountEntry') : t('modals.stockMovement.amountExit')}</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main font-bold text-lg"
              placeholder="0"
              min="0"
              step="0.01"
              autoFocus
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('modals.stockMovement.reason')}</label>
            <input 
              type="text" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
              placeholder={placeholder}
              required 
            />
          </div>
        </form>

        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-end space-x-3">
          <button onClick={onClose} type="button" className="py-2 px-4 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">
            {t('common.cancel')}
          </button>
          <button 
            onClick={handleSubmit} 
            type="submit" 
            disabled={isSaving} 
            className={`py-2 px-6 rounded-md text-white font-bold ${isIngreso ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
          >
            {isSaving ? t('modals.stockMovement.saving') : t('modals.stockMovement.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockMovementModal;
// ===== FIN: src/components/modals/StockMovementModal.jsx =====