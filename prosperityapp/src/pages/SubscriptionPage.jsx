import React, { useEffect } from 'react';
import feather from 'feather-icons';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

const SubscriptionPage = () => {
    const { t } = useTranslation();
    const { userRole, isLoading, config } = useData();
    const { realRole, businessId, businessPlan } = useBusiness();
    const [isCreatingCheckout, setIsCreatingCheckout] = React.useState(false);

    useEffect(() => {
        if (!isLoading) {
            feather.replace();
        }
    }, [isLoading]);

    if (isLoading) return null;

    // For now, we simulate the plan data if it's not present in the config or business table.
    const planName = businessPlan === 'pro' ? "AgendiApp PRO" : businessPlan === 'enterprise' ? "AgendiApp ENTERPRISE" : "AgendiApp FREE"; 
    const planStatus = businessPlan === 'free' ? "Gratuito" : "Activo";
    const renewalDate = businessPlan === 'free' ? "-" : "Renovación Mensual";
    const userLimit = businessPlan === 'free' ? 2 : businessPlan === 'pro' ? 10 : 999;
    const currentUsers = 1; // Assuming 1 for logic simplification here if not reading from real count

    const handleUpgradeToPro = async (provider = 'mercadopago') => {
        setIsCreatingCheckout(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { plan: 'pro', businessId, provider }
            });

            if (error) throw error;
            
            if (provider === 'mercadopago' && data?.init_point) {
                // Redirigir a Mercado Pago
                window.location.href = data.init_point;
            } else if (provider === 'stripe' && data?.url) {
                // Redirigir a Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error("No se pudo obtener el link de pago seguro");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al conectar con Mercado Pago");
        } finally {
            setIsCreatingCheckout(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">Mi Suscripción</h2>
                    <p className="text-text-muted mt-1">Gestiona tu plan activo y métodos de pago</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Plan Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-bg-secondary border border-border-main rounded-xl p-6 shadow-sm overflow-hidden relative">
                        {/* Status Indicator */}
                        <div className="absolute top-0 right-0 p-6 flex flex-col items-end">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {planStatus}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent border border-accent/30">
                                <i data-feather="star" className="w-6 h-6"></i>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-text-main">{planName}</h3>
                                <p className="text-text-muted text-sm mt-0.5">Plan actual</p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6 mt-8 p-6 bg-bg-tertiary rounded-lg border border-border-main border-dashed">
                            <div>
                                <p className="text-text-muted text-sm font-medium mb-1">Próxima Facturación</p>
                                <p className="text-text-main font-bold text-lg">{renewalDate}</p>
                                <p className="text-xs text-text-muted mt-1">Monto: $19.99</p>
                            </div>
                            <div>
                                <p className="text-text-muted text-sm font-medium mb-1">Método de Pago</p>
                                <div className="flex items-center gap-2">
                                    <i data-feather="credit-card" className="w-5 h-5 text-text-main"></i>
                                    <p className="text-text-main font-bold">•••• 4242</p>
                                </div>
                                <p className="text-xs text-text-muted mt-1">Expira: 12/28</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4">
                            {businessPlan === 'free' && (
                                <div className="flex flex-col gap-3">
                                    <h5 className="text-sm font-semibold text-text-main mb-1">Selecciona tu método the pago:</h5>
                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={() => handleUpgradeToPro('mercadopago')} 
                                            disabled={isCreatingCheckout}
                                            className="px-5 py-2.5 rounded-lg font-bold bg-[#009EE3] text-white hover:bg-[#0089C5] transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <i data-feather="check-circle" className="w-4 h-4"></i>
                                            {isCreatingCheckout ? 'Creando pago...' : 'Mercado Pago (LATAM)'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleUpgradeToPro('stripe')} 
                                            disabled={isCreatingCheckout}
                                            className="px-5 py-2.5 rounded-lg font-bold bg-[#635BFF] text-white hover:bg-[#4E44E7] transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <i data-feather="credit-card" className="w-4 h-4"></i>
                                            {isCreatingCheckout ? 'Creando pago...' : 'Stripe (Global)'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-text-muted mt-2">
                                        Facturación segura. Puedes cancelar en cualquier momento.
                                    </p>
                                </div>
                            )}
                            {businessPlan !== 'free' && (
                                <button className="px-4 py-2 rounded-lg font-bold border border-border-main text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2">
                                    <i data-feather="credit-card" className="w-4 h-4"></i>
                                    Módulo de Facturación
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats / Usage Limits */}
                    <div className="bg-bg-secondary border border-border-main rounded-xl p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                            <i data-feather="activity" className="w-5 h-5 text-accent"></i>
                            Límites de Uso
                        </h4>
                        <div className="space-y-6">
                            {/* Users Limit */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-text-main">Colaboradores ({currentUsers}/{userLimit})</span>
                                    <span className="text-xs text-text-muted">{Math.round((currentUsers/userLimit)*100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-accent rounded-full transition-all duration-500" 
                                        style={{ width: `${(currentUsers/userLimit)*100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing History (Placeholder) */}
                <div className="bg-bg-secondary border border-border-main rounded-xl p-6 shadow-sm h-fit">
                    <h4 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                        <i data-feather="file-text" className="w-5 h-5 text-accent"></i>
                        Historial de Pagos
                    </h4>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, index) => (
                            <div key={index} className="flex justify-between items-center p-3 rounded-lg border border-border-main hover:bg-bg-tertiary transition-colors cursor-default">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-main">Factura #{1028 - index}</span>
                                    <span className="text-xs text-text-muted">15 {(index===0)? "Mar" : (index===1)? "Feb": "Ene"} 2026</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-text-main">$19.99</span>
                                    <button title="Descargar" className="w-8 h-8 rounded bg-bg-main border border-border-main flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-colors">
                                        <i data-feather="download" className="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SubscriptionPage;
