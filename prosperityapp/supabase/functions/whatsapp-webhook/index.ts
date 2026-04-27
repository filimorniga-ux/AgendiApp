import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // 1. WEBHOOK VERIFICATION (GET)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verificado exitosamente!');
        return new Response(challenge, { status: 200 });
      } else {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // 2. RECEIVE MESSAGES (POST)
    if (req.method === 'POST') {
      const rawBody = await req.text();

      // Validar firma del webhook usando el APP SECRET (Webhooks security)
      const signature = req.headers.get('x-hub-signature-256');
      const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');

      if (appSecret) {
        if (!signature) {
          console.error("Header signature ausente pero WHATSAPP_APP_SECRET está configurado. Rechazando.");
          return new Response('Missing signature', { status: 401 });
        }

        // La firma viene con formato "sha256=..."
        const expectedSignature = signature.replace('sha256=', '');

        // Crear HMAC SHA256 de forma asíncrona usando la Crypto API estándar (soportada en Deno/Supabase Edge)
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(appSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(rawBody)
        );

        // Convertir ArrayBuffer a string hex
        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (hashHex !== expectedSignature) {
          console.error("Firma de webhook inválida");
          return new Response('Invalid signature', { status: 401 });
        }
      } else {
        console.warn("WHATSAPP_APP_SECRET no configurado, saltando validación de seguridad de forma insegura.");
      }

      const body = JSON.parse(rawBody);
      console.log('Incoming webhook event:', JSON.stringify(body, null, 2));

      // Validar si es un evento de WhatsApp
      if (body.object !== 'whatsapp_business_account') {
        return new Response('Not a WhatsApp event', { status: 404 });
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // Ignorar eventos que no sean mensajes recibidos (e.g. status updates)
          if (!value.messages || value.messages.length === 0) continue;

          const metadata = value.metadata;
          const phoneNumberId = metadata.phone_number_id;
          const message = value.messages[0];
          const contact = value.contacts?.[0];

          // 1. Identificar el Tenant (Business ID) usando el phone_number_id
          const { data: config, error: configError } = await supabaseAdmin
            .from('whatsapp_configs')
            .select('business_id, bot_active, system_prompt_customization')
            .eq('phone_number_id', phoneNumberId)
            .single();

          if (configError || !config) {
            console.error(`Config no encontrada para phone_number_id: ${phoneNumberId}`);
            continue;
          }

          const businessId = config.business_id;
          const customerPhone = message.from;
          const customerName = contact?.profile?.name || 'Cliente';
          const metaMessageId = message.id;

          // 2. Extraer el contenido del mensaje
          let content = '';
          if (message.type === 'text') {
            content = message.text.body;
          } else if (message.type === 'audio') {
            content = '[Mensaje de Audio]'; // Implementar transcripción luego si se requiere
          } else if (message.type === 'image') {
            content = '[Imagen recibida]';
          } else {
            content = `[Mensaje tipo: ${message.type}]`;
          }

          // 3. Buscar o crear la conversación
          let conversationId;
          const { data: existingConv } = await supabaseAdmin
            .from('whatsapp_conversations')
            .select('id, status')
            .eq('business_id', businessId)
            .eq('customer_phone', customerPhone)
            .single();

          let conversationStatus = 'bot_active';

          if (existingConv) {
            conversationId = existingConv.id;
            conversationStatus = existingConv.status;
            // Actualizar last_message_at
            await supabaseAdmin
              .from('whatsapp_conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', conversationId);
          } else {
            // Crear nueva conversación
            const { data: newConv, error: convError } = await supabaseAdmin
              .from('whatsapp_conversations')
              .insert({
                business_id: businessId,
                customer_phone: customerPhone,
                customer_name: customerName,
                status: config.bot_active ? 'bot_active' : 'human_active',
                last_message_at: new Date().toISOString()
              })
              .select('id')
              .single();

            if (convError) {
              // 23505 = unique_violation, significa que otro webhook concurrente ya la creó (condición de carrera)
              if (convError.code === '23505') {
                 console.log(`Conversación ya creada concurrentemente para ${customerPhone}`);
                 const { data: concurrentConv } = await supabaseAdmin
                    .from('whatsapp_conversations')
                    .select('id, status')
                    .eq('business_id', businessId)
                    .eq('customer_phone', customerPhone)
                    .single();

                 if (concurrentConv) {
                    conversationId = concurrentConv.id;
                    conversationStatus = concurrentConv.status;
                 } else {
                    console.error('Error recuperando conversación concurrente:', convError);
                    continue;
                 }
              } else {
                 console.error('Error creando conversación:', convError);
                 continue;
              }
            } else {
              conversationId = newConv.id;
              conversationStatus = config.bot_active ? 'bot_active' : 'human_active';
            }
          }

          // 4. Guardar el mensaje del cliente en DB
          const { error: msgInsertError } = await supabaseAdmin
            .from('whatsapp_messages')
            .insert({
              conversation_id: conversationId,
              sender_type: 'customer',
              content: content,
              message_type: message.type,
              meta_message_id: metaMessageId
            });

          if (msgInsertError) {
             if (msgInsertError.code === '23505') {
                console.log(`Mensaje duplicado detectado y omitido (meta_message_id: ${metaMessageId})`);
                continue; // Saltar procesamiento si el mensaje ya existe
             } else {
                console.error('Error guardando mensaje:', msgInsertError);
             }
          }

          // 5. Invocar al Agente si el bot está activo para esta conversación
          if (conversationStatus === 'bot_active') {
             // Invocamos agent-processor para que procese y responda. 
             // Usamos await para asegurar que se procese (Deno en Supabase puede matar tareas en background)
             const payload = {
                businessId,
                conversationId,
                customerPhone,
                messageContent: content,
                phoneNumberId
             };

             const { error: invokeError } = await supabaseAdmin.functions.invoke('agent-processor', {
                body: payload,
                headers: {
                  Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                }
             });

             if (invokeError) {
                 console.error('Error invoking agent-processor:', invokeError);
             }
          }
        }
      }

      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });

  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(err.message, { status: 500 });
  }
});
