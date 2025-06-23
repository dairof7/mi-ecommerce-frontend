// src/RouterConfig.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuthState } from './contexts/AuthContext';

// Páginas (Vistas)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import QuoteHistoryPage from './pages/QuoteHistoryPage';
// import NotFoundPage from './pages/NotFoundPage';

// Componente para Rutas Protegidas
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthState();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-color-secondary">Cargando...</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Componente para Rutas Públicas (que no deberían ser accesibles si ya estás logueado)
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuthState();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-color-secondary">Cargando...</p>
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

function RouterConfig() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      {/* <Route path="/category/:categoryId" element={<ProductListPage />} /> */}
      {/* <Route path="/subcategory/:subcategoryId" element={<ProductListPage />} /> */}

      {/* Rutas que no deberían ser accesibles si ya estás logueado */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      Rutas Protegidas
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/quotes" element={<QuoteHistoryPage />} />
        {/* Añade más rutas protegidas aquí */}
      </Route>
      
      {/* Ruta para Página no encontrada */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
      <Route path="*" element={
        <div className="text-center py-10">
          <h1 className="text-4xl font-bold text-color-primary mb-4">404 - Página No Encontrada</h1>
          <p className="text-lg">Lo sentimos, la página que buscas no existe.</p>
          <Link to="/" className="mt-6 inline-block bg-color-secondary text-white font-semibold py-2 px-4 rounded hover:bg-color-accent1 transition-colors">
            Volver al Inicio
          </Link>
        </div>
      } />
    </Routes>
  );
}

export default RouterConfig;