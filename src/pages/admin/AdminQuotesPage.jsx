// src/pages/admin/AdminQuotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import cartService from '../../services/cartService'; // Asume que tiene getQuotes, cancelQuote
import quoteAdminService from '../../services/quoteAdminService';
import { toast } from 'react-toastify';
import { FaFileInvoiceDollar, FaCheck, FaTimes, FaTruck, FaRedo, FaSearch, FaEdit, FaMoneyBillWave, FaSpinner, FaPaperPlane, FaUserEdit, FaFilePdf, FaEnvelope, FaExternalLinkAlt } from 'react-icons/fa';
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

// Componente para mostrar los items de una cotización con link al producto
const QuoteItemsList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500 italic">Esta cotización no tiene items.</p>;
  }
  return (
    <ul className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
      {items.map(item => (
        <li key={item.id} className="text-sm text-gray-700 flex flex-wrap items-center justify-between gap-2 py-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-800">{item.quantity} x</span>
            {item.product ? (
              <Link
                to={`/products/${item.product}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-color-secondary hover:text-color-accent1 hover:underline inline-flex items-center gap-1 transition-colors"
                title={`Ver "${item.product_name}" en la tienda (abre en nueva pestaña)`}
              >
                <span>{item.product_name}</span>
                <FaExternalLinkAlt size={10} className="text-gray-400 hover:text-color-accent1 flex-shrink-0" />
              </Link>
            ) : (
              <span className="font-medium text-gray-800">{item.product_name}</span>
            )}
            <span className="text-xs text-gray-500">({formatCurrency(item.price_at_quote)} c/u)</span>
          </div>
          <span className="font-semibold text-gray-900 ml-auto">{formatCurrency(item.subtotal)}</span>
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
        start_date: searchParams.get('start_date') || '',
        end_date: searchParams.get('end_date') || '',
        page: parseInt(searchParams.get('page')) || 1,
    });
    
    // Para manejar el estado de carga de botones de acción
    const [processingQuoteId, setProcessingQuoteId] = useState(null);

    // Estados para el modal de edición de comprador, abono y notas
    const [editingQuote, setEditingQuote] = useState(null);
    const [editCustomerName, setEditCustomerName] = useState('');
    const [editCustomerEmail, setEditCustomerEmail] = useState('');
    const [editCustomerDocument, setEditCustomerDocument] = useState('');
    const [editCustomerPhone, setEditCustomerPhone] = useState('');
    const [editCustomerAddress, setEditCustomerAddress] = useState('');
    const [editPaidAmount, setEditPaidAmount] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Estados para el modal de reenvío de factura / correo
    const [resendModalQuote, setResendModalQuote] = useState(null);
    const [resendEmailAddress, setResendEmailAddress] = useState('');
    const [isResendingEmail, setIsResendingEmail] = useState(false);

    const handleOpenEditModal = (quote) => {
        setEditingQuote(quote);
        setEditCustomerName(quote.customer_name || quote.user_detail?.user || '');
        setEditCustomerEmail(quote.customer_email || quote.user_email || '');
        setEditCustomerDocument(quote.customer_document || quote.user_detail?.document || '');
        setEditCustomerPhone(quote.customer_phone || quote.user_detail?.phone || '');
        setEditCustomerAddress(quote.customer_address || quote.user_detail?.address || '');
        setEditPaidAmount(quote.paid_amount !== null && quote.paid_amount !== undefined ? String(quote.paid_amount) : '0');
        setEditNotes(quote.notes || '');
    };

    const handleCloseEditModal = () => {
        setEditingQuote(null);
        setEditCustomerName('');
        setEditCustomerEmail('');
        setEditCustomerDocument('');
        setEditCustomerPhone('');
        setEditCustomerAddress('');
        setEditPaidAmount('');
        setEditNotes('');
    };

    const handleSaveEditQuote = async (e) => {
        e.preventDefault();
        if (!editingQuote) return;
        setIsSavingEdit(true);
        try {
            const numericPaid = parseFloat(editPaidAmount) || 0;
            const response = await quoteAdminService.updateQuote(editingQuote.id, {
                customer_name: editCustomerName.trim(),
                customer_email: editCustomerEmail.trim(),
                customer_document: editCustomerDocument.trim(),
                customer_phone: editCustomerPhone.trim(),
                customer_address: editCustomerAddress.trim(),
                paid_amount: numericPaid,
                notes: editNotes.trim(),
            });
            const updatedQuote = response.data;
            setQuotes(prevQuotes => prevQuotes.map(q => q.id === editingQuote.id ? { ...q, ...updatedQuote } : q));
            toast.success(`Pedido #${editingQuote.id} actualizado exitosamente.`);
            handleCloseEditModal();
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message || "Error al actualizar el pedido.";
            toast.error(errorMsg);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleOpenResendModal = (quote) => {
        setResendModalQuote(quote);
        setResendEmailAddress(quote.customer_email || quote.user_email || '');
    };

    const handleCloseResendModal = () => {
        setResendModalQuote(null);
        setResendEmailAddress('');
    };

    const handleConfirmResendEmail = async (e) => {
        e.preventDefault();
        if (!resendModalQuote) return;
        if (!resendEmailAddress.trim()) {
            toast.warn("Por favor ingresa un correo electrónico de destino.");
            return;
        }
        setIsResendingEmail(true);
        try {
            const response = await quoteAdminService.resendEmail(resendModalQuote.id, {
                email: resendEmailAddress.trim(),
            });
            toast.success(response.data?.message || `Documento enviado a ${resendEmailAddress.trim()}`);
            if (resendEmailAddress.trim() !== resendModalQuote.customer_email) {
                setQuotes(prevQuotes => prevQuotes.map(q => q.id === resendModalQuote.id ? { ...q, customer_email: resendEmailAddress.trim() } : q));
            }
            handleCloseResendModal();
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || "Error al reenviar el correo.";
            toast.error(errorMsg);
        } finally {
            setIsResendingEmail(false);
        }
    };

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
            if (filters.start_date) apiParams.start_date = filters.start_date;
            if (filters.end_date) apiParams.end_date = filters.end_date;
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
        if (value) {
            newSearchParams.set(name, value);
        } else {
            newSearchParams.delete(name);
        }
        newSearchParams.set('page', '1');
        setSearchParams(newSearchParams);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const searchTerm = e.target.elements.search.value;
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
        const newSearchParams = new URLSearchParams(searchParams);
        if (searchTerm) {
            newSearchParams.set('search', searchTerm);
        } else {
            newSearchParams.delete('search');
        }
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
            toast.error(error.error || `Error al procesar la acción para la cotización (Verificar el Stock) #${quoteId}.`);
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

    const handleViewInvoicePdf = async (quoteId) => {
        setProcessingQuoteId(quoteId);
        try {
            const response = await quoteAdminService.getInvoicePdf(quoteId);
            const pdfUrl = URL.createObjectURL(response.data);
            window.open(pdfUrl, '_blank');
            URL.revokeObjectURL(pdfUrl);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message || `Error al generar la factura del pedido #${quoteId}.`;
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
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar (ID, Cliente, Producto)</label>
                        <div className="flex">
                            <input type="text" name="search" id="search" defaultValue={filters.search} className="input-style w-full rounded-l-md !border-r-0" />
                            <button type="submit" className="bg-color-secondary text-white px-4 py-2 rounded-r-md hover:bg-color-accent1"><FaSearch /></button>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Desde</label>
                        <input type="date" name="start_date" id="start_date" value={filters.start_date} onChange={handleFilterChange} className="input-style w-full" />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Hasta</label>
                        <input type="date" name="end_date" id="end_date" value={filters.end_date} onChange={handleFilterChange} className="input-style w-full" />
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
                            <th scope="col" className="px-6 py-3">Ganancia</th>
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
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{formatCurrency(quote.total)}</div>
                                        {Number(quote.paid_amount) > 0 ? (
                                            <div className="mt-1 space-y-0.5">
                                                <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                    Abono: {formatCurrency(quote.paid_amount)}
                                                </span>
                                                {Number(quote.pending_balance) > 0 ? (
                                                    <div className="text-[11px] font-bold text-red-600">
                                                        Saldo: {formatCurrency(quote.pending_balance)}
                                                    </div>
                                                ) : (
                                                    <div className="text-[11px] font-semibold text-emerald-600">
                                                        ✓ Cubierto 100%
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-gray-400 mt-1">Sin abono inicial</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold ${quote.profit > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                            {formatCurrency(quote.profit)}
                                        </div>
                                    </td>
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
                                            {/* Botón para editar datos del comprador, abono y observaciones */}
                                            <button
                                                onClick={() => handleOpenEditModal(quote)}
                                                disabled={processingQuoteId === quote.id}
                                                title="Editar Comprador, Abono y Observaciones"
                                                className="btn-action bg-amber-500 hover:bg-amber-600 text-white"
                                            >
                                                <FaEdit />
                                            </button>

                                            {/* Botón para reenviar factura / cotización por correo */}
                                            <button
                                                onClick={() => handleOpenResendModal(quote)}
                                                disabled={processingQuoteId === quote.id}
                                                title="Reenviar Factura / Cotización por Correo"
                                                className="btn-action bg-purple-600 hover:bg-purple-700 text-white"
                                            >
                                                <FaPaperPlane />
                                            </button>

                                            {/* Botón para ver factura formal PDF A4 */}
                                            <button
                                                onClick={() => handleViewInvoicePdf(quote.id)}
                                                disabled={processingQuoteId === quote.id}
                                                title="Ver Factura en PDF (A4)"
                                                className="btn-action bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                <FaFilePdf />
                                            </button>

                                            {['pending', 'paid', 'shipped'].includes(quote.status) && (
                                                <button onClick={() => handleViewReceipt(quote.id)} disabled={processingQuoteId === quote.id} title="Ver Recibo Térmico (58mm)" className="btn-action bg-gray-500 hover:bg-gray-600"><FaFileInvoiceDollar/></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Fila de Detalles (Expandible) */}
                                {expandedQuoteId === quote.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="6" className="p-4">
                                            <div className="p-4 bg-white rounded shadow-inner space-y-4">
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-2">Items del Pedido:</h4>
                                                    <QuoteItemsList items={quote.items} />
                                                </div>
                                                
                                                {/* Sección de Abono, Saldo Pendiente y Observaciones */}
                                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2 mb-2">
                                                        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                                                            <FaMoneyBillWave className="text-emerald-600" /> Control de Pago y Abono:
                                                        </h4>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditModal(quote);
                                                            }}
                                                            className="text-xs px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded shadow-sm inline-flex items-center gap-1 transition-colors"
                                                        >
                                                            <FaEdit size={12} /> Modificar Abono / Notas
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                                        <div className="bg-white p-2.5 rounded border border-gray-100">
                                                            <span className="text-xs text-gray-500 block">Total Cotización:</span>
                                                            <span className="font-bold text-gray-900 text-base">{formatCurrency(quote.total)}</span>
                                                        </div>
                                                        <div className="bg-white p-2.5 rounded border border-gray-100">
                                                            <span className="text-xs text-gray-500 block">Abono Registrado:</span>
                                                            <span className="font-bold text-emerald-600 text-base">{formatCurrency(quote.paid_amount || 0)}</span>
                                                        </div>
                                                        <div className="bg-white p-2.5 rounded border border-gray-100">
                                                            <span className="text-xs text-gray-500 block">Saldo Pendiente:</span>
                                                            <span className={`font-bold text-base ${Number(quote.pending_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {formatCurrency(quote.pending_balance || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {quote.notes ? (
                                                        <div className="mt-3 p-2.5 bg-amber-50/70 border border-amber-200 rounded text-xs text-gray-800">
                                                            <strong className="text-amber-900 block mb-0.5">Observaciones / Notas del Pedido:</strong>
                                                            <p className="whitespace-pre-line">{quote.notes}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="mt-2 text-xs text-gray-400 italic">Sin observaciones registradas para este pedido.</p>
                                                    )}
                                                </div>

                                                {/* Sección para mostrar el cupón aplicado */}
                                                {quote.coupon && quote.coupon_discount > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2">Descuentos:</h4>
                                                        <div className="text-sm text-gray-600 pl-4 border-l-2 border-green-300">
                                                            <p><strong>Cupón Aplicado:</strong> {quote.coupon.code}</p>
                                                            <p><strong>Descuento:</strong> <span className="font-bold text-green-600">-{formatCurrency(quote.coupon_discount)}</span></p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold text-gray-700">Datos del Comprador:</h4>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditModal(quote);
                                                            }}
                                                            className="text-xs text-color-secondary hover:underline font-semibold inline-flex items-center gap-1"
                                                        >
                                                            <FaUserEdit /> Corregir Datos
                                                        </button>
                                                    </div>
                                                    <div className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200 space-y-1">
                                                        <p><strong>Nombre:</strong> {quote.customer_name || quote.user_detail?.user || 'Invitado'}</p>
                                                        <p><strong>Email:</strong> {quote.customer_email || quote.user_email || 'No especificado'}</p>
                                                        <p><strong>Documento:</strong> {quote.customer_document || quote.user_detail?.document || 'No especificado'}</p>
                                                        <p><strong>Teléfono:</strong> {quote.customer_phone || quote.user_detail?.phone || 'No especificado'}</p>
                                                        <p><strong>Dirección:</strong> {quote.customer_address || quote.user_detail?.address || 'No especificada'}</p>
                                                    </div>
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
            {/* Modal para Editar Comprador, Abono y Observaciones */}
            {editingQuote && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3 mb-4 sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <FaUserEdit size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Editar Pedido #{editingQuote.id}</h3>
                                    <p className="text-xs text-gray-500">Total: {formatCurrency(editingQuote.total)} - Estado: {editingQuote.status}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseEditModal}
                                disabled={isSavingEdit}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                title="Cerrar"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditQuote} className="space-y-4">
                            {/* Sección 1: Datos del Comprador */}
                            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-color-secondary mb-2.5 flex items-center gap-1.5">
                                    <FaUserEdit /> Datos del Comprador
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            value={editCustomerName}
                                            onChange={(e) => setEditCustomerName(e.target.value)}
                                            placeholder="Nombre del cliente"
                                            className="input-style w-full text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={editCustomerEmail}
                                            onChange={(e) => setEditCustomerEmail(e.target.value)}
                                            placeholder="cliente@ejemplo.com"
                                            className="input-style w-full text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Cédula / Documento</label>
                                        <input
                                            type="text"
                                            value={editCustomerDocument}
                                            onChange={(e) => setEditCustomerDocument(e.target.value)}
                                            placeholder="1098765432"
                                            className="input-style w-full text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono / Celular</label>
                                        <input
                                            type="tel"
                                            value={editCustomerPhone}
                                            onChange={(e) => setEditCustomerPhone(e.target.value)}
                                            placeholder="3001234567"
                                            className="input-style w-full text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección de Envío / Domicilio</label>
                                    <input
                                        type="text"
                                        value={editCustomerAddress}
                                        onChange={(e) => setEditCustomerAddress(e.target.value)}
                                        placeholder="Ej. Calle 10 # 5-20, Apto 301"
                                        className="input-style w-full text-xs"
                                    />
                                </div>
                            </div>

                            {/* Sección 2: Control de Pago y Abono */}
                            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                                    <FaMoneyBillWave /> Control de Pago y Abono
                                </h4>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Abono Registrado ($ COP)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={editPaidAmount}
                                        onChange={(e) => setEditPaidAmount(e.target.value)}
                                        className="input-style w-full font-semibold text-sm"
                                        required
                                    />

                                    {/* Botones de ayuda rápida */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditPaidAmount(String(editingQuote.total || 0))}
                                            className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-medium transition-colors"
                                        >
                                            100% Total
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditPaidAmount(prev => String((parseFloat(prev) || 0) + 50000))}
                                            className="text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded font-medium transition-colors"
                                        >
                                            + $50.000
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditPaidAmount(prev => String((parseFloat(prev) || 0) + 100000))}
                                            className="text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded font-medium transition-colors"
                                        >
                                            + $100.000
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditPaidAmount('0')}
                                            className="text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded font-medium transition-colors"
                                        >
                                            $0 (Sin Abono)
                                        </button>
                                    </div>

                                    {/* Saldo pendiente resultante */}
                                    <div className="mt-3 p-2 bg-white rounded border border-gray-200 text-xs">
                                        <div className="flex justify-between text-gray-600 mb-1">
                                            <span>Total venta:</span>
                                            <span className="font-semibold">{formatCurrency(editingQuote.total)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-red-600">Nuevo Saldo Pendiente:</span>
                                            <span className="text-red-700 text-sm">
                                                {formatCurrency(Math.max(0, editingQuote.total - (parseFloat(editPaidAmount) || 0)))}
                                            </span>
                                        </div>
                                        {(parseFloat(editPaidAmount) || 0) >= editingQuote.total && (
                                            <p className="text-[11px] text-green-700 font-semibold mt-1">✓ Quedará 100% pagado</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sección 3: Observaciones */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Observaciones / Notas del Pedido
                                </label>
                                <textarea
                                    rows={3}
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    placeholder="Notas sobre el abono, reserva, fecha de recogida..."
                                    className="input-style w-full text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={handleCloseEditModal}
                                    disabled={isSavingEdit}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-color-secondary hover:bg-color-accent1 rounded-lg shadow transition-colors disabled:opacity-50"
                                >
                                    {isSavingEdit ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Guardando...
                                        </>
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Reenviar Factura / Cotización por Correo */}
            {resendModalQuote && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                        <div className="flex items-center justify-between border-b pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <FaPaperPlane size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Reenviar por Correo</h3>
                                    <p className="text-xs text-gray-500">
                                        {resendModalQuote.status === 'paid' || resendModalQuote.status === 'shipped' ? 'Factura de Venta' : 'Cotización'} #{resendModalQuote.id}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseResendModal}
                                disabled={isResendingEmail}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                title="Cerrar"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmResendEmail} className="space-y-4">
                            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-gray-700 space-y-1">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">Cliente:</span>
                                    <span>{resendModalQuote.customer_name || resendModalQuote.user_detail?.user || 'Invitado'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">Total:</span>
                                    <span className="font-bold text-gray-900">{formatCurrency(resendModalQuote.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">Documento a enviar:</span>
                                    <span className="font-medium text-purple-700">
                                        {resendModalQuote.status === 'paid' || resendModalQuote.status === 'shipped' ? 'Factura de Venta (PDF)' : resendModalQuote.status === 'backorder_paid' ? 'Confirmación Bajo Pedido (PDF)' : 'Cotización Formal (PDF)'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Correo Electrónico de Destino <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={resendEmailAddress}
                                        onChange={(e) => setResendEmailAddress(e.target.value)}
                                        placeholder="cliente@ejemplo.com"
                                        className="input-style w-full pl-9 text-sm"
                                        disabled={isResendingEmail}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Puedes modificar el correo si el cliente desea recibirlo en una dirección diferente.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseResendModal}
                                    disabled={isResendingEmail}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResendingEmail}
                                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow transition-colors disabled:opacity-50"
                                >
                                    {isResendingEmail ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane /> Reenviar Correo
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminQuotesPage;