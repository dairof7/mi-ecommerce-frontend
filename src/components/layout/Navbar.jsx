import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState, useAuthDispatch } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa'; // Iconos
import { useCartState } from '../../contexts/CartContext';

function Navbar() {
  const { isAuthenticated, user, refreshToken } = useAuthState();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const { itemCount } = useCartState();
  const handleLogout = async () => {
    // dispatch({ type: 'LOGOUT_REQUEST' }); // Opcional, para mostrar un loader que indique que se está cerrando sesión
    // Si tienes un loading spinner o algo similar, puedes activarlo aquí
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      dispatch({ type: 'LOGOUT' });
      toast.info('Has cerrado sesión.');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Incluso si la llamada al backend falla, desloguear del frontend
      dispatch({ type: 'LOGOUT' });
      toast.error('Error al cerrar sesión en el servidor, pero se cerró localmente.');
      navigate('/login');
    }
  };

  return (
    <nav className="bg-color-primary text-text-light p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-color-neutral-light transition-colors">
          Solid Store
        </Link>
        <div className="space-x-4 flex items-center">
          <Link to="/products" className="hover:text-color-neutral-light transition-colors">Productos</Link>
          {/* Más enlaces de navegación aquí (Categorías, etc.) */}
          
          {isAuthenticated ? (
            <>
              <Link to="/cart" className="relative hover:text-color-neutral-light transition-colors">
                <FaShoppingCart size={24} />
                
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {itemCount}
                  </span>
                )}

              </Link>
              <Link to="/profile" className="hover:text-color-neutral-light transition-colors flex items-center">
                <FaUserCircle size={24} className="mr-1" /> ({user?.user || user?.username})
              </Link>
              <button onClick={handleLogout} className="bg-color-accent2 hover:bg-opacity-80 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center transition-colors">
                <FaSignOutAlt size={18} className="mr-1" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-color-neutral-light transition-colors flex items-center">
                <FaSignInAlt size={18} className="mr-1" /> Login
              </Link>
              <Link to="/register" className="bg-color-accent1 hover:bg-opacity-80 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center transition-colors">
                <FaUserPlus size={18} className="mr-1" /> Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
export default Navbar;