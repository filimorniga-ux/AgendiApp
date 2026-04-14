/**
 * localDb.js — Base de datos IndexedDB local para AgendiApp
 *
 * Usa Dexie.js como wrapper moderno sobre IndexedDB.
 * Espeja las mismas tablas de Supabase para funcionar offline.
 *
 * Estrategia:
 *  - Al hacer fetch online  → se cachean los resultados aquí
 *  - Al detectar offline    → se leen los datos desde aquí
 *  - Las escrituras offline → van a la tabla `offline_queue`
 *  - Al reconectar          → `syncOfflineQueue()` las ejecuta en Supabase
 */

import Dexie from 'dexie';

export const localDb = new Dexie('AgendiAppDB');

// ── Schema v3 (Current): Eliminación de firebaseId tras migración a Supabase ──
localDb.version(3).stores({
  clients:                  '++_localId, id, business_id',
  collaborators:            '++_localId, id, business_id',
  services:                 '++_localId, id, business_id',
  technical_inventory:      '++_localId, id, business_id',
  retail_inventory:         '++_localId, id, business_id',
  config:                   '++_localId, id, business_id',
  movements:                '++_localId, id, business_id',
  appointments:             '++_localId, id, business_id',
  offline_queue:            '++id, table, operation, status, createdAt',
  suppliers:                '++_localId, id, business_id',
  invoices:                 '++_localId, id, business_id',
  debts:                    '++_localId, id, business_id',
  gift_cards:               '++_localId, id, business_id',
  payroll_closings:         '++_localId, id, business_id',
  monthly_closings:         '++_localId, id, business_id',
  monthly_closing_records:  '++_localId, id, business_id',
  work_shifts:              '++_localId, id, business_id',
  stock_movements:          '++_localId, id, business_id',
});

/**
 * Guarda (o reemplaza) un array entero de rows para una tabla y businessId.
 * Se usa después de un fetch exitoso de Supabase para poblar el caché.
 *
 * @param {string} tableName   - Nombre de tabla en localDb
 * @param {string} businessId  - ID del negocio actual
 * @param {Array}  rows        - Array de objetos ya transformados a camelCase
 */
export async function cacheRows(tableName, businessId, rows) {
  const table = localDb.table(tableName);
  if (!table) return;

  try {
    // Eliminar los registros anteriores de este business
    await table.where('business_id').equals(businessId).delete();
    // Insertar los nuevos
    if (rows && rows.length > 0) {
      await table.bulkAdd(rows.map(r => ({ ...r })));
    }
  } catch (err) {
    console.warn(`[localDb] Error cacheando ${tableName}:`, err);
  }
}

/**
 * Lee todos los rows de una tabla para un businessId desde IndexedDB.
 *
 * @param {string} tableName
 * @param {string} businessId
 * @returns {Promise<Array>}
 */
export async function readCachedRows(tableName, businessId) {
  const table = localDb.table(tableName);
  if (!table) return [];

  try {
    return await table.where('business_id').equals(businessId).toArray();
  } catch (err) {
    console.warn(`[localDb] Error leyendo ${tableName} offline:`, err);
    return [];
  }
}

export default localDb;
