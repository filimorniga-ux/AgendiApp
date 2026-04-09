import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const action = url.searchParams.get("action");

        // MercadoPago en general envía 'topic' (payment, preapproval) y un 'id' thel recurso mutado
        const { type, data } = await req.json();

        // Si tipo es suscripción ("subscription_preapproval")
        if (type === "subscription_preapproval") {
            const subscriptionId = data.id;

            // Consultar a la API de MP la data real de esa suscripción para seguridad
            const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
            const resp = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
                headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
            });
            const subData = await resp.json();

            // Status the la suscripcion (authorized, paused, cancelled)
            const status = subData.status;
            // Nosotros thefinimos que external_reference fuera el businessId para encontrar a qué negocio pertenece
            const businessId = subData.external_reference;

            if (businessId) {
                // Instanciar cliente de supabase con nivel ADMIN (Service Role) the forma que se pueda hacer el query saltándose RLS
                const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
                const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

                let updatedPlan = 'free';
                if (status === 'authorized') {
                    // Validar the acuerdo al monto y dar el plan 'pro' o 'enterprise'
                    const amount = subData.auto_recurring.transaction_amount;
                    if (amount > 30000) updatedPlan = 'enterprise';
                    else if (amount > 10000) updatedPlan = 'pro';
                }

                // Inyectar a la base de datos the Supabase la confirmación del status current 
                const { error } = await supabaseAdmin
                    .from('businesses')
                    .update({ plan: updatedPlan })
                    .eq('id', businessId);

                if (error) console.error("Error al actualizar la base de datos en Supabase: ", error);
            }
        }

        return new Response(JSON.stringify({ status: "success" }), { status: 200 });

    } catch (error) {
        console.error("Error en Webhook Mercado Pago:", error);
        return new Response(JSON.stringify({ status: "error" }), { status: 400 });
    }
});
