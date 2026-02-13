import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeButton } from '../ui/ThemeButton';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

// Isotipo Moneda Dorada "Tech Premium"
const LOGO_URL = "https://placehold.co/100x100/F6E05E/1A202C?text=$";

interface HeaderProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    user: any;
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, user, onLoginClick, onRegisterClick, onLogout }) => {
    const { t } = useLanguage();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled || user ? 'py-2 glass-panel' : 'py-6 bg-transparent'}`}>
            <nav className="container mx-auto px-6 flex justify-between items-center max-w-7xl">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <img src={LOGO_URL} alt="AgendiApp" className="w-10 h-10 rounded-full shadow-lg group-hover:rotate-12 transition-transform duration-300" />
                    <span className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        AGENDI<span className="text-[#f6e05e]">APP</span>
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {!user && ['features', 'ecosystem', 'tutorials', 'pricing', 'contact'].map((item) => (
                        <a
                            key={item}
                            href={`#${item}`}
                            className={`text-sm font-medium hover:text-[#f6e05e] transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
                        >
                            {t.nav[item as keyof typeof t.nav]}
                        </a>
                    ))}

                    <div className="h-6 w-px bg-slate-500/30"></div>
                    <LanguageSwitcher />
                    <ThemeButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

                    {!user ? (
                        <>
                            <button onClick={onLoginClick} className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} hover:text-[#f6e05e]`}>
                                {t.nav.login}
                            </button>
                            <button
                                onClick={onRegisterClick}
                                className="px-5 py-2.5 rounded-lg font-bold text-sm bg-[#f6e05e] text-[#1a202c] shadow-[0_0_20px_-5px_rgba(246,224,94,0.6)] hover:shadow-[0_0_25px_-5px_rgba(246,224,94,0.8)] hover:-translate-y-0.5 transition-all duration-300"
                            >
                                {t.nav.register}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onLogout}
                            className="px-5 py-2.5 rounded-lg font-bold text-sm bg-slate-800 text-white border border-slate-700 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 transition-all"
                        >
                            {t.nav.logout}
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
};
