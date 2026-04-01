import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { ThemeContext, THEME_LIST } from '../../context/ThemeContext';
import { GLOBAL_CURRENCY_DATA } from '../../lib/currencyData';
import feather from 'feather-icons';
import toast from 'react-hot-toast';
import { useStorage } from '../../hooks/useStorage';
import { sbUpdate } from '../../supabase/db';

const AppearanceTab = () => {
    const { t, i18n } = useTranslation();
    const { currentLocale, setCurrentCurrency, config, businessId } = useData();
    const { theme: currentTheme, setTheme } = useContext(ThemeContext);
    const { uploadFile, progress, isUploading } = useStorage();
    const [selectedCountryCode, setSelectedCountryCode] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        const currentCountry = GLOBAL_CURRENCY_DATA.find(c => c.locale === currentLocale);
        if (currentCountry) {
            setSelectedCountryCode(currentCountry.code);
        }
        const settings = config?.find(c => c.id === 'settings');
        if (settings?.logoUrl) {
            setLogoUrl(settings.logoUrl);
        }
    }, [currentLocale, config]);

    useEffect(() => {
        feather.replace();
    }, [logoUrl, currentTheme]);

    const handleCountryChange = (e) => {
        setSelectedCountryCode(e.target.value);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const url = await uploadFile(file, 'branding/logo');
            setLogoUrl(url);

            if (businessId) {
              await sbUpdate('config', businessId, { logoUrl: url });
            }

            toast.success("Logo actualizado correctamente");
        } catch (err) {
            console.warn("Error uploading logo:", err);
            toast.error("Error al subir logo");
        }
    };

    const handleThemeChange = async (themeId) => {
        setTheme(themeId);
        toast.success(`Tema "${THEME_LIST.find(t => t.id === themeId)?.label}" aplicado`);

        // Save theme preference to Supabase (as business default)
        try {
            if (businessId) {
                await sbUpdate('config', businessId, { theme: themeId });
            }
        } catch (err) {
            console.warn('Error saving theme to Supabase:', err);
        }
    };

    const handleSave = () => {
        const selectedCountry = GLOBAL_CURRENCY_DATA.find(c => c.code === selectedCountryCode);
        if (selectedCountry) {
            setCurrentCurrency(selectedCountry.locale, selectedCountry.symbol);
            toast.success(t('common.success'));
        }
    };

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Theme Selector ── */}
            <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm">
                <h3 className="text-xl font-bold text-text-main mb-2 pb-2 border-b border-border-main flex items-center gap-2">
                    🎨 Tema Visual
                </h3>
                <p className="text-text-muted text-sm mb-5">
                    Elige el estilo visual que mejor represente tu negocio. Los cambios se aplican al instante.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {THEME_LIST.map((themeItem) => {
                        const isActive = currentTheme === themeItem.id;
                        return (
                            <button
                                key={themeItem.id}
                                onClick={() => handleThemeChange(themeItem.id)}
                                className={`theme-card text-left ${isActive ? 'theme-card--active' : ''}`}
                                style={isActive ? { borderColor: themeItem.colors[2] } : {}}
                            >
                                {/* Check indicator */}
                                <div
                                    className="theme-card__check"
                                    style={{ background: themeItem.colors[2], color: themeItem.isDark ? '#000' : '#fff' }}
                                >
                                    ✓
                                </div>

                                {/* Color preview bars */}
                                <div className="theme-card__preview">
                                    <div className="theme-card__color-bar" style={{ background: themeItem.colors[0] }} />
                                    <div className="theme-card__color-bar" style={{ background: themeItem.colors[1] }} />
                                    <div className="theme-card__color-bar" style={{ background: themeItem.colors[2] }} />
                                    <div className="theme-card__color-bar" style={{ background: themeItem.colors[3] }} />
                                    <div className="theme-card__color-bar" style={{ background: themeItem.colors[4] }} />
                                </div>

                                {/* Label */}
                                <div className="theme-card__label">
                                    <span>{themeItem.emoji}</span>
                                    <span>{themeItem.label}</span>
                                </div>
                                <p className="text-[0.68rem] text-text-muted mt-1 leading-tight">
                                    {themeItem.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Branding, Language & Currency ── */}
            <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm">
                <h3 className="text-xl font-bold text-text-main mb-6 pb-2 border-b border-border-main">
                    {t('settings.appearance.title')}
                </h3>

                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-text-main">
                            Logo del Negocio
                        </label>
                        <div className="flex items-center gap-4">
                            {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />}
                            <label className="cursor-pointer btn-golden px-4 py-2 text-sm flex items-center gap-2">
                                <i data-feather="upload"></i>
                                {isUploading ? `Subiendo ${Math.round(progress)}%` : 'Subir Logo'}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    accept="image/*"
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-text-main">
                            {t('settings.appearance.language')}
                        </label>
                        <select value={i18n.language} onChange={handleLanguageChange} className="bg-bg-input border border-border-input rounded p-2 text-text-main w-40 focus:border-accent focus:outline-none">
                            <option value="es">🇪🇸 Español</option>
                            <option value="en">🇬🇧 English</option>
                            <option value="pt">🇧🇷 Português</option>
                            <option value="fr">🇫🇷 Français</option>
                            <option value="it">🇮🇹 Italiano</option>
                            <option value="de">🇩🇪 Deutsch</option>
                        </select>
                    </div>

                    {/* Global Currency Selection */}
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-text-main">
                            País / Moneda
                        </label>
                        <select
                            value={selectedCountryCode}
                            onChange={handleCountryChange}
                            className="bg-bg-input border border-border-input rounded p-2 text-text-main w-48 focus:border-accent focus:outline-none"
                        >
                            <option value="" disabled>Seleccionar País</option>
                            {GLOBAL_CURRENCY_DATA.map((country) => (
                                <option key={country.code} value={country.code}>
                                    {country.country} ({country.symbol})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 text-right">
                    <button
                        onClick={handleSave}
                        className="btn-golden px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppearanceTab;
