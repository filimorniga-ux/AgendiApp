import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';
import { Icons } from '../ui/Icons';

export const Tutorials = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const { t } = useLanguage();

    return (
        <section id="tutorials" className="container mx-auto px-6 py-24 max-w-7xl">
            <AnimatedSection>
                <h2 className={`text-3xl md:text-5xl font-black text-center mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t.tutorials.title}
                </h2>
                <p className={`text-xl text-center mb-16 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.tutorials.subtitle}
                </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {t.tutorials.list.map((item: any, i: number) => (
                    <AnimatedSection key={i} delay={i * 30}>
                        <a
                            href="https://youtube.com"
                            target="_blank"
                            rel="noreferrer"
                            className={`group block p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl h-full flex flex-col ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-[#f6e05e]/50' : 'bg-white border-slate-200 hover:border-[#f6e05e]/50'}`}
                        >
                            <div className={`aspect-video rounded-xl mb-4 flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-900 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                <div className="text-[#f6e05e] group-hover:scale-110 transition-transform">
                                    <Icons.Play />
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <h3 className={`font-bold text-lg leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                                <div className="mt-4 pt-4 border-t border-slate-500/10 text-xs font-bold text-[#f6e05e] uppercase tracking-wider flex items-center gap-2">
                                    {t.tutorials.watch_btn} <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </div>
                        </a>
                    </AnimatedSection>
                ))}
            </div>
        </section>
    );
};
