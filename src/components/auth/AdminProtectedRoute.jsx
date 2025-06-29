// src/components/auth/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from '../../contexts/AuthContext';

const AdminProtectedRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuthState();

  if (isLoading) {
    return <div>Cargando...</div>; // O un Loader
  }

  // El objeto 'user' en tu AuthContext debería tener la info del perfil,
  // que a su vez debería indicar si es admin. Asumimos que la API de perfil
  // devuelve un campo como 'is_staff'. Si no, necesitarías que lo haga.
  // Tu 'user' del AuthContext es el 'UserProfile'. El 'user_info' es el 'CustomUser'.
  // Tu CustomUser hereda de AbstractUser, así que tiene 'is_staff'.
  // NECESITAS que tu UserProfileSerializer devuelva esta información.
  const isStaff = user?.is_staff || user?.user?.is_staff; // Busca en ambos por si acaso

  if (!isAuthenticated || !isStaff) {
    // Redirigir a home o a una página de "no autorizado" si no es admin
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // Renderizar contenido si es admin
};

export default AdminProtectedRoute;