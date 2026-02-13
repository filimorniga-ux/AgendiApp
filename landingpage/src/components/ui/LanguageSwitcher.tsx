import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageSwitcher = () => {
    const { lang, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all duration-300 group cursor-pointer"
        >
            <span className={`text-lg transition-transform duration-300 ${lang === 'es' ? 'scale-110' : 'scale-90 grayscale opacity-50'}`}>🇪🇸</span>
            <span className="w-px h-4 bg-white/20 mx-1"></span>
            <span className={`text-lg transition-transform duration-300 ${lang === 'en' ? 'scale-110' : 'scale-90 grayscale opacity-50'}`}>🇺🇸</span>
        </button>
    );
};
