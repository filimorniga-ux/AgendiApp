// ===== INICIO: src/components/modals/SalesCommissionModal.jsx (Tema Corregido) =====
import React, { useRef,  useState, useEffect, useMemo  } from 'react';
import { useTranslation } from 'react-i18next'; // <-- Importar hook
import { useCollaborators } from '../../context/collections/CollaboratorsContext';

const formatCurrency = (value) => { /* ... */ };

const SalesCommissionModal = ({ isOpen, onClose, item, onSave }) => {
  const { t } = useTranslation(); // <-- Hook
  const {
    collaborators
  } = useCollaborators();
  const [commissionType, setCommissionType] = useState('auto');
  const [manualAmount, setManualAmount] = useState(0);

  const collaborator = useMemo(() => {
    if (!item?.collaboratorId || !collaborators) return null;
    return collaborators.find(c => c.id === item.collaboratorId);
  }, [item, collaborators]);

  const autoAmount = useMemo(() => {
    if (!item || !collaborator) return 0;
    const rate = (collaborator.salesCommissionPercent || 10) / 100;
    return item.amount * rate;
  }, [item, collaborator]);

  useEffect(() => {
    if (isOpen) {
      if (item?.commissionType === 'manual') {
        setCommissionType('manual');
        setManualAmount(item.commissionAmount || 0);
      } else {
        setCommissionType('auto');
        setManualAmount(autoAmount);
      }
    }
  }, [isOpen, item, autoAmount]);

  const handleSave = () => {
    if (commissionType === 'auto') {
      onSave(item.cartId, 'auto', autoAmount);
    } else {
      onSave(item.cartId, 'manual', parseFloat(manualAmount) || 0);
    }
    onClose();
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


  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop" ref={modalRef} tabIndex="-1">
      <div className="bg-bg-secondary rounded-lg shadow-xl border-2 border-accent w-full max-w-md modal-content flex flex-col">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-text-main">{t('modals.titles.commission')}</h3>
            <p className="text-sm text-text-muted">{item.description}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-muted">
            {t('modals.forms.soldBy')}: <span className="font-semibold text-text-main">{item.collaboratorName || 'N/A'}</span>
          </p>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary">{t('modals.forms.commissionType')}</label>
            <select 
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main"
            >
              <option value="auto">{t('modals.forms.commAuto')} ({collaborator?.salesCommissionPercent || 10}%)</option>
              <option value="manual">{t('modals.forms.commManual')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary">{t('modals.forms.commissionAmount')}</label>
            <input 
              type="number"
              value={commissionType === 'auto' ? autoAmount : manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              disabled={commissionType === 'auto' || isSaving}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main disabled:opacity-50"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-border-main flex justify-end items-center bg-bg-secondary rounded-b-lg">
          <button onClick={onClose} type="button" className="py-2 px-6 mr-4 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">
            {t('modals.buttons.cancel')}
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-golden py-2 px-4 disabled:opacity-50">
            {isSaving ? t('modals.buttons.saving') : t('modals.buttons.saveCost')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesCommissionModal;
// ===== FIN: src/components/modals/SalesCommissionModal.jsx (Tema Corregido) =====