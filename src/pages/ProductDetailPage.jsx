import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; // useLocation añadido
import productService from '../services/productService';
import cartService from '../services/cartService'; // Importar cartService
import { toast } from 'react-toastify';
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaTags, FaInfoCircle, FaStore, FaShareAlt } from 'react-icons/fa';
import { useAuthState } from '../contexts/AuthContext';
import { useCartDispatch } from '../contexts/CartContext'; // Importar useCartDispatch

// Helper para formatear moneda (asumiendo que está definido o importado)
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits:0, maximumFractionDigits:0 }).format(value);
};

const Loader = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-color-secondary"></div>
    <p className="ml-4 text-xl text-color-secondary">Cargando detalles del producto...</p>
  </div>
);

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Para obtener la ruta actual
  const { isAuthenticated } = useAuthState();
  const cartDispatch = useCartDispatch(); // Hook para despachar acciones al CartContext

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false); // Estado para el botón
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1); // Cantidad a añadir, por defecto 1
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setQuantity(1); // Resetear cantidad al cargar nuevo producto
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);
      setCurrentImageIndex(0);
    } catch (err) {
      const errorMsg = err.message || `Error al cargar el producto ID ${productId}.`;
      setError(errorMsg);
      toast.error(errorMsg);
      if (err.response && err.response.status === 404) {
        // Opcional: redirigir si el producto no se encuentra
        // navigate('/products', { replace: true }); 
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId, navigate]); // navigate añadido como dependencia, aunque no se usa directamente en el try/catch

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, fetchProduct]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (product && newQuantity > product.stock && product.stock > 0) return product.stock;
      if (product && product.stock === 0) return 1; // Si no hay stock, no dejar aumentar
      return newQuantity;
    });
  };

  const handleDirectQuantityInput = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
        value = 1;
    } else if (product && value > product.stock && product.stock > 0) {
        value = product.stock;
    } else if (product && product.stock === 0) {
        value = 1; // O no permitir cambiar si stock es 0
    }
    setQuantity(value);
  };

  const handleGoBack = () => {
    // Si hay un historial de navegación en la sesión actual, retrocede.
    // La clave 'default' se usa solo para la primera entrada en la pila de historial.
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      // De lo contrario, navega a una página de respaldo segura.
      navigate('/products');
    }
  };


  const handleAddToCart = async () => {
    if (!product || product.stock === 0) {
        toast.warn(product.stock === 0 ? "Este producto está agotado." : "Producto no disponible.");
        return;
    }
    if (quantity <= 0) {
        toast.warn("Por favor, selecciona una cantidad válida (mínimo 1).");
        setQuantity(1); // Resetear a 1
        return;
    }
    if (quantity > product.stock) {
        toast.error(`No hay suficiente stock. Solo ${product.stock} unidades disponibles.`);
        setQuantity(product.stock); // Ajustar a stock máximo
        return;
    }

    if (!isAuthenticated) {
        toast.info("Por favor, inicia sesión para añadir productos al carrito.");
        navigate('/login', { state: { from: location.pathname } }); // Guardar ruta actual
        return;
    }

    setIsAddingToCart(true);
    cartDispatch({ type: 'REQUEST_START' });
    try {
      await cartService.addManyProductToCart(product.id, quantity); 
      const updatedCart = await cartService.getCart(); // Recargar el carrito
      // Si el carrito viene null, manejarlo según tu lógica de initialCartState
      if (updatedCart) {
        cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCart } });
      } else {
        // Manejar caso de carrito nulo si es posible (ej. usuario nuevo sin carrito)
        cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: { items: [], id: null, itemCount: 0, totalAmount: 0 } }});
      }
      toast.success(`${quantity} x ${product.name} añadido(s) al carrito!`);
      // setQuantity(1); // Opcional: resetear cantidad en la página de detalle
    } catch (error) {
      const errorMsg = error?.error || error?.detail || error?.message || "Error al añadir al carrito.";
      cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: errorMsg } });
      toast.error(errorMsg);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Mira este producto: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error compartiendo:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Enlace copiado al portapapeles");
      } catch (err) {
        toast.error("No se pudo copiar el enlace");
      }
    }
  };

  const nextImage = () => {
    if (product && product.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + product.images.length) % product.images.length);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <div className="text-center py-10 text-red-500 text-xl">{error} <Link to="/products" className="text-blue-500 hover:underline">Volver al listado</Link></div>;
  if (!product) return <div className="text-center py-10 text-xl">Producto no encontrado. <Link to="/products" className="text-blue-500 hover:underline">Volver al listado</Link></div>;

  const mainImageUrl = product.images && product.images.length > 0
    ? product.images[currentImageIndex]?.image
    : '/logo.png';
  
  const thumbnailImages = product.images || [];

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-4">
        <button onClick={handleGoBack} className="text-color-secondary hover:text-color-accent1 inline-flex items-center font-medium">
            <FaChevronLeft className="mr-2" /> Volver al listado de productos
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 bg-white p-3 sm:p-6 md:p-8 rounded-lg shadow-xl">
        {/* Columna de Imágenes */}
        <div className="product-images">
        <div className="relative mb-2 border rounded-lg shadow-sm overflow-hidden aspect-square md:aspect-auto md:h-auto max-h-[70vh] md:max-h-[500px] lg:max-h-[600px]">
            <img 
              src={mainImageUrl} 
              alt={product.images && product.images.length > 0 ? product.images[currentImageIndex]?.alt_text || product.name : product.name} 
              className="w-full h-full object-contain"
              onError={(e) => {
    e.target.onerror = null; // Evita bucles infinitos si logo.png también falla
    e.target.src = '/logo.png';
  }}
            />
            {thumbnailImages.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity" aria-label="Imagen anterior">
                  <FaChevronLeft size={20} />
                </button>
                <button onClick={nextImage} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity" aria-label="Siguiente imagen">
                  <FaChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          {thumbnailImages.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2 justify-center">
              {thumbnailImages.map((img, index) => (
                <button 
                  key={img.id || index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 md:w-20 md:h-20 border-2 rounded-md overflow-hidden focus:outline-none transition-all ${index === currentImageIndex ? 'border-color-secondary ring-2 ring-color-secondary' : 'border-transparent hover:border-gray-400'}`}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  <img src={img.image} alt={img.alt_text || `Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna de Información y Acciones */}
<div className="product-info flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-color-primary leading-tight pr-4">{product.name}</h1>
            <button 
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-color-secondary hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Compartir producto"
              title="Compartir"
            >
              <FaShareAlt size={20} />
            </button>
          </div>
            
            <div className="mb-2 text-xs sm:text-sm">
              {product.category && (
                <Link to={`/category/${product.category.id}`} className="text-color-accent2 hover:underline mr-1">
                  {product.category.name}
                </Link>
              )}
              {product.subcategory && product.category && <span className="text-gray-400 mx-1"></span>}
              {product.subcategory && (
                <Link to={`/subcategory/${product.subcategory.id}`} className="text-color-accent2 hover:underline">
                  {product.subcategory.name}
                </Link>
              )}
            </div>

            <div className="mb-2">
              {product.has_discount ? (
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl sm:text-3xl font-bold text-color-accent1">{formatCurrency(product.final_sale_price)}</p>
                  <p className="text-lg md:text-xl text-gray-400 line-through">{formatCurrency(product.original_sale_price)}</p>
                  {product.applied_discount_percentage > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          {parseFloat(product.applied_discount_percentage).toFixed(0)}% OFF
                      </span>
                  )}
                </div>
              ) : (
                <p className="text-3xl md:text-4xl font-bold text-color-primary">{formatCurrency(product.original_sale_price)}</p>
              )}
              {product.has_discount && product.discount_amount_saved > 0 && (
                   <p className="text-md text-green-600 font-semibold mt-1">
                      Ahorras: {formatCurrency(product.discount_amount_saved)}
                   </p>
              )}
            </div>
            
            <div className="mb-2 flex items-center">
              <FaStore className="text-gray-600 mr-2" />
              {product.stock > 0 ? (
                <span className="text-green-600 font-semibold">En Stock ({product.stock} disponibles)</span>
              ) : (
                <span className="text-red-500 font-semibold">Agotado</span>
              )}
            </div>


            {product.tags && product.tags.length > 0 && (
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-color-secondary mb-2 flex items-center">
                  <FaTags className="mr-2" /> Etiquetas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <Link key={tag.id} to={`/products?tags_name=${encodeURIComponent(tag.name)}`} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1 rounded-full text-sm transition-colors">
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector de Cantidad y Botón Añadir al Carrito - Empujados hacia abajo si hay mucho contenido arriba */}
          <div className="mt-auto pt-4 sm:pt-6 border-t border-gray-200">
            {product.stock > 0 ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                    <label htmlFor={`quantity-${productId}`} className="font-semibold text-gray-700">Cantidad:</label>
                    <div className="flex items-center border border-gray-300 rounded">
                        <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || isAddingToCart} className="px-3 py-1.5 text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-l" aria-label="Disminuir cantidad">-</button>
                        <input 
                            type="number" 
                            id={`quantity-${productId}`}
                            value={quantity}
                            onChange={handleDirectQuantityInput}
                            min="1"
                            max={product.stock}
                            className="w-12 text-center border-l border-r border-gray-300 py-1.5 focus:outline-none"
                            aria-label="Cantidad de producto"
                            disabled={isAddingToCart}
                        />
                        <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock || isAddingToCart} className="px-3 py-1.5 text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-r" aria-label="Aumentar cantidad">+</button>
                    </div>
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !isAuthenticated} // Deshabilitar si no está autenticado también
                    className={`w-full flex items-center justify-center text-white font-bold py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg text-base transition-colors disabled:cursor-not-allowed
                                ${isAddingToCart ? 'bg-color-accent2 opacity-70' 
                                                : (isAuthenticated ? 'bg-color-secondary hover:bg-color-accent1' 
                                                                  : 'bg-gray-400')}`}
                >
                    <FaShoppingCart className="mr-2" />
                    {isAddingToCart ? 'Añadiendo...' : 'Agregar al Carrito'}
                </button>
                {!isAuthenticated && (
                    <p className="text-xs text-center mt-2 text-gray-500">
                        <Link to="/login" state={{ from: location.pathname }} className="underline hover:text-color-secondary">Inicia sesión</Link> para añadir al carrito.
                    </p>
                )}
              </>
            ) : (
              <p className="text-center text-xl font-semibold text-red-600 bg-red-100 p-3 rounded-md">Producto Agotado</p>
            )}
          </div>
                      {/* Descripción del Producto */}
            {product.description && (
              <div className="mb-6 prose prose-sm max-w-none"> {/* Usar clases 'prose' de Tailwind para formateo de texto */}
                <h3 className="text-lg font-semibold text-color-secondary mb-2 flex items-center">
                  <FaInfoCircle className="mr-2" /> Descripción
                </h3>
                <div className="text-gray-700 leading-relaxed">{product.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
              </div>
            )}
        </div>
      </div>
      {/* TODO: Banners para product_detail_related */}
    </div>
  );
}

export default ProductDetailPage;