/**
 * offlineQueue.js — Cola de escrituras offline para AgendiApp
 *
 * Cuando el dispositivo está sin conexión, las operaciones de escritura
 * (create, update, delete) se guardan aquí en IndexedDB.
 *
 * Al recuperar la conexión, `syncOfflineQueue()` las ejecuta en Supabase
 * en el orden en que fueron encoladas (FIFO).
 *
 * Uso en db.js:
 *   import { enqueueWrite, syncOfflineQueue } from './offlineQueue';
 */

import localDb from '../lib/localDb';
import { supabase } from '../supabase/client';
import { rowToCamel } from '../supabase/tableMap';

/**
 * Escribe optimísticamente un row en la caché local Dexie.
 * Convierte de snake_case a camelCase antes de guardar.
 * Así los hooks de lectura offline ven el cambio inmediatamente.
 */
export async function optimisticWrite(tableName, snakeRow) {
  try {
    const camelRow = rowToCamel(snakeRow);
    await localDb.table(tableName).add({ ...camelRow, _isPending: true });
  } catch (e) {
    // Ignorar duplicados silenciosamente
  }
}

/**
 * Elimina un row de la caché local Dexie por id.
 */
export async function optimisticDelete(tableName, id) {
  try {
    await localDb.table(tableName).where('id').equals(id).delete();
  } catch (e) {
    // ignorar
  }
}


/**
 * Encola una operación para ejecutar luego cuando haya red.
 *
 * @param {'insert'|'update'|'delete'} operation
 * @param {string} table        - Nombre de tabla en Supabase (snake_case)
 * @param {Object} payload      - Datos de la operación
 * @param {string} [recordId]   - ID del registro (para update/delete)
 */
export async function enqueueWrite(operation, table, payload, recordId = null) {
  await localDb.offline_queue.add({
    operation,
    table,
    payload,
    recordId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  console.log(`[offlineQueue] Encolado ${operation} en ${table}`);
}

/**
 * Encola un batch de inserciones para una tabla (ej: movements).
 * Se ejecuta como un solo insert cuando se recupera la red.
 *
 * @param {string} table   - Nombre de tabla en Supabase
 * @param {Array}  rows    - Array de objetos snake_case a insertar
 */
export async function batchEnqueueWrite(table, rows) {
  await localDb.offline_queue.add({
    operation: 'batch_insert',
    table,
    payload: rows,
    recordId: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  console.log(`[offlineQueue] Batch encolado (${rows.length} rows) en ${table}`);
}

/**
 * Sincroniza la cola de escrituras offline con Supabase.
 * Se llama automáticamente al detectar reconexión a internet.
 *
 * Ejecuta cada operación en orden. Si una falla, la marca como 'error'
 * y continúa con las demás (no bloquea la cola entera).
 */
export async function syncOfflineQueue() {
  const pending = await localDb.offline_queue
    .where('status').equals('pending')
    .sortBy('createdAt');

  if (pending.length === 0) return;

  console.log(`[offlineQueue] Sincronizando ${pending.length} operaciones pendientes...`);

  for (const item of pending) {
    try {
      if (item.operation === 'insert') {
        const { error } = await supabase.from(item.table).insert(item.payload);
        if (error) throw error;

      } else if (item.operation === 'batch_insert') {
        // Batch insert (usado por MovementModal y otras operaciones complejas)
        const { error } = await supabase.from(item.table).insert(item.payload);
        if (error) throw error;

      } else if (item.operation === 'update') {
        const { error } = await supabase
          .from(item.table)
          .update(item.payload)
          .eq('id', item.recordId);
        if (error) throw error;

      } else if (item.operation === 'delete') {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', item.recordId);
        if (error) throw error;

      } else if (item.operation === 'batch_insert' && item.table === 'movements_delete_by_txid') {
        // Operación especial: eliminar por transaction_id (usado por MovementModal offline)
        for (const row of item.payload) {
          await supabase
            .from('movements')
            .delete()
            .eq('transaction_id', row.transaction_id)
            .eq('business_id', row.business_id);
          await supabase
            .from('gift_cards')
            .delete()
            .eq('transaction_id', row.transaction_id)
            .eq('business_id', row.business_id);
        }
      }

      // Marcar como completada
      await localDb.offline_queue.update(item.id, { status: 'synced' });
      console.log(`[offlineQueue] ✅ ${item.operation} en ${item.table}`);

    } catch (err) {
      await localDb.offline_queue.update(item.id, { status: 'error', errorMsg: err.message });
      console.error(`[offlineQueue] ❌ Error sincronizando ${item.operation} en ${item.table}:`, err.message);
    }
  }

  // Limpiar las operaciones sincronizadas con más de 24h de antigüedad
  const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  await localDb.offline_queue
    .where('status').equals('synced')
    .and(item => item.createdAt < yesterday)
    .delete();

  console.log('[offlineQueue] Sincronización completada.');
}

/**
 * Retorna el número de operaciones pendientes en la cola.
 * Útil para mostrar badges o alertas en la UI.
 */
export async function getPendingCount() {
  return localDb.offline_queue.where('status').equals('pending').count();
}
