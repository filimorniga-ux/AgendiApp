import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessId, conversationId, customerPhone, messageContent, phoneNumberId } = await req.json();
    console.log(`[agent-processor] Processing for business=${businessId}, conversation=${conversationId}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // 1. Obtener la configuración del bot para este tenant
    const { data: config, error: configError } = await supabaseAdmin
      .from('whatsapp_configs')
      .select('system_prompt_customization')
      .eq('business_id', businessId)
      .single();

    if (configError) {
      console.error('[agent-processor] Config error:', configError);
    }

    // 2. Obtener datos del negocio para contexto RAG básico
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('name, whatsapp_phone, city, country, description, sector, instagram, facebook, website_url')
      .eq('id', businessId)
      .single();

    // 3. Obtener servicios activos (RAG: precios y catálogo)
    const { data: services } = await supabaseAdmin
      .from('services')
      .select('name, price, duration_min, category')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('category')
      .limit(50);

    const serviceCatalog = services && services.length > 0
      ? services.map((s: { name: string; price: number; duration_min?: number; category?: string }) =>
          `- ${s.name}: $${s.price}${s.duration_min ? ` (${s.duration_min} min)` : ''}${s.category ? ` [${s.category}]` : ''}`
        ).join('\n')
      : 'No hay servicios configurados.';

    // 4. Obtener colaboradores activos
    const { data: collaborators } = await supabaseAdmin
      .from('collaborators')
      .select('name, role')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .limit(20);

    const teamInfo = collaborators && collaborators.length > 0
      ? collaborators.map((c: { name: string; role?: string }) => `- ${c.name}${c.role ? ` (${c.role})` : ''}`).join('\n')
      : 'No hay información de equipo.';

    // 5. Obtener historial reciente de la conversación
    const { data: messages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('sender_type, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(15);

    const history = messages ? messages.reverse() : [];

    // 6. Preparar el system prompt enriquecido con RAG
    const businessName = business?.name || 'nuestro negocio';
    const customInstructions = config?.system_prompt_customization || '';

    const systemPrompt = `Eres el asistente virtual de "${businessName}" en WhatsApp.
Tu objetivo es ayudar a los clientes de forma amable, profesional y eficiente.

## Tus capacidades:
- Informar sobre servicios, precios y disponibilidad
- Agendar citas para los clientes
- Responder preguntas frecuentes sobre el negocio
- Transferir a un humano cuando sea necesario

## Catálogo de servicios y precios:
${serviceCatalog}

## Equipo disponible:
${teamInfo}

## Información del negocio:
- Nombre: ${businessName}
${business?.sector ? `- Sector: ${business.sector}` : ''}
${business?.description ? `- Descripción: ${business.description}` : ''}
${business?.city ? `- Ubicación: ${business.city}${business?.country ? `, ${business.country}` : ''}` : ''}
${business?.whatsapp_phone ? `- WhatsApp: ${business.whatsapp_phone}` : ''}
${business?.instagram ? `- Instagram: ${business.instagram}` : ''}
${business?.website_url ? `- Web: ${business.website_url}` : ''}

## Reglas importantes:
1. Responde SIEMPRE en el idioma del cliente (español por defecto)
2. Sé conciso — WhatsApp es un chat, no un email
3. Usa emojis con moderación para un tono amigable
4. Si te piden algo que no puedes hacer, sugiere hablar con un humano
5. NUNCA inventes precios, horarios o información que no tengas
6. Para agendar citas, confirma: servicio, fecha, hora y profesional
7. Formatea listas con viñetas para mejor legibilidad en WhatsApp

${customInstructions ? `## Instrucciones adicionales del negocio:\n${customInstructions}` : ''}`;

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: { sender_type: string; content: string }) => ({
        role: m.sender_type === 'customer' ? 'user' : 'assistant',
        content: m.content
      })),
    ];

    // Si el mensaje no está en el historial (race condition), agregarlo
    if (messageContent && (!history.length || history[history.length - 1].content !== messageContent)) {
      openAiMessages.push({ role: 'user', content: messageContent });
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "check_availability",
          description: "Consulta la disponibilidad de citas para una fecha dada (YYYY-MM-DD). Retorna las citas ya reservadas.",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string", description: "Fecha en formato YYYY-MM-DD" }
            },
            required: ["date"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_prices",
          description: "Obtiene la lista completa de precios de servicios del negocio.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "create_appointment",
          description: "Crea una cita para el cliente en una fecha y hora específicas con un servicio determinado.",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string", description: "Fecha de la cita en formato YYYY-MM-DD" },
              time: { type: "string", description: "Hora de la cita en formato HH:mm" },
              service_name: { type: "string", description: "Nombre del servicio solicitado" },
              client_name: { type: "string", description: "Nombre del cliente (opcional)" }
            },
            required: ["date", "time", "service_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "transfer_to_human",
          description: "Transfiere la conversación a un humano cuando el bot no puede resolver la consulta.",
          parameters: { type: "object", properties: {} }
        }
      }
    ];

    // 7. Determinar qué LLM usar (soporta DeepSeek y Gemini)
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    let aiResponseText = "Lo siento, estoy teniendo problemas técnicos. Un momento por favor. 🙏";

    if (deepseekApiKey) {
      aiResponseText = await callDeepSeek(deepseekApiKey, openAiMessages, tools, supabaseAdmin, businessId, conversationId);
    } else if (geminiApiKey) {
      aiResponseText = await callGemini(geminiApiKey, openAiMessages, supabaseAdmin, businessId);
    } else {
      console.error('[agent-processor] No LLM API key configured (DEEPSEEK_API_KEY or GEMINI_API_KEY)');
      aiResponseText = "¡Hola! 👋 Gracias por escribirnos. En este momento nuestro asistente está en mantenimiento. Te responderemos pronto.";
    }

    // 8. Enviar mensaje de vuelta a WhatsApp
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (whatsappToken) {
      console.log(`[agent-processor] Sending reply to ${customerPhone}`);
      const waResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: customerPhone,
          type: "text",
          text: { body: aiResponseText }
        })
      });

      if (!waResponse.ok) {
        const errorBody = await waResponse.text();
        console.error('[agent-processor] WhatsApp API error:', waResponse.status, errorBody);
      } else {
        console.log('[agent-processor] WhatsApp message sent successfully');
      }
    } else {
      console.error('[agent-processor] WHATSAPP_ACCESS_TOKEN not set');
    }

    // 9. Guardar la respuesta del bot en DB
    const { error: saveError } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'bot',
        content: aiResponseText,
        message_type: 'text'
      });

    if (saveError) {
      console.error('[agent-processor] Error saving bot response:', saveError);
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 });

  } catch (err: unknown) {
    console.error("[agent-processor] Fatal error:", err);
    return new Response(err instanceof Error ? err.message : String(err), { headers: corsHeaders, status: 500 });
  }
});


// ─── DeepSeek LLM ──────────────────────────────────────────────────────────
async function callDeepSeek(
  apiKey: string,
  messages: Array<{role: string; content: string}>,
  tools: Array<Record<string, unknown>>,
  supabaseAdmin: ReturnType<typeof createClient>,
  businessId: string,
  conversationId: string
): Promise<string> {
  let aiResponseText = "Lo siento, tuve un problema procesando tu mensaje.";
  let isToolCall = true;
  const currentMessages = [...messages];

  for (let i = 0; i < 3 && isToolCall; i++) {
    console.log(`[DeepSeek] Iteration ${i + 1}`);
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: currentMessages,
        tools: tools,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[DeepSeek] API error:', response.status, errText);
      return "Disculpa, estoy teniendo problemas técnicos. Intenta de nuevo en unos minutos. 🙏";
    }

    const data = await response.json();
    const responseMessage = data.choices?.[0]?.message;

    if (!responseMessage) {
      console.error('[DeepSeek] Empty response:', JSON.stringify(data));
      return "No pude procesar tu mensaje. ¿Podrías reformularlo?";
    }

    currentMessages.push(responseMessage);

    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        console.log(`[DeepSeek] Tool call: ${toolCall.function.name}`);
        const functionResult = await executeToolCall(toolCall, supabaseAdmin, businessId, conversationId);
        currentMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: functionResult,
        });
      }
    } else {
      isToolCall = false;
      aiResponseText = responseMessage.content || "No pude generar una respuesta.";
    }
  }

  return aiResponseText;
}


// ─── Gemini LLM (Fallback / Free tier) ─────────────────────────────────────
async function callGemini(
  apiKey: string,
  messages: Array<{role: string; content: string}>,
  supabaseAdmin: ReturnType<typeof createClient>,
  businessId: string
): Promise<string> {
  // Convert OpenAI-format messages to Gemini format
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Gemini] API error:', response.status, errText);
    return "Disculpa, estoy teniendo problemas técnicos. 🙏";
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";
}


// ─── Tool execution ─────────────────────────────────────────────────────────
async function executeToolCall(
  toolCall: { id: string; function: { name: string; arguments: string } },
  supabaseAdmin: ReturnType<typeof createClient>,
  businessId: string,
  conversationId: string
): Promise<string> {
  const args = JSON.parse(toolCall.function.arguments || '{}');

  try {
    switch (toolCall.function.name) {
      case 'get_prices': {
        const { data: srvs, error } = await supabaseAdmin
          .from('services')
          .select('name, price, duration_min, category')
          .eq('business_id', businessId)
          .eq('is_active', true);

        if (error) throw error;
        return srvs && srvs.length > 0
          ? srvs.map((s: { name: string; price: number; duration_min?: number; category?: string }) =>
              `${s.name}: $${s.price}${s.duration_min ? ` (${s.duration_min} min)` : ''}`
            ).join('\n')
          : "No hay servicios disponibles en este momento.";
      }

      case 'check_availability': {
        const { data: appointments, error } = await supabaseAdmin
          .from('appointments')
          .select('starts_at, ends_at, status, service_name, collaborator_name')
          .eq('business_id', businessId)
          .gte('starts_at', `${args.date}T00:00:00Z`)
          .lte('starts_at', `${args.date}T23:59:59Z`)
          .neq('status', 'cancelled');

        if (error) throw error;
        if (!appointments || appointments.length === 0) {
          return `El día ${args.date} está completamente libre. ¡Puedes agendar a cualquier hora!`;
        }
        const slots = appointments.map((a: { starts_at: string; ends_at: string; service_name?: string; collaborator_name?: string }) => {
          const start = new Date(a.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
          const end = new Date(a.ends_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
          return `${start} - ${end}${a.service_name ? ` (${a.service_name})` : ''}`;
        });
        return `Horarios ocupados el ${args.date}:\n${slots.join('\n')}\n\nEl resto del día está disponible.`;
      }

      case 'create_appointment': {
        const startTime = new Date(`${args.date}T${args.time}:00Z`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const { error } = await supabaseAdmin
          .from('appointments')
          .insert({
            business_id: businessId,
            starts_at: startTime.toISOString(),
            ends_at: endTime.toISOString(),
            status: 'pending',
            client_name: args.client_name || 'Cliente WhatsApp',
            service_name: args.service_name,
            notes: `Agendado vía WhatsApp`
          });

        if (error) throw error;
        return `✅ Cita creada exitosamente:\n- Fecha: ${args.date}\n- Hora: ${args.time}\n- Servicio: ${args.service_name}\n\nEstado: Pendiente de confirmación.`;
      }

      case 'transfer_to_human': {
        await supabaseAdmin
          .from('whatsapp_conversations')
          .update({ status: 'human_active' })
          .eq('id', conversationId);

        return "Conversación transferida a un humano. El cliente será atendido por un miembro del equipo.";
      }

      default:
        return `Herramienta no reconocida: ${toolCall.function.name}`;
    }
  } catch (err: unknown) {
    console.error(`[Tool] Error in ${toolCall.function.name}:`, err);
    return `Error ejecutando ${toolCall.function.name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
