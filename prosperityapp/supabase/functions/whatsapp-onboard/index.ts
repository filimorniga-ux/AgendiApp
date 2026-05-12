/// <reference lib="deno.window" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, businessId } = await req.json();

    if (!code || !businessId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code or businessId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const appId = Deno.env.get("META_APP_ID") || "2512577115880923";
    const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");

    if (!appSecret) {
      console.error("[whatsapp-onboard] WHATSAPP_APP_SECRET not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfigured: missing app secret" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // ═══════════════════════════════════════════════
    // STEP 1: Exchange authorization code for access token
    // ═══════════════════════════════════════════════
    console.log("[whatsapp-onboard] Step 1: Exchanging code for access token...");

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `code=${code}`,
      { method: "GET" }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("[whatsapp-onboard] Token exchange failed:", tokenData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to exchange code for token", details: tokenData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const shortLivedToken = tokenData.access_token;
    console.log("[whatsapp-onboard] Short-lived token obtained ✅");

    // ═══════════════════════════════════════════════
    // STEP 2: Exchange for long-lived token (60 days)
    // ═══════════════════════════════════════════════
    console.log("[whatsapp-onboard] Step 2: Getting long-lived token...");

    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${shortLivedToken}`,
      { method: "GET" }
    );

    const longLivedData = await longLivedResponse.json();
    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 5184000; // default 60 days
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.log(`[whatsapp-onboard] Long-lived token obtained (expires in ${expiresIn}s) ✅`);

    // ═══════════════════════════════════════════════
    // STEP 3: Get shared WABAs (find the connected WABA + phone)
    // ═══════════════════════════════════════════════
    console.log("[whatsapp-onboard] Step 3: Discovering WABA and phone numbers...");

    // Get the user's business integrations
    const debugResponse = await fetch(
      `https://graph.facebook.com/v25.0/debug_token?input_token=${accessToken}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const debugData = await debugResponse.json();

    // Get WABA IDs from the user's granted assets
    let wabaId = "";
    let phoneNumberId = "";
    let displayPhone = "";

    // Try to get WABA from shared WABAs endpoint
    const sharedWabasResponse = await fetch(
      `https://graph.facebook.com/v25.0/${appId}/message_whatsapp_business_accounts?access_token=${accessToken}`
    );
    const sharedWabas = await sharedWabasResponse.json();

    if (sharedWabas.data && sharedWabas.data.length > 0) {
      wabaId = sharedWabas.data[0].id;
      console.log(`[whatsapp-onboard] Found WABA: ${wabaId}`);

      // Get phone numbers for this WABA
      const phonesResponse = await fetch(
        `https://graph.facebook.com/v25.0/${wabaId}/phone_numbers?access_token=${accessToken}`
      );
      const phonesData = await phonesResponse.json();

      if (phonesData.data && phonesData.data.length > 0) {
        phoneNumberId = phonesData.data[0].id;
        displayPhone = phonesData.data[0].display_phone_number || "";
        console.log(`[whatsapp-onboard] Found phone: ${phoneNumberId} (${displayPhone})`);
      }
    }

    if (!phoneNumberId) {
      console.error("[whatsapp-onboard] No phone number found in WABA");
      return new Response(
        JSON.stringify({ success: false, error: "No se encontró un número de WhatsApp. Asegúrate de completar el proceso de registro." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ═══════════════════════════════════════════════
    // STEP 4: Register the phone number for Cloud API
    // ═══════════════════════════════════════════════
    console.log("[whatsapp-onboard] Step 4: Registering phone for Cloud API...");

    const registerResponse = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin: "123456",
        }),
      }
    );

    const registerData = await registerResponse.json();
    if (registerData.success) {
      console.log("[whatsapp-onboard] Phone registered for Cloud API ✅");
    } else {
      // May already be registered, that's OK
      console.log("[whatsapp-onboard] Phone registration response:", registerData);
    }

    // ═══════════════════════════════════════════════
    // STEP 5: Subscribe app to WABA webhooks
    // ═══════════════════════════════════════════════
    console.log("[whatsapp-onboard] Step 5: Subscribing app to WABA...");

    const subscribeResponse = await fetch(
      `https://graph.facebook.com/v25.0/${wabaId}/subscribed_apps`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subscribeData = await subscribeResponse.json();
    console.log("[whatsapp-onboard] WABA subscription:", subscribeData);

    // ═══════════════════════════════════════════════
    // STEP 6: Save everything to whatsapp_configs
    // ═══════════════════════════════════════════════
    console.log("[whatsapp-onboard] Step 6: Saving configuration to database...");

    const { error: upsertError } = await supabaseAdmin
      .from("whatsapp_configs")
      .upsert(
        {
          business_id: businessId,
          phone_number_id: phoneNumberId,
          waba_id: wabaId,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          display_phone: displayPhone,
          connection_status: "connected",
          connected_at: new Date().toISOString(),
          bot_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" }
      );

    if (upsertError) {
      console.error("[whatsapp-onboard] DB upsert error:", upsertError);
      return new Response(
        JSON.stringify({ success: false, error: "Error al guardar la configuración en la base de datos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("[whatsapp-onboard] ✅ Onboarding complete!");

    return new Response(
      JSON.stringify({
        success: true,
        phoneNumberId,
        wabaId,
        displayPhone,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[whatsapp-onboard] Fatal error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
