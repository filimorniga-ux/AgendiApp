import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';

export const Hero = ({ isDarkMode, onRegisterClick }) => {
    const { t } = useLanguage();
    return (
        <section className="relative pt-48 pb-32 px-6 text-center max-w-6xl mx-auto">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f6e05e] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"></div>

            <AnimatedSection>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f6e05e]/10 border border-[#f6e05e]/20 text-[#f6e05e] text-xs font-bold uppercase tracking-wider mb-8">
                    <span className="w-2 h-2 rounded-full bg-[#f6e05e] animate-pulse"></span> v3.0 Release
                </div>
                <h1 className={`text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t.hero.title}
                </h1>
                <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t.hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                    <button
                        onClick={onRegisterClick}
                        className="px-10 py-4 rounded-xl font-bold text-lg bg-[#f6e05e] text-[#1a202c] shadow-[0_10px_40px_-10px_rgba(246,224,94,0.5)] hover:scale-105 hover:shadow-[0_20px_60px_-15px_rgba(246,224,94,0.6)] transition-all duration-300"
                    >
                        {t.hero.cta_primary}
                    </button>
                    <button className={`px-10 py-4 rounded-xl font-bold text-lg border transition-all duration-300 ${isDarkMode ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-900 hover:bg-slate-100'}`}>
                        {t.hero.cta_secondary}
                    </button>
                </div>
            </AnimatedSection>
        </section>
    );
};
