// src/pages/QuoteHistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import cartService from '../services/cartService'; // Asume que las funciones de quote están aquí
import { toast } from 'react-toastify';
import { FaFileInvoiceDollar, FaInfoCircle, FaTimesCircle, FaCheckCircle, FaRedo } from 'react-icons/fa';

// Helper para formatear moneda y fecha
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
          <span className="text-gray-500"> (@ {formatCurrency(item.price_at_quote)} c/u)</span>
          <span className="float-right font-semibold">{formatCurrency(item.subtotal)}</span>
        </li>
      ))}
    </ul>
  );
};

function QuoteHistoryPage() {
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState(null); // Para expandir/colapsar detalles
  const [isCancelling, setIsCancelling] = useState(null); // Para el estado de carga del botón cancelar

  // Paginación (si tu endpoint /api/carts/quotes/ está paginado)
  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(0);
  // const [totalQuotes, setTotalQuotes] = useState(0);

  const fetchQuotes = useCallback(async (/* page = 1 */) => {
    setIsLoading(true);
    setError(null);
    try {
      // const params = { page };
      const data = await cartService.getQuotes(/* params */); // Pasar params si hay paginación
      setQuotes(data.results || data || []); // data.results si está paginado, sino data
      // if (data.count !== undefined) {
      //   setTotalQuotes(data.count);
      //   setTotalPages(Math.ceil(data.count / 10)); // Asume 10 por página para cotizaciones
      //   setCurrentPage(page);
      // }
    } catch (err) {
      const errorMsg = err.message || "Error al cargar el historial de cotizaciones.";
      setError(errorMsg);
      toast.error(errorMsg);
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const toggleQuoteDetails = (quoteId) => {
    setExpandedQuoteId(prevId => (prevId === quoteId ? null : quoteId));
  };

  const handleCancelQuote = async (quoteId) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta cotización? Esta acción no se puede deshacer.")) {
        return;
    }
    setIsCancelling(quoteId);
    try {
        const updatedQuote = await cartService.cancelQuote(quoteId);
        // Actualizar la lista de cotizaciones para reflejar el cambio de estado
        setQuotes(prevQuotes => 
            prevQuotes.map(q => q.id === quoteId ? { ...q, status: updatedQuote.status } : q)
        );
        toast.success(`Cotización #${quoteId} cancelada.`);
    } catch (err) {
        toast.error(err.message || `Error al cancelar la cotización #${quoteId}.`);
    } finally {
        setIsCancelling(null);
    }
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

  if (isLoading && quotes.length === 0) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500 text-xl">{error}</div>;
  }

  if (!isLoading && quotes.length === 0) {
    return (
      <div className="text-center py-20">
        <FaFileInvoiceDollar size={80} className="mx-auto text-color-neutral-light mb-6" />
        <h2 className="text-2xl font-semibold text-color-primary mb-4">No tienes cotizaciones todavía</h2>
        <p className="text-gray-600 mb-6">Cuando generes una cotización, aparecerá aquí.</p>
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
      <h1 className="text-3xl font-bold text-color-primary mb-8">Mis Cotizaciones</h1>
      <div className="space-y-6">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div 
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleQuoteDetails(quote.id)}
                aria-expanded={expandedQuoteId === quote.id}
                aria-controls={`quote-details-${quote.id}`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <h2 className="text-lg font-semibold text-color-secondary">
                    Cotización #{quote.id}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Fecha: {formatDate(quote.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                    {getStatusBadge(quote.status)}
                    <p className="text-xl font-bold text-color-primary mt-1">
                        {formatCurrency(quote.total)}
                    </p>
                </div>
              </div>
            </div>

            {/* Detalles expandibles de la cotización */}
            {expandedQuoteId === quote.id && (
              <div id={`quote-details-${quote.id}`} className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <h3 className="text-md font-semibold text-gray-800 mb-2">Detalles de la Cotización:</h3>
                <QuoteItemsList items={quote.items} />
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                    {quote.status === 'pending' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCancelQuote(quote.id); }}
                            disabled={isCancelling === quote.id}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                        >
                            {isCancelling === quote.id ? (
                                <FaRedo className="animate-spin mr-2" /> 
                            ) : (
                                <FaTimesCircle className="mr-2" />
                            )}
                            {isCancelling === quote.id ? 'Cancelando...' : 'Cancelar Cotización'}
                        </button>
                    )}
                    {/* Podrías añadir un botón de "Pagar" o "Ver Factura" si el estado es 'paid' */}
                    {/* <Link to={`/checkout/quote/${quote.id}`} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Proceder al Pago
                    </Link> */}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* TODO: Paginación si el endpoint de cotizaciones está paginado */}
      {/* {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={fetchQuotes} />
      )} */}
    </div>
  );
}

export default QuoteHistoryPage;