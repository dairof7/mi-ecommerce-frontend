// src/pages/admin/POSPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartState, useCartDispatch } from '../../contexts/CartContext';
import cartService from '../../services/cartService';
import { toast } from 'react-toastify';
import { FaUserPlus, FaFileInvoiceDollar, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
// Reutiliza componentes de otras páginas si los tienes en 'common'
// import { Loader, formatCurrency } from '../utils/helpers'; 
// Por ahora los defino aquí por simplicidad:
const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

function POSPage() {
  const { items, itemCount, totalAmount, isCartLoading } = useCartState();
  const cartDispatch = useCartDispatch();
  const navigate = useNavigate();

  // Estados para el formulario del cliente invitado
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [isProcessingItem, setIsProcessingItem] = useState(false);

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

  const handleCreatePosSale = async (e) => {
    e.preventDefault();
    if (itemCount === 0) {
      toast.warn("El carrito está vacío. Añade productos para crear una venta.");
      return;
    }
    
    setIsProcessingItem(true);
    const payload = {
      customer: {
        name: customerName,
        email: customerEmail,
        document: customerDocument,
        phone: customerPhone,
      }
    };
    
    try {
      // Usamos la misma función de servicio, pero ahora con el payload
      const quoteData = await cartService.createQuoteFromCart(payload);
      cartDispatch({ type: 'CLEAR_CART_SUCCESS' });
      toast.success(`Venta en punto físico registrada (Cotización #${quoteData.id})`);
      
      // El vendedor ahora debe ir a finalizar la venta
      navigate(`/manage/quotes`, { state: { highlightedQuoteId: quoteData.id } });

    } catch (error) {
      const errorMsg = error.detail || error.error || error.message || "Error al registrar la venta.";
      toast.error(errorMsg);
    } finally {
      setIsProcessingItem(false);
    }
  };
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-color-primary mb-6">Punto de Venta (POS)</h1>
      <p className="text-gray-600 mb-8">Usa esta interfaz para registrar ventas realizadas en la tienda física. Los productos añadidos aquí usan tu carrito de administrador.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna para el formulario del cliente y el resumen */}
        <div className="lg:col-span-1 lg:order-2">
          <form onSubmit={handleCreatePosSale} className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
            <h2 className="text-xl font-semibold text-color-secondary mb-4 flex items-center">
              <FaUserPlus className="mr-2" /> Datos del Cliente (Opcional)
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className="input-style w-full mt-1" />
              </div>
              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="customerEmail" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="input-style w-full mt-1" />
              </div>
              <div>
                <label htmlFor="customerDocument" className="block text-sm font-medium text-gray-700">Documento</label>
                <input type="text" id="customerDocument" value={customerDocument} onChange={e => setCustomerDocument(e.target.value)} className="input-style w-full mt-1" />
              </div>
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input type="tel" id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input-style w-full mt-1" />
              </div>
            </div>
            
            <hr className="my-6" />

            <h3 className="text-lg font-medium text-color-primary">Resumen</h3>
            <dl className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal ({itemCount} items)</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalAmount)}</dd>
              </div>
            </dl>
            <div className="mt-6">
              <button
                type="submit"
                disabled={isProcessingItem || itemCount === 0 || isCartLoading}
                className="w-full flex items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {isProcessingItem ? 'Registrando...' : 'Registrar Venta y Generar Cotización'}
                <FaFileInvoiceDollar className="ml-2"/>
              </button>
            </div>
          </form>
        </div>

        {/* Columna para el carrito y añadir productos */}
        <div className="lg:col-span-2 lg:order-1">
          <h2 className="text-xl font-semibold text-color-secondary mb-4">Carrito Actual</h2>
          {/* Aquí podrías tener un buscador de productos para añadir al carrito */}
          {/* ... */}
          
          {/* Listado de items del carrito */}
          {itemCount > 0 ? (
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
          ) : (
            <p className="py-10 text-center text-gray-500 bg-gray-50 rounded-md">El carrito está vacío. Busca y añade productos.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default POSPage;