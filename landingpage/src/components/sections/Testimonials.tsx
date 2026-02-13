import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';
import { Icons } from '../ui/Icons';

export const Testimonials = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const { t } = useLanguage();
    return (
        <section className={`py-24 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            <div className="container mx-auto px-6 max-w-7xl">
                <AnimatedSection>
                    <h2 className={`text-3xl md:text-4xl font-black text-center mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.testimonials.title}</h2>
                    <p className={`text-xl text-center mb-16 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.testimonials.subtitle}</p>
                </AnimatedSection>
                <div className="grid md:grid-cols-3 gap-8">
                    {t.testimonials.list.map((item: any, i: number) => (
                        <AnimatedSection key={i} delay={i * 100}>
                            <div className={`p-8 rounded-3xl h-full flex flex-col ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'} shadow-xl`}>
                                <div className="flex gap-1 mb-6 text-[#f6e05e]">
                                    {[1, 2, 3, 4, 5].map(s => <Icons.Star key={s} />)}
                                </div>
                                <p className="text-lg mb-6 italic flex-1">"{item.text}"</p>
                                <div>
                                    <div className="font-bold text-[#f6e05e]">{item.name}</div>
                                    <div className="text-sm opacity-60">{item.salon}</div>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
};
