/**
 * db.js — Capa de escritura para Supabase con soporte Offline-First.
 *
 * Cuando hay red   → escribe directamente en Supabase (comportamiento anterior).
 * Cuando no hay red → encola la operación en IndexedDB (offlineQueue).
 *                     Al reconectar, syncOfflineQueue() la ejecuta automáticamente.
 *
 * También llama a syncOfflineQueue() al detectar reconexión a internet.
 *
 * Uso:
 *   import { sbCreate, sbUpdate, sbDelete } from '../supabase/db';
 *   await sbCreate('clients', { name: 'Juan', ... }, businessId);
 *   await sbUpdate('clients', id, { phone: '...' });
 *   await sbDelete('clients', id);
 */

import { supabase }      from './client';
import { COLLECTION_TO_TABLE, objToSnake } from './tableMap';
import { enqueueWrite, syncOfflineQueue, optimisticWrite, optimisticDelete } from '../lib/offlineQueue';

function getTable(collectionName) {
  return COLLECTION_TO_TABLE[collectionName] || collectionName;
}

// ── Auto-sync al reconectar ──────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.info('[db] 🌐 Conexión restaurada — sincronizando cola offline...');
    await syncOfflineQueue();
  });
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un documento en Supabase.
 * Si no hay red, encola la operación para ejecutarla al reconectar.
 *
 * @returns {Promise<{data, error, queued?}>}
 */
export async function sbCreate(collectionName, payload, businessId) {
  const table        = getTable(collectionName);
  const snakePayload = objToSnake({ ...payload, businessId });

  if (!navigator.onLine) {
    const offlineId = `offline_${Date.now()}`;
    await enqueueWrite('insert', table, snakePayload);
    // Escritura optimística: la UI ve el registro inmediatamente
    await optimisticWrite(table, { ...snakePayload, id: offlineId });
    return { data: { ...snakePayload, id: offlineId }, error: null, queued: true };
  }

  return supabase.from(table).insert(snakePayload).select().single();
}

/**
 * Actualiza un documento en Supabase por ID.
 * Si no hay red, encola la operación.
 *
 * @returns {Promise<{data, error, queued?}>}
 */
export async function sbUpdate(collectionName, id, payload) {
  const table        = getTable(collectionName);
  const snakePayload = objToSnake({ ...payload, updatedAt: new Date().toISOString() });

  if (!navigator.onLine) {
    await enqueueWrite('update', table, snakePayload, id);
    // Escritura optimística en Dexie
    try {
      const { rowToCamel } = await import('./tableMap');
      await import('../lib/localDb').then(({ default: db }) =>
        db.table(table).where('id').equals(id).modify(rowToCamel(snakePayload))
      );
    } catch (_) {}
    return { data: { id, ...snakePayload }, error: null, queued: true };
  }

  return supabase.from(table).update(snakePayload).eq('id', id).select().single();
}

/**
 * Elimina un documento en Supabase por ID.
 * Si no hay red, encola la operación.
 *
 * @returns {Promise<{error, queued?}>}
 */
export async function sbDelete(collectionName, id) {
  const table = getTable(collectionName);

  if (!navigator.onLine) {
    await enqueueWrite('delete', table, {}, id);
    // Eliminación optimística de Dexie
    await optimisticDelete(table, id);
    return { error: null, queued: true };
  }

  return supabase.from(table).delete().eq('id', id);
}

/**
 * Obtiene un documento por ID.
 * @returns {Promise<{data, error}>}
 */
export async function sbGetById(collectionName, id) {
  const table = getTable(collectionName);
  return supabase.from(table).select('*').eq('id', id).single();
}

/**
 * Obtiene todos los documentos de una tabla para un business.
 * @returns {Promise<{data, error}>}
 */
export async function sbGetAll(collectionName, businessId, options = {}) {
  const table = getTable(collectionName);
  let query = supabase.from(table).select('*').eq('business_id', businessId);

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }
  if (options.filters) {
    for (const [col, val] of Object.entries(options.filters)) {
      query = query.eq(col, val);
    }
  }

  return query;
}
