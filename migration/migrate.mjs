#!/usr/bin/env node
/**
 * migrate.mjs — Migración Firestore → Supabase (v2)
 * - Usa firebase-admin (Service Account)
 * - Mapea campos Firestore → columnas Supabase
 * - El ID de Firestore se guarda en firebase_id (columna TEXT)
 * - Supabase genera sus propios UUIDs (gen_random_uuid())
 * - Los IDs relacionales se dejan null (se pueden enlazar después)
 *
 * Ejecutar: node migrate.mjs
 */

import { createRequire } from 'module';
import { createClient }  from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname }  from 'path';
import { fileURLToPath }     from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// ─── VERIFICAR service account ────────────────────────────────────────────────
const SA_PATH = resolve(__dirname, 'serviceAccountKey.json');
if (!existsSync(SA_PATH)) {
  console.error('\n❌  serviceAccountKey.json no encontrado en:', SA_PATH);
  process.exit(1);
}

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const fsDb = admin.firestore();

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://mzoodzsefyaymhjpzopm.supabase.co';
// Usa la Service Role Key para saltarse RLS en la migración
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌  Falta la variable de entorno SUPABASE_SERVICE_KEY');
  console.error('   Ejecútalo así:');
  console.error('   SUPABASE_SERVICE_KEY="tu-service-key" node migrate.mjs\n');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Convierte Firestore Timestamp → ISO string, deja el resto igual */
function normalizeVal(v) {
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate().toISOString();
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    // Objeto anidado: normalizar sus valores recursivamente
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = normalizeVal(val);
    return out;
  }
  return v;
}

/** Lee todos los docs de una colección de Firestore */
async function readCollection(colName) {
  const snap = await fsDb.collection(colName).get();
  return snap.docs.map(d => ({ _firebaseId: d.id, ...d.data() }));
}

// ─── MAPEADORES POR COLECCIÓN ──────────────────────────────────────────────────
/**
 * Cada función recibe un doc de Firestore y devuelve una fila lista para Supabase.
 * Se usa `firebase_id` para que las tablas guarden el ID original de Firestore.
 * Los campos UUID relacionales (business_id, client_id, etc.) los ponemos como null
 * ya que la FK en businesses aún no tiene datos; los enlazarás manualmente o con
 * un segundo script si es necesario.
 */

function mapCollaborator(doc, businessId) {
  return {
    firebase_id:       doc._firebaseId,
    business_id:       businessId,        // UUID de la tabla businesses
    firebase_uid:      doc.uid ?? doc.firebaseUid ?? null,
    name:              doc.name ?? doc.nombre ?? '',
    last_name:         doc.lastName ?? doc.apellido ?? null,
    role:              doc.role ?? 'staff',
    commission_percent:doc.commissionPercent ?? doc.commission ?? 0,
    base_salary:       doc.baseSalary ?? doc.salary ?? 0,
    status:            doc.active === false ? 'inactive' : 'active',
    display_order:     doc.displayOrder ?? doc.order ?? 999,
    created_at:        normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapClient(doc, businessId) {
  return {
    firebase_id: doc._firebaseId,
    business_id: businessId,
    name:        doc.name ?? doc.nombre ?? '',
    last_name:   doc.lastName ?? doc.apellido ?? null,
    phone:       doc.phone ?? doc.telefono ?? null,
    email:       doc.email ?? null,
    birthday:    doc.birthday ?? doc.fechaNacimiento ?? null,
    last_visit:  normalizeVal(doc.lastVisit) ?? null,
    notes:       doc.notes ?? doc.notas ?? null,
    created_at:  normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapService(doc, businessId) {
  return {
    firebase_id:  doc._firebaseId,
    business_id:  businessId,
    name:         doc.name ?? doc.nombre ?? '',
    price:        doc.price ?? doc.precio ?? 0,
    duration_min: doc.duration ?? doc.durationMin ?? doc.duracion ?? 60,
    category:     doc.category ?? doc.categoria ?? null,
    description:  doc.description ?? doc.descripcion ?? null,
    is_active:    doc.active !== false && doc.isActive !== false,
    created_at:   normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapTechnicalInventory(doc, businessId) {
  return {
    firebase_id:   doc._firebaseId,
    business_id:   businessId,
    name:          doc.name ?? doc.nombre ?? '',
    brand:         doc.brand ?? doc.marca ?? null,
    unit:          doc.unit ?? doc.unidad ?? 'ml',
    stock_current: doc.stockCurrent ?? doc.stock ?? doc.currentStock ?? 0,
    stock_min:     doc.stockMin ?? doc.minStock ?? 0,
    cost_per_unit: doc.costPerUnit ?? doc.collabCost ?? doc.cost ?? 0,
    category:      doc.category ?? doc.categoria ?? null,
    created_at:    normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapRetailInventory(doc, businessId) {
  return {
    firebase_id:   doc._firebaseId,
    business_id:   businessId,
    name:          doc.name ?? doc.nombre ?? '',
    brand:         doc.brand ?? doc.marca ?? null,
    barcode:       doc.barcode ?? doc.codigoBarras ?? null,
    stock_current: doc.stockCurrent ?? doc.stock ?? 0,
    stock_min:     doc.stockMin ?? doc.minStock ?? 0,
    cost_price:    doc.cost ?? doc.costPrice ?? doc.costo ?? 0,
    sale_price:    doc.price ?? doc.salePrice ?? doc.precio ?? 0,
    category:      doc.category ?? doc.categoria ?? null,
    is_active:     doc.active !== false && doc.isActive !== false,
    created_at:    normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapMovement(doc, businessId) {
  return {
    firebase_id:    doc._firebaseId,
    business_id:    businessId,
    type:           doc.type ?? doc.tipo ?? 'income',
    amount:         Math.round(doc.amount ?? doc.monto ?? 0),
    technical_cost: Math.round(doc.technicalCost ?? doc.costoTecnico ?? 0),
    description:    doc.description ?? doc.descripcion ?? '',
    payment_method: doc.paymentMethod ?? doc.metodoPago ?? null,
    client_name:    doc.clientName ?? doc.client?.name ?? null,
    client_id:      null, // FK UUID — se enlaza después
    collaborator_id:null,
    collaborator_name: doc.collaboratorName ?? doc.collaborator?.name ?? null,
    service_id:     null,
    appointment_id: null,
    date:           normalizeVal(doc.date) ?? normalizeVal(doc.createdAt)?.slice(0,10) ?? new Date().toISOString().slice(0,10),
    products_used:  doc.productsUsed ? normalizeVal(doc.productsUsed) : null,
    notes:          doc.notes ?? doc.notas ?? null,
    transaction_id: doc.transactionId ?? null,
    gc_code:        doc.gcCode ?? null,
    gc_receipt_url: doc.gcReceiptUrl ?? null,
    quantity:       doc.quantity ?? doc.cantidad ?? 1,
    created_at:     normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapAppointment(doc, businessId) {
  return {
    firebase_id:       doc._firebaseId,
    business_id:       businessId,
    client_id:         null, // FK UUID
    client_name:       doc.clientName ?? doc.client?.name ?? null,
    collaborator_id:   null,
    collaborator_name: doc.collaboratorName ?? doc.collaborator?.name ?? null,
    service_id:        null,
    service_name:      doc.serviceName ?? doc.service?.name ?? null,
    starts_at:         normalizeVal(doc.startsAt ?? doc.startTime ?? doc.date) ?? new Date().toISOString(),
    ends_at:           normalizeVal(doc.endsAt ?? doc.endTime) ?? null,
    price:             doc.price ?? doc.cost ?? doc.precio ?? 0,
    status:            doc.status ?? 'scheduled',
    color:             doc.color ?? null,
    notes:             doc.notes ?? doc.notas ?? null,
    created_at:        normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapGiftCard(doc, businessId) {
  return {
    firebase_id:           doc._firebaseId,
    business_id:           businessId,
    code:                  doc.code ?? doc.codigo ?? '',
    initial_value:         doc.initialValue ?? doc.value ?? 0,
    balance:               doc.balance ?? doc.saldo ?? 0,
    buyer_name:            doc.buyerName ?? doc.comprador ?? null,
    buyer_contact:         doc.buyerContact ?? null,
    client_id:             null, // FK UUID
    receipt_url:           doc.receiptUrl ?? null,
    redemption_receipt_url:doc.redemptionReceiptUrl ?? null,
    status:                doc.status ?? 'Activa',
    transaction_id:        doc.transactionId ?? null,
    history:               doc.history ? normalizeVal(doc.history) : [],
    created_at:            normalizeVal(doc.createdAt) ?? new Date().toISOString(),
  };
}

function mapConfig(doc, businessId) {
  // Guardamos todo lo extra (address, phone, etc.) en el campo JSONB `settings`
  const {
    _firebaseId, businessName, currency, locale, theme,
    workingHoursStart, workingHoursEnd, lunchStart, lunchEnd,
    workingDays, logoUrl, createdAt,
    ...extra
  } = doc;
  return {
    business_id:          businessId,
    business_name:        businessName ?? doc.name ?? 'Mi Salón',
    currency:             currency ?? 'CLP',
    locale:               locale ?? 'es-CL',
    theme:                theme ?? 'dark',
    working_hours_start:  workingHoursStart ?? '09:00:00',
    working_hours_end:    workingHoursEnd   ?? '20:00:00',
    lunch_start:          lunchStart  ?? null,
    lunch_end:            lunchEnd    ?? null,
    working_days:         workingDays ?? [1,2,3,4,5,6],
    logo_url:             logoUrl     ?? null,
    settings:             extra,  // address, phone, etc. → JSONB
    created_at:           normalizeVal(createdAt) ?? new Date().toISOString(),
  };
}

// ─── OBTENER O CREAR BUSINESS ─────────────────────────────────────────────────

async function getOrCreateBusiness(configDocs) {
  // Intentar obtener un business existente (evitar .single() si está vacío)
  const { data: existing, error: listErr } = await supabase.from('businesses').select('id').limit(1);
  if (!listErr && existing && existing.length > 0) {
    console.log(`   Business existente encontrado: ${existing[0].id}`);
    return existing[0].id;
  }

  // Crear uno nuevo con los datos del config de Firestore
  const cfg = configDocs[0] ?? {};
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      owner_uid: serviceAccount.client_email, // placeholder
      name:      cfg.businessName ?? cfg.name ?? 'Mi Salón',
      plan:      'pro',
    })
    .select('id')
    .single();

  if (error) throw new Error('No se pudo crear el business: ' + error.message);
  console.log(`   Nuevo business creado: ${data.id}`);
  return data.id;
}

// ─── UPSERT BATCH ─────────────────────────────────────────────────────────────

async function upsertBatch(table, rows, conflictCol = 'firebase_id') {
  if (!rows.length) return { ok: 0, fail: 0 };

  const BATCH = 50;
  let ok = 0, fail = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).upsert(chunk, {
      onConflict: conflictCol,
      ignoreDuplicates: false,
    });

    if (error) {
      console.warn(`\n    ❌  ${table} lote ${i}–${i+BATCH}: ${error.message}`);
      fail += chunk.length;
    } else {
      ok += chunk.length;
      process.stdout.write('.');
    }
  }
  return { ok, fail };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  Migración Firestore → Supabase v2\n');
  console.log(`   Firebase:  ${serviceAccount.project_id}`);
  console.log(`   Supabase:  ${SUPABASE_URL}\n`);
  console.log('─'.repeat(60));

  // 1. Leer config de Firestore para obtener el nombre del negocio
  console.log('\n📦  Leyendo config de Firestore...');
  const configDocs = await readCollection('config');
  console.log(`   ${configDocs.length} doc(s) encontrados.`);

  // 2. Obtener/crear el business en Supabase
  const businessId = await getOrCreateBusiness(configDocs);

  const totals = { ok: 0, fail: 0 };

  // 3. Migrar config
  if (configDocs.length) {
    console.log('\n📦  config → config');
    const rows = configDocs.map(d => mapConfig(d, businessId));
    // Config no tiene firebase_id, upsert por business_id
    const r = await upsertBatch('config', rows, 'business_id');
    console.log(`\n  ✅  ${r.ok} OK, ${r.fail} errores.`);
    totals.ok += r.ok; totals.fail += r.fail;
  }

  // 4. Colaboradores
  const MIGRATIONS = [
    { col: 'collaborators',     table: 'collaborators',     mapFn: mapCollaborator },
    { col: 'clients',           table: 'clients',           mapFn: mapClient },
    { col: 'services',          table: 'services',          mapFn: mapService },
    { col: 'technicalInventory',table: 'technical_inventory',mapFn: mapTechnicalInventory },
    { col: 'retailInventory',   table: 'retail_inventory',  mapFn: mapRetailInventory },
    { col: 'movements',         table: 'movements',         mapFn: mapMovement },
    { col: 'appointments',      table: 'appointments',      mapFn: mapAppointment },
    { col: 'giftCards',         table: 'gift_cards',        mapFn: mapGiftCard },
  ];

  for (const { col, table, mapFn } of MIGRATIONS) {
    console.log(`\n📦  ${col} → ${table}`);
    process.stdout.write('  📥  Leyendo...');
    const docs = await readCollection(col);
    console.log(` ${docs.length} docs.`);

    if (!docs.length) continue;

    const rows = docs.map(d => mapFn(d, businessId));
    process.stdout.write('  💾  Insertando');
    const r = await upsertBatch(table, rows, 'firebase_id');
    console.log(`\n  ✅  ${r.ok} OK, ${r.fail} errores.`);
    totals.ok += r.ok; totals.fail += r.fail;
  }

  // 5. Resumen
  console.log('\n' + '═'.repeat(60));
  console.log('📊  RESUMEN FINAL');
  console.log('═'.repeat(60));
  console.log(`  ✅  Insertados/actualizados: ${totals.ok}`);
  console.log(`  ❌  Errores:               ${totals.fail}`);
  console.log('═'.repeat(60));
  console.log(totals.fail === 0 ? '\n🎉  ¡Migración completada sin errores!\n' : '\n⚠️   Revisa los errores de arriba.\n');

  process.exit(0);
}

main().catch(err => { console.error('\n💥  Error fatal:', err.message); process.exit(1); });
