// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState, useAuthDispatch } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaBars, FaTimes } from 'react-icons/fa';
import { useCartState } from '../../contexts/CartContext';
import logoImage from '../../assets/logo_blanco.png';

function Navbar() {
  const { isAuthenticated, user, refreshToken: currentRefreshToken } = useAuthState(); // Obtener refreshToken del estado
  const { itemCount } = useCartState();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    // ... (tu lógica de logout como antes, usando currentRefreshToken) ...
    dispatch({ type: 'LOGOUT_REQUEST' });
    try {
      if (currentRefreshToken) { // Usar el refreshToken del estado
        await authService.logout(currentRefreshToken);
      }
      dispatch({ type: 'LOGOUT' });
      toast.info('Has cerrado sesión.');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      dispatch({ type: 'LOGOUT' });
      toast.error('Error al cerrar sesión en el servidor, pero se cerró localmente.');
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const commonLinkClasses = "block px-3 py-2 rounded-md text-base font-medium hover:bg-color-secondary hover:text-text-light transition-colors";
  const desktopLinkClasses = "text-text-light hover:text-color-neutral-light"; // Para enlaces en desktop
  const mobileLinkClasses = "text-gray-700 hover:bg-gray-200"; // Para enlaces en menú móvil

  return (
    <nav className="bg-color-primary text-text-light shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img 
              src={logoImage} // Usa la variable importada
              className="h-8 sm:h-9" // Ajusta el tamaño según tu logo
              alt="S" 
            />
            <span className="self-center text-xl sm:text-2xl font-semibold whitespace-nowrap hover:text-color-neutral-light transition-colors">
              Solid Store {/* Nombre de tu tienda */}
            </span>
          </Link>


          {/* Navegación Desktop (oculta en mobile) */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/products" className={`${desktopLinkClasses}`}>Productos</Link>
            {/* Otros enlaces de navegación principales para desktop */}
            
            {isAuthenticated ? (
              <>
                <Link to="/cart" className={`relative p-2 ${desktopLinkClasses}`}>
                  <FaShoppingCart size={22} />
                  {itemCount > 0 && (
                    <span className="absolute top-1 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className={`flex items-center ${desktopLinkClasses}`}>
                  <FaUserCircle size={22} className="mr-1" /> Perfil
                </Link>
                <button onClick={handleLogout} className={`bg-color-accent2 hover:bg-opacity-80 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center transition-colors`}>
                  <FaSignOutAlt size={18} className="mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`flex items-center ${desktopLinkClasses}`}>
                  <FaSignInAlt size={18} className="mr-1" /> Login
                </Link>
                <Link to="/register" className={`bg-color-accent1 hover:bg-opacity-80 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center transition-colors`}>
                  <FaUserPlus size={18} className="mr-1" /> Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón Hamburguesa (visible solo en mobile) */}
          <div className="md:hidden flex items-center">
            {/* Icono de carrito siempre visible en mobile si está autenticado */}
            {isAuthenticated && (
                <Link to="/cart" className={`relative p-2 mr-2 ${desktopLinkClasses}`}> {/* Reusar estilo desktop */}
                    <FaShoppingCart size={22} />
                    {itemCount > 0 && (
                    <span className="absolute top-1 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {itemCount}
                    </span>
                    )}
                </Link>
            )}
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-text-light hover:text-white hover:bg-color-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 bg-white shadow-lg rounded-b-md" id="mobile-menu"> {/* Posicionado absolutamente */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/products" onClick={toggleMobileMenu} className={`${commonLinkClasses} ${mobileLinkClasses}`}>Productos</Link>
            {/* Otros enlaces de navegación principales para mobile */}
            
            {isAuthenticated ? (
              <>
                {/* El carrito ya está arriba, pero si quieres duplicarlo o moverlo aquí:
                <Link to="/cart" onClick={toggleMobileMenu} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}>
                    <FaShoppingCart size={20} className="mr-2" /> Carrito
                    {itemCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-1.5 rounded-full">{itemCount}</span>}
                </Link> */}
                <Link to="/quotes" onClick={toggleMobileMenu} className={`${commonLinkClasses} ${mobileLinkClasses}`}>Mis Cotizaciones</Link>
                <Link to="/profile" onClick={toggleMobileMenu} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}>
                    <FaUserCircle size={20} className="mr-2" /> Perfil
                </Link>
                <button onClick={() => { handleLogout(); toggleMobileMenu(); }} className={`${commonLinkClasses} ${mobileLinkClasses} w-full text-left flex items-center`}>
                    <FaSignOutAlt size={20} className="mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={toggleMobileMenu} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}>
                    <FaSignInAlt size={20} className="mr-2" /> Login
                </Link>
                <Link to="/register" onClick={toggleMobileMenu} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}>
                    <FaUserPlus size={20} className="mr-2" /> Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
export default Navbar;