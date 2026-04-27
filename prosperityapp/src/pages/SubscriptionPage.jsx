import React, { useEffect } from 'react';
import feather from 'feather-icons';
import { useTranslation } from 'react-i18next';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

import { useRole } from '../context/collections/RoleContext';
import { useAppConfig } from '../context/collections/ConfigContext';
import { useCollaborators } from '../context/collections/CollaboratorsContext';

const SubscriptionPage = () => {
    const { t } = useTranslation();

    const {
        userRole
    } = useRole();

    const {
        config,
        loading: loadingAppConfig
    } = useAppConfig();

    const {
        collaborators,
        loading: loadingCollaborators
    } = useCollaborators();

    const isLoading = loadingAppConfig || loadingCollaborators;
    const { realRole, businessId, businessPlan, user } = useBusiness();
    const [isCreatingCheckout, setIsCreatingCheckout] = React.useState(false);

    useEffect(() => {
        if (!isLoading) {
            feather.replace();
        }
    }, [isLoading]);

    if (isLoading) return null;

    const planName = businessPlan === 'pro' ? "AgendiApp PRO" : businessPlan === 'enterprise' ? "AgendiApp ENTERPRISE" : "AgendiApp FREE";
    const planStatus = businessPlan === 'free' ? t('subscription.free', 'Gratuito') : t('subscription.active', 'Activo');
    const renewalDate = businessPlan === 'free' ? "-" : t('subscription.monthlyRenewal', 'Renovación Mensual');
    const planPrice = businessPlan === 'pro' ? '$14.990' : businessPlan === 'enterprise' ? '$29.990' : '$0';
    const userLimit = businessPlan === 'free' ? 2 : businessPlan === 'pro' ? 10 : 999;
    const currentUsers = (collaborators || []).length || 1;

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
            console.warn('[Subscription] Checkout error:', error?.message || 'Unknown');
            toast.error("Error al conectar con el proveedor de pago");
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
                                <p className="text-text-muted text-sm font-medium mb-1">{t('subscription.nextBilling', 'Próxima Facturación')}</p>
                                <p className="text-text-main font-bold text-lg">{renewalDate}</p>
                                <p className="text-xs text-text-muted mt-1">{t('subscription.amount', 'Monto')}: {planPrice}</p>
                            </div>
                            {businessPlan !== 'free' && (
                            <div>
                                <p className="text-text-muted text-sm font-medium mb-1">{t('subscription.paymentMethod', 'Método de Pago')}</p>
                                <div className="flex items-center gap-2">
                                    <i data-feather="credit-card" className="w-5 h-5 text-text-main"></i>
                                    <p className="text-text-main font-bold">{t('subscription.configuredOnProvider', 'Configurado en proveedor')}</p>
                                </div>
                            </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col gap-4">
                            {businessPlan === 'free' && (
                                <div className="flex flex-col gap-3">
                                    <h5 className="text-sm font-semibold text-text-main mb-1">Selecciona tu método de pago:</h5>
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

                {/* Billing History */}
                <div className="bg-bg-secondary border border-border-main rounded-xl p-6 shadow-sm h-fit">
                    <h4 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                        <i data-feather="file-text" className="w-5 h-5 text-accent"></i>
                        {t('subscription.billingHistory', 'Historial de Pagos')}
                    </h4>
                    <div className="space-y-4">
                        {businessPlan === 'free' ? (
                            <div className="text-center py-8 text-text-muted">
                                <i data-feather="inbox" className="w-10 h-10 mx-auto mb-3 opacity-30"></i>
                                <p className="text-sm">{t('subscription.noPayments', 'Sin pagos registrados')}</p>
                                <p className="text-xs mt-1 opacity-60">{t('subscription.upgradeToSee', 'Actualiza a PRO para ver tu historial de facturación')}</p>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-muted">
                                <i data-feather="clock" className="w-10 h-10 mx-auto mb-3 opacity-30"></i>
                                <p className="text-sm">{t('subscription.billingManaged', 'Tu facturación se gestiona a través del proveedor de pago')}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SubscriptionPage;
