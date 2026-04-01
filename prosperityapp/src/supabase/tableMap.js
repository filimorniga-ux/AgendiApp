/**
 * Mapeo de nombres de colección Firestore → tabla Supabase
 * y transformación de campos camelCase (JS) ↔ snake_case (SQL)
 */

// Firestore collection name → Supabase table name
export const COLLECTION_TO_TABLE = {
  clients:              'clients',
  collaborators:        'collaborators',
  services:             'services',
  technicalInventory:   'technical_inventory',
  retailInventory:      'retail_inventory',
  config:               'config',
  movements:            'movements',
  appointments:         'appointments',
  monthlyClosings:      'monthly_closings',
  monthlyClosingRecords: 'monthly_closing_records',
  workShifts:           'work_shifts',
  payrollClosings:      'payroll_closings',
  stockMovements:       'stock_movements',
  giftCards:            'gift_cards',
  users:                'users',
  suppliers:            'suppliers',
  invoices:             'invoices',
  debts:                'debts',
  cashSessions:         'cash_sessions',
};

/**
 * Mapeo explícito de columnas Supabase → campos que usan los componentes
 * (aliasing para compatibilidad con nombres heredados de Firestore)
 */
const FIELD_ALIASES = {
  // Campos comunes
  stock_current:   'stockUnits',
  stock_min:       'minStock',
  is_active:       'isActive',
  firebase_id:     'firebaseId',

  // technical_inventory nuevos campos
  unit_size:       'unitSize',
  unit_of_measure: 'unitOfMeasure',
  factura_cost:    'facturaCost',
  collab_cost:     'collabCost',
  sell_mode:       'sellMode',
  
  // legacy
  cost_per_unit:   'costPerUnit',
};


/**
 * Convierte un objeto snake_case de Supabase → camelCase para React.
 * Aplica aliases explícitos si existen, o conversión automática snake→camel.
 *
 * @param {Object} row        - Fila de Supabase
 * @param {Object} [aliases]  - Mapa de aliases { col_name: 'jsFieldName' }
 */
export function rowToCamel(row, aliases = FIELD_ALIASES) {
  if (!row) return row;
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    const targetKey = aliases[key] ?? snakeToCamel(key);
    // Parseo de numéricos que llegan como string desde postgres
    if ((key === 'stock_current' || key === 'stock_min') && typeof value === 'string') {
      mapped[targetKey] = parseFloat(value);
    } else {
      mapped[targetKey] = value;
    }

    if (key === 'amount_value') {
      mapped['amount'] = typeof value === 'string' ? parseFloat(value) : value;
    }
  }

  return mapped;
}

/**
 * Versión específica para retail_inventory
 * Columnas reales: stock_current, stock_min, cost_price, sale_price
 */
export function retailRowToCamel(row) {
  const RETAIL_ALIASES = {
    ...FIELD_ALIASES,
    stock_current: 'stock',   // override: retail usa 'stock' no 'stockUnits'
    cost_price:    'cost',
    sale_price:    'price',
  };
  return rowToCamel(row, RETAIL_ALIASES);
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
