import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';
import { Icons } from '../ui/Icons';

interface PricingProps {
    isDarkMode: boolean;
    onRegisterClick: () => void;
}

interface PlanConfig {
    key: string;
    title: string;
    desc: string;
    basePrice: number;
    extraBranchPrice?: number;
    features: string[];
    cta: string;
    recommended: boolean;
    icon: string;
}

export const Pricing: React.FC<PricingProps> = ({ isDarkMode, onRegisterClick }) => {
    const { t } = useLanguage();
    const [isAnnual, setIsAnnual] = useState(true);
    const [branchCount, setBranchCount] = useState(2);

    const DISCOUNT = 0.30; // 30% annual discount

    const plans = [
        {
            key: 'personal',
            title: t.pricing.plan_personal,
            desc: t.pricing.desc_personal,
            basePrice: 10,
            features: t.pricing.features_personal,
            cta: t.pricing.cta_personal,
            recommended: false,
            icon: '👤',
        },
        {
            key: 'pro',
            title: t.pricing.plan_pro,
            desc: t.pricing.desc_pro,
            basePrice: 20,
            features: t.pricing.features_pro,
            cta: t.pricing.cta_pro,
            recommended: true,
            icon: '⚡',
        },
        {
            key: 'enterprise',
            title: t.pricing.plan_enterprise,
            desc: t.pricing.desc_enterprise,
            basePrice: 20,
            extraBranchPrice: 15,
            features: t.pricing.features_enterprise,
            cta: t.pricing.cta_enterprise,
            recommended: false,
            icon: '🏢',
        },
    ];

    const getPrice = (base: number): string => {
        if (isAnnual) {
            return (base * (1 - DISCOUNT)).toFixed(0);
        }
        return base.toFixed(0);
    };

    const getAnnualTotal = (base: number): string => {
        return (base * 12 * (1 - DISCOUNT)).toFixed(0);
    };

    const getEnterpriseMonthlyCost = () => {
        const first = isAnnual ? 20 * (1 - DISCOUNT) : 20;
        const extras = (branchCount - 1) * (isAnnual ? 15 * (1 - DISCOUNT) : 15);
        return (first + extras).toFixed(0);
    };

    const PlanCard = ({ plan }: { plan: PlanConfig }) => {
        const { title, desc, basePrice, features, cta, recommended, icon, key, extraBranchPrice } = plan;
        const monthlyPrice = getPrice(basePrice);
        const isEnterprise = key === 'enterprise';

        return (
            <div className={`relative p-8 rounded-3xl flex flex-col transition-all duration-500 transform-gpu hover:-translate-y-2 group
                ${recommended
                    ? isDarkMode
                        ? 'border-2 border-[#f6e05e]/60 bg-gradient-to-b from-[#f6e05e]/10 via-white/5 to-black/40 backdrop-blur-2xl shadow-[0_0_60px_-10px_rgba(246,224,94,0.2)] hover:shadow-[0_20px_60px_-15px_rgba(246,224,94,0.35)] hover:border-[#f6e05e]'
                        : 'border-2 border-[#f6e05e] bg-white shadow-xl hover:shadow-2xl'
                    : isEnterprise
                        ? isDarkMode
                            ? 'border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-black/40 backdrop-blur-xl hover:border-purple-400/50 hover:shadow-[0_20px_50px_-20px_rgba(168,85,247,0.2)]'
                            : 'border border-purple-200 bg-gradient-to-b from-purple-50 to-white hover:shadow-xl hover:border-purple-300'
                        : isDarkMode
                            ? 'border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:shadow-[0_20px_50px_-20px_rgba(255,255,255,0.1)]'
                            : 'border border-slate-200 bg-white/80 hover:bg-white hover:shadow-xl'
                }
                ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
                {/* Badge */}
                {recommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-[#f6e05e] to-[#d4a853] text-[#1a202c] text-xs font-black rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(246,224,94,0.5)]">
                        {t.pricing.most_popular}
                    </div>
                )}

                {/* Trial Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5 w-fit
                    ${isDarkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    {t.pricing.trial_badge}
                </div>

                {/* Icon + Title */}
                <div className="mb-5">
                    <span className="text-3xl mb-2 block">{icon}</span>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h3>
                    <p className={`text-sm mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                    {isEnterprise ? (
                        <>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl md:text-5xl font-black drop-shadow-md">${getEnterpriseMonthlyCost()}</span>
                                <span className={`text-lg font-medium ${isDarkMode ? 'opacity-50' : 'text-slate-400'}`}>{t.pricing.monthly_equiv}</span>
                            </div>
                            <div className={`text-xs mt-2 space-y-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <p>{t.pricing.enterprise_base}: <span className="font-bold">${getPrice(basePrice)}{t.pricing.monthly_equiv}</span></p>
                                <p>{t.pricing.enterprise_extra}: <span className="font-bold">${getPrice(extraBranchPrice ?? 15)}{t.pricing.per_branch}</span></p>
                            </div>
                            {/* Branch Calculator */}
                            <div className={`mt-4 p-3 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
                                <label className={`text-xs font-bold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {t.pricing.enterprise_calc_label}
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={branchCount}
                                        onChange={(e) => setBranchCount(Number(e.target.value))}
                                        className="flex-1 accent-[#f6e05e] h-1.5 cursor-pointer"
                                    />
                                    <span className={`text-lg font-black min-w-[2ch] text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {branchCount}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl md:text-5xl font-black drop-shadow-md">${monthlyPrice}</span>
                                <span className={`text-lg font-medium ${isDarkMode ? 'opacity-50' : 'text-slate-400'}`}>{t.pricing.monthly_equiv}</span>
                            </div>
                            <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isAnnual ? (
                                    <span>
                                        {t.pricing.billed_annually}: <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>${getAnnualTotal(basePrice)}/yr</span>
                                        <span className="ml-2 line-through opacity-40">${(basePrice * 12)}</span>
                                    </span>
                                ) : (
                                    <span>{t.pricing.billed_monthly}</span>
                                )}
                            </div>
                            {isAnnual && (
                                <div className="mt-3 text-xs font-black text-green-400 bg-green-500/10 border border-green-500/20 inline-block px-3 py-1 rounded-full uppercase tracking-wider">
                                    {t.pricing.save} ${(basePrice * 12 * DISCOUNT).toFixed(0)}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Features */}
                <ul className="space-y-3.5 mb-8 flex-1">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="text-[#f6e05e] mt-0.5 drop-shadow-[0_0_8px_rgba(246,224,94,0.5)] flex-shrink-0"><Icons.Check /></span>
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{f}</span>
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                <button
                    onClick={onRegisterClick}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/btn
                        ${recommended
                            ? 'bg-[#f6e05e] text-slate-950 shadow-[0_10px_30px_-10px_rgba(246,224,94,0.4)] hover:shadow-[0_15px_40px_-10px_rgba(246,224,94,0.6)] hover:-translate-y-1'
                            : isEnterprise
                                ? isDarkMode
                                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30 hover:border-purple-400/40 hover:-translate-y-0.5'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                                : isDarkMode
                                    ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white/20 hover:-translate-y-0.5'
                                    : 'bg-slate-900 text-white hover:bg-black hover:shadow-lg'
                        }`}
                >
                    <span className="relative z-10">{cta}</span>
                    {recommended && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out z-0"></div>}
                </button>
            </div>
        );
    };

    return (
        <section id="pricing" className="container mx-auto px-6 py-24 max-w-7xl relative z-10">
            <AnimatedSection>
                <h2 className={`text-4xl md:text-6xl font-black text-center mb-4 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.pricing.title}</h2>
                <p className={`text-lg md:text-xl text-center mb-6 font-light max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricing.subtitle}</p>

                {/* Trial Text */}
                <p className={`text-center text-sm mb-10 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ✨ {t.pricing.trial_text}
                </p>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-16">
                    <div className={`flex items-center gap-1 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${!isAnnual
                                ? 'bg-[#f6e05e] text-[#1a202c] shadow-md'
                                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            {t.pricing.monthly_label}
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isAnnual
                                ? 'bg-[#f6e05e] text-[#1a202c] shadow-md'
                                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            {t.pricing.annual_label}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${isAnnual
                                ? 'bg-green-500 text-white'
                                : isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                            }`}>
                                {t.pricing.annual_badge}
                            </span>
                        </button>
                    </div>
                </div>
            </AnimatedSection>

            {/* 3 Plan Cards */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {plans.map((plan, index) => (
                    <AnimatedSection key={plan.key} delay={index * 100}>
                        <PlanCard plan={plan} />
                    </AnimatedSection>
                ))}
            </div>
        </section>
    );
};
