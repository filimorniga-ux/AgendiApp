import React from 'react';
import { Navigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';

/**
 * Filtra el acceso dependiendo del rol del usuario.
 * @param {Array<string>} allowedRoles roles permitidos ('owner', 'admin', 'collaborator')
 * @param {string} fallbackPath ruta a redirigir si no tiene permiso (por defecto '/app')
 */
const RoleGuard = ({ allowedRoles = ['owner', 'admin'], fallbackPath = '/app', children }) => {
  const { realRole, loadingAuth } = useBusiness();

  // Si aún está cargando la auth, devolvemos null (o un spinner) para evitar redirecciones falsas
  if (loadingAuth) return null;

  if (!allowedRoles.includes(realRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleGuard;
