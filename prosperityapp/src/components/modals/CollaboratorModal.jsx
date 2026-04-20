import React, { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { sbCreate, sbUpdate, sbDelete, sbGetAll } from '../../supabase/db';
import { useData } from '../../context/DataContext';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../../hooks/useStorage';
import { ROLE_CATALOG } from '../../lib/permissions';
import PinModal from './PinModal';

// ── Helper: llamar a la Edge Function de gestión de auth ─────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callCollaboratorAuthFn(payload, businessId) {
  // We pass the business ID via a custom header for dev bypass mode
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? `Bearer ${session.access_token}`
    : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-collaborator-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'x-business-id': businessId || '',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error en Edge Function');
  return json;
}

// ── PIN verification mini-component ──────────────────────────────────────────
const PinVerifier = ({ config, onSuccess, onCancel }) => {
  const [pin, setPin]   = useState('');
  const [err, setErr]   = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);

  const storedPin = config?.[0]?.securityPin || '1234';

  useEffect(() => {
    if (blockedUntil && Date.now() >= blockedUntil) {
      setBlockedUntil(null);
      setAttempts(0);
      setErr('');
    } else if (blockedUntil) {
      const timer = setTimeout(() => {
        setBlockedUntil(null);
        setAttempts(0);
        setErr('');
      }, blockedUntil - Date.now());
      return () => clearTimeout(timer);
    }
  }, [blockedUntil]);

  const verify = (e) => {
    e.preventDefault();
    if (blockedUntil) return;

    if (pin === storedPin) {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setBlockedUntil(Date.now() + 30000); // 30 seconds block
        setErr('Demasiados intentos fallidos. Inténtalo de nuevo en 30 segundos.');
      } else {
        setErr('PIN incorrecto. Inténtalo de nuevo.');
      }
    }
  };

  const isBlocked = !!blockedUntil;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6a2 2 0 100-4 2 2 0 000 4zm0 0v1m-7 4h14a2 2 0 002-2v-2a9 9 0 10-18 0v2a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-bold text-text-main">Autorización Requerida</p>
        <p className="text-text-muted text-sm mt-1">Solo el administrador puede gestionar el acceso a la app de los colaboradores.</p>
      </div>
      <form onSubmit={verify} className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={pin}
          onChange={(e) => { setPin(e.target.value); if (!isBlocked) setErr(''); }}
          placeholder="PIN de administrador"
          className="w-full bg-bg-tertiary border border-border-main rounded-lg p-3 text-text-main text-center text-xl tracking-widest focus:outline-none focus:border-accent disabled:opacity-50"
          maxLength={6}
          autoFocus
          disabled={isBlocked}
        />
        {err && <p className="text-red-400 text-xs text-center">{err}</p>}
        <button type="submit" disabled={isBlocked} className="btn-golden w-full py-2.5 font-semibold disabled:opacity-50">
          {isBlocked ? 'Bloqueado' : 'Autorizar'}
        </button>
        <button type="button" onClick={onCancel} className="w-full py-2 text-text-muted text-sm hover:text-text-main transition-colors">
          Cancelar
        </button>
      </form>
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const CollaboratorModal = ({ isOpen, onClose, collaboratorToEdit }) => {
  const { t } = useTranslation();
  const { businessId, config } = useData();
  const { businessId: biz } = useBusiness();
  const effectiveBusinessId = businessId || biz;

  const { uploadFile, progress, isUploading } = useStorage();
  const [formData,   setFormData]   = useState({});
  const [activeTab,  setActiveTab]  = useState('personal');
  const [isSaving,   setIsSaving]   = useState(false);
  const isEditMode = !!collaboratorToEdit;

  // ── "Acceso App" tab state ────────────────────────────────────────────────
  const [accessTabUnlocked, setAccessTabUnlocked] = useState(false);
  const [isPinForAccessOpen, setIsPinForAccessOpen] = useState(false);
  const [loginEmail,        setLoginEmail]        = useState('');
  const [newPassword,       setNewPassword]       = useState('');
  const [showPassword,      setShowPassword]      = useState(false);
  const [isSavingAccess,    setIsSavingAccess]    = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData(collaboratorToEdit);
        setLoginEmail(collaboratorToEdit.loginEmail || collaboratorToEdit.email || '');
      } else {
        setFormData({
          name: '', lastName: '', docType: 'DNI', docNumber: '',
          whatsapp: '', email: '', emergencyContactName: '', emergencyContactPhone: '',
          hireDate: new Date().toISOString().split('T')[0],
          commissionPercent: 50,
          salesCommissionPercent: 10,
          status: 'active', terminationDate: null, displayOrder: 0,
        });
        setLoginEmail('');
      }
      setActiveTab('personal');
      setAccessTabUnlocked(false);
      setNewPassword('');
      setTimeout(() => feather.replace(), 50);
    }
  }, [isOpen, collaboratorToEdit, isEditMode]);

  useEffect(() => { feather.replace(); }, [activeTab]);

  // Sync loginEmail default from email field
  useEffect(() => {
    if (!isEditMode && formData.email && !loginEmail) {
      setLoginEmail(formData.email);
    }
  }, [formData.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = ['commissionPercent', 'salesCommissionPercent', 'displayOrder'].includes(name)
      ? parseFloat(value)
      : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const collabId = collaboratorToEdit?.id || 'new_collab_' + Date.now();
    const path = `contracts/${collabId}/${file.name}`;
    try {
      const url = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, [type]: url }));
      toast.success('Archivo subido correctamente');
    } catch (err) {
      console.warn('Upload error:', err);
      toast.error('Error al subir archivo');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (!isEditMode) {
        const { data: existing } = await sbGetAll('collaborators', effectiveBusinessId);
        if (existing?.length > 0) {
          await Promise.all(
            existing.map((c) => sbUpdate('collaborators', c.id, { displayOrder: (c.display_order ?? 0) + 1 }))
          );
        }
        const payload = { ...formData, displayOrder: 0 };
        delete payload.id;
        const { error } = await sbCreate('collaborators', payload, effectiveBusinessId);
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
      console.warn('Error:', error);
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
      // If collaborator has an auth account, remove it first
      if (collaboratorToEdit.authUserId) {
        await callCollaboratorAuthFn(
          { action: 'delete', authUserId: collaboratorToEdit.authUserId, collaboratorId: collaboratorToEdit.id },
          effectiveBusinessId
        ).catch(console.warn);
      }
      const { error } = await sbDelete('collaborators', collaboratorToEdit.id);
      if (error) throw error;
      toast.success(t('collaborators.alerts.deleted'));
      onClose();
    } catch (error) {
      console.warn('Error:', error);
      toast.error(t('collaborators.alerts.errorDelete'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Save access credentials ───────────────────────────────────────────────
  const handleSaveAccess = async (e) => {
    e.preventDefault();
    if (!loginEmail) { toast.error('Ingresa un correo de acceso'); return; }
    if (!newPassword && !collaboratorToEdit?.authUserId) {
      toast.error('La contraseña es obligatoria para la primera configuración');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSavingAccess(true);
    try {
      if (collaboratorToEdit?.authUserId) {
        // Update existing auth user
        if (newPassword) {
          await callCollaboratorAuthFn(
            { action: 'update_password', authUserId: collaboratorToEdit.authUserId, password: newPassword },
            effectiveBusinessId
          );
        }
        // Update login_email in collaborators table
        await sbUpdate('collaborators', collaboratorToEdit.id, { loginEmail });
      } else if (isEditMode && collaboratorToEdit?.id) {
        // Create new auth user for existing collaborator
        const result = await callCollaboratorAuthFn(
          { action: 'create', email: loginEmail, password: newPassword, collaboratorId: collaboratorToEdit.id },
          effectiveBusinessId
        );
        if (result?.authUserId) {
          // Update local formData to reflect the new authUserId (for UI badge)
          setFormData(prev => ({ ...prev, authUserId: result.authUserId, loginEmail }));
        } else {
          throw new Error('Error al crear el acceso: No se recibió ID de usuario.');
        }
      } else {
        toast.error('Primero guarda el colaborador antes de configurar el acceso');
        return;
      }
      toast.success('Acceso de colaborador actualizado');
      setNewPassword('');
    } catch (err) {
      console.warn('[handleSaveAccess]', err);
      toast.error(`Error de configuración: ${err.message || 'No se pudo guardar el acceso'}`);
      // Revert partial state changes if needed
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!collaboratorToEdit?.authUserId) return;
    if (!window.confirm('¿Estás seguro de que quieres revocar el acceso a la app de este colaborador?')) return;
    setIsSavingAccess(true);
    try {
      await callCollaboratorAuthFn(
        { action: 'delete', authUserId: collaboratorToEdit.authUserId, collaboratorId: collaboratorToEdit.id },
        effectiveBusinessId
      );
      setFormData(prev => ({ ...prev, authUserId: null, loginEmail: null }));
      toast.success('Acceso revocado correctamente');
    } catch (err) {
      toast.error(`Error al revocar acceso: ${err.message}`);
    } finally {
      setIsSavingAccess(false);
    }
  };

  if (!isOpen) return null;

  const hasAccess = !!formData.authUserId;

  const TABS = [
    { id: 'personal',   label: t('collaborators.modal.tabs.personal') },
    { id: 'laboral',    label: t('collaborators.modal.tabs.labor') },
    { id: 'acceso',     label: 'Acceso App' },
    { id: 'documentos', label: t('collaborators.modal.tabs.docs') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-2xl modal-content flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border-main flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-bold text-text-main">
            {isEditMode ? t('collaborators.modal.editTitle') : t('collaborators.modal.newTitle')}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <nav className="flex p-2 bg-bg-main/50 flex-shrink-0 overflow-x-auto gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md whitespace-nowrap flex items-center gap-1.5 transition-colors
                ${activeTab === tab.id ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}
            >
              {tab.id === 'acceso' && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasAccess ? 'bg-green-400' : 'bg-text-muted/40'}`} />
              )}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-grow">

          {/* ── Tab: Personal ── */}
          <div className={activeTab === 'personal' ? 'space-y-4' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.name')} className="input-themed" required />
              <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.lastName')} className="input-themed" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select name="docType" value={formData.docType || 'DNI'} onChange={handleInputChange} className="input-themed">
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Cedula">Cédula</option>
              </select>
              <input type="text" name="docNumber" value={formData.docNumber || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.docNumber')} className="input-themed" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="tel" name="whatsapp" value={formData.whatsapp || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.phone')} className="input-themed" />
              <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.email')} className="input-themed" />
            </div>
            <hr className="border-border-main/50" />
            <h4 className="font-semibold text-text-main">{t('collaborators.modal.form.emergencyHeader')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.emergencyName')} className="input-themed" />
              <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone || ''} onChange={handleInputChange} placeholder={t('collaborators.modal.form.emergencyPhone')} className="input-themed" />
            </div>
          </div>

          {/* ── Tab: Laboral ── */}
          <div className={activeTab === 'laboral' ? 'space-y-4' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.hireDate')}</label>
                <input type="date" name="hireDate" value={formData.hireDate || ''} onChange={handleInputChange} className="input-themed mt-1" />
              </div>
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.status')}</label>
                <select name="status" value={formData.status || 'active'} onChange={handleInputChange} className="input-themed mt-1">
                  <option value="active">{t('collaborators.modal.statusOptions.active')}</option>
                  <option value="inactive">{t('collaborators.modal.statusOptions.inactive')}</option>
                  <option value="terminated">{t('collaborators.modal.statusOptions.terminated')}</option>
                </select>
              </div>
            </div>
            {/* Rol del Sistema */}
            <div>
              <label className="text-xs text-text-muted font-semibold uppercase tracking-wide">Rol en la App</label>
              <select name="appRole" value={formData.appRole || 'stylist'} onChange={handleInputChange} className="input-themed mt-1">
                {ROLE_CATALOG.map(r => (
                  <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">Define los permisos del colaborador dentro de la app.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.commService')}</label>
                <input type="number" name="commissionPercent" value={formData.commissionPercent || 0} onChange={handleInputChange} className="input-themed mt-1" />
              </div>
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.commSales')}</label>
                <input type="number" name="salesCommissionPercent" value={formData.salesCommissionPercent || 0} onChange={handleInputChange} className="input-themed mt-1" />
              </div>
            </div>
            {formData.status === 'terminated' && (
              <div>
                <label className="text-xs text-text-muted">{t('collaborators.modal.form.terminationDate')}</label>
                <input type="date" name="terminationDate" value={formData.terminationDate || ''} onChange={handleInputChange} className="input-themed mt-1" />
              </div>
            )}
          </div>

          {/* ── Tab: Acceso App ── */}
          <div className={activeTab === 'acceso' ? 'space-y-4' : 'hidden'}>
            {!isEditMode ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <p className="text-text-muted text-sm">Primero guarda el colaborador para poder configurar su acceso a la app.</p>
              </div>
            ) : !accessTabUnlocked ? (
              <>
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6a2 2 0 100-4 2 2 0 000 4zm0 0v1m-7 4h14a2 2 0 002-2v-2a9 9 0 10-18 0v2a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-text-main">Autorización Requerida</p>
                    <p className="text-text-muted text-sm mt-1">Solo el administrador puede gestionar el acceso a la app de los colaboradores.</p>
                  </div>
                  <button onClick={() => setIsPinForAccessOpen(true)} className="btn-golden py-2.5 px-6 font-semibold">Ingresar PIN</button>
                  <button onClick={() => setActiveTab('personal')} className="text-text-muted text-sm hover:text-text-main transition-colors">Cancelar</button>
                </div>
                <PinModal
                  isOpen={isPinForAccessOpen}
                  operation="collaborator_access"
                  onClose={() => setIsPinForAccessOpen(false)}
                  onSuccess={() => { setIsPinForAccessOpen(false); setAccessTabUnlocked(true); }}
                />
              </>
            ) : (
              <form onSubmit={handleSaveAccess} className="space-y-5">
                {/* Status badge */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasAccess ? 'border-green-500/30 bg-green-500/10' : 'border-border-main bg-bg-tertiary/50'}`}>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${hasAccess ? 'bg-green-400' : 'bg-text-muted/40'}`} />
                  <div>
                    <p className="font-semibold text-text-main text-sm">
                      {hasAccess ? 'Acceso activo a la app' : 'Sin acceso configurado'}
                    </p>
                    {hasAccess && formData.loginEmail && (
                      <p className="text-text-muted text-xs mt-0.5">{formData.loginEmail}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                    Correo de inicio de sesión
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="input-themed mt-1"
                  />
                  <p className="text-xs text-text-muted mt-1">Este es el correo que usará el colaborador para entrar a la app.</p>
                </div>

                <div>
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                    {hasAccess ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña de acceso'}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={hasAccess ? '••••••••  (nueva contraseña)' : 'Mínimo 6 caracteres'}
                      className="input-themed pr-10"
                      minLength={newPassword ? 6 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7m5.54-5.46l-14 14" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Puede ser numérica, alfanumérica o con caracteres especiales. Mínimo 6 caracteres.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSavingAccess}
                    className="btn-golden py-2 px-5 font-semibold disabled:opacity-50"
                  >
                    {isSavingAccess ? 'Guardando...' : hasAccess ? 'Actualizar Acceso' : 'Activar Acceso'}
                  </button>
                  {hasAccess && (
                    <button
                      type="button"
                      onClick={handleRevokeAccess}
                      disabled={isSavingAccess}
                      className="py-2 px-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-md hover:bg-red-500/20 text-sm font-semibold disabled:opacity-50"
                    >
                      Revocar Acceso
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* ── Tab: Documentos ── */}
          <div className={activeTab === 'documentos' ? 'space-y-4' : 'hidden'}>
            <p className="text-text-muted">{t('collaborators.modal.docs.info')}</p>
            <div className="space-y-3">
              <div className="w-full p-3 bg-bg-tertiary border border-border-main rounded-md">
                <label className="flex items-center gap-3 text-text-muted cursor-pointer">
                  <i data-feather="upload-cloud"></i>
                  <span>{t('collaborators.modal.docs.contract')}</span>
                  <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'contractUrl')} accept=".pdf,.doc,.docx,.jpg,.png" disabled={isUploading} />
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
              <div className="w-full p-3 bg-bg-tertiary border border-border-main rounded-md">
                <label className="flex items-center gap-3 text-text-muted cursor-pointer">
                  <i data-feather="upload-cloud"></i>
                  <span>{t('collaborators.modal.docs.settlement')}</span>
                  <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'settlementUrl')} accept=".pdf,.doc,.docx,.jpg,.png" disabled={isUploading} />
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-between flex-shrink-0">
          <div>
            {isEditMode && activeTab !== 'acceso' && (
              <button onClick={handleDelete} type="button" disabled={isSaving} className="bg-red-600 text-white font-bold py-2 px-6 rounded-md hover:bg-red-700 disabled:opacity-50">
                {t('common.delete')}
              </button>
            )}
          </div>
          <div className="flex gap-4">
            {activeTab !== 'acceso' && (
              <>
                <button onClick={onClose} type="button" className="py-2 px-6 bg-bg-tertiary rounded-md text-text-muted hover:bg-bg-tertiary/80">
                  {t('common.cancel')}
                </button>
                <button onClick={handleSave} type="button" disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">
                  {isSaving ? t('modals.buttons.saving') : t('common.save')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorModal;