// ===== INICIO: src/components/modals/ClientModal.jsx (Sprint 90) =====
import React, { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { db } from '../../firebase/config';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ClientModal = ({ isOpen, onClose, clientToEdit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!clientToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) { 
        setFormData(clientToEdit); 
      } else {
        setFormData({
          name: '', lastName: '', docType: 'DNI', docNumber: '',
          phone: '', email: '', birthday: '', lastVisit: '',
        });
      }
      setActiveTab('personal');
      setTimeout(() => feather.replace(), 50);
    }
  }, [isOpen, clientToEdit, isEditMode]);

  useEffect(() => { feather.replace(); }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    setIsSaving(true);
    try {
      let docRef;
      const dataToSave = {
        ...formData,
        lastVisit: formData.lastVisit || new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        docRef = doc(db, 'clients', clientToEdit.id);
        await setDoc(docRef, dataToSave, { merge: true });
        toast.success(t('common.success'));
      } else {
        docRef = collection(db, 'clients');
        dataToSave.createdAt = serverTimestamp();
        await addDoc(docRef, dataToSave);
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
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-2xl modal-content flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{isEditMode ? t('modals.client.editTitle') : t('modals.client.newTitle')}</h3>
          <button onClick={onClose} className="text-text-main/70 hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        <nav className="flex p-2 bg-bg-main/50">
          <button onClick={() => setActiveTab('personal')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'personal' ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}>
            {t('modals.client.personal')}
          </button>
          <button onClick={() => setActiveTab('historial')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'historial' ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}>
            {t('modals.client.history')}
          </button>
        </nav>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-grow space-y-6">

          <div className={activeTab === 'personal' ? 'space-y-4' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} placeholder={t('modals.client.name')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" required />
              <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} placeholder={t('modals.client.lastName')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select name="docType" value={formData.docType || 'DNI'} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main">
                <option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="Cedula">Cédula</option>
              </select>
              <input type="text" name="docNumber" value={formData.docNumber || ''} onChange={handleInputChange} placeholder={t('modals.client.docNumber')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder={t('modals.client.phone')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
              <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder={t('modals.client.email')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
            </div>
            <div>
              <label className="text-xs text-text-muted">{t('modals.client.birthday')}</label>
              <input type="date" name="birthday" value={formData.birthday || ''} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
            </div>
          </div>

          <div className={activeTab === 'historial' ? 'space-y-4' : 'hidden'}>
            <p className="text-text-muted">{t('modals.client.historyDesc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted">{t('modals.client.clientSince')}</label>
                <p className="font-semibold text-text-main">{formData.createdAt ? new Date(formData.createdAt.seconds * 1000).toLocaleDateString('es-CL') : t('common.notAvailable')}</p>
              </div>
              <div>
                <label className="text-xs text-text-muted">{t('modals.client.lastVisitReg')}</label>
                <p className="font-semibold text-text-main">{formData.lastVisit || t('common.notAvailable')}</p>
              </div>
            </div>
          </div>

        </form>

        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-between flex-shrink-0">
          <div></div>
          <div className="flex gap-4">
            <button onClick={onClose} type="button" className="py-2 px-6 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">{t('common.cancel')}</button>
            <button onClick={handleSave} type="submit" disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">{isSaving ? t('modals.buttons.saving') : t('common.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ClientModal;
// ===== FIN: src/components/modals/ClientModal.jsx =====