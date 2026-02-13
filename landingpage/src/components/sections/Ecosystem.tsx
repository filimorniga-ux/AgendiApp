import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';
import { Icons } from '../ui/Icons';

export const Ecosystem = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const { t } = useLanguage();

    const platforms = [
        { Icon: Icons.Windows, label: "Windows", bg: "bg-blue-600" },
        { Icon: Icons.Apple, label: "macOS & iOS", bg: "bg-gray-900" },
        { Icon: Icons.Android, label: "Android", bg: "bg-green-600" },
        { Icon: Icons.Beaker, label: "Web (Cloud)", bg: "bg-purple-600" }
    ];

    return (
        <section id="ecosystem" className={`py-24 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100/50'}`}>
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <AnimatedSection>
                        <h2 className={`text-4xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.ecosystem.title}</h2>
                        <p className={`text-xl mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.ecosystem.subtitle}</p>
                        <div className="space-y-4">
                            {[t.ecosystem.role_admin, t.ecosystem.role_staff, t.ecosystem.role_client].map((role: string, i: number) => (
                                <div key={i} className={`flex items-center p-4 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                                    <div className="w-2 h-2 rounded-full bg-[#f6e05e] mr-4"></div>
                                    <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{role}</span>
                                </div>
                            ))}
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={200}>
                        <div className="grid grid-cols-2 gap-4">
                            {platforms.map((p, i) => (
                                <button key={i} className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-transform hover:scale-105 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-50'} shadow-xl`}>
                                    <div className={`${p.bg} p-3 rounded-lg text-white`}>
                                        <p.Icon />
                                    </div>
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </AnimatedSection>
                </div>
            </div>
        </section>
    );
};
