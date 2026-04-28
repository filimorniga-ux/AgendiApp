/**
 * JobCampaignModal — Modal para crear/editar una oferta de empleo
 * 
 * Campos: título, descripción, requisitos, beneficios, ubicación geo,
 * sector, tipo de puesto, compensación, contacto (WhatsApp/email), expiración.
 * 
 * Usa PhoneInput para WhatsApp de contacto con formato E.164.
 * Usa country-state-city para cascada País → Estado → Ciudad.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Country, State, City } from 'country-state-city';
import PhoneInput from '../../components/ui/PhoneInput';

const SECTORS = ['barbershop', 'salon', 'spa', 'clinic', 'nails', 'restaurant', 'other'];
const POSITION_TYPES = ['full_time', 'part_time', 'freelance', 'temporary'];

const JobCampaignModal = ({ isOpen, onClose, onSave, campaign = null, businessCountryCode = '' }) => {
  const { t } = useTranslation();

  const emptyForm = {
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    country: '',
    country_code: '',
    state: '',
    state_code: '',
    city: '',
    sector: '',
    position_type: 'full_time',
    compensation_type: 'fixed_salary',
    salary_fixed: '',
    salary_approximate: '',
    commission_percentage: '',
    commission_details: '',
    contact_whatsapp: '',
    contact_email: '',
    status: 'active',
    expires_at: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaign) {
      setForm({
        ...emptyForm,
        ...campaign,
        salary_fixed: campaign.salary_fixed?.toString() || '',
        commission_percentage: campaign.commission_percentage?.toString() || '',
        expires_at: campaign.expires_at ? campaign.expires_at.split('T')[0] : '',
      });
    } else {
      // Pre-fill country from business config
      if (businessCountryCode) {
        const countryObj = Country.getCountryByCode(businessCountryCode);
        setForm({
          ...emptyForm,
          country_code: businessCountryCode,
          country: countryObj?.name || '',
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [campaign, isOpen, businessCountryCode]);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => form.country_code ? State.getStatesOfCountry(form.country_code) : [], [form.country_code]);
  const cities = useMemo(() => form.state_code && form.country_code ? City.getCitiesOfState(form.country_code, form.state_code) : [], [form.country_code, form.state_code]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    const obj = Country.getCountryByCode(code);
    setForm(prev => ({
      ...prev,
      country_code: code,
      country: obj?.name || '',
      state_code: '',
      state: '',
      city: '',
    }));
  };

  const handleStateChange = (e) => {
    const code = e.target.value;
    const obj = State.getStateByCodeAndCountry(code, form.country_code);
    setForm(prev => ({
      ...prev,
      state_code: code,
      state: obj?.name || '',
      city: '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        salary_fixed: form.salary_fixed ? parseFloat(form.salary_fixed) : null,
        commission_percentage: form.commission_percentage ? parseFloat(form.commission_percentage) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      onClose();
    } catch (err) {
      console.error('Error saving campaign:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-secondary rounded-xl border border-border-main shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-main p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-text-main">
            {campaign ? t('jobBoard.editCampaign') : t('jobBoard.createCampaign')}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Título */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-text-main">{t('jobBoard.campaignTitle')} *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej: Estilista Senior con experiencia"
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-text-main">{t('jobBoard.campaignDescription')}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe las responsabilidades del cargo..."
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Requisitos y Beneficios (lado a lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">{t('jobBoard.requirements')}</label>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={3}
                placeholder="• 2 años de experiencia&#10;• Manejo de colorimetría"
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">{t('jobBoard.benefits')}</label>
              <textarea
                name="benefits"
                value={form.benefits}
                onChange={handleChange}
                rows={3}
                placeholder="• Horario flexible&#10;• Comisiones competitivas"
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Sector + Tipo de puesto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">{t('jobBoard.sector')}</label>
              <select
                name="sector"
                value={form.sector}
                onChange={handleChange}
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {SECTORS.map(s => (
                  <option key={s} value={s}>{t(`jobBoard.sectors.${s}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">{t('jobBoard.positionType')}</label>
              <select
                name="position_type"
                value={form.position_type}
                onChange={handleChange}
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
              >
                {POSITION_TYPES.map(pt => (
                  <option key={pt} value={pt}>{t(`jobBoard.positionTypes.${pt}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ubicación: País → Estado → Ciudad */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              📍 Ubicación de la oferta
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                name="country_code"
                value={form.country_code}
                onChange={handleCountryChange}
                className="bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
              >
                <option value="">País...</option>
                {countries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>
                ))}
              </select>
              <select
                name="state_code"
                value={form.state_code}
                onChange={handleStateChange}
                disabled={!form.country_code}
                className="bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none disabled:opacity-50"
              >
                <option value="">Estado...</option>
                {states.map(s => (
                  <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                ))}
              </select>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                disabled={!form.state_code}
                className="bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none disabled:opacity-50"
              >
                <option value="">Ciudad...</option>
                {cities.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Compensación */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-main">💰 Compensación</h4>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-main">Modalidad de Compensación</label>
              <select
                name="compensation_type"
                value={form.compensation_type || 'fixed_salary'}
                onChange={handleChange}
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none mb-2"
              >
                <option value="percentage">Porcentaje</option>
                <option value="chair_rental">Arrendamiento de sillón</option>
                <option value="fixed_salary">Salario fijo</option>
                <option value="to_agree">A convenir</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-muted">{t('jobBoard.salaryFixed')}</label>
                <input
                  type="number"
                  name="salary_fixed"
                  value={form.salary_fixed}
                  onChange={handleChange}
                  placeholder="Ej: 1500000"
                  className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">{t('jobBoard.salaryApproximate')}</label>
                <input
                  type="text"
                  name="salary_approximate"
                  value={form.salary_approximate}
                  onChange={handleChange}
                  placeholder="Ej: Competitivo, A convenir"
                  className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">{t('jobBoard.commissionPercentage')} (%)</label>
                <input
                  type="number"
                  name="commission_percentage"
                  value={form.commission_percentage}
                  onChange={handleChange}
                  placeholder="Ej: 40"
                  min="0"
                  max="100"
                  className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">{t('jobBoard.commissionDetails')}</label>
                <input
                  type="text"
                  name="commission_details"
                  value={form.commission_details}
                  onChange={handleChange}
                  placeholder="Ej: 40% servicios + 10% ventas"
                  className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-main">📞 Contacto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PhoneInput
                label={t('jobBoard.contactWhatsapp')}
                name="contact_whatsapp"
                value={form.contact_whatsapp}
                countryCode={form.country_code || businessCountryCode}
                onChange={handleChange}
                showWhatsAppIcon={true}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-main">{t('jobBoard.contactEmail')}</label>
                <input
                  type="email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={handleChange}
                  placeholder="rrhh@tunegocio.com"
                  className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Expiración + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">{t('jobBoard.expiresAt')}</label>
              <input
                type="date"
                name="expires_at"
                value={form.expires_at}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-main">Estado</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
              >
                <option value="active">{t('jobBoard.status.active')}</option>
                <option value="paused">{t('jobBoard.status.paused')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-bg-secondary border-t border-border-main p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            data-testid="btn-save-campaign"
            className="px-6 py-2 bg-accent text-accent-text rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCampaignModal;
