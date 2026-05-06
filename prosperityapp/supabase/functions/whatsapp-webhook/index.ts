import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // 1. WEBHOOK VERIFICATION (GET) — Meta sends this when you register the webhook URL
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[whatsapp-webhook] ✅ Webhook verified successfully');
        return new Response(challenge, { status: 200 });
      } else {
        console.warn(`[whatsapp-webhook] ❌ Verification failed. mode=${mode}, token_match=${token === verifyToken}`);
        return new Response('Forbidden', { status: 403 });
      }
    }

    // 2. RECEIVE MESSAGES (POST) — Meta sends message events here
    if (req.method === 'POST') {
      const rawBody = await req.text();

      // Validate webhook signature using APP SECRET
      const signature = req.headers.get('x-hub-signature-256');
      const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');

      if (appSecret) {
        if (!signature) {
          console.error("[whatsapp-webhook] Missing x-hub-signature-256 header");
          return new Response('Missing signature', { status: 401 });
        }

        const expectedSignature = signature.replace('sha256=', '');
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(appSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (hashHex !== expectedSignature) {
          console.error("[whatsapp-webhook] ❌ Invalid webhook signature");
          return new Response('Invalid signature', { status: 401 });
        }
      } else {
        console.warn("[whatsapp-webhook] ⚠️ WHATSAPP_APP_SECRET not set — skipping signature validation");
      }

      const body = JSON.parse(rawBody);

      // Validate it's a WhatsApp Business event
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

          // Skip non-message events (status updates, etc.)
          if (!value.messages || value.messages.length === 0) {
            console.log('[whatsapp-webhook] Non-message event (status update), skipping');
            continue;
          }

          const metadata = value.metadata;
          const phoneNumberId = metadata.phone_number_id;
          const message = value.messages[0];
          const contact = value.contacts?.[0];

          console.log(`[whatsapp-webhook] 📩 Message from ${message.from} (type: ${message.type})`);

          // 1. Identify the Tenant (Business) using phone_number_id
          const { data: config, error: configError } = await supabaseAdmin
            .from('whatsapp_configs')
            .select('business_id, bot_active, system_prompt_customization')
            .eq('phone_number_id', phoneNumberId)
            .single();

          if (configError || !config) {
            console.error(`[whatsapp-webhook] ❌ No config found for phone_number_id: ${phoneNumberId}`);
            continue;
          }

          const businessId = config.business_id;
          const customerPhone = message.from;
          const customerName = contact?.profile?.name || 'Cliente';
          const metaMessageId = message.id;

          // 2. Extract message content
          let content = '';
          if (message.type === 'text') {
            content = message.text.body;
          } else if (message.type === 'audio') {
            content = '[Mensaje de Audio — transcripción no disponible]';
          } else if (message.type === 'image') {
            content = message.image?.caption
              ? `[Imagen] ${message.image.caption}`
              : '[Imagen recibida]';
          } else if (message.type === 'document') {
            content = `[Documento: ${message.document?.filename || 'sin nombre'}]`;
          } else if (message.type === 'location') {
            content = `[Ubicación: ${message.location?.latitude}, ${message.location?.longitude}]`;
          } else {
            content = `[Mensaje tipo: ${message.type}]`;
          }

          // 3. Find or create conversation
          let conversationId: string;
          let conversationStatus = 'bot_active';

          const { data: existingConv } = await supabaseAdmin
            .from('whatsapp_conversations')
            .select('id, status')
            .eq('business_id', businessId)
            .eq('customer_phone', customerPhone)
            .single();

          if (existingConv) {
            conversationId = existingConv.id;
            conversationStatus = existingConv.status;
            await supabaseAdmin
              .from('whatsapp_conversations')
              .update({
                last_message_at: new Date().toISOString(),
                customer_name: customerName // Update name in case it changed
              })
              .eq('id', conversationId);
          } else {
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
              // Handle race condition (another webhook created it concurrently)
              if (convError.code === '23505') {
                console.log(`[whatsapp-webhook] Race condition: conversation already exists for ${customerPhone}`);
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
                  console.error('[whatsapp-webhook] Failed to recover conversation after race condition');
                  continue;
                }
              } else {
                console.error('[whatsapp-webhook] Error creating conversation:', convError);
                continue;
              }
            } else {
              conversationId = newConv!.id;
              conversationStatus = config.bot_active ? 'bot_active' : 'human_active';
            }
          }

          // 4. Save customer message to DB
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
              console.log(`[whatsapp-webhook] Duplicate message skipped (${metaMessageId})`);
              continue;
            } else {
              console.error('[whatsapp-webhook] Error saving message:', msgInsertError);
            }
          }

          // 5. Invoke agent-processor if bot is active
          if (conversationStatus === 'bot_active') {
            console.log(`[whatsapp-webhook] 🤖 Invoking agent-processor for conversation ${conversationId}`);
            const payload = {
              businessId,
              conversationId,
              customerPhone,
              messageContent: content,
              phoneNumberId
            };

            try {
              const { error: invokeError } = await supabaseAdmin.functions.invoke('agent-processor', {
                body: payload,
                headers: {
                  Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                }
              });

              if (invokeError) {
                console.error('[whatsapp-webhook] ❌ Error invoking agent-processor:', invokeError);
              } else {
                console.log('[whatsapp-webhook] ✅ agent-processor invoked successfully');
              }
            } catch (invokeErr) {
              console.error('[whatsapp-webhook] ❌ Exception invoking agent-processor:', invokeErr);
            }
          } else {
            console.log(`[whatsapp-webhook] 👤 Conversation in human mode, skipping bot`);
          }
        }
      }

      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });

  } catch (err: unknown) {
    console.error("[whatsapp-webhook] Fatal error:", err);
    return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
  }
});
