import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeButton } from '../ui/ThemeButton';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { Icons, CloseIcon } from '../ui/Icons';

// Navbar Component

export const Header = ({ isDarkMode, toggleTheme, user, onLoginClick, onRegisterClick, onLogout }) => {
    const { t } = useLanguage();
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 z-50 w-full transition-all duration-500 border-b ${
            scrolled || user 
                ? isDarkMode 
                    ? 'py-2 bg-slate-950/90 backdrop-blur-xl border-white/10 shadow-2xl'
                    : 'py-2 bg-white/90 backdrop-blur-xl border-slate-200 shadow-sm'
                : 'py-5 bg-gradient-to-b from-black/70 via-black/30 to-transparent border-transparent'
        }`}>
            <nav className="container mx-auto px-6 flex justify-between items-center max-w-7xl">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <span className={`text-2xl font-black tracking-tighter ${
                        scrolled
                            ? isDarkMode ? 'text-white' : 'text-slate-900'
                            : 'text-white'
                    }`} style={!scrolled ? { textShadow: '0 1px 4px rgba(0,0,0,0.5)' } : undefined}>
                        AGENDI<span className="text-[#f6e05e]">APP</span>
                    </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {!user && ['features', 'ecosystem', 'tutorials', 'pricing', 'contact'].map((item) => (
                        <a
                            key={item}
                            href={`#${item}`}
                            className={`text-sm font-medium hover:text-[#f6e05e] transition-colors ${
                                scrolled
                                    ? isDarkMode ? 'text-slate-300' : 'text-slate-600'
                                    : 'text-white/90 hover:text-[#f6e05e]'
                            }`}
                            style={!scrolled ? { textShadow: '0 1px 3px rgba(0,0,0,0.6)' } : undefined}
                        >
                            {t.nav[item]}
                        </a>
                    ))}

                    <div className="h-6 w-px bg-slate-500/30"></div>
                    <LanguageSwitcher />
                    <ThemeButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

                    {!user ? (
                        <>
                            <button onClick={onLoginClick} className={`text-sm font-bold ${
                                scrolled
                                    ? isDarkMode ? 'text-white' : 'text-slate-900'
                                    : 'text-white'
                            } hover:text-[#f6e05e] transition-colors`}
                                style={!scrolled ? { textShadow: '0 1px 3px rgba(0,0,0,0.6)' } : undefined}
                            >
                                {t.nav.login}
                            </button>
                            <button
                                onClick={onRegisterClick}
                                className="px-5 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-[#f6e05e] to-[#d4a853] text-[#1a202c] shadow-[0_0_20px_-5px_rgba(246,224,94,0.6)] hover:shadow-[0_0_25px_-5px_rgba(246,224,94,0.8)] hover:-translate-y-0.5 transition-all duration-300"
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

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center gap-4">
                    <ThemeButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-lg ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'}`}>
                        {isMobileMenuOpen ? <CloseIcon /> : <Icons.Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <div className={`md:hidden absolute top-full left-0 w-full border-b ${isDarkMode ? 'bg-slate-950/95 border-white/10' : 'bg-white/95 border-slate-200'} backdrop-blur-3xl shadow-xl flex flex-col p-6 gap-6 animate-in slide-in-from-top-2 duration-300`}>
                    <LanguageSwitcher />

                    {!user && (
                        <div className="flex flex-col gap-4">
                            {['features', 'ecosystem', 'tutorials', 'pricing', 'contact'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`text-lg font-medium hover:text-[#f6e05e] transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
                                >
                                    {t.nav[item]}
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="h-px w-full bg-slate-500/20"></div>

                    <div className="flex flex-col gap-4">
                        {!user ? (
                            <>
                                <button
                                    onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                                    className={`w-full py-4 rounded-xl font-bold ${isDarkMode ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'} transition-colors`}
                                >
                                    {t.nav.login}
                                </button>
                                <button
                                    onClick={() => { onRegisterClick(); setIsMobileMenuOpen(false); }}
                                    className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-[#f6e05e] to-[#d4a853] text-[#1a202c] shadow-lg transition-all"
                                >
                                    {t.nav.register}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                                className="w-full py-4 rounded-xl font-bold bg-slate-800 text-white border border-slate-700 hover:bg-red-500/20 hover:text-red-200 transition-all"
                            >
                                {t.nav.logout}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};
