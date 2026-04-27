// ===== INICIO: src/components/modals/ClosePeriodoModal.jsx (Sprint 91) =====
import React, { useRef,  useState, useEffect  } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { safeNum, safeSum } from '../../lib/mathUtils';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(safeNum(value));
};

const ClosePeriodoModal = ({ isOpen, onClose, onSave, summaryData, dateRangeString }) => {
  const { t } = useTranslation();
  const [closingName, setClosingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosingName(dateRangeString || `Cierre ${new Date().toLocaleDateString('es-CL')}`);
      setIsSaving(false);
    }
  }, [isOpen, dateRangeString]);

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!closingName) {
      toast.error(t('payroll.errors.nameRequired'));
      return;
    }
    setIsSaving(true);
    try {
      await onSave(closingName);
      // El toast de éxito ya se maneja en el componente padre
      onClose();
    } catch (error) {
      console.warn("Error al cerrar el período: ", error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };



  const modalRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Foco inicial
      setTimeout(() => {
        if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
           const focusableElements = modalRef.current.querySelectorAll(
             'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
           );
           if (focusableElements.length > 0) {
             focusableElements[0].focus();
           }
        }
      }, 100);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const totalGeneral = safeSum(summaryData.map(collab => collab.finalPayment));
  const totalCollabs = summaryData.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop" ref={modalRef} tabIndex="-1">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-lg modal-content flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{t('payroll.closePeriodBtn')}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          <div>
            <label htmlFor="closingName" className="block text-sm font-medium text-text-muted">{t('payroll.modal.closingName')}</label>
            <input 
              type="text" 
              name="closingName" 
              id="closingName" 
              value={closingName}
              onChange={(e) => setClosingName(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" 
              required 
            />
          </div>
          <div className="bg-bg-main/50 p-4 rounded-lg border border-border-main">
            <h4 className="font-semibold text-text-main mb-2">{t('modals.summaryTitle')}</h4>
            <div className="flex justify-between">
              <span className="text-text-muted">{t('collaborators.title')}:</span>
              <span className="font-semibold text-text-main">{totalCollabs}</span>
            </div>
            <div className="flex justify-between text-lg mt-2">
              <span className="font-bold text-text-main">{t('payroll.modal.totalToPay')}:</span>
              <span className="font-bold text-accent">{formatCurrency(totalGeneral)}</span>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            {t('payroll.modal.warning')}
          </p>
        </div>
        
        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-end flex-shrink-0">
          <button onClick={onClose} type="button" className="py-2 px-6 mr-4 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} type="submit" disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">
            {isSaving ? t('modals.buttons.saving') : t('payroll.modal.confirmBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClosePeriodoModal;
// ===== FIN: src/components/modals/ClosePeriodoModal.jsx =====