// ===== INICIO: src/pages/ConfiguracionPage.jsx (Sprint 111 - Traducido) =====
import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { sbUpdate } from '../supabase/db';
import { handleSeedDatabase } from '../firebase/seedDatabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import AppearanceTab from './Settings/AppearanceTab';
import { useStorage } from '../hooks/useStorage';

const ConfiguracionPage = () => {
  const { t, i18n } = useTranslation();
  const { config, collaborators, isLoading, businessId } = useData();
  const { uploadFile, progress, isUploading } = useStorage();

  const [activeTab, setActiveTab] = useState('accounting');
  const [formData, setFormData] = useState({});
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinChangeData, setPinChangeData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [pinError, setPinError] = useState('');

  const settings = useMemo(() => (config && config.find(c => c.id === 'settings')) || {
    taxGeneral: 19,
    partners: [],
    theme: 'dark',
    brandName: 'Gema',
    logoUrl: 'https://placehold.co/40x40/2d3748/f6e05e?text=G',
    taxOverrides: {},
    salesCommissionGeneral: 10,
    securityPin: '1234'
  }, [config]);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    if (!isLoading) {
      feather.replace();
    }
  }, [activeTab, collaborators, formData.partners, isLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = ['taxGeneral', 'salesCommissionGeneral'].includes(name) ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handlePartnerChange = (index, field, value) => {
    const newPartners = [...(formData.partners || [])];
    const val = field === 'percent' ? parseFloat(value) : value;
    newPartners[index] = { ...newPartners[index], [field]: val };
    setFormData(prev => ({ ...prev, partners: newPartners }));
  };

  const addPartner = () => {
    const newPartners = [...(formData.partners || []), { name: t('settings.accounting.partnerNamePlaceholder'), percent: 0 }];
    setFormData(prev => ({ ...prev, partners: newPartners }));
  };

  const removePartner = (index) => {
    const newPartners = formData.partners.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, partners: newPartners }));
  };

  const handleTaxOverrideChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      taxOverrides: {
        ...(prev.taxOverrides || {}),
        [id]: parseFloat(value) || 0
      }
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const path = `branding/logo_${Date.now()}`;
      const url = await uploadFile(file, path);
      // AQUÍ ESTÁ LA CLAVE: Actualizar el estado inmediatamente
      setFormData(prev => ({ ...prev, logoUrl: url }));
      toast.success("Logo subido. No olvides dar clic en Guardar.");
    } catch (error) {
      console.warn(error);
      toast.error("Error al subir logo");
    }
  };

  const handleSaveSettings = async (tabKey) => {
    let dataToSave = {};
    if (tabKey === 'appearance') {
      dataToSave = {
        brandName: formData.brandName,
        logoUrl: formData.logoUrl,
      };
    } else if (tabKey === 'accounting') {
      const totalPercent = (formData.partners || []).reduce((sum, p) => sum + (parseFloat(p.percent) || 0), 0);
      if (totalPercent !== 100 && formData.partners.length > 0) {
        toast.error(t('settings.accounting.errorTotal', { total: totalPercent }));
        return;
      }
      dataToSave = {
        taxGeneral: formData.taxGeneral,
        taxOverrides: formData.taxOverrides,
        partners: formData.partners,
        salesCommissionGeneral: formData.salesCommissionGeneral,
      };
    } else if (tabKey === 'security') {
      if (!formData.securityPin || formData.securityPin.length < 4) {
        toast.error(t('settings.security.pinError'));
        return;
      }
      dataToSave = {
        securityPin: formData.securityPin
      };
    } else if (tabKey === 'company') {
      dataToSave = {
        businessName: formData.businessName,
        taxId: formData.taxId,
        address: formData.address,
        country: formData.country,
        city: formData.city,
        zipCode: formData.zipCode,
        email: formData.email,
        phone: formData.phone
      };
    }
    try {
      if (!businessId) throw new Error('Business ID no disponible');
      const { error } = await sbUpdate('config', businessId, dataToSave);
      if (error) throw error;
      toast.success(t('common.success'));
    } catch (error) {
      console.warn('Error saving configuration: ', error);
      toast.error(t('common.error'));
    }
  };

  // Maintain handleSave for backwards compatibility
  const handleSave = () => handleSaveSettings('security');

  const handlePinChange = async () => {
    setPinError('');

    // Validar que el PIN actual sea correcto
    const currentStoredPin = settings.securityPin || '1234';
    if (pinChangeData.currentPin !== currentStoredPin) {
      setPinError(t('settings.security.incorrectCurrentPin') || 'PIN actual incorrecto');
      return;
    }

    // Validar que el nuevo PIN tenga al menos 4 dígitos
    if (!pinChangeData.newPin || pinChangeData.newPin.length < 4) {
      setPinError(t('settings.security.pinError') || 'El PIN debe tener al menos 4 dígitos');
      return;
    }

    // Validar que los PINs coincidan
    if (pinChangeData.newPin !== pinChangeData.confirmPin) {
      setPinError(t('settings.security.pinMismatch') || 'Los PINs no coinciden');
      return;
    }

    try {
      if (!businessId) throw new Error('Business ID no disponible');
      const { error } = await sbUpdate('config', businessId, { securityPin: pinChangeData.newPin });
      if (error) throw error;
      toast.success(t('settings.security.pinChanged') || 'PIN actualizado correctamente');
      setIsPinModalOpen(false);
      setPinChangeData({ currentPin: '', newPin: '', confirmPin: '' });
    } catch (error) {
      console.warn('Error al cambiar PIN:', error);
      toast.error(t('common.error'));
    }
  };

  if (isLoading) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-main">{t('settings.title')}</h2>
          <p className="text-text-muted">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="lg:w-1/4">
          <nav id="settings-tabs" className="flex flex-col space-y-1">
            <button onClick={() => setActiveTab('appearance')} className={`p-3 rounded-md text-left flex items-center gap-3 transition-colors ${activeTab === 'appearance' ? 'bg-accent text-accent-text font-bold' : 'text-text-muted hover:bg-bg-tertiary'}`}>
              <i data-feather="pen-tool" className="w-5 h-5"></i> {t('settings.tabs.appearance')}
            </button>
            <button onClick={() => setActiveTab('company')} className={`p-3 rounded-md text-left flex items-center gap-3 transition-colors ${activeTab === 'company' ? 'bg-accent text-accent-text font-bold' : 'text-text-muted hover:bg-bg-tertiary'}`}>
              <i data-feather="briefcase" className="w-5 h-5"></i> {t('settings.tabs.company')}
            </button>
            <button onClick={() => setActiveTab('accounting')} className={`p-3 rounded-md text-left flex items-center gap-3 transition-colors ${activeTab === 'accounting' ? 'bg-accent text-accent-text font-bold' : 'text-text-muted hover:bg-bg-tertiary'}`}>
              <i data-feather="dollar-sign" className="w-5 h-5"></i> {t('settings.tabs.accounting')}
            </button>
            <button onClick={() => setActiveTab('security')} className={`p-3 rounded-md text-left flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-accent text-accent-text font-bold' : 'text-text-muted hover:bg-bg-tertiary'}`}>
              <i data-feather="lock" className="w-5 h-5"></i> {t('settings.tabs.security')}
            </button>
            <button onClick={() => setActiveTab('maintenance')} className={`p-3 rounded-md text-left flex items-center gap-3 transition-colors ${activeTab === 'maintenance' ? 'bg-accent text-accent-text font-bold' : 'text-text-muted hover:bg-bg-tertiary'}`}>
              <i data-feather="database" className="w-5 h-5"></i> {t('settings.tabs.maintenance')}
            </button>
          </nav>
        </div>

        <div className="flex-1">
          {/* --- APARIENCIA --- */}
          <div className={`space-y-8 ${activeTab === 'appearance' ? '' : 'hidden'}`}>
            <AppearanceTab />
          </div>

          {/* --- INFORMACIÓN DE EMPRESA --- */}
          <div className={`space-y-8 ${activeTab === 'company' ? '' : 'hidden'}`}>
            <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm">
              <h3 className="text-xl font-bold text-text-main mb-2 pb-2 border-b border-border-main">{t('settings.company.title')}</h3>
              <p className="text-text-muted mb-6">{t('settings.company.subtitle')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.businessName')}</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.taxId')}</label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.address')}</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.country')}</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.city')}</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.zipCode')}</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">{t('settings.company.phone')}</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 text-right">
                <button onClick={() => handleSaveSettings('company')} className="btn-golden">{t('common.save')}</button>
              </div>
            </div>
          </div>

          {/* --- CONTABILIDAD --- */}
          <div className={`space-y-8 ${activeTab === 'accounting' ? '' : 'hidden'}`}>
            <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm">
              <h3 className="text-xl font-bold text-text-main mb-6 pb-2 border-b border-border-main">{t('settings.accounting.titleCommissions')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-text-main">{t('settings.accounting.salesCommission')}</label>
                  <input type="number" name="salesCommissionGeneral" className="bg-bg-tertiary border border-border-main rounded p-2 w-24 text-right text-text-main focus:border-accent focus:outline-none" value={formData.salesCommissionGeneral || 0} onChange={handleInputChange} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-text-main">{t('settings.accounting.generalTax')}</label>
                  <input type="number" name="taxGeneral" className="bg-bg-tertiary border border-border-main rounded p-2 w-24 text-right text-text-main focus:border-accent focus:outline-none" value={formData.taxGeneral || 0} onChange={handleInputChange} />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-text-main mt-8 mb-4">{t('settings.accounting.taxOverrides')}</h4>
              <div className="space-y-3 pl-4 border-l-2 border-bg-tertiary">
                {(collaborators || []).map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <label className="text-text-secondary">{c.name}:</label>
                    <input type="number" className="bg-bg-tertiary border border-border-main rounded p-2 w-24 text-right text-text-main focus:border-accent focus:outline-none" placeholder={String(settings.taxGeneral)} value={formData.taxOverrides?.[c.id] || ''} onChange={e => handleTaxOverrideChange(c.id, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm">
              <h3 className="text-xl font-bold text-text-main mb-6 pb-2 border-b border-border-main">{t('settings.accounting.titlePartners')}</h3>
              <div className="space-y-3">
                {(formData.partners || []).map((p, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input type="text" placeholder={t('settings.accounting.partnerNamePlaceholder')} className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none" value={p.name} onChange={(e) => handlePartnerChange(index, 'name', e.target.value)} />
                    <input type="number" placeholder="%" className="w-24 bg-bg-tertiary border border-border-main rounded p-2 text-right text-text-main focus:border-accent focus:outline-none" value={p.percent} onChange={(e) => handlePartnerChange(index, 'percent', e.target.value)} />
                    <button onClick={() => removePartner(index)} className="text-red-400 hover:text-red-500 p-2"><i data-feather="trash-2" className="w-5 h-5"></i></button>
                  </div>
                ))}
              </div>
              <button onClick={addPartner} className="mt-4 text-accent font-semibold flex items-center gap-2 hover:underline">
                <i data-feather="plus-circle" className="w-5 h-5"></i> {t('settings.accounting.addPartnerBtn')}
              </button>
              <div className="mt-6 text-right">
                {/* FIX: Botón Traducido */}
                <button onClick={() => handleSaveSettings('accounting')} className="btn-golden">{t('common.save')}</button>
              </div>
            </div>
          </div>

          {/* --- SEGURIDAD --- */}
          <div className={`space-y-8 ${activeTab === 'security' ? '' : 'hidden'}`}>
            <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm">
              <h3 className="text-xl font-bold text-text-main mb-6 pb-2 border-b border-border-main">{t('settings.security.title')}</h3>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-text-muted mb-4">{t('settings.security.pinDescription')}</p>
                  <p className="text-xs text-text-muted mb-4">
                    {t('settings.security.currentPin')}: ••••
                  </p>
                  <button
                    onClick={() => {
                      setIsPinModalOpen(true);
                      setPinError('');
                    }}
                    className="btn-golden flex items-center gap-2"
                  >
                    <i data-feather="lock" className="w-5 h-5"></i>
                    {t('settings.security.changePin') || 'Cambiar PIN'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de Cambio de PIN */}
          {isPinModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
              <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-text-main">{t('settings.security.changePin') || 'Cambiar PIN de Seguridad'}</h3>
                  <button
                    onClick={() => {
                      setIsPinModalOpen(false);
                      setPinChangeData({ currentPin: '', newPin: '', confirmPin: '' });
                      setPinError('');
                    }}
                    className="text-text-muted hover:text-text-main text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-4">
                  {/* PIN Actual */}
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-2">
                      {t('settings.security.currentPin') || 'PIN Actual'}
                    </label>
                    <input
                      type="password"
                      className="w-full bg-bg-tertiary border border-border-main rounded p-3 text-center text-2xl tracking-widest text-text-main focus:border-accent focus:outline-none"
                      value={pinChangeData.currentPin}
                      onChange={(e) => setPinChangeData({ ...pinChangeData, currentPin: e.target.value })}
                      maxLength={6}
                      placeholder="••••"
                      autoFocus
                    />
                  </div>

                  {/* Nuevo PIN */}
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-2">
                      {t('settings.security.newPin') || 'Nuevo PIN'}
                    </label>
                    <input
                      type="password"
                      className="w-full bg-bg-tertiary border border-border-main rounded p-3 text-center text-2xl tracking-widest text-text-main focus:border-accent focus:outline-none"
                      value={pinChangeData.newPin}
                      onChange={(e) => setPinChangeData({ ...pinChangeData, newPin: e.target.value })}
                      maxLength={6}
                      placeholder="••••"
                    />
                  </div>

                  {/* Confirmar Nuevo PIN */}
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-2">
                      {t('settings.security.confirmPin') || 'Confirmar Nuevo PIN'}
                    </label>
                    <input
                      type="password"
                      className="w-full bg-bg-tertiary border border-border-main rounded p-3 text-center text-2xl tracking-widest text-text-main focus:border-accent focus:outline-none"
                      value={pinChangeData.confirmPin}
                      onChange={(e) => setPinChangeData({ ...pinChangeData, confirmPin: e.target.value })}
                      maxLength={6}
                      placeholder="••••"
                    />
                  </div>

                  {pinError && (
                    <p className="text-red-400 text-sm">{pinError}</p>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setIsPinModalOpen(false);
                        setPinChangeData({ currentPin: '', newPin: '', confirmPin: '' });
                        setPinError('');
                      }}
                      className="flex-1 px-4 py-2 rounded-md border border-border-main bg-bg-tertiary text-text-main hover:bg-bg-main transition-colors"
                    >
                      {t('common.cancel') || 'Cancelar'}
                    </button>
                    <button
                      onClick={handlePinChange}
                      className="flex-1 btn-golden"
                    >
                      {t('common.save') || 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- MANTENIMIENTO --- */}
          <div className={`space-y-8 ${activeTab === 'maintenance' ? '' : 'hidden'}`}>
            <div className="bg-bg-secondary p-6 rounded-lg border border-red-500/50 shadow-sm">
              <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                <i data-feather="alert-triangle" className="w-6 h-6"></i>
                {t('settings.maintenance.dangerZone')}
              </h3>
              <p className="text-text-muted mb-6">{t('settings.maintenance.resetWarning')}</p>
              <button onClick={handleSeedDatabase} className="bg-red-600 text-white font-bold py-3 px-6 rounded-md hover:bg-red-700 transition-colors shadow-md">
                {t('settings.maintenance.resetBtn')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default ConfiguracionPage;
// ===== FIN: src/pages/ConfiguracionPage.jsx =====