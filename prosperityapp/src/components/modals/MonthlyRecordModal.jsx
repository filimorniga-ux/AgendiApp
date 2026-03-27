// ===== INICIO: src/components/modals/MonthlyRecordModal.jsx (Sprint 91) =====
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const MonthlyRecordModal = ({ isOpen, onClose, recordToEdit, yearMonth }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!recordToEdit;

  // Categories inside component to use translation hook
  const categories = [
    { key: 'cashUnsealed', label: t('closings.categories.cashUnsealed') },
    { key: 'cashWeekly', label: t('closings.categories.cashWeekly') },
    { key: 'transfers', label: t('closings.categories.transfers') },
    { key: 'cards', label: t('closings.categories.cards') },
    { key: 'partnersAdvances', label: t('closings.categories.partnersAdvances') },
    { key: 'monthlyOutgoings', label: t('closings.categories.monthlyOutgoings') },
    { key: 'weeklySalesSavings', label: t('closings.categories.weeklySalesSavings') },
    { key: 'taxSavings', label: t('closings.categories.taxSavings') },
    { key: 'techSavings', label: t('closings.categories.techSavings') },
  ];

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData(recordToEdit);
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          category: categories[0].key,
          amount: '',
        });
      }
    }
  }, [isOpen, recordToEdit, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const collectionRef = collection(db, 'monthlyClosings', yearMonth, 'records');
      
      const dataToSave = {
        date: formData.date,
        description: formData.description,
        [formData.category]: parseFloat(formData.amount) || 0,
        _categoryKey: formData.category, 
        _amountValue: parseFloat(formData.amount) || 0,
      };

      if (isEditMode) {
        const docRef = doc(collectionRef, recordToEdit.id);
        await setDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() }, { merge: true });
        toast.success(t('common.success'));
      } else {
        await addDoc(collectionRef, { ...dataToSave, createdAt: serverTimestamp() });
        toast.success(t('common.success'));
      }
      onClose();
    } catch (error) {
      console.warn("Error:", error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-lg modal-content flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{isEditMode ? t('modals.monthlyRecord.editTitle') : t('modals.monthlyRecord.newTitle')}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-grow space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted">{t('modals.monthlyRecord.date')}</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date || ''}
              onChange={handleInputChange}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted">{t('modals.monthlyRecord.description')}</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description || ''}
              onChange={handleInputChange}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted">{t('modals.monthlyRecord.category')}</label>
            <select 
              name="category" 
              value={formData.category || ''}
              onChange={handleInputChange}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main"
            >
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted">{t('modals.monthlyRecord.amount')}</label>
            <input 
              type="number" 
              name="amount" 
              value={formData.amount || ''}
              onChange={handleInputChange}
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" 
              required 
            />
          </div>
        </form>
        
        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-end flex-shrink-0">
          <button onClick={onClose} type="button" className="py-2 px-6 mr-4 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} type="submit" disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">
            {isSaving ? t('modals.monthlyRecord.saving') : t('modals.monthlyRecord.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
export default MonthlyRecordModal;
// ===== FIN: src/components/modals/MonthlyRecordModal.jsx =====