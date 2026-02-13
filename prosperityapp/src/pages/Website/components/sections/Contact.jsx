import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';

export const Contact = ({ isDarkMode }) => {
    const { t } = useLanguage();
    return (
        <section id="contact" className="container mx-auto px-6 py-24 max-w-4xl">
            <AnimatedSection>
                <div className={`p-8 md:p-12 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-slate-100'}`}>
                    <h2 className={`text-3xl font-black text-center mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.contact.title}</h2>
                    <p className={`text-center mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.contact.subtitle}</p>

                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.contact.name}</label>
                                <input type="text" className={`w-full p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#f6e05e] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.contact.email}</label>
                                <input type="email" className={`w-full p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#f6e05e] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`} />
                            </div>
                        </div>
                        <div>
                            <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.contact.message}</label>
                            <textarea rows={4} className={`w-full p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#f6e05e] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}></textarea>
                        </div>
                        <button type="button" className="w-full py-4 rounded-xl font-bold text-[#1a202c] bg-[#f6e05e] hover:shadow-lg hover:scale-[1.01] transition-all">
                            {t.contact.submit}
                        </button>
                    </form>
                </div>
            </AnimatedSection>
        </section>
    );
};
