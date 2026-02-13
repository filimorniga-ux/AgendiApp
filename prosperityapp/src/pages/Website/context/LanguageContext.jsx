import React, { useState, createContext, useContext } from 'react';
import { translations } from '../lib/i18n';

const LanguageContext = createContext({
    lang: 'es',
    t: translations.es,
    toggleLanguage: () => { }
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState('es');

    const toggleLanguage = () => {
        setLang(prev => prev === 'es' ? 'en' : 'es');
    };

    return (
        <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
