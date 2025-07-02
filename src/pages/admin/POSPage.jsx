import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartState, useCartDispatch } from '../../contexts/CartContext';
import cartService from '../../services/cartService';
import authService from '../../services/authService';
import useDebounce from '../../hooks/useDebounce';
import { toast } from 'react-toastify';
import { FaUserPlus, FaFileInvoiceDollar, FaTrash, FaUserCheck, FaTimes, FaSpinner } from 'react-icons/fa';

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
  const { items, itemCount, totalAmount, isLoading: isCartLoading } = useCartState();
  const cartDispatch = useCartDispatch();
  const navigate = useNavigate();

  // Estados para el formulario del cliente
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Estados para la lógica de la página
  const [isProcessingSale, setIsProcessingSale] = useState(false); // Estado unificado para la acción de venta

  // Estados para búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Efecto para buscar usuarios
  useEffect(() => {
    if (debouncedSearchTerm.trim() && !selectedUser) {
      setIsSearching(true);
      authService.searchUsers(debouncedSearchTerm).then(results => {
        setSearchResults(results || []);
        setIsSearching(false);
      }).catch(error => {
        console.error("Error en la búsqueda:", error);
        setIsSearching(false);
        setSearchResults([]);
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, selectedUser]);

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
    setSearchResults([]);
    setSearchTerm('');
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerDocument('');
    setCustomerPhone('');
  };

  const handleCreatePosSale = async (e) => {
    e.preventDefault();
    if (itemCount === 0) {
      toast.warn("El carrito está vacío. Añade productos para crear una venta.");
      return;
    }
    
    setIsProcessingSale(true); // Usar el estado correcto
    const payload = {
      customer: {
        name: customerName,
        email: customerEmail,
        document: customerDocument,
        phone: customerPhone,
      },
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
      setIsProcessingSale(false); // Usar el estado correcto
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    // Si necesitas un loader por item, necesitarías un estado como `processingItemId`
    try {
      await cartService.removeItemFromCart(cartItemId);
      toast.info("Producto eliminado del carrito.");
      await refreshCart();
    } catch (error) {
      toast.error(error.message || "Error al eliminar producto.");
    }
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-color-primary mb-6">Punto de Venta (POS)</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">Utiliza esta interfaz para añadir productos al carrito (de tu cuenta de admin) y registrar ventas para clientes en la tienda física.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna para el formulario del cliente y el resumen */}
        <div className="lg:col-span-1 lg:order-2">
          <form onSubmit={handleCreatePosSale} className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
            <h2 className="text-xl font-semibold text-color-secondary mb-4 flex items-center">
              <FaUserPlus className="mr-2" /> Datos del Cliente
            </h2>

            {/* Buscador de Usuarios */}
            <div className="relative mb-4">
              <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700">Buscar Cliente Registrado</label>
              <input type="text" id="userSearch" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nombre, email, documento..." className="input-style w-full mt-1" disabled={!!selectedUser} autoComplete="off" />
              {isSearching && <p className="text-xs text-blue-500 mt-1 italic">Buscando...</p>}
              {searchResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {searchResults.map(user => (
                    <li key={user.id} onClick={() => handleSelectUser(user)} className="px-3 py-2 cursor-pointer hover:bg-color-accent1 hover:text-white border-b last:border-b-0 group">
                      <p className="font-semibold text-sm">{user.full_name}</p>
                      <p className="text-xs text-gray-500 group-hover:text-white">{user.email}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Usuario seleccionado */}
            {selectedUser && (
                <div className="p-3 mb-4 text-sm text-green-800 bg-green-100 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold flex items-center"><FaUserCheck className="mr-2"/> Cliente Seleccionado:</p>
                        <p>{selectedUser.full_name}</p>
                    </div>
                    <button type="button" onClick={clearSelectedUser} className="text-red-600 hover:text-red-800 font-bold p-1 rounded-full hover:bg-red-200" title="Desvincular cliente"><FaTimes /></button>
                </div>
            )}
            
            {/* Formulario de invitado */}
            <div className={`space-y-4 transition-opacity duration-300 ${selectedUser ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <p className="text-xs text-center text-gray-500 border-b pb-2 mb-2">O ingresa los datos para un cliente invitado:</p>
              <div><label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className="input-style w-full mt-1" /></div>
              <div><label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Email</label><input type="email" id="customerEmail" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="input-style w-full mt-1" /></div>
              <div><label htmlFor="customerDocument" className="block text-sm font-medium text-gray-700">Documento</label><input type="text" id="customerDocument" value={customerDocument} onChange={e => setCustomerDocument(e.target.value)} className="input-style w-full mt-1" /></div>
              <div><label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Teléfono</label><input type="tel" id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input-style w-full mt-1" /></div>
            </div>
            
            <hr className="my-6" />

            {/* Resumen y Botón */}
            <h3 className="text-lg font-medium text-color-primary">Resumen</h3>
            <dl className="mt-4 space-y-4"><div className="flex items-center justify-between"><dt className="text-sm text-gray-600">Subtotal ({itemCount} items)</dt><dd className="text-sm font-medium text-gray-900">{formatCurrency(totalAmount)}</dd></div></dl>
            <div className="mt-6">
              <button type="submit" disabled={isProcessingSale || itemCount === 0 || isCartLoading} className="w-full flex items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {isProcessingSale ? <FaSpinner className="animate-spin mr-2" /> : <FaFileInvoiceDollar className="ml-2"/>}
                {isProcessingSale ? 'Registrando...' : 'Registrar Venta'}
              </button>
            </div>
          </form>
        </div>

        {/* Columna del Carrito */}
        <div className="lg:col-span-2 lg:order-1">
          <h2 className="text-xl font-semibold text-color-secondary mb-4">Carrito Actual</h2>
          <div className="mb-4">
            <Link to="/products" className="text-color-accent2 hover:underline">+ Añadir más productos (Ir al listado)</Link>
          </div>
          {isCartLoading && <Loader message="Actualizando carrito..."/>}
          {!isCartLoading && itemCount > 0 ? (
            <div className="bg-white rounded-lg shadow-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {items.map((item) => (
                    <li key={item.id} className="flex py-4 px-4 items-center">
                        <div className="flex-shrink-0">
                            <img src={item.product_image_url || '/logo.png'} alt={item.product_name} className="h-16 w-16 rounded-md object-cover" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(item.product_sale_price)} x {item.quantity} = <strong>{formatCurrency(item.subtotal)}</strong></p>
                        </div>
                        <div className="flex items-center">
                            <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-600 p-2"><FaTrash /></button>
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