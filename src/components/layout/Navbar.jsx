// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState, useAuthDispatch } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { 
    FaShoppingCart, FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus, 
    FaBars, FaTimes, FaAngleDown, FaFileInvoiceDollar 
} from 'react-icons/fa';
import { useCartState } from '../../contexts/CartContext';
// import logoImage from '../../assets/logo.svg'; // Descomenta si tienes un logo
import logoImage from '../../assets/logo_blanco.png';
function Navbar() {
  const { isAuthenticated, user, refreshToken: currentRefreshToken } = useAuthState();
  const { itemCount } = useCartState();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      // Opcional: cerrar menú móvil también si se hace clic fuera de él y del botón hamburguesa
      // const mobileMenu = document.getElementById('mobile-menu');
      // const mobileMenuButton = document.querySelector('.mobile-menu-button'); // Necesitarías una clase en el botón
      // if (mobileMenu && !mobileMenu.contains(event.target) && mobileMenuButton && !mobileMenuButton.contains(event.target)) {
      //   setIsMobileMenuOpen(false);
      // }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef]);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    // dispatch({ type: 'LOGOUT_REQUEST' }); // Eliminado según tu preferencia anterior
    try {
      if (currentRefreshToken) {
        await authService.logout(currentRefreshToken);
      }
    } catch (error) {
      console.error('Error calling backend logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      toast.info('Has cerrado sesión.');
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }

  const commonLinkClasses = "block px-3 py-2 rounded-md text-base font-medium hover:bg-color-secondary hover:text-text-light transition-colors";
  const desktopLinkClasses = "text-text-light hover:text-color-neutral-light transition-colors";
  const mobileLinkClasses = "text-gray-700 hover:bg-gray-100";

  // Clases para el badge del carrito con Tailwind
  const cartBadgeClasses = "absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full";

  return (
    <nav className="bg-color-primary text-text-light shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
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

          {/* Navegación Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/products" className={`${desktopLinkClasses} px-3 py-2 rounded-md text-sm font-medium`}>Productos</Link>

            <Link to="/como-comprar" className={`${desktopLinkClasses} px-3 py-2 rounded-md text-sm font-medium`}>Cómo Comprar</Link>
<Link to="/about-us" className="tu-clase-de-estilo-para-enlaces">
  Quiénes Somos
</Link>

            {isAuthenticated ? (
              <>
              {user?.is_staff && (
                <>
                   <Link to="/manage/quotes" // <-- RUTA ACTUALIZADA      onClick={closeAllMenus} 
                    className={`${desktopLinkClasses} px-3 py-2 rounded-md text-sm font-medium`}
                    >
                    Gestionar Pedidos
                    </Link>

                    <Link to="/pos" // <-- RUTA ACTUALIZADA      onClick={closeAllMenus} 
                    className={`${desktopLinkClasses} px-3 py-2 rounded-md text-sm font-medium`}
                    >
                    POS
                    </Link>
                </>
              )}
                {/* Contenedor del Carrito con position: relative */}
                {!user?.is_staff && (
                <Link to="/cart" className={`relative p-2 ${desktopLinkClasses} rounded-md hover:bg-color-secondary`}>
                  <FaShoppingCart size={22} />
                  {itemCount > 0 && ( <span className={cartBadgeClasses}>{itemCount}</span> )}
                </Link>
                )}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center p-2 rounded-md ${desktopLinkClasses} focus:outline-none hover:bg-color-secondary`}
                    aria-haspopup="true" aria-expanded={isUserMenuOpen}
                  >
                    <FaUserCircle size={22} />
                    <span className="ml-2 hidden lg:inline text-sm">{user?.user || 'Mi Cuenta'}</span>
                    <FaAngleDown size={16} className="ml-1 hidden lg:inline" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-500">Sesión iniciada como</p>
                        <p className="text-sm font-medium text-color-primary truncate" title={user?.email}>{user?.email}</p>
                      </div>
                      <hr className="my-0.5"/>
                      <Link to="/profile" onClick={closeAllMenus} className={`block px-4 py-2 text-sm ${mobileLinkClasses} hover:text-color-secondary flex items-center`}><FaUserCircle className="mr-2 text-gray-500"/>Mi Perfil</Link>
                      <Link to="/quotes" onClick={closeAllMenus} className={`block px-4 py-2 text-sm ${mobileLinkClasses} hover:text-color-secondary flex items-center`}><FaFileInvoiceDollar className="mr-2 text-gray-500"/>Mis Cotizaciones</Link>
                      <hr className="my-0.5"/>
                      <button onClick={handleLogout} className={`block w-full text-left px-4 py-2 text-sm ${mobileLinkClasses} hover:text-color-secondary flex items-center`}>
                        <FaSignOutAlt className="mr-2 text-gray-500"/> Logout
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
              
                // Contenedor del Carrito en Mobile con position: relative
                <Link to="/cart" className={`relative p-2 mr-2 ${desktopLinkClasses} rounded-md hover:bg-color-secondary`} onClick={closeAllMenus}>
                    <FaShoppingCart size={22} />
                    {itemCount > 0 && ( <span className={cartBadgeClasses}>{itemCount}</span> )}
                </Link>
            )}
            
            <button 
                onClick={toggleMobileMenu} 
                type="button" 
                className="inline-flex items-center justify-center p-2 rounded-md text-text-light hover:text-white hover:bg-color-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" 
                aria-controls="mobile-menu" 
                aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Abrir menú</span>
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu"> {/* No necesita ser absolute si el nav es sticky y el contenido debajo empuja */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white rounded-b-md shadow-lg"> {/* Fondo blanco para el menú móvil */}
            <Link to="/products" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses}`}>Productos</Link>
            <Link to="/como-comprar" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses}`}>Cómo Comprar</Link>
            {isAuthenticated ? (
              <>
                {  user?.is_staff && (
                  <>
                   <Link to="/manage/quotes" // <-- RUTA ACTUALIZADA      onClick={closeAllMenus} 
                    className={`${commonLinkClasses} ${mobileLinkClasses}`}
                    onClick={closeAllMenus}
                    >
                    Gestionar Pedidos
                    </Link>
                                        <Link to="/pos" // <-- RUTA ACTUALIZADA      onClick={closeAllMenus} 
                    className={`${commonLinkClasses} ${mobileLinkClasses}`}
                    onClick={closeAllMenus}
                    >
                    POS
                    </Link>
                      </>
                    
                )}
                <Link to="/profile" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaUserCircle className="mr-2 text-gray-500"/>Mi Perfil</Link>
                <Link to="/quotes" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaFileInvoiceDollar className="mr-2 text-gray-500"/>Mis Cotizaciones</Link>
                <hr className="my-1"/>
                <button onClick={handleLogout} className={`${commonLinkClasses} ${mobileLinkClasses} w-full text-left flex items-center`}>
                    <FaSignOutAlt className="mr-2 text-gray-500"/> Logout
                </button>
              </>
            ) : (
              <>
                <hr className="my-1"/>
                <Link to="/login" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaSignInAlt className="mr-2 text-gray-500"/>Login</Link>
                <Link to="/register" onClick={closeAllMenus} className={`${commonLinkClasses} ${mobileLinkClasses} flex items-center`}><FaUserPlus className="mr-2 text-gray-500"/>Registrarse</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;