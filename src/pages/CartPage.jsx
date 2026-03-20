// src/pages/CartPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartState, useCartDispatch } from '../contexts/CartContext';
import cartService from '../services/cartService'; // ya tiene apply/remove coupon
import { toast } from 'react-toastify';
import { FaTrash, FaPlus, FaMinus, FaShoppingBag, FaFileInvoiceDollar, FaTimesCircle } from 'react-icons/fa';

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
  const { items, itemCount, subtotal, coupon, couponDiscount, total, isLoading: isCartLoading } = useCartState();
  const cartDispatch = useCartDispatch();
  const navigate = useNavigate();
  const [isProcessingItem, setIsProcessingItem] = useState(null); // Para loaders por item: { type: 'qty'/'remove', itemId: X }
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [couponCode, setCouponCode] = useState('');

 const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const itemToUpdate = items.find(item => item.product_id === productId);
    if (!itemToUpdate) return;

    setIsProcessingItem({ type: 'qty', itemId: itemToUpdate.id });
    try {
      const updatedCartData = await cartService.addItemToCart(productId, newQuantity);
      cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCartData } });
      toast.success("Cantidad actualizada.");
    } catch (error) {
      toast.error(error.message || "Error al actualizar cantidad - No hay stock suficiente.");
    } finally {
      setIsProcessingItem(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setIsProcessingItem({ type: 'remove', itemId: cartItemId });
    try {
      const updatedCartData = await cartService.removeItemFromCart(cartItemId);
      cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCartData } });
      toast.info("Producto eliminado del carrito.");
    } catch (error) {
      toast.error(error.message || "Error al eliminar producto.");
    } finally {
      setIsProcessingItem(null);
    }
  };

const handleCreateQuote = async () => {
    setIsCreatingQuote(true);
    try {
      const quoteData = await cartService.createQuoteFromCart();
      cartDispatch({ type: 'CLEAR_CART_SUCCESS' }); 
      toast.success(`Cotización #${quoteData.id} creada exitosamente.`);
      navigate('/quotes');
    } catch (error) {
      const errorMsg = error.detail || error.error || error.message || "Error al crear la cotización.";
      toast.error(errorMsg);
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.warn("Por favor, ingresa un código de cupón.");
      return;
    }
    cartDispatch({ type: 'REQUEST_START' });
    try {
      const updatedCart = await cartService.applyCoupon(couponCode);
      cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCart } });
      toast.success(`Cupón "${couponCode}" aplicado.`);
      setCouponCode(''); // Limpiar input en éxito
    } catch (error) {
      const errorMsg = error.error || "El cupón no es válido o no se puede aplicar.";
      cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: errorMsg } });
      toast.error(errorMsg);
    }
  };

  const handleRemoveCoupon = async () => {
    cartDispatch({ type: 'REQUEST_START' });
    try {
      const updatedCart = await cartService.removeCoupon();
      cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCart } });
      toast.info("Cupón removido.");
    } catch (error) {
      toast.error(error.error || "No se pudo remover el cupón.");
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
                    onError={(e) => {
    e.target.onerror = null; // Evita bucles infinitos si logo.png también falla
    e.target.src = '/logo.png';
  }}
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
                      <p className="mt-1 text-sm font-medium text-color-secondary text-gray-400 line-through">
                        {formatCurrency(item.product_sale_price)} c/u
                      </p>
                      
                      <p className="text-sm font-bold text-color-accent1">{formatCurrency(item.product_final_price)} x {item.quantity} = <strong>{formatCurrency(item.subtotal)}</strong></p>


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
        <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:mt-0 lg:w-1/3 lg:p-8 h-fit sticky top-24">
          <h2 className="text-lg font-medium text-color-primary">Resumen del Carrito</h2>

          <form onSubmit={handleApplyCoupon} className="mt-6">
            <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-700">Código de Descuento</label>
            <div className="mt-1 flex space-x-2">
              <input
                type="text"
                id="coupon-code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="input-style w-full"
                placeholder="CUPON10"
                disabled={isCartLoading || !!coupon}
              />
              <button
                type="submit"
                disabled={isCartLoading || !!coupon}
                className="bg-color-secondary text-white px-4 py-2 rounded-md hover:bg-color-accent1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </form>

          <dl className="mt-6 space-y-4 border-t pt-4">
            <div className="flex items-center justify-between"><dt className="text-sm text-gray-600">Subtotal ({itemCount} items)</dt><dd className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</dd></div>
            {coupon && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 flex items-center">
                  Descuento ({coupon.code})
                  <button onClick={handleRemoveCoupon} className="ml-2 text-red-500 hover:text-red-700" title="Remover cupón" disabled={isCartLoading}>
                    <FaTimesCircle />
                  </button>
                </dt>
                <dd className="text-sm font-medium text-green-600">-{formatCurrency(couponDiscount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4"><dt className="text-base font-medium text-gray-900">Total del Pedido</dt><dd className="text-base font-medium text-gray-900">{formatCurrency(total)}</dd></div>
          </dl>
<p className="mt-6 text-xs text-center text-gray-500">
              Nota: Los precios no incluyen el costo de envío. Este se coordinará después de generar tu cotización.
            </p>
          <div className="mt-4">
            <button
              onClick={handleCreateQuote}
              disabled={isCreatingQuote || itemCount === 0 || isCartLoading}
              className="w-full flex items-center justify-center rounded-md border border-transparent bg-color-accent1 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-color-accent2 focus:ring-offset-2 disabled:opacity-60"
            >
              {isCreatingQuote ? 'Procesando...' : 'Generar Cotización'}
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