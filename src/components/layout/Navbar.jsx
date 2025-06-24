// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react'; // useEffect y useRef añadidos
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState, useAuthDispatch } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { 
    FaShoppingCart, FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus, 
    FaBars, FaTimes, FaAngleDown, FaFileInvoiceDollar // FaAngleDown y FaFileInvoiceDollar añadidos
} from 'react-icons/fa';
import { useCartState } from '../../contexts/CartContext';

function Navbar() {
  const { isAuthenticated, user, refreshToken: currentRefreshToken } = useAuthState();
  const { itemCount } = useCartState();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // Estado para el menú de usuario
  const userMenuRef = useRef(null); // Ref para el menú de usuario (para cerrar al hacer clic fuera)

  // Cerrar menú de usuario si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef]);

  const handleLogout = async () => {
    // ... (tu lógica de logout)
    setIsMobileMenuOpen(false); // Cerrar menú móvil si está abierto
    setIsUserMenuOpen(false); // Cerrar menú de usuario
    dispatch({ type: 'LOGOUT_REQUEST' });
    try {
      if (currentRefreshToken) {
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
  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }

  const commonLinkClasses = "block px-3 py-2 rounded-md text-base font-medium hover:bg-color-secondary hover:text-text-light transition-colors";
  const desktopLinkClasses = "text-text-light hover:text-color-neutral-light";
  const mobileLinkClasses = "text-gray-700 hover:bg-gray-100"; // Para menú móvil en fondo blanco

  return (
    <nav className="bg-color-primary text-text-light shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse" onClick={closeAllMenus}>
            {/* <img src={logoImage} className="h-8 sm:h-9" alt="Logo" /> */}
            <span className="self-center text-xl sm:text-2xl font-semibold whitespace-nowrap hover:text-color-neutral-light transition-colors">
              MiEcommerce
            </span>
          </Link>

          {/* Navegación Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/products" className={`${desktopLinkClasses}`}>Productos</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/cart" className={`relative p-2 ${desktopLinkClasses}`}>
                  <FaShoppingCart size={22} />
                  {itemCount > 0 && ( <span className="cart-badge">{itemCount}</span> )}
                </Link>
                
                {/* Menú de Usuario Desktop */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center p-2 rounded-md ${desktopLinkClasses} focus:outline-none hover:bg-color-secondary`}
                    aria-haspopup="true" aria-expanded={isUserMenuOpen}
                  >
                    <FaUserCircle size={22} />
                    <span className="ml-2 hidden lg:inline">{user?.email?.split('@')[0] || 'Mi Cuenta'}</span>
                    <FaAngleDown size={18} className="ml-1 hidden lg:inline" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-500">Sesión iniciada como</p>
                        <p className="text-sm font-medium text-color-primary truncate" title={user?.email}>{user?.email}</p>
                      </div>
                      <hr/>
                      <Link to="/profile" onClick={closeAllMenus} className={`block px-4 py-2 text-sm ${mobileLinkClasses} hover:text-color-secondary flex items-center`}><FaUserCircle className="mr-2 text-color-secondary"/>Mi Perfil</Link>
                      <Link to="/quotes" onClick={closeAllMenus} className={`block px-4 py-2 text-sm ${mobileLinkClasses} hover:text-color-secondary flex items-center`}><FaFileInvoiceDollar className="mr-2 text-color-secondary"/>Mis Cotizaciones</Link>
                      <hr className="my-1"/>
                      <button onClick={handleLogout} className={`block w-full text-left px-4 py-2 text-sm ${mobileLinkClasses} hover:text-color-secondary flex items-center`}>
                        <FaSignOutAlt className="mr-2 text-color-secondary"/> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${desktopLinkClasses} hover:bg-color-secondary`}>
                  <FaSignInAlt className="mr-1" /> Login
                </Link>
                <Link to="/register" className="bg-color-accent1 hover:bg-opacity-80 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center transition-colors">
                  <FaUserPlus className="mr-1" /> Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón Hamburguesa e Icono de Carrito en Mobile */}
          <div className="md:hidden flex items-center">
            {isAuthenticated && (
                <Link to="/cart" className={`relative p-2 mr-2 ${desktopLinkClasses}`} onClick={closeAllMenus}>
                    <FaShoppingCart size={22} />
                    {itemCount > 0 && ( <span className="cart-badge">{itemCount}</span> )}
                </Link>
            )}
            <button onClick={toggleMobileMenu} type="button" className="mobile-menu-button" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen}>
              <span className="sr-only">Abrir menú</span>
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 bg-white shadow-lg rounded-b-md" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/products" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses}`}>Productos</Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaUserCircle className="mr-2"/>Mi Perfil</Link>
                <Link to="/quotes" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaFileInvoiceDollar className="mr-2"/>Mis Cotizaciones</Link>
                <button onClick={handleLogout} className={`${commonLinkClasses} ${mobileLinkClasses} w-full text-left flex items-center`}>
                    <FaSignOutAlt className="mr-2"/> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaSignInAlt className="mr-2"/>Login</Link>
                <Link to="/register" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaUserPlus className="mr-2"/>Registrarse</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
// Estilos para el badge del carrito (puedes ponerlos en tu index.css o un archivo de estilos global)
// .cart-badge {
//   position: absolute;
//   top: 0.1rem; /* Ajusta según el tamaño del icono */
//   right: 0.1rem; /* Ajusta según el tamaño del icono */
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   padding: 0.1em 0.4em; /* Ajusta el padding */
//   font-size: 0.65rem; /* Más pequeño */
//   font-weight: bold;
//   line-height: 1;
//   color: white;
//   background-color: red; /* O tu color de acento para notificaciones */
//   border-radius: 9999px; /* Circular */
//   transform: translate(50%, -50%); /* Para posicionarlo en la esquina superior derecha del icono */
// }
// .mobile-menu-button { /* Clases para el botón de hamburguesa */
//    @apply inline-flex items-center justify-center p-2 rounded-md text-text-light hover:text-white hover:bg-color-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white;
// }

export default Navbar;