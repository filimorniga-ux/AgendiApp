/**
 * BusinessProfileTab — Perfil público del negocio
 * 
 * Permite al owner/admin gestionar cómo se ve su negocio en:
 * - La bolsa de empleo (landing page)
 * - El directorio público de negocios
 * 
 * Campos: descripción, sector, redes sociales, logo, fotos, ubicación, toggle is_public
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';
import { useStorage } from '../../hooks/useStorage';
import toast from 'react-hot-toast';
import PhoneInput from '../../components/ui/PhoneInput';

const SECTORS = [
  'barbershop', 'salon', 'spa', 'clinic', 'nails', 'restaurant', 'other'
];

const BusinessProfileTab = () => {
  
  const { uploadFile } = useStorage();

  const [profile, setProfile] = useState({
    description: '',
    sector: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    website_url: '',
    logo_url: '',
    photos: [],
    lat: null,
    lng: null,
    is_public: false,
    city: '',
    country: '',
    country_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  // Cargar perfil del negocio
  useEffect(() => {
    if (!businessId) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('description, sector, instagram, facebook, tiktok, website_url, logo_url, photos, lat, lng, is_public, city, country, country_code')
        .eq('id', businessId)
        .single();
      
      if (!error && data) {
        setProfile(prev => ({ ...prev, ...data, photos: data.photos || [] }));
        if (data.logo_url) setLogoPreview(data.logo_url);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [businessId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview local
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);

    try {
      const path = `business-logos/${businessId}/${Date.now()}_${file.name}`;
      const { publicUrl } = await uploadFile('business-assets', path, file);
      setProfile(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo subido');
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast.error('Error subiendo logo');
    }
  };

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          description: profile.description || null,
          sector: profile.sector || null,
          instagram: profile.instagram || null,
          facebook: profile.facebook || null,
          tiktok: profile.tiktok || null,
          website_url: profile.website_url || null,
          logo_url: profile.logo_url || null,
          photos: profile.photos,
          lat: profile.lat ? parseFloat(profile.lat) : null,
          lng: profile.lng ? parseFloat(profile.lng) : null,
          is_public: profile.is_public,
          city: profile.city || null,
          country: profile.country || null,
          country_code: profile.country_code || null,
        })
        .eq('id', businessId);

      if (error) throw error;
      toast.success(t('businessProfile.saved'));
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm animate-pulse">
        <div className="h-6 bg-bg-tertiary rounded w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-bg-tertiary rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm animate-fade-in space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border-main">
        <h3 className="text-xl font-bold text-text-main">{t('businessProfile.title')}</h3>
        <p className="text-sm text-text-muted mt-1">{t('businessProfile.subtitle')}</p>
      </div>

      {/* Toggle público */}
      <div className="flex items-center justify-between bg-bg-tertiary p-4 rounded-lg border border-border-main">
        <div>
          <p className="text-sm font-semibold text-text-main">{t('businessProfile.isPublic')}</p>
          <p className="text-xs text-text-muted mt-1">{t('businessProfile.isPublicHelp')}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="is_public"
            checked={profile.is_public}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
        </label>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-main">{t('businessProfile.logoUrl')}</label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo"
              className="w-16 h-16 rounded-lg object-cover border border-border-main"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-bg-tertiary border border-dashed border-border-main flex items-center justify-center text-text-muted">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <label className="cursor-pointer bg-bg-tertiary border border-border-main px-4 py-2 rounded-lg text-sm text-text-main hover:bg-accent hover:text-accent-text transition-colors">
            Subir logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-main">{t('businessProfile.description')}</label>
        <textarea
          name="description"
          value={profile.description || ''}
          onChange={handleChange}
          rows={3}
          placeholder="Cuéntale al mundo sobre tu negocio..."
          className="w-full bg-bg-tertiary border border-border-main rounded-lg p-3 text-text-main text-sm focus:border-accent focus:outline-none resize-none"
        />
        <p className="text-xs text-text-muted text-right">{(profile.description || '').length}/500</p>
      </div>

      {/* Sector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-main">{t('businessProfile.sector')}</label>
        <select
          name="sector"
          value={profile.sector || ''}
          onChange={handleChange}
          className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Seleccionar sector...</option>
          {SECTORS.map(s => (
            <option key={s} value={s}>{t(`jobBoard.sectors.${s}`)}</option>
          ))}
        </select>
      </div>

      {/* Redes Sociales */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-text-main flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {t('businessProfile.socialMedia')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'instagram', icon: '📸', placeholder: '@tu_negocio' },
            { name: 'facebook', icon: '📘', placeholder: 'facebook.com/tu_negocio' },
            { name: 'tiktok', icon: '🎵', placeholder: '@tu_negocio' },
            { name: 'website_url', icon: '🌐', placeholder: 'https://tu-sitio.com' },
          ].map(({ name, icon, placeholder }) => (
            <div key={name} className="flex items-center gap-2 bg-bg-tertiary border border-border-main rounded-lg px-3 py-2">
              <span className="text-base">{icon}</span>
              <input
                type="text"
                name={name}
                value={profile[name] || ''}
                onChange={handleChange}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-text-main text-sm focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ubicación */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-text-main flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('businessProfile.location')}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted">{t('businessProfile.latitude')}</label>
            <input
              type="number"
              step="any"
              name="lat"
              value={profile.lat || ''}
              onChange={handleChange}
              placeholder="4.7110"
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted">{t('businessProfile.longitude')}</label>
            <input
              type="number"
              step="any"
              name="lng"
              value={profile.lng || ''}
              onChange={handleChange}
              placeholder="-74.0721"
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-text-muted">
          💡 Tip: Busca las coordenadas de tu negocio en Google Maps (clic derecho → copiar coordenadas).
        </p>
      </div>

      {/* Botón guardar */}
      <div className="pt-4 border-t border-border-main">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 bg-accent text-accent-text rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </div>
  );
};

export default BusinessProfileTab;
