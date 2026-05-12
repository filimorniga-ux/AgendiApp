/// <reference lib="deno.window" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Cron function to refresh WhatsApp access tokens before they expire.
 * Meta long-lived tokens last 60 days. We refresh when < 10 days remain.
 * Schedule: Run daily via Supabase Cron.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const appId = Deno.env.get("META_APP_ID") || "2512577115880923";
    const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");

    if (!appSecret) {
      console.error("[token-refresh] WHATSAPP_APP_SECRET not set");
      return new Response(JSON.stringify({ error: "Missing app secret" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Find tokens expiring within 10 days
    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    const { data: configs, error } = await supabaseAdmin
      .from("whatsapp_configs")
      .select("id, business_id, access_token, token_expires_at")
      .eq("connection_status", "connected")
      .not("access_token", "is", null)
      .lt("token_expires_at", tenDaysFromNow);

    if (error) {
      console.error("[token-refresh] DB query error:", error);
      return new Response(JSON.stringify({ error: "DB query failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(`[token-refresh] Found ${configs?.length || 0} tokens to refresh`);

    let refreshed = 0;
    let failed = 0;

    for (const config of configs || []) {
      try {
        console.log(`[token-refresh] Refreshing token for business ${config.business_id}...`);

        const response = await fetch(
          `https://graph.facebook.com/v25.0/oauth/access_token?` +
          `grant_type=fb_exchange_token&` +
          `client_id=${appId}&` +
          `client_secret=${appSecret}&` +
          `fb_exchange_token=${config.access_token}`,
          { method: "GET" }
        );

        const data = await response.json();

        if (data.access_token) {
          const expiresIn = data.expires_in || 5184000;
          const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

          await supabaseAdmin
            .from("whatsapp_configs")
            .update({
              access_token: data.access_token,
              token_expires_at: newExpiresAt,
              updated_at: new Date().toISOString(),
            })
            .eq("id", config.id);

          refreshed++;
          console.log(`[token-refresh] ✅ Refreshed for business ${config.business_id}`);
        } else {
          console.error(`[token-refresh] ❌ Failed for business ${config.business_id}:`, data);
          
          // If token is invalid, mark as error
          if (data.error?.code === 190) {
            await supabaseAdmin
              .from("whatsapp_configs")
              .update({
                connection_status: "error",
                updated_at: new Date().toISOString(),
              })
              .eq("id", config.id);
          }
          
          failed++;
        }
      } catch (err) {
        console.error(`[token-refresh] Error refreshing ${config.business_id}:`, err);
        failed++;
      }
    }

    const result = {
      total: configs?.length || 0,
      refreshed,
      failed,
      timestamp: new Date().toISOString(),
    };

    console.log("[token-refresh] Complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[token-refresh] Fatal:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
