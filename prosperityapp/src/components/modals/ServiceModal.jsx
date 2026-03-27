// ===== INICIO: src/components/modals/ServiceModal.jsx (Sprint 94) =====
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // <-- Importar
import CurrencyInput from '../ui/CurrencyInput';

const ServiceModal = ({ isOpen, onClose, serviceToEdit }) => {
  const { t } = useTranslation(); // <-- Hook
  const [formData, setFormData] = useState({ name: '', category: '', price: '', duration: '' });
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!serviceToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData(serviceToEdit);
      } else {
        setFormData({ name: '', category: '', price: '', duration: '' });
      }
    }
  }, [isOpen, serviceToEdit, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error(t('modals.errors.completeFields'));
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration) || 0,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        const docRef = doc(db, 'services', serviceToEdit.id);
        await setDoc(docRef, dataToSave, { merge: true });
        toast.success(t('common.success'));
      } else {
        const docRef = collection(db, 'services');
        dataToSave.createdAt = serverTimestamp();
        await addDoc(docRef, dataToSave);
        toast.success(t('common.success'));
      }
      onClose();
    } catch (error) {
      console.warn("Error guardando servicio: ", error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-lg modal-content flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{isEditMode ? t('modals.service.editTitle') : t('modals.service.newTitle')}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-grow space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-muted">{t('modals.service.name')}</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder={t('modals.service.placeholders.name')}
              value={formData.name || ''}
              onChange={handleInputChange}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main placeholder-text-muted/50"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-text-muted">{t('modals.service.category')}</label>
            <input
              type="text"
              name="category"
              id="category"
              placeholder={t('modals.service.placeholders.category')}
              value={formData.category || ''}
              onChange={handleInputChange}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main placeholder-text-muted/50"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              <option value="Cortes y Lavado" />
              <option value="Coloración" />
              <option value="Tratamientos" />
              <option value="Manicura y Pedicura" />
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-text-muted">{t('modals.service.price')}</label>
              <CurrencyInput
                name="price"
                id="price"
                placeholder={t('modals.service.placeholders.price')}
                value={formData.price}
                onChange={handleInputChange}
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main"
                required
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-text-muted">{t('modals.service.duration')}</label>
              <input
                type="number"
                name="duration"
                id="duration"
                placeholder={t('modals.service.placeholders.duration')}
                value={formData.duration || ''}
                onChange={handleInputChange}
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-end flex-shrink-0">
          <button onClick={onClose} type="button" className="py-2 px-6 mr-4 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} type="submit" disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">
            {isSaving ? t('modals.buttons.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
// ===== FIN: src/components/modals/ServiceModal.jsx (Sprint 94) =====