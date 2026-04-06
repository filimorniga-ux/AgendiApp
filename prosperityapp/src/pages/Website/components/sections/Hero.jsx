import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';

export const Hero = ({ isDarkMode, onRegisterClick }) => {
    const { t } = useLanguage();
    
    // Video local optimizado (sin audio, faststart, bitrate reducido)
    // WebM (VP9) es preferido por ser más ligero; MP4 (H.264) como fallback universal.

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Video */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                >
                    <source src="/videos/hero-landing.webm" type="video/webm" />
                    <source src="/videos/hero-landing.mp4" type="video/mp4" />
                </video>
                {/* Gradient Overlay para máxima legibilidad, enfatizando el "Dark / Gold luxury" */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
                {/* Acento Gold Sutil de fondo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f6e05e] rounded-full opacity-[0.03] blur-[150px] pointer-events-none z-10"></div>
            </div>

            {/* Content Foreground */}
            <div className="relative z-20 container mx-auto px-6 text-center max-w-6xl pt-20">
                <AnimatedSection>
                    {/* Badge Glassmorphism */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-10 shadow-2xl">
                        <span className="w-2 h-2 rounded-full bg-[#f6e05e] animate-pulse shadow-[0_0_10px_#f6e05e]"></span> 
                        AgendiApp 2026 Edition
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter text-white drop-shadow-2xl">
                        {t.hero.title}
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="text-xl md:text-3xl mb-14 max-w-3xl mx-auto leading-relaxed text-slate-300 font-light tracking-wide">
                        {t.hero.subtitle}
                    </p>
                    
                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <button
                            onClick={onRegisterClick}
                            className="px-12 py-5 rounded-2xl font-black text-lg bg-[#f6e05e] text-slate-950 shadow-[0_15px_50px_-10px_rgba(246,224,94,0.4)] hover:scale-105 hover:shadow-[0_20px_60px_-10px_rgba(246,224,94,0.6)] hover:bg-[#ffe866] transition-all duration-500 uppercase tracking-widest relative overflow-hidden group"
                        >
                            <span className="relative z-10">{t.hero.cta_primary}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                        </button>
                        <button 
                            className="px-12 py-5 rounded-2xl font-bold text-lg text-white bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl uppercase tracking-widest"
                        >
                            {t.hero.cta_secondary}
                        </button>
                    </div>
                </AnimatedSection>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 opacity-60 animate-bounce">
                <span className="text-white/50 text-xs tracking-widest uppercase font-bold">Descubre Más</span>
                <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
            </div>
        </section>
    );
};
