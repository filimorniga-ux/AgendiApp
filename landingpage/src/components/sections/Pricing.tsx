import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedSection } from '../ui/AnimatedSection';
import { Icons } from '../ui/Icons';

type BillingCycle = 'monthly' | 'quarterly' | 'biannual' | 'annual';

interface PricingProps {
    isDarkMode: boolean;
    onRegisterClick: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ isDarkMode, onRegisterClick }) => {
    const { t } = useLanguage();
    const [cycle, setCycle] = useState<BillingCycle>('annual');

    const config = {
        monthly: { months: 1, discount: 0 },
        quarterly: { months: 3, discount: 0.20 },
        biannual: { months: 6, discount: 0.30 },
        annual: { months: 12, discount: 0.40 }
    };

    const calculatePrice = (basePrice: number) => {
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

    const PlanCard = ({ title, desc, basePrice, features, recommended = false, cta }: any) => {
        const priceData = calculatePrice(basePrice);

        return (
            <div className={`relative p-8 rounded-3xl flex flex-col ${recommended ? 'border-2 border-[#f6e05e]' : isDarkMode ? 'border border-slate-700 bg-slate-800/50' : 'border border-slate-200 bg-white/50'} ${isDarkMode ? 'text-white' : 'text-slate-900'} transition-all hover:scale-[1.02]`}>
                {recommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#f6e05e] text-[#1a202c] text-sm font-bold rounded-full uppercase tracking-wide shadow-lg">Most Popular</div>}

                <div className="mb-4">
                    <h3 className="text-2xl font-bold">{title}</h3>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">${priceData.monthly}</span>
                        <span className="text-lg opacity-60">{t.pricing.monthly_equiv}</span>
                    </div>
                    <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.pricing.billed_at} {config[cycle].months}m: <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>${priceData.total}</span>
                        {priceData.hasDiscount && (
                            <span className="ml-2 line-through opacity-50">${priceData.totalStandard}</span>
                        )}
                    </div>
                    {priceData.hasDiscount && (
                        <div className="mt-2 text-sm font-bold text-green-500 bg-green-500/10 inline-block px-2 py-1 rounded-lg">
                            {t.pricing.save} ${priceData.savings}
                        </div>
                    )}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="text-[#f6e05e] mt-0.5 flex-shrink-0"><Icons.Check /></span>
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{f}</span>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onRegisterClick}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${recommended ? 'bg-[#f6e05e] text-[#1a202c] hover:shadow-lg' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                >
                    {cta}
                </button>
            </div>
        );
    };

    return (
        <section id="pricing" className="container mx-auto px-6 py-24 max-w-6xl">
            <AnimatedSection>
                <h2 className={`text-3xl md:text-5xl font-black text-center mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.pricing.title}</h2>
                <p className={`text-xl text-center mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricing.subtitle}</p>

                {/* Cycle Switcher */}
                <div className="flex justify-center mb-16 overflow-x-auto pb-4 md:pb-0">
                    <div className={`flex p-1.5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                        {(['monthly', 'quarterly', 'biannual', 'annual'] as BillingCycle[]).map((c) => (
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
