import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.18.0?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Manejar preflight request (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { plan, businessId, provider = 'mercadopago', userEmail } = await req.json();
        
        // Use req origin for dynamic URLs
        const origin = req.headers.get('origin') || 'https://agendiapp.app';

        if (!plan || !businessId) {
            throw new Error("El plan y businessId son obligatorios.");
        }

        if (provider === 'stripe') {
            const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
            if (!STRIPE_SECRET_KEY) {
                throw new Error("Credenciales de Stripe no configuradas en el servidor.");
            }
            
            const stripe = new Stripe(STRIPE_SECRET_KEY, {
                apiVersion: '2023-10-16',
                httpClient: Stripe.createFetchHttpClient(),
            });

            let unitAmount = 0;
            let productName = '';
            
            if (plan === 'pro') {
                unitAmount = 1999; // $19.99 USD
                productName = "AgendiApp PRO - Mensual";
            } else if (plan === 'enterprise') {
                unitAmount = 3999; // $39.99 USD
                productName = "AgendiApp ENTERPRISE - Mensual";
            } else {
                throw new Error("Plan inválido para Stripe.");
            }

            const sessionConfig: any = {
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: productName,
                            },
                            unit_amount: unitAmount,
                            recurring: {
                                interval: 'month',
                            },
                        },
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${origin}/app/suscripcion?status=success`,
                cancel_url: `${origin}/app/suscripcion?status=cancel`,
                client_reference_id: businessId, // Fundamental: ID the negocio para procesar en Webhook
                metadata: {
                    plan: plan,
                }
            };

            if (userEmail) {
                sessionConfig.customer_email = userEmail;
            }

            const session = await stripe.checkout.sessions.create(sessionConfig);

            return new Response(
                JSON.stringify({ url: session.url }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );

        } else if (provider === 'mercadopago') {
            const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
            if (!MP_ACCESS_TOKEN) {
                throw new Error("Credenciales de Mercado Pago no configuradas.");
            }

            // Definimos los precios base de los planes en CLP para MP
            let transactionAmount = 0;
            let reason = "Suscripción AgendiApp";

            if (plan === 'pro') {
                transactionAmount = 19990; // Ej: 19,990 CLP
                reason = "AgendiApp PRO - Mensual";
            } else if (plan === 'enterprise') {
                transactionAmount = 39990; // Ej: 39,990 CLP
                reason = "AgendiApp ENTERPRISE - Mensual";
            } else {
                throw new Error("Plan inválido para Mercado Pago.");
            }

            // Crear una suscripción "Preapproval" con Mercado Pago
            const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    reason: reason,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: "months",
                        transaction_amount: transactionAmount,
                        currency_id: "CLP" // Configurado para CLP local
                    },
                    back_url: `${origin}/app/suscripcion?status=success`,
                    payer_email: userEmail || "test_user_ex@testuser.com",
                    external_reference: businessId // ID del negocio
                })
            });

            const mpData = await mpResponse.json();

            if (!mpResponse.ok) {
                console.error("Error de Mercado Pago:", mpData);
                throw new Error("Error al generar el link de pago en Mercado Pago.");
            }

            return new Response(
                JSON.stringify({ init_point: mpData.init_point }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        } else {
            throw new Error(`Proveedor de pago no soportado: ${provider}`);
        }

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
