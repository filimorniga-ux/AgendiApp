import React, { useState, createContext, useContext } from 'react';
import { translations, Language } from '../lib/i18n';

const LanguageContext = createContext<{
    lang: Language;
    t: typeof translations['es'];
    toggleLanguage: () => void;
}>({
    lang: 'es',
    t: translations.es,
    toggleLanguage: () => { }
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState<Language>('es');

    const toggleLanguage = () => {
        setLang(prev => prev === 'es' ? 'en' : 'es');
    };

    return (
        <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
