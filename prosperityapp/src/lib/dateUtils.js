/**
 * dateUtils.js — Utilidades de fecha para AgendiApp
 *
 * parseDate() convierte CUALQUIER formato de fecha al objeto Date de JS:
 *  - string ISO  "2024-12-01"  (Supabase)
 *  - string ISO  "2024-12-01T12:00:00Z"  (Supabase con hora)
 *  - number      timestamp en ms o seconds
 *  - Firestore Timestamp { seconds, nanoseconds }  (legado)
 *  - Date        pasa directo
 *
 * Uso:
 *   import { parseDate, formatDateCL } from '../lib/dateUtils';
 *   parseDate(m.date).toISOString().split('T')[0]   // → "2024-12-01"
 *   formatDateCL(m.date)                             // → "01-12-2024"
 */

/**
 * Convierte cualquier valor de fecha a objeto Date.
 * @param {string|number|Date|{seconds:number}|null} value
 * @returns {Date}
 */
export function parseDate(value) {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  // number: puede ser epoch en ms (>1e12) o en seconds (<1e12)
  if (typeof value === 'number') {
    return value > 1e10 ? new Date(value) : new Date(value * 1000);
  }
  // Firestore Timestamp object
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(0);
}

/**
 * Formatea una fecha a string ISODate ("YYYY-MM-DD") sin offset de zona horaria.
 * @param {*} value - Cualquier formato soportado por parseDate()
 * @returns {string}
 */
export function toISODateStr(value) {
  return parseDate(value).toISOString().split('T')[0];
}

/**
 * Formatea una fecha al formato local es-CL (DD-MM-YYYY).
 * @param {*} value - Cualquier formato soportado por parseDate()
 * @returns {string}
 */
export function formatDateCL(value) {
  if (!value) return 'N/A';
  const d = parseDate(value);
  if (isNaN(d)) return 'N/A';
  return d.toLocaleDateString('es-CL');
}

/**
 * Retorna true si una fecha está dentro de un rango [start, end].
 * @param {*} value - Valor de fecha
 * @param {Date} start
 * @param {Date} end
 * @returns {boolean}
 */
export function isInRange(value, start, end) {
  const d = parseDate(value);
  return d >= start && d <= end;
}
