import React, { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { sbCreate, sbUpdate, sbDelete, sbGetAll } from '../../supabase/db';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../../hooks/useStorage';

const CollaboratorModal = ({ isOpen, onClose, collaboratorToEdit }) => {
  const { t } = useTranslation();
  const { businessId } = useData();
  const { uploadFile, progress, isUploading } = useStorage();
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!collaboratorToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData(collaboratorToEdit);
      } else {
        setFormData({
          name: '', lastName: '', docType: 'DNI', docNumber: '',
          whatsapp: '', email: '', emergencyContactName: '', emergencyContactPhone: '',
          hireDate: new Date().toISOString().split('T')[0],
          commissionPercent: 50,
          salesCommissionPercent: 10,
          status: 'active', terminationDate: null, displayOrder: 0,
        });
      }
      setActiveTab('personal');
      setTimeout(() => feather.replace(), 50);
    }
  }, [isOpen, collaboratorToEdit, isEditMode]);

  useEffect(() => { feather.replace(); }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = ['commissionPercent', 'salesCommissionPercent', 'displayOrder'].includes(name) ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Generate a unique path: contracts/{collaboratorId}/{fileName}
    const collabId = collaboratorToEdit?.id || 'new_collab_' + Date.now();
    const path = `contracts/${collabId}/${file.name}`;

    try {
      const url = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, [type]: url }));
      toast.success("Archivo subido correctamente");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir archivo");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (!isEditMode) {
        // Incrementar displayOrder de todos los existentes y crear el nuevo al inicio
        const { data: existing } = await sbGetAll('collaborators', businessId);
        if (existing?.length > 0) {
          await Promise.all(
            existing.map((c) => sbUpdate('collaborators', c.id, { displayOrder: (c.display_order ?? 0) + 1 }))
          );
        }
        const payload = { ...formData, displayOrder: 0 };
        delete payload.id;
        const { error } = await sbCreate('collaborators', payload, businessId);
        if (error) throw error;
        toast.success(t('collaborators.alerts.created'));
      } else {
        const payload = { ...formData };
        delete payload.id;
        const { error } = await sbUpdate('collaborators', collaboratorToEdit.id, payload);
        if (error) throw error;
        toast.success(t('collaborators.alerts.updated'));
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('collaborators.alerts.errorSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    if (!window.confirm(t('collaborators.alerts.confirmDelete', { name: formData.name }))) return;
    setIsSaving(true);
    try {
      const { error } = await sbDelete('collaborators', collaboratorToEdit.id);
      if (error) throw error;
      toast.success(t('collaborators.alerts.deleted'));
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('collaborators.alerts.errorDelete'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-2xl modal-content flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{isEditMode ? t('collaborators.modal.editTitle') : t('collaborators.modal.newTitle')}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>
        <nav className="flex p-2 bg-bg-main/50">
          <button onClick={() => setActiveTab('personal')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'personal' ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}>{t('collaborators.modal.tabs.personal')}</button>
          <button onClick={() => setActiveTab('laboral')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'laboral' ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}>{t('collaborators.modal.tabs.labor')}</button>
          <button onClick={() => setActiveTab('documentos')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'documentos' ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}>{t('collaborators.modal.tabs.docs')}</button>
        </nav>
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-grow space-y-6">
          <div className={activeTab === 'personal' ? 'space-y-4' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.name')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" required />
              <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.lastName')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select name="docType" value={formData.docType || 'DNI'} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main">
                <option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="Cedula">Cédula</option>
              </select>
              <input type="text" name="docNumber" value={formData.docNumber || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.docNumber')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="tel" name="whatsapp" value={formData.whatsapp || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.phone')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
              <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.email')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
            </div>
            <hr className="border-border-main/50" />
            <h4 className="font-semibold text-text-main">{t('collaborators.modal.form.emergencyHeader')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.emergencyName')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
              <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.emergencyPhone')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
            </div>
          </div>
          <div className={activeTab === 'laboral' ? 'space-y-4' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.hireDate')}</label>
                <input type="date" name="hireDate" value={formData.hireDate || ''} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
              </div>
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.status')}</label>
                <select name="status" value={formData.status || 'active'} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main">
                  <option value="active">{t('collaborators.modal.statusOptions.active')}</option>
                  <option value="inactive">{t('collaborators.modal.statusOptions.inactive')}</option>
                  <option value="terminated">{t('collaborators.modal.statusOptions.terminated')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.commService')}</label>
                <input type="number" name="commissionPercent" value={formData.commissionPercent || 0} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
              </div>
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.commSales')}</label>
                <input type="number" name="salesCommissionPercent" value={formData.salesCommissionPercent || 0} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
              </div>
            </div>
            {formData.status === 'terminated' && (
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.terminationDate')}</label>
                <input type="date" name="terminationDate" value={formData.terminationDate || ''} onChange={handleInputChange} className="w-full bg-bg-tertiary border border-border-main rounded p-2 mt-1 text-text-main" />
              </div>
            )}
          </div>
          <div className={activeTab === 'documentos' ? 'space-y-4' : 'hidden'}>
            <p className="text-text-muted">{t('collaborators.modal.docs.info')}</p>
            <div className="space-y-3">

              {/* CONTRACT UPLOAD */}
              <div className="w-full p-3 bg-bg-tertiary border border-border-main rounded-md">
                <label className="flex items-center gap-3 text-text-muted cursor-pointer">
                  <i data-feather="upload-cloud"></i>
                  <span>{t('collaborators.modal.docs.contract')}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'contractUrl')}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    disabled={isUploading}
                  />
                </label>
                {isUploading && <div className="text-xs text-accent mt-2">Subiendo... {Math.round(progress)}%</div>}
                {formData.contractUrl && (
                  <div className="mt-2 text-sm">
                    <a href={formData.contractUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                      <i data-feather="file-text" className="w-4 h-4"></i> Ver Contrato Actual
                    </a>
                  </div>
                )}
              </div>

              {/* SETTLEMENT UPLOAD */}
              <div className="w-full p-3 bg-bg-tertiary border border-border-main rounded-md">
                <label className="flex items-center gap-3 text-text-muted cursor-pointer">
                  <i data-feather="upload-cloud"></i>
                  <span>{t('collaborators.modal.docs.settlement')}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'settlementUrl')}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    disabled={isUploading}
                  />
                </label>
                {isUploading && <div className="text-xs text-accent mt-2">Subiendo... {Math.round(progress)}%</div>}
                {formData.settlementUrl && (
                  <div className="mt-2 text-sm">
                    <a href={formData.settlementUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                      <i data-feather="file-text" className="w-4 h-4"></i> Ver Finiquito Actual
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-between flex-shrink-0">
          <div>
            {isEditMode && (<button onClick={handleDelete} type="button" disabled={isSaving} className="bg-red-600 text-text-main font-bold py-2 px-6 rounded-md hover:bg-red-700 disabled:opacity-50">{t('common.delete')}</button>)}
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} type="button" className="py-2 px-6 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">{t('common.cancel')}</button>
            <button onClick={handleSave} type="submit" disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">{isSaving ? t('modals.buttons.saving') : t('common.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CollaboratorModal;
// ===== FIN: src/components/modals/CollaboratorModal.jsx (Sprint 91) =====