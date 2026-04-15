// ===== INICIO: src/pages/ConfiguracionPage.jsx (Sprint 111 - Traducido) =====
import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { useBusiness } from '../context/BusinessContext';
import { sbUpdate } from '../supabase/db';
import { supabase } from '../supabase/client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import AppearanceTab from './Settings/AppearanceTab';
import TicketEditorTab from './Settings/TicketEditorTab';
import ClientAcquisitionTab from './Settings/ClientAcquisitionTab';
import { useStorage } from '../hooks/useStorage';

const ConfiguracionPage = () => {
  const { t } = useTranslation();
  const { config, collaborators, isLoading, businessId } = useData();
  const { uploadFile } = useStorage();
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [businessSlug, setBusinessSlug] = useState('');

  const [activeTab, setActiveTab] = useState('accounting');
  const [formData, setFormData] = useState({});
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinChangeData, setPinChangeData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [pinError, setPinError] = useState('');

  const settings = useMemo(() => config?.[0] || {
    taxGeneral: 19,
    partners: [],
    theme: 'dark',
    brandName: 'Gema',
    logoUrl: null,
    taxOverrides: {},
    salesCommissionGeneral: 10,
    securityPin: '1234'
  }, [config]);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Fetch business-level fields (whatsapp, slug)
  useEffect(() => {
    if (!businessId) return;
    supabase.from('businesses').select('whatsapp_phone, slug').eq('id', businessId).single()
      .then(({ data }) => {
        if (data) {
          setWhatsappPhone(data.whatsapp_phone || '');
          setBusinessSlug(data.slug || '');
        }
      });
  }, [businessId]);

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
      if (totalPercent !== 100 && (formData.partners || []).length > 0) {
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
      // Also save business-level fields (whatsapp, slug) to businesses table
      if (businessId) {
        await supabase.from('businesses').update({
          whatsapp_phone: whatsappPhone || null,
          slug: businessSlug || null,
        }).eq('id', businessId);
      }
    } else if (tabKey === 'ticket') {
      dataToSave = { ticketConfig: formData.ticketConfig };
    }
    try {
      if (!businessId) throw new Error('Business ID no disponible');
      const rowId = settings?.id || businessId;
      const { error } = await sbUpdate('config', rowId, dataToSave);
      if (error) throw error;
      toast.success(t('common.success'));
    } catch (error) {
      console.warn('Error saving configuration: ', error);
      toast.error(t('common.error'));
    }
  };



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

  const settingsTabs = [
    { id: 'appearance', icon: 'pen-tool', label: t('settings.tabs.appearance') },
    { id: 'client-acquisition', icon: 'link', label: 'Reserva & Códigos QR' },
    { id: 'company', icon: 'briefcase', label: t('settings.tabs.company') },
    { id: 'ticket', icon: 'file-text', label: 'Ticket de Venta' },
    { id: 'accounting', icon: 'dollar-sign', label: t('settings.tabs.accounting') },
    { id: 'security', icon: 'lock', label: t('settings.tabs.security') },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main">{t('settings.title')}</h2>
          <p className="text-text-muted text-sm">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Mobile: horizontal pill nav — Desktop: side nav */}
      <div className="flex lg:hidden overflow-x-auto gap-1 mb-4 pb-1 border-b border-border-main">
        {settingsTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab.id ? 'bg-accent text-accent-text' : 'bg-bg-secondary text-text-muted border border-border-main hover:bg-bg-tertiary'}`}
          >
            <i data-feather={tab.icon} className="w-4 h-4"></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 overflow-y-auto pb-24 sm:pb-4">
        {/* Desktop side nav */}
        <div className="hidden lg:block lg:w-1/4">
          <nav id="settings-tabs" className="flex flex-col space-y-1">
            {settingsTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`p-3 rounded-md text-left flex items-center gap-3 transition-colors ${activeTab === tab.id ? 'bg-accent text-accent-text font-bold' : 'text-text-muted hover:bg-bg-tertiary'}`}
              >
                <i data-feather={tab.icon} className="w-5 h-5"></i> {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {/* --- APARIENCIA --- */}
          <div className={`space-y-8 ${activeTab === 'appearance' ? '' : 'hidden'}`}>
            <AppearanceTab />
          </div>

          {/* --- CÓDIGO QR / RESERVAS --- */}
          <div className={`space-y-8 ${activeTab === 'client-acquisition' ? '' : 'hidden'}`}>
            <ClientAcquisitionTab />
          </div>

          {/* --- TICKET DE VENTA --- */}
          <div className={`space-y-6 ${activeTab === 'ticket' ? '' : 'hidden'}`}>
            <div className="flex flex-col gap-1 mb-2">
              <h3 className="text-xl font-bold text-text-main">Editor de Ticket de Venta</h3>
              <p className="text-sm text-text-muted">Personaliza qué información aparece en el ticket que recibe el cliente al pagar.</p>
            </div>
            <TicketEditorTab />
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

                {/* WhatsApp para clientes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    WhatsApp del comercio
                  </label>
                  <input
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="Ej: +573001234567 (con código de país)"
                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                  />
                  <p className="text-xs text-text-muted">Este número aparecerá como botón flotante de WhatsApp en tu página pública.</p>
                </div>

                {/* Slug del comercio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">URL pública (slug)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-text-muted whitespace-nowrap">agendiapp.app/p/</span>
                    <input
                      type="text"
                      value={businessSlug}
                      onChange={(e) => setBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="mi-salon"
                      className="flex-1 bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-text-muted">Solo letras minúsculas, números y guiones. Este es el enlace que compartes con tus clientes.</p>
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

        </div>
      </div>
    </div>
  );
};
export default ConfiguracionPage;
// ===== FIN: src/pages/ConfiguracionPage.jsx =====