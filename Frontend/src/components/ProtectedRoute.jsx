// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading, hasRole, isSuperUser } = useAuth();

  if (loading) {
    return <div className="text-white">Cargando...</div>;
  }

  // Si no hay usuario, redirige al login (manteniendo tu ruta)
  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  // Si se requieren roles específicos
  if (requiredRoles.length > 0) {
    if (isSuperUser) {
      return children;
    }
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to="/Unauthorized" replace />;
    }
  }

  return children;
};