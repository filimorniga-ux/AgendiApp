import React from 'react';
import { Navigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const ProtectedRoute = ({ children }) => {
    const { user, loadingAuth } = useData();

    if (loadingAuth) {
        // Puedes retornar un spinner o null mientras carga
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        // Si no hay usuario, redirigir a la Landing Page
        return <Navigate to="/" replace />;
    }

    // Si hay usuario, renderizar el contenido protegido
    return children;
};

export default ProtectedRoute;
