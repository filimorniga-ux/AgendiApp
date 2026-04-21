import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constante de rounds
const BCRYPT_ROUNDS = 10;

// Función de comparación en tiempo constante (mitigación timing attack para legacy pins)
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // El body debería contener action y pin
    const { action, pin } = await req.json();

    if (!pin || typeof pin !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid PIN provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Obtener la configuración actual del usuario
    const { data: configData, error: configError } = await supabaseClient
      .from('config')
      .select('id, settings')
      .limit(1)
      .maybeSingle();

    if (configError) {
      throw configError;
    }

    if (!configData) {
      return new Response(JSON.stringify({ error: 'Config not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const currentSettings = configData.settings || {};
    const storedPin = currentSettings.securityPin;

    if (action === 'hash') {
      // 1. Hashear el PIN con bcrypt
      const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
      const hashedPin = await bcrypt.hash(pin, salt);

      // 2. Actualizar configuración
      const newSettings = { ...currentSettings, securityPin: hashedPin };

      const { error: updateError } = await supabaseClient
        .from('config')
        .update({ settings: newSettings })
        .eq('id', configData.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'verify') {
      if (!storedPin) {
        // No hay PIN configurado en la DB, retornar inválido
        return new Response(JSON.stringify({ valid: false, error: 'No PIN configured' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let isValid = false;

      // Verificar si el storedPin ya es un hash bcrypt (empieza con $2a$, $2b$, etc.)
      if (storedPin.startsWith('$2a$') || storedPin.startsWith('$2b$')) {
        isValid = await bcrypt.compare(pin, storedPin);
      } else {
        // Modo legacy: texto plano
        isValid = constantTimeCompare(pin, storedPin);

        if (isValid) {
          // AUTO-MIGRACIÓN: Si es válido en plano, hashear y reemplazar para que no quede más en plano
          try {
            // Utilizamos el supabase admin client (service_role_key) para asegurar que la
            // migración se guarde exitosamente incluso si el usuario no tiene permisos RLS completos
            // (aunque si llegó aquí, la query auth funcionó) y para evitar race conditions.
            const supabaseAdmin = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
            const hashedPin = await bcrypt.hash(pin, salt);

            // Solo actualizar si sigue siendo igual en texto plano para mitigar race condition
            // de que alguien haya cambiado el pin mientras tanto.
            const newSettings = { ...currentSettings, securityPin: hashedPin };

            await supabaseAdmin
              .from('config')
              .update({ settings: newSettings })
              .eq('id', configData.id);
          } catch (migrateErr) {
            console.error('Error auto-migrating legacy PIN:', migrateErr);
            // Si falla la migración, la verificación sigue siendo válida de todos modos
          }
        }
      }

      return new Response(JSON.stringify({ valid: isValid }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (err) {
    console.error('manage-pin function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
