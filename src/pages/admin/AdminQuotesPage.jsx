// src/pages/admin/AdminQuotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import cartService from '../../services/cartService'; // Asume que tiene getQuotes, cancelQuote
import quoteAdminService from '../../services/quoteAdminService';
import { toast } from 'react-toastify';
import { FaFileInvoiceDollar, FaCheck, FaTimes, FaTruck, FaRedo, FaSearch } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits:0, maximumFractionDigits:0 }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const Loader = ({ message = "Cargando cotizaciones..." }) => (
  <div className="flex flex-col justify-center items-center py-20 min-h-[calc(100vh-200px)]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-secondary mb-3"></div>
    <p className="text-color-secondary">{message}</p>
  </div>
);

// Componente para mostrar los items de una cotización
const QuoteItemsList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500 italic">Esta cotización no tiene items.</p>;
  }
  return (
    <ul className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
      {items.map(item => (
        <li key={item.id} className="text-sm text-gray-700">
          <span className="font-medium">{item.quantity} x {item.product_name}</span>
          <span className="text-gray-500"> ({formatCurrency(item.price_at_quote)} c/u)</span>
          <span className="float-right font-semibold">{formatCurrency(item.subtotal)}</span>
        </li>
      ))}
    </ul>
  );
};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pendiente</span>;
      case 'paid':
        return <span className="px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Pagada</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Cancelada</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Enviada</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };


function AdminQuotesPage() {
    const [quotes, setQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});
    const [expandedQuoteId, setExpandedQuoteId] = useState(null); 
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        search: searchParams.get('search') || '',
        page: parseInt(searchParams.get('page')) || 1,
    });
    
    // Para manejar el estado de carga de botones de acción
    const [processingQuoteId, setProcessingQuoteId] = useState(null);
    const toggleQuoteDetails = (quoteId) => {
        setExpandedQuoteId(prevId => (prevId === quoteId ? null : quoteId));
    };
    const fetchQuotes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Construir los params para la API a partir del estado de filtros
            const apiParams = { page: filters.page };
            if (filters.status) apiParams.status = filters.status;
            if (filters.search) apiParams.search = filters.search;
            // Tu API debe soportar estos filtros

            const data = await cartService.getQuotes(apiParams);
            setQuotes(data.results || []);
            setPagination({
                count: data.count,
                next: data.next,
                previous: data.previous,
                totalPages: Math.ceil(data.count / 10) // Asume 10 por página
            });
        } catch (err) {
            const errorMsg = err.message || "Error al cargar cotizaciones.";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [filters]); // Se ejecuta cuando cambian los filtros

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // Resetea a página 1 al cambiar filtro
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set(name, value);
        newSearchParams.set('page', '1');
        setSearchParams(newSearchParams);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const searchTerm = e.target.elements.search.value;
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('search', searchTerm);
        newSearchParams.set('page', '1');
        setSearchParams(newSearchParams);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', newPage.toString());
            setSearchParams(newSearchParams);
        }
    };

    const updateQuoteState = (quoteId, newStatusData) => {
        setQuotes(prevQuotes => 
            prevQuotes.map(q => q.id === quoteId ? { ...q, ...newStatusData } : q)
        );
    };

    const handleAction = async (actionType, quoteId) => {
        setProcessingQuoteId(quoteId);
        try {
            let updatedQuoteObject;
            
            if (actionType === 'finalize') {
                const response = await quoteAdminService.finalizeSale(quoteId);
                updatedQuoteObject = response.data.quote;
                toast.success(`Venta #${quoteId} finalizada.`);
            } else if (actionType === 'cancel') {
                const responseData = await cartService.cancelQuote(quoteId); // Reutilizamos el servicio (devuelve data directo)
                updatedQuoteObject = responseData.quote;
                toast.info(`Cotización #${quoteId} cancelada.`);
            } else if (actionType === 'ship') {
                const response = await quoteAdminService.markAsShipped(quoteId);
                updatedQuoteObject = response.data.quote;
                toast.success(`Pedido #${quoteId} marcado como enviado.`);
            }

            if (updatedQuoteObject) {
                // Actualizar el estado local con el objeto completo devuelto por la API
                setQuotes(prevQuotes => 
                    prevQuotes.map(q => 
                        q.id === quoteId ? updatedQuoteObject : q
                    )
                );
            } else {
                // Fallback si la API no devuelve el objeto 'quote' (aunque debería)
                console.warn("La acción fue exitosa pero la API no devolvió el objeto de la cotización actualizado. Se recargará la lista.");
                fetchQuotes(); // Recargar todo
            }

        } catch (error) {
            toast.error(error.error || `Error al procesar la acción para la cotización #${quoteId}.`);
        } finally {
            setProcessingQuoteId(null);
        }
    };

    const handleViewReceipt = async (quoteId) => {
        setProcessingQuoteId(quoteId);
        try {
            // La respuesta de axios contiene el blob en la propiedad 'data'
            const response = await quoteAdminService.getQuoteReceipt(quoteId);
            const pdfUrl = URL.createObjectURL(response.data);
            window.open(pdfUrl, '_blank'); // Abre el PDF en una nueva pestaña
            URL.revokeObjectURL(pdfUrl); // Libera memoria
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message || `Error al generar el recibo para el pedido #${quoteId}.`;
            toast.error(errorMsg);
        } finally {
            setProcessingQuoteId(null);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-color-primary mb-6">Gestión de Pedidos</h1>

            {/* Panel de Filtros */}
            <div className="p-4 bg-gray-100 rounded-lg mb-6 shadow">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar (ID, Cliente)</label>
                        <div className="flex">
                            <input type="text" name="search" id="search" defaultValue={filters.search} className="input-style w-full rounded-l-md !border-r-0" />
                            <button type="submit" className="bg-color-secondary text-white px-4 py-2 rounded-r-md hover:bg-color-accent1"><FaSearch /></button>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Filtrar por Estado</label>
                        <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="input-style w-full">
                            <option value="">Todos los Estados</option>
                            <option value="pending">Pendiente</option>
                            <option value="paid">Pagado</option>
                            <option value="shipped">Enviado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                </form>
            </div>

            {isLoading && <Loader />}
            {error && <p className="text-red-500 text-center py-5">{error}</p>}
            
            <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">ID / Fecha</th>
                            <th scope="col" className="px-6 py-3">Cliente</th>
                            <th scope="col" className="px-6 py-3">Total</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!isLoading && quotes.map(quote => (
                            <React.Fragment key={quote.id}>
                                {/* Fila Principal de la Cotización */}
                                <tr 
                                    className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                                    onClick={() => toggleQuoteDetails(quote.id)} // Expande/colapsa al hacer clic
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-color-primary">#{quote.id}</div>
                                        <div className="text-xs text-gray-500">{formatDate(quote.created_at)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {/* Si hay customer_name, es un invitado. Si no, usa el del usuario registrado. */}
                                            {quote.customer_name || quote.user_detail?.user || 'Invitado Anónimo'}
                                            {/* {quote.user || 'Invitado Anónimo'} */}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {quote.customer_email || quote.user_email || 'Sin email'}
                                        </div>
                                            {(quote.customer_phone || quote.user_detail?.phone) &&
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Tel: {quote.customer_phone || quote.user_detail?.phone}
                                                </div>
                                            }
                                    </td>
                                    <td className="px-6 py-4 font-bold">{formatCurrency(quote.total)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(quote.status)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}> 
                                            {/* e.stopPropagation() en el div de los botones para que el clic
                                                en un botón no dispare el onClick de la fila (toggleQuoteDetails) */}
                                            {quote.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleAction('finalize', quote.id)} disabled={processingQuoteId === quote.id} title="Marcar como Pagado" className="btn-action bg-green-500 hover:bg-green-600"><FaCheck/></button>
                                                    <button onClick={() => handleAction('cancel', quote.id)} disabled={processingQuoteId === quote.id} title="Cancelar Cotización" className="btn-action bg-red-500 hover:bg-red-600"><FaTimes/></button>
                                                </>
                                            )}
                                            {quote.status === 'paid' && (
                                                <>
                                                    <button onClick={() => handleAction('ship', quote.id)} disabled={processingQuoteId === quote.id} title="Marcar como Enviado" className="btn-action bg-blue-500 hover:bg-blue-600"><FaTruck/></button>
                                                    <button onClick={() => handleAction('cancel', quote.id)} disabled={processingQuoteId === quote.id} title="Cancelar Cotización" className="btn-action bg-red-500 hover:bg-red-600"><FaTimes/></button>
                                                </>
                                            )}
                                            {['pending', 'paid', 'shipped'].includes(quote.status) && (
                                                <button onClick={() => handleViewReceipt(quote.id)} disabled={processingQuoteId === quote.id} title="Ver Recibo" className="btn-action bg-gray-500 hover:bg-gray-600"><FaFileInvoiceDollar/></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Fila de Detalles (Expandible) */}
                                {expandedQuoteId === quote.id && (
                                    <tr className="bg-gray-50">
                                        {/* El colspan debe coincidir con el número de columnas de tu tabla */}
                                        <td colSpan="5" className="p-4">
                                            <div className="p-2 bg-white rounded shadow-inner">
                                                <h4 className="font-semibold text-gray-700 mb-2">Items del Pedido:</h4>
                                                <QuoteItemsList items={quote.items} />
                                                
                                                {/* Sección para mostrar el cupón aplicado */}
                                                {quote.coupon && quote.coupon_discount > 0 && (
                                                    <>
                                                        <h4 className="font-semibold text-gray-700 mb-2 mt-4">Descuentos:</h4>
                                                        <div className="text-sm text-gray-600 pl-4 border-l-2 border-green-300">
                                                            <p><strong>Cupón Aplicado:</strong> {quote.coupon.code}</p>
                                                            <p><strong>Descuento:</strong> <span className="font-bold text-green-600">-{formatCurrency(quote.coupon_discount)}</span></p>
                                                        </div>
                                                    </>
                                                )}

                                                <h4 className="font-semibold text-gray-700 mb-2 mt-4">Datos del Comprador:</h4>
                                                <div className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                                                    <p><strong>Dirección:</strong> {quote.user_detail?.address || 'No especificada'}</p>
                                                    <p><strong>Teléfono:</strong> {quote.user_detail?.phone || 'No especificado'}</p>
                                                    <p><strong>Documento:</strong> {quote.user_detail?.document || 'No especificado'}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>

                        ))}
                    </tbody>
                </table>
            </div>

            {!isLoading && quotes.length === 0 && <p className="text-center py-10 text-gray-500">No se encontraron cotizaciones con los filtros actuales.</p>}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-lg shadow-lg">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(filters.page - 1)}
                            disabled={!pagination.previous || isLoading}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => handlePageChange(filters.page + 1)}
                            disabled={!pagination.next || isLoading}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando{' '}
                                <span className="font-medium">{(filters.page - 1) * 10 + 1}</span> a{' '}
                                <span className="font-medium">{Math.min(filters.page * 10, pagination.count)}</span> de{' '}
                                <span className="font-medium">{pagination.count}</span> resultados
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(filters.page - 1)}
                                    disabled={!pagination.previous || isLoading}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Anterior</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                                </button>
                                {/* Aquí podrías generar los números de página si lo deseas */}
                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                    Página {filters.page} de {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(filters.page + 1)}
                                    disabled={!pagination.next || isLoading}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Siguiente</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminQuotesPage;