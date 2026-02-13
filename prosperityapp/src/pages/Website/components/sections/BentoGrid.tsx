import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';
import { Icons } from '../ui/Icons';

const BentoCard = ({ title, desc, icon: Icon, colSpan = 1, isDarkMode }: any) => (
    <div className={`
    group relative overflow-hidden rounded-3xl p-8 
    ${colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1'}
    ${isDarkMode
            ? 'bg-[#1a202c]/40 border border-white/10 hover:border-[#f6e05e]/50 hover:bg-[#1a202c]/60'
            : 'bg-white/60 border border-slate-200 hover:border-[#f6e05e]/50'}
    backdrop-blur-xl transition-all duration-500 hover:shadow-2xl
  `}>
        {/* Hover Gradient Effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none
      ${isDarkMode
                ? 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#f6e05e]/10 via-transparent to-transparent'
                : 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#f6e05e]/20 via-transparent to-transparent'
            }
    `}></div>

        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 text-[#f6e05e]">
            <Icon />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-end">
            <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 text-[#f6e05e] group-hover:bg-[#f6e05e] group-hover:text-slate-900' : 'bg-slate-100 text-slate-900 group-hover:bg-[#f6e05e] group-hover:text-white'}`}>
                <Icon />
            </div>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{desc}</p>
        </div>
    </div>
);

export const BentoGrid = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const { t } = useLanguage();
    return (
        <section id="features" className="container mx-auto px-6 py-24 max-w-7xl">
            <AnimatedSection>
                <h2 className={`text-3xl md:text-5xl font-black text-center mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t.bento.title}
                </h2>
                <p className={`text-xl text-center mb-16 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.bento.subtitle}
                </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
                <AnimatedSection delay={100}>
                    <BentoCard colSpan={2} isDarkMode={isDarkMode} title={t.bento.calc_title} desc={t.bento.calc_desc} icon={Icons.Calculator} />
                </AnimatedSection>
                <AnimatedSection delay={200}>
                    <BentoCard isDarkMode={isDarkMode} title={t.bento.stock_title} desc={t.bento.stock_desc} icon={Icons.Beaker} />
                </AnimatedSection>
                <AnimatedSection delay={300}>
                    <BentoCard isDarkMode={isDarkMode} title={t.bento.tips_title} desc={t.bento.tips_desc} icon={Icons.CreditCard} />
                </AnimatedSection>
                <AnimatedSection delay={400}>
                    <BentoCard colSpan={2} isDarkMode={isDarkMode} title={t.bento.gift_title} desc={t.bento.gift_desc} icon={Icons.Gift} />
                </AnimatedSection>
                <AnimatedSection delay={500}>
                    <BentoCard isDarkMode={isDarkMode} title={t.bento.agenda_title} desc={t.bento.agenda_desc} icon={Icons.Calendar} />
                </AnimatedSection>
            </div>
        </section>
    );
};
