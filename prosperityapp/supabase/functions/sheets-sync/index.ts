import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ── Google Auth via Service Account JWT ──────────────────────────────────────
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

async function getGoogleAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")!;
  const rawKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")!;
  // Handle escaped newlines from env vars
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: SCOPES.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const b64urlStr = (str: string) => b64url(enc.encode(str));

  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import RSA private key
  const pemBody = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyBuf = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuf,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    enc.encode(signingInput)
  );
  const jwt = `${signingInput}.${b64url(signature)}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get Google token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

// ── Google Sheets API Helpers ────────────────────────────────────────────────
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

// Sheet tab definitions
const SHEET_TABS = [
  { title: "📅 Agenda",              color: { red: 0.85, green: 0.65, blue: 0.13 } },
  { title: "💰 Caja Diaria",          color: { red: 0.13, green: 0.73, blue: 0.33 } },
  { title: "📦 Inventario Retail",     color: { red: 0.20, green: 0.47, blue: 0.96 } },
  { title: "🧴 Inventario Técnico",    color: { red: 0.61, green: 0.35, blue: 0.71 } },
  { title: "👥 Clientes",             color: { red: 0.96, green: 0.49, blue: 0.13 } },
  { title: "💼 Nóminas",              color: { red: 0.55, green: 0.63, blue: 0.68 } },
  { title: "📈 Cierres Mensuales",     color: { red: 0.80, green: 0.20, blue: 0.20 } },
];

const HEADERS: Record<string, string[]> = {
  "📅 Agenda":           ["Fecha", "Hora Inicio", "Hora Fin", "Cliente", "Profesional", "Servicio", "Precio", "Estado", "Notas"],
  "💰 Caja Diaria":     ["Fecha", "Tipo", "Descripción", "Monto", "Método de Pago", "Profesional", "Cliente", "Notas"],
  "📦 Inventario Retail":["Producto", "Marca", "Código Barras", "Stock Actual", "Stock Mínimo", "Costo", "Precio Venta", "Categoría", "Estado"],
  "🧴 Inventario Técnico":["Producto", "Marca", "Unidad", "Stock Actual", "Stock Mínimo", "Costo/Unidad", "Categoría", "Modo Venta"],
  "👥 Clientes":        ["Nombre", "Apellido", "Teléfono", "Email", "Cumpleaños", "Última Visita", "Notas"],
  "💼 Nóminas":         ["Cierre", "Rango de Fechas", "Creado"],
  "📈 Cierres Mensuales":["Período", "Ingresos", "Egresos", "Ahorro", "Distribución", "Notas", "Cerrado"],
};

async function createSpreadsheet(token: string, businessName: string) {
  const sheets = SHEET_TABS.map((tab, i) => ({
    properties: {
      sheetId: i,
      title: tab.title,
      tabColor: tab.color,
      gridProperties: { frozenRowCount: 1 },
    },
  }));

  const res = await fetch(SHEETS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title: `AgendiApp — ${businessName}` },
      sheets,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create spreadsheet: ${err}`);
  }
  return await res.json();
}

async function shareSpreadsheet(token: string, fileId: string, email: string) {
  const res = await fetch(`${DRIVE_API}/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "user",
      role: "writer",
      emailAddress: email,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to share spreadsheet: ${err}`);
  }
}

async function formatHeaders(token: string, spreadsheetId: string) {
  const requests = SHEET_TABS.map((_, i) => ([
    // Bold + background color on header row
    {
      repeatCell: {
        range: { sheetId: i, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.85, green: 0.65, blue: 0.13 },
            textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 11 },
            horizontalAlignment: "CENTER",
            borders: {
              bottom: { style: "SOLID", width: 2, color: { red: 0.6, green: 0.45, blue: 0.1 } },
            },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,borders)",
      },
    },
    // Auto-resize columns
    {
      autoResizeDimensions: {
        dimensions: { sheetId: i, dimension: "COLUMNS", startIndex: 0, endIndex: 10 },
      },
    },
  ])).flat();

  await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });
}

async function writeHeaders(token: string, spreadsheetId: string) {
  const data = Object.entries(HEADERS).map(([sheetTitle, headers]) => ({
    range: `'${sheetTitle}'!A1`,
    values: [headers],
  }));

  await fetch(`${SHEETS_API}/${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ valueInputOption: "RAW", data }),
  });
}

async function clearAndWriteSheet(token: string, spreadsheetId: string, sheetTitle: string, rows: string[][]) {
  // Clear existing data (except header)
  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A2:Z10000:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    }
  );

  if (rows.length === 0) return;

  // Write new data
  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A2:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: rows }),
    }
  );
}

// ── Data Transformation Helpers ─────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("es-CL"); } catch { return d; }
}
function fmtTime(d: string | null) {
  if (!d) return "";
  try { return new Date(d).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }); } catch { return d; }
}
function fmtMoney(n: number | null) {
  return n != null ? `$${Number(n).toLocaleString("es-CL")}` : "";
}
const STATUS_MAP: Record<string, string> = {
  scheduled: "📅 Programada",
  confirmed: "✅ Confirmada",
  completed: "✔️ Completada",
  cancelled: "❌ Cancelada",
  no_show:   "⚠️ No asistió",
};

async function fullSync(token: string, spreadsheetId: string, supabase: any, businessId: string) {
  // 1. Agenda
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: false })
    .limit(500);

  const agendaRows = (appointments || []).map((a: any) => [
    fmtDate(a.starts_at), fmtTime(a.starts_at), fmtTime(a.ends_at),
    a.client_name || "", a.collaborator_name || "", a.service_name || "",
    fmtMoney(a.price), STATUS_MAP[a.status] || a.status, a.notes || "",
  ]);
  await clearAndWriteSheet(token, spreadsheetId, "📅 Agenda", agendaRows);

  // 2. Caja Diaria
  const { data: movements } = await supabase
    .from("movements")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1000);

  const cajaRows = (movements || []).map((m: any) => [
    fmtDate(m.date || m.created_at), m.type || "", m.description || "",
    fmtMoney(m.amount), m.payment_method || "", m.collaborator_name || "",
    m.client_name || "", m.notes || "",
  ]);
  await clearAndWriteSheet(token, spreadsheetId, "💰 Caja Diaria", cajaRows);

  // 3. Inventario Retail
  const { data: retail } = await supabase
    .from("retail_inventory")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  const retailRows = (retail || []).map((r: any) => [
    r.name || "", r.brand || "", r.barcode || "",
    String(r.stock_current ?? 0), String(r.stock_min ?? 0),
    fmtMoney(r.cost_price), fmtMoney(r.sale_price),
    r.category || "", r.is_active ? "Activo" : "Inactivo",
  ]);
  await clearAndWriteSheet(token, spreadsheetId, "📦 Inventario Retail", retailRows);

  // 4. Inventario Técnico
  const { data: tech } = await supabase
    .from("technical_inventory")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  const techRows = (tech || []).map((t: any) => [
    t.name || "", t.brand || "", t.unit || t.unit_of_measure || "ml",
    String(t.stock_current ?? 0), String(t.stock_min ?? 0),
    fmtMoney(t.cost_per_unit), t.category || "",
    t.sell_mode === "whole" ? "Unidad completa" : "Fraccionado",
  ]);
  await clearAndWriteSheet(token, spreadsheetId, "🧴 Inventario Técnico", techRows);

  // 5. Clientes
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  const clientRows = (clients || []).map((c: any) => [
    c.name || "", c.last_name || "", c.phone || "",
    c.email || "", fmtDate(c.birthday), fmtDate(c.last_visit), c.notes || "",
  ]);
  await clearAndWriteSheet(token, spreadsheetId, "👥 Clientes", clientRows);

  // 6. Nóminas
  const { data: payrolls } = await supabase
    .from("payroll_closings")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const payrollRows = (payrolls || []).map((p: any) => [
    p.name || "", p.date_range || "", fmtDate(p.created_at),
  ]);
  await clearAndWriteSheet(token, spreadsheetId, "💼 Nóminas", payrollRows);

  // 7. Cierres Mensuales
  const { data: closings } = await supabase
    .from("monthly_closings")
    .select("*")
    .eq("business_id", businessId)
    .order("period", { ascending: false });

  const closingRows = (closings || []).map((c: any) => [
    c.period || "", fmtMoney(c.total_income), fmtMoney(c.total_outgoings),
    fmtMoney(c.total_savings), fmtMoney(c.total_to_distribute),
    c.notes || "", fmtDate(c.closed_at),
  ]);
  await clearAndWriteSheet(token, spreadsheetId, "📈 Cierres Mensuales", closingRows);
}

// ── Main Handler ────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    let authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    console.log("== DEBUG REQUEST ==");
    console.log("Method:", req.method);
    console.log("Token length:", token.length);

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        throw new Error("Missing Supabase Native Environment Variables");
    }

    // Verify the calling user using standard Supabase verification
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Explicit token validation inside edge function
    const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
    
    console.log("Auth User resolution:", !!user, authErr?.message);
    
    if (authErr || !user) {
      console.error("Rejecting request with 401: Unauthorized", authErr);
      return jsonResponse({ error: "Unauthorized", details: authErr?.message }, 401);
    }

    // Admin client for data operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Body action:", body.action);
    const { action, business_id, shared_email } = body;

    // Verify user belongs to business
    const { data: userRow, error: r_err } = await adminClient
      .from("users")
      .select("business_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!userRow || userRow.business_id !== business_id) {
      console.error("Forbidden block. User DB:", userRow?.business_id, "Req:", business_id, "Err:", r_err);
      return jsonResponse({ error: "Forbidden: not your business" }, 403);
    }

    // Get business name
    const { data: biz } = await adminClient
      .from("businesses")
      .select("name")
      .eq("id", business_id)
      .single();
    const businessName = biz?.name || "Mi Salón";

    const googleToken = await getGoogleAccessToken();

    // ── CREATE ─────────────────────────────────────────────
    if (action === "create") {
      if (!shared_email) {
        return jsonResponse({ error: "shared_email is required" }, 400);
      }

      // Check if already connected
      const { data: existing } = await adminClient
        .from("google_sheets_sync")
        .select("id, spreadsheet_url")
        .eq("business_id", business_id)
        .single();

      if (existing) {
        return jsonResponse({ error: "already_connected", url: existing.spreadsheet_url }, 409);
      }

      // 1. Create the spreadsheet
      const spreadsheet = await createSpreadsheet(googleToken, businessName);
      const spreadsheetId = spreadsheet.spreadsheetId;
      const spreadsheetUrl = spreadsheet.spreadsheetUrl;

      // 2. Write headers
      await writeHeaders(googleToken, spreadsheetId);
      await formatHeaders(googleToken, spreadsheetId);

      // 3. Share with user
      await shareSpreadsheet(googleToken, spreadsheetId, shared_email);

      // 4. Full data sync
      await fullSync(googleToken, spreadsheetId, adminClient, business_id);

      // 5. Save to DB
      await adminClient.from("google_sheets_sync").insert({
        business_id,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: spreadsheetUrl,
        shared_email,
        last_synced_at: new Date().toISOString(),
        sync_status: "active",
      });

      return jsonResponse({
        success: true,
        spreadsheet_url: spreadsheetUrl,
        spreadsheet_id: spreadsheetId,
      });
    }

    // ── FULL SYNC ──────────────────────────────────────────
    if (action === "full-sync") {
      const { data: sync } = await adminClient
        .from("google_sheets_sync")
        .select("*")
        .eq("business_id", business_id)
        .single();

      if (!sync) {
        return jsonResponse({ error: "No sheet connected" }, 404);
      }

      await fullSync(googleToken, sync.spreadsheet_id, adminClient, business_id);

      await adminClient
        .from("google_sheets_sync")
        .update({ last_synced_at: new Date().toISOString(), sync_status: "active", error_message: null })
        .eq("id", sync.id);

      return jsonResponse({ success: true, last_synced_at: new Date().toISOString() });
    }

    // ── DISCONNECT ─────────────────────────────────────────
    if (action === "disconnect") {
      await adminClient
        .from("google_sheets_sync")
        .delete()
        .eq("business_id", business_id);

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action. Use: create, full-sync, disconnect" }, 400);
  } catch (err: any) {
    console.error("sheets-sync error:", err);
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
