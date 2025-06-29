import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaCartPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuthState } from '../../contexts/AuthContext';
import { useCartDispatch } from '../../contexts/CartContext'; // Solo necesitamos el dispatch aquí
import cartService from '../../services/cartService';

// Helper para formatear moneda
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits:0, maximumFractionDigits:0 }).format(value);
};

function ProductCard({ product }) {
  const { isAuthenticated } = useAuthState();
  const cartDispatch = useCartDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

const imageUrl = product.images && product.images.length > 0 
  ? product.images[0].image 
  : '/logo.png';
  
  const handleAddToCart = async (e) => {
    // Prevenir que el clic en el botón también active el Link de la tarjeta si estuvieran anidados de otra forma
    if (e) { // e puede ser undefined si se llama programáticamente
        e.preventDefault();
        e.stopPropagation();
    }
    

    if (product.stock === 0) {
        toast.warn("Este producto está agotado.");
        return;
    }

    if (!isAuthenticated) {
      toast.info("Por favor, inicia sesión para añadir productos al carrito.");
      // Guardamos la ruta actual (lista de productos) O la del detalle si el usuario hace clic desde ahí
      // Si este ProductCard está en ProductListPage, location.pathname será /products (o /category/X)
      // Si el usuario quiere ir al detalle primero, el Link to={`/products/${product.id}`} se encarga
      // Aquí, si no está logueado y hace clic en "Añadir", lo mandamos a login y luego podría volver
      // a la lista o al producto si guardamos product.id también.
      // Por simplicidad, lo mandamos a login y luego a la página de donde vino (la lista).
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    setIsAdding(true);
    cartDispatch({ type: 'REQUEST_START' });

    try {
      // Llamamos al nuevo endpoint que siempre añade/incrementa en 1
      const updatedCartData = await cartService.addOneProductToCart(product.id); 
      
      if (updatedCartData) {
        cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCartData } });
      } else {
        // Fallback si la API no devuelve el carrito
        const fallbackCart = await cartService.getCart();
        cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: fallbackCart || { items: [], id: null, itemCount: 0, totalAmount: 0 } }});
      }
      toast.success(`"${product.name}" añadido al carrito!`);
    } catch (error) {
      const errorMsg = error?.error || error?.detail || error?.message || "Error al añadir al carrito.";
      cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: errorMsg } });
      toast.error(errorMsg);
    } finally {
      setIsAdding(false);
    }
  };

  const buttonText = () => {
    if (product.stock === 0) return 'Agotado';
    if (isAdding) return 'Añadiendo...';
    if (!isAuthenticated) return 'Ver Producto'; // O 'Iniciar Sesión para Comprar'
    return 'Añadir al Carrito';
  };

  const handleButtonClick = (e) => {
    if (!isAuthenticated && product.stock > 0) {
        // Si no está autenticado y hace clic en "Ver Producto", lo llevamos al detalle
        e.preventDefault(); // Prevenir que el Link padre se active si este botón estuviera dentro
        e.stopPropagation();
        navigate(`/products/${product.id}`);
    } else if (product.stock > 0) {
        handleAddToCart(e); // Solo llama a handleAddToCart si hay stock y está autenticado (o se manejará dentro)
    }
    // Si está agotado, el botón está deshabilitado y no hace nada
  };


  return (
  <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden transform hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out flex flex-col group">
    <Link to={`/products/${product.id}`} className="block relative aspect-[4/3] overflow-hidden">
      <img 
        src={imageUrl} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      />
    </Link>
    <div className="p-1 sm:p-4 flex flex-col flex-grow"> {/* Padding más pequeño en mobile */}
<h5 className="text-sm sm:text-base font-semibold tracking-tight text-color-primary mb-0.5 min-h-[1.6em] sm:min-h-[2em] line-clamp-2" title={product.name}>
  <Link to={`/products/${product.id}`} className="hover:text-color-accent1">
    {product.name}
  </Link>
</h5>
        


        <div className="mt-auto pt-2">
        <div className="flex items-baseline justify-between mb-2">
  <div className="flex flex-col items-start">
    <div className="flex items-baseline gap-2">
      {product.has_discount ? (
        <>
          <span className="text-lg sm:text-xl font-bold text-color-accent2">
            {formatCurrency(product.final_sale_price)}
          </span>
          {product.applied_discount_percentage > 0 && (
            <p className="text-xs text-green-600 font-semibold mb-0">
              Ahorro: {parseFloat(product.applied_discount_percentage).toFixed(0)}%
            </p>
          )}
        </>
      ) : (
        <span className="text-lg sm:text-xl font-bold text-color-primary">
          {formatCurrency(product.original_sale_price)}
        </span>
      )}
    </div>
    {product.has_discount && (
      <span className="text-xs text-gray-500 line-through">
        {formatCurrency(product.original_sale_price)}
      </span>
    )}
  </div>
</div>


          <button 
            onClick={handleButtonClick} // Cambiado a handleButtonClick
            disabled={product.stock === 0 || isAdding} // Deshabilitar si está agotado o añadiendo
            className={`w-full flex items-center justify-center text-white font-medium rounded-lg text-xs sm:text-sm px-3 py-2 md:px-4 md:py-2.5 text-center transition-colors duration-150 ease-in-out
                        ${product.stock === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                              : (isAdding ? 'bg-color-accent2 opacity-70 cursor-wait' 
                                                          : 'bg-color-secondary hover:bg-color-accent1 focus:ring-4 focus:outline-none focus:ring-blue-300')}`}
            title={buttonText()}
          >
            <FaCartPlus className="mr-2" />
            {buttonText()}
          </button>
          {!isAuthenticated && product.stock > 0 && (
            <p className="text-xs text-center mt-1 text-gray-500">
              <Link to="/login" state={{ from: `/products/${product.id}` }} className="underline hover:text-color-secondary">Inicia sesión</Link> para comprar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;