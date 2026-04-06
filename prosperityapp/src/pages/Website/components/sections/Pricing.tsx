import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';
import { Icons } from '../ui/Icons';

export const Pricing = ({ isDarkMode, onRegisterClick }) => {
    const { t } = useLanguage();
    const [cycle, setCycle] = useState('annual');

    const config = {
        monthly: { months: 1, discount: 0 },
        quarterly: { months: 3, discount: 0.20 },
        biannual: { months: 6, discount: 0.30 },
        annual: { months: 12, discount: 0.40 }
    };

    const calculatePrice = (basePrice) => {
        const { months, discount } = config[cycle];
        const totalStandard = basePrice * months;
        const totalDiscounted = totalStandard * (1 - discount);
        const monthlyEquivalent = totalDiscounted / months;
        const savings = totalStandard - totalDiscounted;

        return {
            totalStandard: totalStandard.toFixed(2),
            total: totalDiscounted.toFixed(2),
            monthly: monthlyEquivalent.toFixed(2),
            savings: savings.toFixed(2),
            hasDiscount: discount > 0
        };
    };

    const PlanCard = ({ title, desc, basePrice, features, recommended = false, cta }) => {
        const priceData = calculatePrice(basePrice);

        return (
            <div className={`relative p-8 rounded-3xl flex flex-col transition-all duration-500 transform-gpu hover:-translate-y-2 group ${recommended ? isDarkMode ? 'border border-[#f6e05e]/50 bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(246,224,94,0.15)] hover:shadow-[0_20px_50px_-15px_rgba(246,224,94,0.3)] hover:border-[#f6e05e]' : 'border-2 border-[#f6e05e] shadow-xl hover:shadow-2xl' : isDarkMode ? 'border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:shadow-[0_20px_50px_-20px_rgba(255,255,255,0.1)]' : 'border border-slate-200 bg-white/50 hover:bg-white hover:shadow-xl'} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-[#f6e05e] to-[#d4a853] text-[#1a202c] text-xs font-black rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(246,224,94,0.5)]">Most Popular</div>}

                <div className="mb-4">
                    <h3 className="text-3xl font-black tracking-tight">{title}</h3>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-1 relative">
                        <span className="text-5xl font-black drop-shadow-md">${priceData.monthly}</span>
                        <span className="text-lg opacity-50 font-medium">{t.pricing.monthly_equiv}</span>
                    </div>
                    <div className={`text-sm mt-3 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.pricing.billed_at} {config[cycle].months}m: <span className={isDarkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>${priceData.total}</span>
                        {priceData.hasDiscount && (
                            <span className="ml-2 line-through opacity-40">${priceData.totalStandard}</span>
                        )}
                    </div>
                    {priceData.hasDiscount && (
                        <div className="mt-3 text-xs font-black text-green-400 bg-green-500/10 border border-green-500/20 inline-block px-3 py-1 rounded-full uppercase tracking-wider">
                            {t.pricing.save} ${priceData.savings}
                        </div>
                    )}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="text-[#f6e05e] mt-0.5 drop-shadow-[0_0_8px_rgba(246,224,94,0.5)] flex-shrink-0"><Icons.Check /></span>
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{f}</span>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onRegisterClick}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/btn ${recommended ? 'bg-[#f6e05e] text-slate-950 shadow-[0_10px_30px_-10px_rgba(246,224,94,0.4)] hover:shadow-[0_15px_40px_-10px_rgba(246,224,94,0.6)] hover:-translate-y-1' : isDarkMode ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white/20 hover:-translate-y-0.5' : 'bg-slate-900 text-white hover:bg-black hover:shadow-lg'}`}
                >
                    <span className="relative z-10">{cta}</span>
                    {recommended && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out z-0"></div>}
                </button>
            </div>
        );
    };

    return (
        <section id="pricing" className="container mx-auto px-6 py-24 max-w-6xl relative z-10">
            <AnimatedSection>
                <h2 className={`text-4xl md:text-6xl font-black text-center mb-6 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.pricing.title}</h2>
                <p className={`text-xl text-center mb-16 font-light ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricing.subtitle}</p>

                {/* Cycle Switcher */}
                <div className="flex justify-center mb-16 overflow-x-auto pb-4 md:pb-0">
                    <div className={`flex p-1.5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                        {['monthly', 'quarterly', 'biannual', 'annual'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setCycle(c)}
                                className={`
                    px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                    ${cycle === c
                                        ? 'bg-[#f6e05e] text-[#1a202c] shadow-md'
                                        : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}
                  `}
                            >
                                {t.pricing.cycles[c]}
                                {config[c].discount > 0 && <span className="ml-1 text-[10px] opacity-80">-{config[c].discount * 100}%</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-8">
                <AnimatedSection delay={100}>
                    <PlanCard
                        title={t.pricing.plan_basic}
                        desc={t.pricing.desc_basic}
                        basePrice={19.99}
                        features={t.pricing.features_basic}
                        cta={t.pricing.cta_basic}
                    />
                </AnimatedSection>
                <AnimatedSection delay={200}>
                    <PlanCard
                        title={t.pricing.plan_pro}
                        desc={t.pricing.desc_pro}
                        basePrice={39.99}
                        features={t.pricing.features_pro}
                        recommended={true}
                        cta={t.pricing.cta_pro}
                    />
                </AnimatedSection>
            </div>
        </section>
    );
};
