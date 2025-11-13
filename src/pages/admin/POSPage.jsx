import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartState, useCartDispatch } from '../../contexts/CartContext';
import cartService from '../../services/cartService';
import authService from '../../services/authService';
import productService from '../../services/productService';
import { toast } from 'react-toastify';
import { FaUserPlus, FaFileInvoiceDollar, FaTrash, FaUserCheck, FaTimes, FaSpinner, FaSearch, FaPlusCircle, FaPlus, FaMinus, FaTimesCircle } from 'react-icons/fa';

// --- Componentes Internos ---
const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const Loader = ({ message = "Procesando..." }) => (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-20">
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-color-secondary"></div>
        <p className="ml-3 text-color-secondary">{message}</p>
      </div>
    </div>
);
// --- Fin Componentes Internos ---

function POSPage() {
  const { items, itemCount, subtotal, coupon, couponDiscount, total, isLoading: isCartLoading } = useCartState();
  const cartDispatch = useCartDispatch();
  const navigate = useNavigate();

  // Estados del Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Estados para Búsqueda de Usuarios
  const [searchTermUser, setSearchTermUser] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Estados para Búsqueda de Productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState([]);

  // Estado de carga para acciones
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [processingItemId, setProcessingItemId] = useState(null);

  // Estado para manejar los inputs de cantidad de forma diferida
  const [quantityInputs, setQuantityInputs] = useState({});
  const quantityInputRefs = useRef({});

  // --- Efectos ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTermUser.trim() && !selectedUser) {
      setIsSearchingUser(true);
      authService.searchUsers(searchTermUser)
        .then(results => setUserSearchResults(results || []))
        .finally(() => setIsSearchingUser(false));
    } else {
      setUserSearchResults([]);
    }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTermUser, selectedUser]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
    if (productSearchTerm.trim()) {
      setIsSearchingProduct(true);
      productService.getProducts({ search: productSearchTerm, limit: 5 })
        .then(data => setProductSearchResults(data.results || []))
        .finally(() => setIsSearchingProduct(false));
    } else {
      setProductSearchResults([]);
    }
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearchTerm]);

  useEffect(() => {
    // Sincroniza el estado de los inputs con el carrito real cuando este cambia
    const initialQuantities = items.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
    setQuantityInputs(initialQuantities);
  }, [items]);


  // --- Manejadores de Eventos ---
  const refreshCart = useCallback(async () => {
    cartDispatch({ type: 'REQUEST_START' });
    try {
        const cartData = await cartService.getCart();
        cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: cartData } });
    } catch (error) {
        cartDispatch({ type: 'REQUEST_FAILURE', payload: { error: "Error al recargar el carrito" } });
        toast.error("No se pudo actualizar el carrito.");
    }
  }, [cartDispatch]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCustomerName(user.full_name || `${user.first_name} ${user.last_name}`.trim());
    setCustomerEmail(user.email);
    setCustomerDocument(user.document || '');
    setCustomerPhone(user.phone || '');
    setUserSearchResults([]);
    setSearchTermUser('');
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerDocument('');
    setCustomerPhone('');
  };

  const handleAddProduct = async (product) => {
    if (product.stock === 0) {
      toast.warn(`"${product.name}" está agotado.`);
      return;
    }
    setProcessingItemId(product.id);
    try {
      const updatedCart = await cartService.addOneProductToCart(product.id);
      cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCart } });
      toast.success(`"${product.name}" añadido al carrito.`); // Mensaje de éxito
      setProductSearchTerm('');
      setProductSearchResults([]);
    } catch (error) {
      toast.error(error.message || `Error al añadir "${product.name}".`);
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    const item = items.find(i => i.product_id === productId);
    if (!item) return;

    if (newQuantity < 1) {
        // Llama a handleRemoveItem, que tiene su propia lógica de recarga
        handleRemoveItem(item.id); 
        return;
    }

    setProcessingItemId(item.id);
    try {
        // 1. Llama al endpoint que modifica el carrito.
        // Asumimos que `addItemToCart` es el que ESTABLECE la cantidad
        // y que devuelve el objeto del carrito completo y actualizado.
        const updatedCartData = await cartService.addItemToCart(productId, newQuantity);
        // 2. Despacha la acción de éxito CON los datos que ya recibiste.
        // Esto actualiza el estado local INMEDIATAMENTE sin otra llamada a la API.
        cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCartData } });
        
        // El toast se puede omitir para cambios de +/- para no ser molesto, pero lo dejamos por ahora.
        // toast.success("Cantidad actualizada."); 

    } catch (error) {
        toast.error(error.message || "Error al actualizar cantidad.");
        // Si la actualización falla, es bueno recargar el estado desde el backend
        // para asegurar que el frontend refleje la realidad (que el cambio no se hizo).
        await refreshCart();
    } finally {
        setProcessingItemId(null);
    }
};
  
  const handleRemoveItem = async (cartItemId) => {
    setProcessingItemId(cartItemId);
    try {
      const updatedCartData = await cartService.removeItemFromCart(cartItemId);
      cartDispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: updatedCartData } });

      toast.info("Producto eliminado del carrito.");
      // await refreshCart();
    } catch (error) {
      toast.error(error.message || "Error al eliminar producto.");
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleCreatePosSale = async (e) => {
    e.preventDefault();
    if (itemCount === 0) {
      toast.warn("El carrito está vacío.");
      return;
    }
    
    setIsProcessingSale(true);
    const payload = {
      customer: { name: customerName, email: customerEmail, document: customerDocument, phone: customerPhone },
      user_id: selectedUser ? selectedUser.id : null,
    };
    
    try {
      const quoteData = await cartService.createQuoteFromCart(payload);
      cartDispatch({ type: 'CLEAR_CART_SUCCESS' });
      toast.success(`Venta en punto físico registrada (Cotización #${quoteData.id})`);
      navigate(`/manage/quotes`, { state: { highlightedQuoteId: quoteData.id } });
    } catch (error) {
      const errorMsg = error.detail || error.error || error.message || "Error al registrar la venta.";
      toast.error(errorMsg);
    } finally {
      setIsProcessingSale(false);
    }
  };

  // --- Manejadores de Cupones ---
  const [couponCode, setCouponCode] = useState('');

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
      setCouponCode('');
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

  // --- Manejadores para el input de cantidad diferido ---
  const handleQuantityInputChange = (itemId, value) => {
    setQuantityInputs(prev => ({ ...prev, [itemId]: value }));
  };

  const handleQuantityUpdateTrigger = (itemId, productId) => {
    const newQuantityValue = quantityInputs[itemId];
    const newQuantity = newQuantityValue === '' ? 1 : parseInt(newQuantityValue, 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
      // Si el valor no es válido, revierte al valor original del carrito
      const originalItem = items.find(i => i.id === itemId);
      setQuantityInputs(prev => ({ ...prev, [itemId]: originalItem.quantity }));
      toast.warn("La cantidad debe ser un número mayor o igual a 1.");
      return;
    }

    // Llama a la función de actualización solo si la cantidad ha cambiado
    const originalItem = items.find(i => i.id === itemId);
    if (originalItem && originalItem.quantity !== newQuantity) {
      handleUpdateQuantity(productId, newQuantity);
    }
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-color-primary mb-6">Punto de Venta (POS)</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">Utiliza esta interfaz para añadir productos al carrito y registrar ventas para clientes.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna para el formulario del cliente y el resumen */}
        <div className="lg:col-span-1 lg:order-2">
          <form onSubmit={handleCreatePosSale} className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
            <h2 className="text-xl font-semibold text-color-secondary mb-4 flex items-center"><FaUserPlus className="mr-2" /> Datos del Cliente</h2>
            <div className="relative mb-4">
                <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700">Buscar Cliente Registrado</label>
                <input type="text" id="userSearch" value={searchTermUser} onChange={(e) => setSearchTermUser(e.target.value)} placeholder="Nombre, email, documento..." className="input-style w-full mt-1" disabled={!!selectedUser} autoComplete="off" />
                {isSearchingUser && <p className="text-xs text-blue-500 mt-1 italic">Buscando cliente...</p>}
                {userSearchResults.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                        {userSearchResults.map(user => (
                            <li key={user.id} onClick={() => handleSelectUser(user)} className="px-3 py-2 cursor-pointer hover:bg-color-accent1 hover:text-white border-b last:border-b-0 group">
                                <p className="font-semibold text-sm">{user.full_name}</p>
                                <p className="text-xs text-gray-500 group-hover:text-white">{user.email}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {selectedUser && (
                <div className="p-3 mb-4 text-sm text-green-800 bg-green-100 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold flex items-center"><FaUserCheck className="mr-2"/> Cliente Seleccionado:</p>
                        <p>{selectedUser.full_name}</p>
                    </div>
                    <button type="button" onClick={clearSelectedUser} className="text-red-600 hover:text-red-800 font-bold p-1 rounded-full hover:bg-red-200" title="Desvincular cliente"><FaTimes /></button>
                </div>
            )}
            <div className={`space-y-4 transition-opacity duration-300 ${selectedUser ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <p className="text-xs text-center text-gray-500 border-b pb-2 mb-2">O ingresa los datos para un cliente invitado:</p>
                <div><label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className="input-style w-full mt-1" /></div>
                <div><label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Email</label><input type="email" id="customerEmail" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="input-style w-full mt-1" /></div>
                <div><label htmlFor="customerDocument" className="block text-sm font-medium text-gray-700">Documento</label><input type="text" id="customerDocument" value={customerDocument} onChange={e => setCustomerDocument(e.target.value)} className="input-style w-full mt-1" /></div>
                <div><label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Teléfono</label><input type="tel" id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input-style w-full mt-1" /></div>
            </div>
            <hr className="my-6" />
            <h3 className="text-lg font-medium text-color-primary">Resumen</h3>
            
            <div className="mt-4">
              <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-700">Código de Descuento</label>
              <div className="mt-1 flex space-x-2">
                <input 
                  type="text" 
                  id="coupon-code" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(e); } }} 
                  className="input-style w-full" placeholder="CUPONPOS" disabled={isCartLoading || !!coupon} 
                />
                <button type="button" onClick={handleApplyCoupon} disabled={isCartLoading || !!coupon} className="bg-color-secondary text-white px-4 py-2 rounded-md hover:bg-color-accent1 disabled:opacity-50 disabled:cursor-not-allowed">
                  Aplicar
                </button>
              </div>
            </div>

            <dl className="mt-4 space-y-4 border-t pt-4">
              <div className="flex items-center justify-between"><dt className="text-sm text-gray-600">Subtotal ({itemCount} items)</dt><dd className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</dd></div>
              {coupon && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600 flex items-center">
                    Descuento ({coupon.code})
                    <button type="button" onClick={handleRemoveCoupon} className="ml-2 text-red-500 hover:text-red-700" title="Remover cupón" disabled={isCartLoading}><FaTimesCircle /></button>
                  </dt>
                  <dd className="text-sm font-medium text-green-600">-{formatCurrency(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4"><dt className="text-base font-medium text-gray-900">Total</dt><dd className="text-base font-bold text-gray-900">{formatCurrency(total)}</dd></div>
            </dl>
            <div className="mt-6">
                <button type="submit" disabled={isProcessingSale || itemCount === 0 || isCartLoading} className="w-full flex items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isProcessingSale ? <FaSpinner className="animate-spin mr-2" /> : <FaFileInvoiceDollar className="ml-2"/>}
                    {isProcessingSale ? 'Registrando...' : 'Registrar Venta'}
                </button>
            </div>
          </form>
        </div>

        {/* Columna del Carrito y Buscador de Productos */}
        <div className="lg:col-span-2 lg:order-1">
          {/* --- Buscador de Productos --- */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-color-secondary mb-2">Añadir Productos al Carrito</h2>
            <div className="relative">
              <div className="flex items-center">
                <FaSearch className="absolute left-3 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  placeholder="Buscar producto por nombre..."
                  className="input-style w-full pl-10"
                  autoComplete="off"
                />
              </div>
              {isSearchingProduct && <p className="text-xs text-blue-500 mt-1 italic">Buscando productos...</p>}
              
              {productSearchResults.length > 0 && (
                <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-80 overflow-y-auto shadow-lg">
                  {productSearchResults.map(product => (
                    <li key={product.id} className="border-b last:border-b-0">
                      <button 
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        disabled={product.stock === 0}
                        className="px-4 py-3 cursor-pointer hover:bg-color-accent1 hover:text-white w-full text-left flex items-center justify-between group disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <img src={product.images?.[0]?.image || '/logo.png'} alt={product.name} className="w-10 h-10 object-cover rounded mr-3" />
                          <div>
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className={`text-xs ${product.stock > 0 ? 'text-gray-500 group-hover:text-white' : 'text-red-500 font-semibold'}`}>{product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                           <p className="font-semibold text-sm">{formatCurrency(product.final_sale_price)}</p>
                           <FaPlusCircle className="text-green-500" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* --- Fin Buscador de Productos --- */}

          <h2 className="text-xl font-semibold text-color-secondary mb-4">Carrito Actual</h2>
          {isCartLoading && <Loader message="Actualizando carrito..."/>}
          {!isCartLoading && itemCount > 0 ? (
            <div className="bg-white rounded-lg shadow-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {items.map((item) => (
                      
                    <li key={item.id} className={`flex py-4 px-4 items-center transition-opacity ${processingItemId === item.id ? 'opacity-50' : ''}`}>
                        <div className="flex-shrink-0">
                            <img src={item.product_image_url || '/logo.png'} alt={item.product_name} className="h-16 w-16 rounded-md object-cover" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(item.product_final_price)} x {item.quantity} = <strong>{formatCurrency(item.subtotal)}</strong></p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center border border-gray-300 rounded">
                                <button
                                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || !!processingItemId}
                                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-l"
                                    aria-label="Disminuir cantidad"
                                >
                                    <FaMinus size={10} />
                                </button>
                                <input
                                    type="number"
                                    value={quantityInputs[item.id] || ''}
                                    onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                    onBlur={() => handleQuantityUpdateTrigger(item.id, item.product_id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleQuantityUpdateTrigger(item.id, item.product_id);
                                        e.target.blur(); // Opcional: quita el foco del input
                                      }
                                    }}
                                    disabled={!!processingItemId}
                                    className="w-12 text-center border-l border-r text-sm focus:outline-none focus:ring-1 focus:ring-color-secondary disabled:bg-white"
                                    min="1"
                                    aria-label={`Cantidad para ${item.product_name}`}
                                />
                                <button
                                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                                    disabled={!!processingItemId}
                                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded-r"
                                    aria-label="Aumentar cantidad"
                                >
                                    <FaPlus size={10} />
                                </button>
                            </div>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-600 p-2" disabled={!!processingItemId} aria-label="Eliminar item">
                                <FaTrash />
                            </button>
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
          ) : (
            !isCartLoading && <p className="py-10 text-center text-gray-500 bg-gray-50 rounded-md">El carrito está vacío.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default POSPage;