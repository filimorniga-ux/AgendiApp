import React from 'react';
import { Navigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';

/**
 * Filtra el acceso dependiendo del rol del usuario.
 * 
 * Roles del ecosistema:
 *   - 'owner'   → Dueño del comercio (acceso total)
 *   - 'admin'   → Administrador delegado (acceso casi total)
 *   - 'staff'   → Colaborador/empleado (acceso limitado: agenda propia + nómina propia)
 *   - 'client'  → Cliente final (acceso al portal público + historial)
 *
 * @param {Array<string>} allowedRoles Roles permitidos (default: ['owner', 'admin'])
 * @param {string} fallbackPath Ruta de redirección si no tiene permiso
 */
const RoleGuard = ({ allowedRoles = ['owner', 'admin'], fallbackPath = '/app', children }) => {
  const { realRole, isClient, loadingAuth } = useBusiness();

  // Si aún está cargando la auth, devolvemos null para evitar redirecciones falsas
  if (loadingAuth) return null;

  // Si es un cliente autenticado, redirigirlo al portal público
  if (isClient) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(realRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleGuard;
