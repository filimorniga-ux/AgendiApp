/**
 * permissions.js — Sistema de Roles y Permisos (RBAC) de AgendiApp.
 *
 * Define la jerarquía de roles, el catálogo visible en UI,
 * y las operaciones sensibles que requieren autorización con PIN.
 */

// ── Jerarquía de roles (mayor número = mayor autoridad) ──────────────────────
export const ROLE_HIERARCHY = {
  assistant:   0,
  stylist:     1,
  barber:      1,
  manicurist:  1,
  esthetician: 1,
  cashier:     2,
  manager:     3,
  admin:       4,
  owner:       5,
};

// ── Catálogo de roles para UI ────────────────────────────────────────────────
export const ROLE_CATALOG = [
  { value: 'owner',       label: 'Dueño/a',          icon: '👑', tier: 5 },
  { value: 'admin',       label: 'Administrador/a',   icon: '🛡️', tier: 4 },
  { value: 'manager',     label: 'Gerente',           icon: '📊', tier: 3 },
  { value: 'cashier',     label: 'Cajero/a',          icon: '💰', tier: 2 },
  { value: 'stylist',     label: 'Estilista',         icon: '✂️', tier: 1 },
  { value: 'barber',      label: 'Barbero/a',         icon: '💈', tier: 1 },
  { value: 'manicurist',  label: 'Manicurista',       icon: '💅', tier: 1 },
  { value: 'esthetician', label: 'Esteticista',       icon: '🧖', tier: 1 },
  { value: 'assistant',   label: 'Auxiliar',          icon: '🤝', tier: 0 },
];

// ── Operaciones sensibles ────────────────────────────────────────────────────
// Cada entrada define:
//   minRole      → rol mínimo para autorizar
//   requirePin   → ¿mostrar PinModal?
//   requireNote  → ¿exigir justificación escrita?
//   label        → texto para mostrar en el PinModal
export const SENSITIVE_OPERATIONS = {
  cash_close:          { minRole: 'manager', requirePin: true,  requireNote: false, label: 'Cierre de Caja' },
  cash_audit:          { minRole: 'manager', requirePin: true,  requireNote: false, label: 'Arqueo Parcial' },
  movement_edit:       { minRole: 'manager', requirePin: true,  requireNote: true,  label: 'Editar Movimiento' },
  movement_delete:     { minRole: 'admin',   requirePin: true,  requireNote: true,  label: 'Eliminar Movimiento' },
  stock_shrinkage:     { minRole: 'manager', requirePin: true,  requireNote: true,  label: 'Merma de Inventario' },
  stock_exit:          { minRole: 'cashier', requirePin: false, requireNote: false, label: 'Salida de Mercancía' },
  inventory_delete:    { minRole: 'admin',   requirePin: true,  requireNote: true,  label: 'Eliminar Producto' },
  collaborator_access: { minRole: 'admin',   requirePin: true,  requireNote: false, label: 'Acceso de Colaborador' },
  config_change:       { minRole: 'admin',   requirePin: true,  requireNote: false, label: 'Cambiar Configuración' },
};

// ── Funciones de verificación ────────────────────────────────────────────────

/**
 * Devuelve el nivel numérico de un rol.
 * @param {string} appRole — el app_role del colaborador
 * @returns {number}
 */
export function getRoleLevel(appRole) {
  return ROLE_HIERARCHY[appRole] ?? 0;
}

/**
 * ¿Un colaborador con `appRole` puede autorizar la `operation`?
 * @param {string} appRole
 * @param {string} operation — clave de SENSITIVE_OPERATIONS
 * @returns {boolean}
 */
export function canAuthorize(appRole, operation) {
  const op = SENSITIVE_OPERATIONS[operation];
  if (!op) return true; // operación no registrada → acceso libre
  return getRoleLevel(appRole) >= getRoleLevel(op.minRole);
}

/**
 * Obtiene la definición de una operación sensible.
 * @param {string} operation — clave de SENSITIVE_OPERATIONS
 * @returns {object|null}
 */
export function getOperationDef(operation) {
  return SENSITIVE_OPERATIONS[operation] ?? null;
}

/**
 * Devuelve la etiqueta legible de un app_role.
 * @param {string} appRole
 * @returns {string}
 */
export function getRoleLabel(appRole) {
  return ROLE_CATALOG.find(r => r.value === appRole)?.label ?? appRole;
}

/**
 * Devuelve los roles que pueden ser asignados por alguien con `assignerRole`.
 * Un usuario solo puede asignar roles de nivel inferior al suyo.
 * @param {string} assignerRole
 * @returns {Array}
 */
export function getAssignableRoles(assignerRole) {
  const level = getRoleLevel(assignerRole);
  return ROLE_CATALOG.filter(r => r.tier < level);
}
