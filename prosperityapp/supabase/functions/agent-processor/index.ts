import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessId, conversationId, customerPhone, phoneNumberId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // 1. Obtener la configuración del bot para este tenant
    const { data: config } = await supabaseAdmin
      .from('whatsapp_configs')
      .select('system_prompt_customization')
      .eq('business_id', businessId)
      .single();

    // 2. Obtener historial reciente de la conversación
    const { data: messages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('sender_type, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    const history = messages ? messages.reverse() : [];

    // 3. Preparar el prompt para DeepSeek
    const systemPrompt = `Eres un asistente virtual amable y profesional para un negocio. 
Tu trabajo es responder dudas de clientes, agendar citas y dar precios de productos y servicios.
Si no sabes algo o el usuario solicita hablar con un humano, indícalo claramente.
Instrucciones personalizadas del negocio: ${config?.system_prompt_customization || ''}
Responde de manera concisa y usa un formato amigable para WhatsApp.`;

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: { sender_type: string, content: string }) => ({
        role: m.sender_type === 'customer' ? 'user' : 'assistant',
        content: m.content
      })),
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "check_availability",
          description: "Consulta la disponibilidad de citas para una fecha dada (YYYY-MM-DD).",
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
          description: "Obtiene la lista de precios de servicios.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_appointment",
          description: "Crea una cita para el cliente en una fecha y hora específicas.",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string", description: "Fecha de la cita en formato YYYY-MM-DD" },
              time: { type: "string", description: "Hora de la cita en formato HH:mm" },
              service_name: { type: "string", description: "Nombre del servicio solicitado" }
            },
            required: ["date", "time", "service_name"]
          }
        }
      }
    ];

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    let aiResponseText = "Lo siento, en este momento estoy teniendo problemas técnicos.";

    if (deepseekApiKey) {
      let isToolCall = true;
      const currentMessages = [...openAiMessages];

      // Bucle para procesar llamadas a herramientas (hasta 3 iteraciones)
      for (let i = 0; i < 3 && isToolCall; i++) {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: currentMessages,
            tools: tools,
            temperature: 0.7,
          })
        });

        if (!response.ok) {
          console.error('Error from DeepSeek:', await response.text());
          break;
        }

        const data = await response.json();
        const responseMessage = data.choices[0].message;
        
        currentMessages.push(responseMessage);

        if (responseMessage.tool_calls) {
          for (const toolCall of responseMessage.tool_calls) {
            console.log(`Executing tool: ${toolCall.function.name}`);
            let functionResult = "";
            const args = JSON.parse(toolCall.function.arguments);

            try {
              if (toolCall.function.name === 'get_prices') {
                const { data: services, error } = await supabaseAdmin
                  .from('services')
                  .select('name, price')
                  .eq('business_id', businessId)
                  .eq('is_active', true);
                
                if (error) throw error;
                functionResult = services && services.length > 0 
                  ? services.map((s: { name: string, price: number }) => `${s.name}: $${s.price}`).join('\\n')
                  : "No hay servicios disponibles.";
                
                console.log('Tool get_prices executed successfully');
              } 
              else if (toolCall.function.name === 'check_availability') {
                const { data: appointments, error } = await supabaseAdmin
                  .from('appointments')
                  .select('start_time, end_time')
                  .eq('business_id', businessId)
                  .gte('start_time', `${args.date}T00:00:00Z`)
                  .lte('start_time', `${args.date}T23:59:59Z`);
                
                if (error) throw error;
                functionResult = `Citas existentes para el ${args.date}: ` + 
                  (appointments && appointments.length > 0 
                    ? appointments.map((a: { start_time: string, end_time: string }) => `de ${new Date(a.start_time).toLocaleTimeString()} a ${new Date(a.end_time).toLocaleTimeString()}`).join(', ') 
                    : "Ninguna, todo el día está libre.");
                
                console.log(`Tool check_availability executed successfully for ${args.date}`);
              }
              else if (toolCall.function.name === 'create_appointment') {
                // Simplified creation for now
                const startTime = new Date(`${args.date}T${args.time}:00Z`);
                const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hora de duracion por defecto
                
                const { error } = await supabaseAdmin
                  .from('appointments')
                  .insert({
                    business_id: businessId,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'pending',
                    client_name: 'Cliente WhatsApp', 
                    notes: `Servicio solicitado: ${args.service_name}`
                  });
                
                if (error) throw error;
                functionResult = `Cita creada exitosamente el ${args.date} a las ${args.time} para ${args.service_name}.`;
                console.log(`Tool create_appointment executed successfully for ${args.date} ${args.time}`);
              }
            } catch (err: unknown) {
              console.error(`Error executing tool ${toolCall.function.name}:`, err);
              functionResult = `Error ejecutando la acción: ${err instanceof Error ? err.message : String(err)}`;
            }

            currentMessages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.function.name,
              content: functionResult,
            });
          }
        } else {
          isToolCall = false;
          aiResponseText = responseMessage.content;
        }
      }
    } else {
        console.warn('DEEPSEEK_API_KEY not set, returning fallback response.');
        aiResponseText = "No se ha configurado la API Key del agente. Por favor contacta soporte.";
    }

    // 5. Enviar mensaje de vuelta a WhatsApp
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (whatsappToken) {
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
        console.error('Error sending WhatsApp message:', await waResponse.text());
      }
    } else {
        console.warn('WHATSAPP_ACCESS_TOKEN not set, unable to send message back to Meta.');
    }

    // 6. Guardar la respuesta del bot en DB
    await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'bot',
        content: aiResponseText,
        message_type: 'text'
      });

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 });

  } catch (err: unknown) {
    console.error("Agent processor error:", err);
    return new Response(err instanceof Error ? err.message : String(err), { headers: corsHeaders, status: 500 });
  }
});
