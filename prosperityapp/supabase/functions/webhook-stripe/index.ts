import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.18.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
    try {
        const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
        const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
            return new Response("Stripe credentials not configured", { status: 500 });
        }

        const stripe = new Stripe(STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Obtener el signature header
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response("No signature found", { status: 400 });
        }

        const body = await req.text();
        let event;

        try {
            // Verificar que la petición realmente viene de Stripe
            event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error(`⚠️ Webhook signature verification failed.`, err.message);
            return new Response(err.message, { status: 400 });
        }

        // Si el evento es un pago/suscripcion exitosa
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const businessId = session.client_reference_id; // Deberia traer el ID del negocio q seteamos en create-checkout

            if (!businessId) {
                console.error("No business ID present in metadata");
                return new Response("Missing business ID", { status: 400 });
            }

            console.log(`Pago recibido via Stripe. Actualizando negocio: ${businessId}`);

            // Inicializar supabase admin client para saltar RLS y editar tabla businesses
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') || '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '' // <- Service role para saltar RLS
            );

            // Read plan from metadata or fallback to 'pro'
            const chosenPlan = session.metadata?.plan || 'pro';

            // Actualizar plan
            const { error: updateError } = await supabaseAdmin
                .from('businesses')
                .update({ plan: chosenPlan })
                .eq('id', businessId);

            if (updateError) {
                console.error(`Error updating business plan to ${chosenPlan} in DB:`, updateError);
                return new Response("Database Error", { status: 500 });
            }

            console.log(`Plan actualizado correctamente a ${chosenPlan}`);
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });

    } catch (err) {
        console.error("Webhook error:", err);
        return new Response(err.message, { status: 500 });
    }
});
