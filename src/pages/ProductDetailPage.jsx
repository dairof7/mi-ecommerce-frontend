import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { toast } from 'react-toastify';
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaTags, FaInfoCircle, FaStore } from 'react-icons/fa';
import { useAuthDispatch, useAuthState } from '../contexts/AuthContext'; // Para verificar si está logueado
// import { useCartDispatch } from '../contexts/CartContext'; // Descomentar cuando tengas CartContext

// Helper para formatear moneda
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
  const { productId } = useParams(); // Obtiene el ID del producto de la URL
  const navigate = useNavigate();
  // const authDispatch = useAuthDispatch(); // Para acciones de autenticación si fueran necesarias
  const { isAuthenticated } = useAuthState(); // Para saber si el usuario está logueado
  // const cartDispatch = useCartDispatch(); // Descomentar cuando tengas CartContext

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);
      setCurrentImageIndex(0); // Resetear al cargar nuevo producto
    } catch (err) {
      const errorMsg = err.message || `Error al cargar el producto ID ${productId}.`;
      setError(errorMsg);
      toast.error(errorMsg);
      // Opcional: redirigir si el producto no se encuentra (ej. a una página 404 o al listado)
      // if (err.response && err.response.status === 404) {
      //   navigate('/products', { replace: true });
      // }
    } finally {
      setIsLoading(false);
    }
  }, [productId, navigate]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, fetchProduct]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (product && newQuantity > product.stock) return product.stock; // No exceder el stock
      return newQuantity;
    });
  };

  const handleDirectQuantityInput = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
        value = 1;
    } else if (product && value > product.stock) {
        value = product.stock;
    }
    setQuantity(value);
  };


  const handleAddToCart = () => {
    if (!product) return;
    if (quantity <= 0) {
        toast.warn("Por favor, selecciona una cantidad válida.");
        return;
    }
    if (quantity > product.stock) {
        toast.error("No hay suficiente stock para la cantidad seleccionada.");
        return;
    }

    if (!isAuthenticated) {
        toast.info("Por favor, inicia sesión para añadir productos al carrito.");
        navigate('/login', { state: { from: `/products/${productId}` } }); // Redirigir a login y guardar la ruta actual
        return;
    }

    // TODO: Lógica para añadir al carrito usando CartContext y/o API
    // Ejemplo conceptual:
    // cartDispatch({ 
    //   type: 'ADD_ITEM', 
    //   payload: { product: { id: product.id, name: product.name, final_sale_price: product.final_sale_price, image: product.images?.[0]?.image }, quantity } 
    // });
    // await cartService.addItemToCart(product.id, quantity); // Llamada al API
    
    toast.success(`${quantity} x ${product.name} añadido(s) al carrito!`);
    // Opcional: ¿Resetear cantidad después de añadir? ¿Navegar al carrito?
    // setQuantity(1);
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
    ? product.images[currentImageIndex]?.image // Tu schema dice product.images[i].image es la URL
    : 'https://via.placeholder.com/600x600.png?text=Sin+Imagen';
  
  const thumbnailImages = product.images || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Columna de Imágenes */}
        <div className="product-images">
          <div className="relative mb-4 border rounded-lg shadow-lg overflow-hidden">
            <img 
              src={mainImageUrl} 
              alt={product.images && product.images.length > 0 ? product.images[currentImageIndex]?.alt_text || product.name : product.name} 
              className="w-full h-auto md:h-[500px] object-contain transition-transform duration-300 ease-in-out" // object-contain para verla completa
            />
            {thumbnailImages.length > 1 && (
              <>
                <button 
                  onClick={prevImage} 
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity"
                  aria-label="Imagen anterior"
                >
                  <FaChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage} 
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity"
                  aria-label="Siguiente imagen"
                >
                  <FaChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          {/* Miniaturas */}
          {thumbnailImages.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {thumbnailImages.map((img, index) => (
                <button 
                  key={img.id || index} // Usar img.id si está disponible
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-20 h-20 border-2 rounded-md overflow-hidden focus:outline-none transition-all ${index === currentImageIndex ? 'border-color-secondary ring-2 ring-color-secondary' : 'border-transparent hover:border-gray-400'}`}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  <img src={img.image} alt={img.alt_text || `Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna de Información y Acciones */}
        <div className="product-info">
          <h1 className="text-3xl lg:text-4xl font-bold text-color-primary mb-3">{product.name}</h1>
          
          <div className="mb-4">
            {product.category && (
              <Link to={`/category/${product.category.id}`} className="text-sm text-color-accent2 hover:underline mr-2">
                {product.category.name}
              </Link>
            )}
            {product.subcategory && product.category && <span className="text-sm text-gray-500 mr-2"></span>}
            {product.subcategory && (
              <Link to={`/subcategory/${product.subcategory.id}`} className="text-sm text-color-accent2 hover:underline">
                {product.subcategory.name}
              </Link>
            )}
          </div>

          {/* Precios */}
          <div className="mb-5">
            {product.has_discount ? (
              <div className="flex items-baseline space-x-2">
                <p className="text-4xl font-bold text-color-accent1">{formatCurrency(product.final_sale_price)}</p>
                <p className="text-xl text-gray-400 line-through">{formatCurrency(product.original_sale_price)}</p>
                {product.applied_discount_percentage > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        {parseFloat(product.applied_discount_percentage).toFixed(0)}% OFF
                    </span>
                )}
              </div>
            ) : (
              <p className="text-4xl font-bold text-color-primary">{formatCurrency(product.original_sale_price)}</p>
            )}
            {product.has_discount && product.discount_amount_saved > 0 && (
                 <p className="text-md text-green-600 font-semibold mt-1">
                    Ahorras: {formatCurrency(product.discount_amount_saved)}
                 </p>
            )}
          </div>
          
          {/* Stock */}
          <div className="mb-5 flex items-center">
            <FaStore className="text-gray-600 mr-2" />
            {product.stock > 0 ? (
              <span className="text-green-600 font-semibold">En Stock ({product.stock} disponibles)</span>
            ) : (
              <span className="text-red-500 font-semibold">Agotado</span>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-color-secondary mb-2 flex items-center">
                <FaInfoCircle className="mr-2" /> Descripción
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-color-secondary mb-2 flex items-center">
                <FaTags className="mr-2" /> Etiquetas
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <Link 
                    key={tag.id} 
                    to={`/products?tags_name=${encodeURIComponent(tag.name)}`} // Enlace para filtrar por este tag
                    className="bg-color-neutral-light text-color-primary hover:bg-opacity-80 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Cantidad y Botón Añadir al Carrito */}
          {product.stock > 0 && (
            <div className="mt-6 pt-6 border-t">
                <div className="flex items-center space-x-3 mb-4">
                    <label htmlFor="quantity" className="font-semibold text-gray-700">Cantidad:</label>
                    <div className="flex items-center border border-gray-300 rounded">
                        <button 
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="px-3 py-1.5 text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-l"
                            aria-label="Disminuir cantidad"
                        >
                            -
                        </button>
                        <input 
                            type="number" 
                            id="quantity"
                            value={quantity}
                            onChange={handleDirectQuantityInput}
                            min="1"
                            max={product.stock}
                            className="w-12 text-center border-l border-r border-gray-300 py-1.5 focus:outline-none"
                            aria-label="Cantidad de producto"
                        />
                        <button 
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= product.stock}
                            className="px-3 py-1.5 text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-r"
                            aria-label="Aumentar cantidad"
                        >
                            +
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="w-full flex items-center justify-center bg-color-secondary hover:bg-color-accent1 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaShoppingCart className="mr-2" />
                    Añadir al Carrito
                </button>
            </div>
          )}
          
          {/* TODO: Banners para product_detail_related */}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;