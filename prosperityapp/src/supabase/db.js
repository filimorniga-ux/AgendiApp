/**
 * Capa de escritura para Supabase — reemplaza las operaciones directas
 * de Firestore (addDoc, setDoc, updateDoc, deleteDoc) en los componentes.
 *
 * Uso:
 *   import { sbCreate, sbUpdate, sbDelete } from '../supabase/db';
 *   await sbCreate('clients', { name: 'Juan', ... }, businessId);
 *   await sbUpdate('clients', id, { phone: '...' });
 *   await sbDelete('clients', id);
 */

import { supabase } from './client';
import { COLLECTION_TO_TABLE, objToSnake } from './tableMap';

function getTable(collectionName) {
  return COLLECTION_TO_TABLE[collectionName] || collectionName;
}

/**
 * Crea un documento en Supabase.
 * @returns {Promise<{data, error}>}
 */
export async function sbCreate(collectionName, payload, businessId) {
  const table = getTable(collectionName);
  const snakePayload = objToSnake({ ...payload, businessId });
  return supabase.from(table).insert(snakePayload).select().single();
}

/**
 * Actualiza un documento en Supabase por ID.
 * @returns {Promise<{data, error}>}
 */
export async function sbUpdate(collectionName, id, payload) {
  const table = getTable(collectionName);
  const snakePayload = objToSnake({ ...payload, updatedAt: new Date().toISOString() });
  return supabase.from(table).update(snakePayload).eq('id', id).select().single();
}

/**
 * Elimina un documento en Supabase por ID.
 * @returns {Promise<{error}>}
 */
export async function sbDelete(collectionName, id) {
  const table = getTable(collectionName);
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
