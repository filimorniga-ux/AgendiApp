// ===== INICIO: src/components/modals/RetailProductModal.jsx (Sprint 95) =====
import React, { useRef,  useState, useEffect  } from 'react';
import { sbCreate, sbUpdate } from '../../supabase/db';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import CurrencyInput from '../ui/CurrencyInput';
import { useBusiness } from '../../context/BusinessContext';

const RetailProductModal = ({ isOpen, onClose, productToEdit }) => {
  const { t } = useTranslation();
  const {
    businessId
  } = useBusiness();
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!productToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData(productToEdit);
      } else {
        setFormData({
          name: '', brand: '', category: '',
          cost: '', price: '', stock: 0, minStock: 3
        });
      }
    }
  }, [isOpen, productToEdit, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = {
        name:       formData.name,
        brand:      formData.brand || null,
        category:   formData.category || null,
        costPrice:  parseFloat(formData.cost) || 0,
        salePrice:  parseFloat(formData.price) || 0,
        stockCurrent: parseFloat(formData.stock) || 0,
        stockMin:   parseFloat(formData.minStock) || 3,
      };
      if (isEditMode) {
        const { error } = await sbUpdate('retailInventory', productToEdit.id, dataToSave);
        if (error) throw error;
      } else {
        const { error } = await sbCreate('retailInventory', dataToSave, businessId);
        if (error) throw error;
      }
      toast.success(t('common.success'));
      onClose();
    } catch (error) {
      console.warn('Error:', error);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-70 modal-backdrop" ref={modalRef} tabIndex="-1">
      <div className="bg-bg-secondary rounded-t-[20px] sm:rounded-lg shadow-xl border border-border-main w-full sm:max-w-md modal-content flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{isEditMode ? t('modals.retailProduct.editTitle') : t('modals.retailProduct.newTitle')}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-grow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="retail-name" className="block text-sm font-medium text-text-muted">{t('modals.retailProduct.name')}</label>
              <input id="retail-name" type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" required />
            </div>
            <div>
              <label htmlFor="retail-brand" className="block text-sm font-medium text-text-muted">{t('modals.retailProduct.brand')}</label>
              <input id="retail-brand" type="text" name="brand" value={formData.brand || ''} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
            </div>
          </div>

          <div>
            <label htmlFor="retail-category" className="block text-sm font-medium text-text-muted">{t('modals.retailProduct.category')}</label>
            <input id="retail-category" type="text" name="category" value={formData.category || ''} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" list="retail-categories" />
            <datalist id="retail-categories">
              <option value="Shampoo" /><option value="Acondicionador" /><option value="Tratamiento" /><option value="Styling" />
            </datalist>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="retail-cost" className="block text-sm font-medium text-text-muted">{t('modals.retailProduct.cost')}</label>
              <CurrencyInput id="retail-cost" name="cost" value={formData.cost} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" required />
            </div>
            <div>
              <label htmlFor="retail-price" className="block text-sm font-medium text-text-muted">{t('modals.retailProduct.price')}</label>
              <CurrencyInput id="retail-price" name="price" value={formData.price} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" required />
            </div>
            <div>
              <label htmlFor="retail-stock" className="block text-sm font-medium text-text-muted">{t('modals.retailProduct.stock')}</label>
              <input id="retail-stock" type="number" name="stock" value={formData.stock || 0} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
            </div>
          </div>

          <div>
            <label htmlFor="retail-minStock" className="block text-sm font-medium text-text-muted">{t('modals.retailProduct.minStock')}</label>
            <input id="retail-minStock" type="number" name="minStock" value={formData.minStock || 3} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
          </div>
        </form>

        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-end flex-shrink-0">
          <button onClick={onClose} type="button" className="py-2 px-6 mr-4 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">{t('common.cancel')}</button>
          <button onClick={handleSave} type="submit" disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">
            {isSaving ? t('modals.buttons.saving') : (isEditMode ? t('modals.buttons.updateChanges') : t('modals.forms.create'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetailProductModal;
// ===== FIN: src/components/modals/RetailProductModal.jsx =====