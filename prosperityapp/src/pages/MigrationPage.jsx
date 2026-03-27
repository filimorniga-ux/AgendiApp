// ===== src/pages/MigrationPage.jsx — Herramienta one-time de migración Firestore → Supabase =====
import React, { useState, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { supabase } from '../supabase/client';
import { useData } from '../context/DataContext';

const BATCH_SIZE = 50;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ──────────────────────────────────────────────────────────
// Transformadores de campo por colección
// ──────────────────────────────────────────────────────────
function toISO(val) {
  if (!val) return null;
  if (val?.toDate) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return null;
}

function clients_transform(doc, businessId) {
  const d = doc.data();
  return {
    firebase_id:  doc.id,
    business_id:  businessId,
    name:         d.name || '',
    last_name:    d.lastName || null,
    phone:        d.phone || null,
    email:        d.email || null,
    birthday:     d.birthday ? (typeof d.birthday === 'string' ? d.birthday : toISO(d.birthday)?.split('T')[0]) : null,
    last_visit:   d.lastVisit ? (typeof d.lastVisit === 'string' ? d.lastVisit : toISO(d.lastVisit)?.split('T')[0]) : null,
    notes:        d.notes || null,
  };
}

function collaborators_transform(doc, businessId) {
  const d = doc.data();
  return {
    firebase_id:       doc.id,
    business_id:       businessId,
    name:              d.name || '',
    last_name:         d.lastName || null,
    role:              d.role || null,
    commission_percent: d.commissionPercent || d.salesCommissionPercent || 0,
    base_salary:       d.baseSalary || 0,
    status:            d.status === 'inactive' ? 'inactive' : 'active',
    display_order:     d.displayOrder || 999,
  };
}

function services_transform(doc, businessId) {
  const d = doc.data();
  return {
    firebase_id:  doc.id,
    business_id:  businessId,
    name:         d.name || '',
    price:        parseInt(d.price || 0),
    duration_min: d.durationMin || d.duration || 60,
    category:     d.category || null,
    description:  d.description || null,
    is_active:    d.isActive !== false,
  };
}

function retail_inventory_transform(doc, businessId) {
  const d = doc.data();
  return {
    firebase_id:   doc.id,
    business_id:   businessId,
    name:          d.name || '',
    brand:         d.brand || null,
    barcode:       d.barcode || null,
    stock_current: parseInt(d.stock || d.stockCurrent || 0),
    stock_min:     parseInt(d.stockMin || 0),
    cost_price:    parseInt(d.costPrice || 0),
    sale_price:    parseInt(d.price || d.salePrice || 0),
    category:      d.category || null,
    is_active:     d.isActive !== false,
  };
}

function technical_inventory_transform(doc, businessId) {
  const d = doc.data();
  return {
    firebase_id:   doc.id,
    business_id:   businessId,
    name:          d.name || '',
    brand:         d.brand || null,
    unit:          d.unit || 'ml',
    stock_current: parseFloat(d.stock || d.stockCurrent || 0),
    stock_min:     parseFloat(d.stockMin || 0),
    cost_per_unit: parseInt(d.costPerUnit || 0),
    category:      d.category || null,
  };
}

function config_transform(doc, businessId) {
  const d = doc.data();
  return {
    business_id:          businessId,
    business_name:        d.businessName || d.name || 'Mi Salón',
    currency:             d.currency || 'CLP',
    locale:               d.locale || 'es-CL',
    theme:                d.theme || 'dark',
    working_hours_start:  d.workingHoursStart || '09:00',
    working_hours_end:    d.workingHoursEnd || '20:00',
    working_days:         d.workingDays || [1,2,3,4,5,6],
    logo_url:             d.logoUrl || null,
    settings:             { ...d }, // guardar todo en JSONB
  };
}

function monthly_closings_transform(doc, businessId) {
  const d = doc.data();
  return {
    firebase_id:        doc.id,
    business_id:        businessId,
    period:             d.period || d.yearMonth || '',
    total_income:       parseInt(d.totalIncome || 0),
    total_outgoings:    parseInt(d.totalOutgoings || 0),
    total_savings:      parseInt(d.totalSavings || 0),
    total_to_distribute: parseInt(d.totalToDistribute || 0),
    notes:              d.notes || null,
    snapshot_data:      d.snapshotData || null,
    closed_at:          toISO(d.closedAt),
  };
}

// ──────────────────────────────────────────────────────────
// Config de migración por colección
// ──────────────────────────────────────────────────────────
const MIGRATION_TASKS = [
  { key: 'clients',             label: '👥 Clientes',              table: 'clients',             transform: clients_transform },
  { key: 'collaborators',       label: '💼 Colaboradores',         table: 'collaborators',       transform: collaborators_transform },
  { key: 'services',            label: '✂️ Servicios',             table: 'services',            transform: services_transform },
  { key: 'retailInventory',     label: '📦 Inventario Retail',     table: 'retail_inventory',    transform: retail_inventory_transform },
  { key: 'technicalInventory',  label: '🧪 Inventario Técnico',    table: 'technical_inventory', transform: technical_inventory_transform },
  { key: 'monthlyClosings',     label: '📅 Cierres Mensuales',     table: 'monthly_closings',    transform: monthly_closings_transform },
];

const CONFIG_TASK = { key: 'config', label: '⚙️ Configuración', table: 'config', transform: config_transform };

// ──────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────
export default function MigrationPage() {
  const { businessId } = useData();
  const [status, setStatus] = useState({}); // { [key]: { total, done, errors, running, done } }
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  const addLog = useCallback((msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString('es-CL') }]);
  }, []);

  const updateStatus = (key, patch) =>
    setStatus(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  // ── Migrar una colección ─────────────────────────────────
  const migrateCollection = async (task) => {
    const { key, label, table, transform } = task;
    updateStatus(key, { running: true, done: 0, total: 0, errors: 0 });
    addLog(`🔄 Iniciando migración: ${label}`);

    try {
      // 1. Leer todos los docs de Firebase para este businessId
      const firebaseQuery = query(
        collection(db, key),
        where('businessId', '==', businessId)
      );
      const snap = await getDocs(firebaseQuery);
      const docs = snap.docs;
      updateStatus(key, { total: docs.length });
      addLog(`   📥 ${docs.length} documentos encontrados en Firebase`);

      if (docs.length === 0) {
        addLog(`   ⏭️ Sin datos — saltando`, 'warn');
        updateStatus(key, { running: false });
        return 0;
      }

      // 2. Transformar y batch upsert
      let doneCount = 0;
      let errorCount = 0;

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        const rows = batch.map(doc => transform(doc, businessId)).filter(Boolean);

        const { error } = await supabase
          .from(table)
          .upsert(rows, { onConflict: 'firebase_id', ignoreDuplicates: false });

        if (error) {
          console.warn(`[Migration] Error en ${table}:`, error);
          errorCount += batch.length;
          addLog(`   ⚠️ Error batch ${i}-${i + BATCH_SIZE}: ${error.message}`, 'error');
        } else {
          doneCount += batch.length;
        }

        updateStatus(key, { done: doneCount, errors: errorCount });
        await sleep(100); // rate limit
      }

      addLog(`   ✅ ${doneCount} migrados, ${errorCount} errores`, doneCount > 0 ? 'success' : 'error');
      updateStatus(key, { running: false, done: doneCount, errors: errorCount });
      return doneCount;

    } catch (err) {
      console.warn('[Migration] Error fatal:', err);
      addLog(`   ❌ Error fatal: ${err.message}`, 'error');
      updateStatus(key, { running: false, errors: 1 });
      return 0;
    }
  };

  // ── Migrar config (sin where businessId, es un doc único) ──
  const migrateConfig = async () => {
    const { key, label, table, transform } = CONFIG_TASK;
    updateStatus(key, { running: true, done: 0, total: 0, errors: 0 });
    addLog(`🔄 Iniciando migración: ${label}`);

    try {
      const snap = await getDocs(collection(db, key));
      const docs = snap.docs;
      updateStatus(key, { total: docs.length });

      if (docs.length === 0) {
        addLog(`   ⏭️ Sin datos — saltando`, 'warn');
        updateStatus(key, { running: false });
        return 0;
      }

      // Config: tomar el primer doc que tenga businessId coincidente
      const configDoc = docs.find(d => d.data().businessId === businessId || d.id === businessId)
        || docs[0];

      const row = transform(configDoc, businessId);
      const { error } = await supabase
        .from(table)
        .upsert(row, { onConflict: 'business_id' });

      if (error) throw error;
      addLog(`   ✅ Config migrada`, 'success');
      updateStatus(key, { running: false, done: 1 });
      return 1;
    } catch (err) {
      addLog(`   ❌ Error: ${err.message}`, 'error');
      updateStatus(key, { running: false, errors: 1 });
      return 0;
    }
  };

  // ── Migrar todo ──────────────────────────────────────────
  const handleMigrateAll = async () => {
    if (!businessId) {
      addLog('❌ No hay businessId — inicia sesión primero', 'error');
      return;
    }
    setRunning(true);
    setLog([]);
    addLog(`🚀 Iniciando migración completa | businessId: ${businessId}`);

    await migrateConfig();
    for (const task of MIGRATION_TASKS) {
      await migrateCollection(task);
    }

    addLog('🎉 Migración completada', 'success');
    setRunning(false);
  };

  // ── Render ───────────────────────────────────────────────
  if (!businessId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-main">
        <div className="text-center">
          <p className="text-xl mb-2">⚠️ No autenticado</p>
          <p className="text-text-muted">Inicia sesión para acceder a la migración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main p-6 text-text-main">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-main">🚀 Migración de Datos</h1>
          <p className="text-text-muted text-sm mt-1">
            Copia todos tus datos de Firebase (Firestore) a Supabase. Operación segura — usa upsert idempotente.
          </p>
          <code className="text-xs bg-bg-secondary px-2 py-1 rounded mt-2 inline-block text-accent">
            businessId: {businessId}
          </code>
        </div>

        {/* Tabla de progreso */}
        <div className="bg-bg-secondary rounded-xl border border-border-main mb-6 overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-main/50">
              <tr>
                <th className="text-left p-3 text-sm text-text-muted">Colección</th>
                <th className="text-right p-3 text-sm text-text-muted">Docs</th>
                <th className="text-right p-3 text-sm text-text-muted">Migrados</th>
                <th className="text-right p-3 text-sm text-text-muted">Errores</th>
                <th className="p-3 text-sm text-text-muted">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[CONFIG_TASK, ...MIGRATION_TASKS].map(task => {
                const s = status[task.key] || {};
                return (
                  <tr key={task.key} className="border-t border-border-main">
                    <td className="p-3 text-sm">{task.label}</td>
                    <td className="p-3 text-right text-sm text-text-muted">{s.total ?? '—'}</td>
                    <td className="p-3 text-right text-sm text-green-400">{s.done ?? '—'}</td>
                    <td className="p-3 text-right text-sm text-red-400">{s.errors ?? '—'}</td>
                    <td className="p-3 text-center">
                      {s.running ? (
                        <span className="text-xs text-accent animate-pulse">⏳ Migrando...</span>
                      ) : s.done > 0 ? (
                        <span className="text-xs text-green-400">✅ OK</span>
                      ) : s.errors > 0 ? (
                        <span className="text-xs text-red-400">❌ Error</span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Botón principal */}
        <button
          onClick={handleMigrateAll}
          disabled={running}
          className="w-full btn-golden py-3 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {running ? '⏳ Migrando...' : '🚀 Iniciar Migración Completa'}
        </button>

        {/* Log en tiempo real */}
        {log.length > 0 && (
          <div className="bg-bg-secondary border border-border-main rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
            {log.map((entry, i) => (
              <div
                key={i}
                className={
                  entry.type === 'error' ? 'text-red-400' :
                  entry.type === 'success' ? 'text-green-400' :
                  entry.type === 'warn' ? 'text-yellow-400' :
                  'text-text-muted'
                }
              >
                <span className="text-text-muted/50">[{entry.ts}]</span> {entry.msg}
              </div>
            ))}
          </div>
        )}

        {/* Advertencia */}
        <div className="mt-6 border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-4 text-sm text-yellow-400">
          ⚠️ <strong>Uso único:</strong> Esta herramienta es para migración inicial. Puedes ejecutarla múltiples veces — usa upsert idempotente. Una vez completada la migración, elimina esta ruta del router.
        </div>
      </div>
    </div>
  );
}
