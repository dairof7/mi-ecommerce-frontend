// src/pages/CartPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartState, useCartDispatch } from '../contexts/CartContext';
import cartService from '../services/cartService';
import { toast } from 'react-toastify';
import { FaTrash, FaPlus, FaMinus, FaShoppingBag, FaFileInvoiceDollar } from 'react-icons/fa';

// Helper para formatear moneda
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits:0, maximumFractionDigits:0 }).format(value);
};

const Loader = ({ message = "Actualizando carrito..."}) => (
    <div className="flex justify-center items-center py-5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-color-secondary"></div>
        <p className="ml-3 text-color-secondary">{message}</p>
    </div>
);


function CartPage() {
  const { items, itemCount, totalAmount, isLoading: isCartLoading, cartId } = useCartState();
  const cartDispatch = useCartDispatch(); // Renombrado para claridad
  const navigate = useNavigate();
  const [isProcessingItem, setIsProcessingItem] = useState(null); // Para loaders por item: { type: 'qty'/'remove', itemId: X }
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  // Función para recargar el carrito, podría vivir en el contexto también
  const refreshCart = async () => {
     cartDispatch({ type: 'REQUEST_START' });
     try {
         const cartData = await cartService.getCart();
         cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: cartData } });
     } catch (error) {
         cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: "Error al recargar el carrito" } });
         toast.error("No se pudo actualizar el carrito.");
     }
  };

 const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const itemToUpdate = items.find(item => item.product_id === productId); // Asume que item.product es el ID del producto
    if (!itemToUpdate) return;

    setIsProcessingItem({ type: 'qty', itemId: itemToUpdate.id });
    // cartDispatch({ type: 'REQUEST_START' }); // refreshCart ya lo hace
    try {
      await cartService.updateItemQuantity(productId, newQuantity);
      toast.success("Cantidad actualizada.");
      await refreshCart(); // Recargar el carrito completo
    } catch (error) {
      toast.error(error.message || "Error al actualizar cantidad - No hay stock suficiente.");
      // cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: error.message } }); // refreshCart maneja su propio error
    } finally {
      setIsProcessingItem(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setIsProcessingItem({ type: 'remove', itemId: cartItemId });
    // cartDispatch({ type: 'REQUEST_START' });
    try {
      await cartService.removeItemFromCart(cartItemId);
      toast.info("Producto eliminado del carrito.");
      await refreshCart(); // Recargar el carrito completo
    } catch (error) {
      toast.error(error.message || "Error al eliminar producto.");
      // cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: error.message } });
    } finally {
      setIsProcessingItem(null);
    }
  };

const handleCreateQuote = async () => {
    setIsCreatingQuote(true);
    // cartDispatch({ type: 'REQUEST_START' }); // El reducer de CLEAR_CART_SUCCESS pone isLoading a false
    try {
      const quoteData = await cartService.createQuoteFromCart();
      cartDispatch({ type: 'CLEAR_CART_SUCCESS' }); 
      toast.success(`Cotización #${quoteData.id} creada exitosamente.`);
      navigate('/quotes');
    } catch (error) {
      const errorMsg = error.detail || error.error || error.message || "Error al crear la cotización.";
      toast.error(errorMsg);
      // cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: errorMsg } }); // No es necesario si CLEAR_CART_SUCCESS ya lo hace
    } finally {
      setIsCreatingQuote(false);
    }
  };


  if (isCartLoading && items.length === 0) {
    return <Loader message="Cargando carrito..." />;
  }
  if (itemCount === 0 && !isCartLoading) {
    return (
      <div className="text-center py-20">
        <FaShoppingBag size={80} className="mx-auto text-color-neutral-light mb-6" />
        <h2 className="text-2xl font-semibold text-color-primary mb-4">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">Parece que no has añadido nada a tu carrito todavía.</p>
        <Link
          to="/products"
          className="bg-color-secondary hover:bg-color-accent1 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Explorar Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-color-primary mb-8">Tu Carrito de Compras</h1>
      <div className="lg:flex lg:gap-8">
        {/* Columna de Items del Carrito */}
        <div className="lg:w-2/3">
          {isCartLoading && items.length > 0 && <Loader />} {/* Loader encima de la lista si se está actualizando */}
          <ul role="list" className="divide-y divide-gray-200 border-b border-gray-200">
            {items.map((item) => (
              <li key={item.id} className="flex py-6 sm:py-10">
                <div className="flex-shrink-0">
                  {/* Asumiendo que item.product es un objeto y tiene 'images'
                      y tu serializador de CartItem anida el producto o al menos la imagen principal */}
                  <img
                    src={item.product_detail?.images?.[0]?.image || item.product_image_url || '/logo.png'} // Ajusta 'product_image' o 'product_detail'
                    alt={item.product_name}
                    className="h-24 w-24 rounded-md object-cover object-center sm:h-32 sm:w-32"
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-md">
                          <Link to={`/products/${item.product_id}`} // item.product es el ID del producto
                                className="font-semibold text-color-primary hover:text-color-accent1">
                            {item.product_name}
                          </Link>
                        </h3>
                      </div>
                      {/* <p className="mt-1 text-sm text-gray-500">{item.product_detail?.short_description}</p> */}
                      <p className="mt-1 text-sm font-medium text-color-secondary">
                        {formatCurrency(item.product_sale_price)} c/u
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <label htmlFor={`quantity-${item.id}`} className="sr-only">
                        Cantidad, {item.product_name}
                      </label>
                      <div className="flex items-center border border-gray-300 rounded w-fit">
                        <button 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isCartLoading}
                            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-l"
                        >-</button>
                        <input 
                            type="number" 
                            id={`quantity-${item.id}`}
                            value={item.quantity}
                            min="1"
                            // max={item.product_detail?.stock} // Necesitarías el stock aquí
                            onChange={(e) => {
                                const newQty = parseInt(e.target.value);
                                if (!isNaN(newQty) && newQty >= 1) {
                                    handleUpdateQuantity(item.product, newQty);
                                }
                            }}
                            className="w-10 text-center border-l border-r border-gray-300 py-1 focus:outline-none text-sm"
                        />
                        <button 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            // disabled={item.quantity >= item.product_detail?.stock || isCartLoading}
                            disabled={isCartLoading} // Simplificado, el backend validará stock
                            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-r"
                        >+</button>
                      </div>

                      <div className="absolute right-0 top-0">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isCartLoading}
                          className="-m-2 inline-flex p-2 text-gray-400 hover:text-red-500"
                        >
                          <span className="sr-only">Eliminar</span>
                          <FaTrash className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                   <p className="mt-4 flex space-x-2 text-sm text-gray-700">
                    {/* {item.product_detail?.stock > 0 ? (
                        <FaCheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" aria-hidden="true" />
                    ) : (
                        <FaTimesCircle className="h-5 w-5 flex-shrink-0 text-red-500" aria-hidden="true" />
                    )} */}
                    {/* <span>{item.product_detail?.stock > 0 ? 'En stock' : 'Agotado temporalmente'}</span> */}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna del Resumen del Pedido */}
        <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:mt-0 lg:w-1/3 lg:p-8 h-fit sticky top-24"> {/* sticky top para que se quede fijo */}
          <h2 className="text-lg font-medium text-color-primary">Resumen del Carrito</h2>
          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Subtotal ({itemCount} items)</dt>
              <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalAmount)}</dd>
            </div>
            {/* Podrías añadir Descuentos y Envío aquí si los implementas */}
            {/* <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium text-gray-900">Total del Pedido</dt>
              <dd className="text-base font-medium text-gray-900">{formatCurrency(totalAmount)}</dd>
            </div> */}
          </dl>
<p className="mt-6 text-xs text-center text-gray-500">
              Nota: Los precios no incluyen el costo de envío. Este se coordinará después de generar tu cotización.
            </p>
          <div className="mt-4">
            <button
              onClick={handleCreateQuote}
              disabled={isProcessingItem || itemCount === 0 || isCartLoading}
              className="w-full flex items-center justify-center rounded-md border border-transparent bg-color-accent1 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-color-accent2 focus:ring-offset-2 disabled:opacity-60"
            >
              {isProcessingItem ? 'Procesando...' : 'Generar Cotización'}
              <FaFileInvoiceDollar className="ml-2"/>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              o{' '}
              <Link to="/products" className="font-medium text-color-secondary hover:text-color-accent1">
                Continuar Comprando
                <span aria-hidden="true"> →</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;