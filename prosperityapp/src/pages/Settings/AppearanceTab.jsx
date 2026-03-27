import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { GLOBAL_CURRENCY_DATA } from '../../lib/currencyData';
import feather from 'feather-icons';
import toast from 'react-hot-toast';
import { useStorage } from '../../hooks/useStorage'; // Import hook
import { doc, updateDoc, setDoc } from 'firebase/firestore'; // Import firestore functions
import { db } from '../../firebase/config'; // Import db

const AppearanceTab = () => {
    const { t, i18n } = useTranslation();
    const { currentLocale, setCurrentCurrency, config } = useData();
    const { uploadFile, progress, isUploading } = useStorage(); // Use hook
    const [selectedCountryCode, setSelectedCountryCode] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        // Find the country matching the current locale
        const currentCountry = GLOBAL_CURRENCY_DATA.find(c => c.locale === currentLocale);
        if (currentCountry) {
            setSelectedCountryCode(currentCountry.code);
        }
        // Load current logo from config if available
        const settings = config?.find(c => c.id === 'settings');
        if (settings?.logoUrl) {
            setLogoUrl(settings.logoUrl);
        }
    }, [currentLocale, config]);

    useEffect(() => {
        feather.replace();
    }, [logoUrl]);

    const handleCountryChange = (e) => {
        setSelectedCountryCode(e.target.value);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const url = await uploadFile(file, 'branding/logo');
            setLogoUrl(url);

            // Save directly to Firestore (usar setDoc con merge para crear si no existe)
            const settingsRef = doc(db, 'config', 'settings');
            await setDoc(settingsRef, { logoUrl: url }, { merge: true });

            toast.success("Logo actualizado correctamente");
        } catch (err) {
            console.warn("Error uploading logo:", err);
            toast.error("Error al subir logo");
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
                        <select value={i18n.language} onChange={handleLanguageChange} className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main w-40 focus:border-accent focus:outline-none">
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
                            className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main w-48 focus:border-accent focus:outline-none"
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
