import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-business-id',
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
    const { action, pin, collaboratorId } = await req.json();
    let businessId = req.headers.get('x-business-id');

    // 2. Verificar que el usuario tenga permiso sobre este businessId
    // Si no viene x-business-id, intentamos obtenerlo del usuario autenticado
    if (!businessId) {
       const { data: userData } = await supabaseClient
         .from('users')
         .select('business_id, role')
         .eq('auth_user_id', user.id)
         .maybeSingle();

       if (userData) {
         businessId = userData.business_id;
       } else {
         const { data: collabData } = await supabaseClient
           .from('collaborators')
           .select('business_id, role')
           .eq('auth_user_id', user.id)
           .maybeSingle();
         if (collabData) businessId = collabData.business_id;
       }
    }

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Business ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!pin || typeof pin !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid PIN provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Usaremos el admin client para evitar problemas de RLS en estas operaciones críticas.
    // La capa auth ya aseguró que es un usuario legítimo.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Verificar rol para acciones administrativas
    const { data: userPermission } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .eq('business_id', businessId)
      .maybeSingle();

    const isOwnerOrAdmin = userPermission && (userPermission.role === 'owner' || userPermission.role === 'admin');

    if ((action === 'set_collaborator_pin' || action === 'hash') && !isOwnerOrAdmin) {
       return new Response(JSON.stringify({ error: 'Permission denied' }), {
         status: 403,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       });
    }

    if (action === 'set_collaborator_pin') {
       if (!collaboratorId) {
          return new Response(JSON.stringify({ error: 'Missing collaboratorId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
       }

       // 1. Hashear el PIN con bcrypt
       const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
       const hashedPin = await bcrypt.hash(pin, salt);

       // 2. Guardarlo en el colaborador
       const { error: updateError } = await supabaseAdmin
         .from('collaborators')
         .update({ security_pin: hashedPin })
         .eq('id', collaboratorId);

       if (updateError) throw updateError;

       return new Response(JSON.stringify({ success: true }), {
         status: 200,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       });
    }

    // Para operaciones que afectan la config global o requieren verificar config global:
    let configData = null;
    let configError = null;

    if (businessId) {
       const resp = await supabaseAdmin.from('config').select('id, settings').eq('business_id', businessId).limit(1).maybeSingle();
       configData = resp.data;
       configError = resp.error;
    } else {
       // Fallback para legacy sin businessId
       const resp = await supabaseClient.from('config').select('id, settings').limit(1).maybeSingle();
       configData = resp.data;
       configError = resp.error;
    }

    if (configError) throw configError;

    if (action === 'hash') {
      if (!configData) {
        return new Response(JSON.stringify({ error: 'Config not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const currentSettings = configData.settings || {};

      // 1. Hashear el PIN con bcrypt
      const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
      const hashedPin = await bcrypt.hash(pin, salt);

      // 2. Actualizar configuración
      const newSettings = { ...currentSettings, securityPin: hashedPin };

      const { error: updateError } = await supabaseAdmin
        .from('config')
        .update({ settings: newSettings })
        .eq('id', configData.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'verify') {

      let globalStoredPin = configData?.settings?.securityPin;
      let validGlobal = false;

      // 1. Verificar contra el PIN global del dueño
      if (globalStoredPin) {
        if (globalStoredPin.startsWith('$2a$') || globalStoredPin.startsWith('$2b$')) {
          validGlobal = await bcrypt.compare(pin, globalStoredPin);
        } else {
          validGlobal = constantTimeCompare(pin, globalStoredPin);
          if (validGlobal && configData) {
             // Auto-migración global
             try {
               const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
               const hashedPin = await bcrypt.hash(pin, salt);
               const newSettings = { ...configData.settings, securityPin: hashedPin };
               await supabaseAdmin.from('config').update({ settings: newSettings }).eq('id', configData.id);
             } catch(e) {}
          }
        }
      }

      if (validGlobal) {
         return new Response(JSON.stringify({
           valid: true,
           authData: { id: 'admin', name: 'Administrador Principal', role: 'owner' }
         }), {
           status: 200,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         });
      }

      // 2. Si el PIN global no coincide (o no existe), probar con los colaboradores del business
      // Requerimos tener el businessId (pasado desde PinModal o inferido) para no iterar toda la db
      // Vamos a traer los colaboradores con role de acceso que tengan security_pin configurado

      let collabsQuery = supabaseAdmin
        .from('collaborators')
        .select('id, name, role, security_pin')
        .not('security_pin', 'is', null);

      if (businessId) {
        collabsQuery = collabsQuery.eq('business_id', businessId);
      }

      const { data: collabs, error: collabsError } = await collabsQuery;

      if (!collabsError && collabs && collabs.length > 0) {
        for (const collab of collabs) {
          if (collab.security_pin) {
            let isValid = false;
            if (collab.security_pin.startsWith('$2a$') || collab.security_pin.startsWith('$2b$')) {
              isValid = await bcrypt.compare(pin, collab.security_pin);
            } else {
              // Si de alguna forma guardaron un pin plano
              isValid = constantTimeCompare(pin, collab.security_pin);
            }

            if (isValid) {
               return new Response(JSON.stringify({
                 valid: true,
                 authData: { id: collab.id, name: collab.name, role: collab.role }
               }), {
                 status: 200,
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' }
               });
            }
          }
        }
      }

      // 3. Ninguno coincidió
      return new Response(JSON.stringify({ valid: false, error: 'Invalid PIN' }), {
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
