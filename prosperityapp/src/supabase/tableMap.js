/**
 * Mapeo de nombres de colección Firestore → tabla Supabase
 * y transformación de campos camelCase (JS) ↔ snake_case (SQL)
 */

// Firestore collection name → Supabase table name
export const COLLECTION_TO_TABLE = {
  clients:            'clients',
  collaborators:      'collaborators',
  services:           'services',
  technicalInventory: 'technical_inventory',
  retailInventory:    'retail_inventory',
  config:             'config',
  movements:          'movements',
  appointments:       'appointments',
  monthlyClosings:    'monthly_closings',
  users:              'users',
};

/**
 * Convierte un objeto snake_case de Supabase → camelCase para React
 * Solo mapea los campos que cambiaron de nombre; el resto queda igual.
 */
export function rowToCamel(row) {
  if (!row) return row;
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = snakeToCamel(key);
    mapped[camel] = value;
  }
  return mapped;
}

/**
 * Convierte un objeto camelCase de React → snake_case para Supabase
 */
export function objToSnake(obj) {
  if (!obj) return obj;
  const mapped = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = camelToSnake(key);
    mapped[snake] = value;
  }
  return mapped;
}

// Helpers internos
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convierte un orderBy de Firestore string → columna snake_case
 * Ej: 'displayOrder' → 'display_order'
 */
export function fieldToColumn(firestoreField) {
  return camelToSnake(firestoreField);
}
