// src/services/quoteAdminService.js
import api from './api';

const quoteAdminService = {
  /**
   * Marca una cotización como pagada y descuenta el stock.
   * @param {number} quoteId - El ID de la cotización.
   * @returns {Promise<object>} La cotización actualizada.
   */
  finalizeSale: (quoteId) => api.post(`/carts/quotes/${quoteId}/finalize_sale/`),

  /**
   * Marca una cotización pagada como enviada.
   * @param {number} quoteId - El ID de la cotización.
   * @returns {Promise<object>} La cotización actualizada.
   */
  markAsShipped: (quoteId) => api.post(`/carts/quotes/${quoteId}/mark-as-shipped/`),

  /**
   * Obtiene el recibo en PDF para una cotización.
   * @param {number} quoteId - El ID de la cotización.
   * @returns {Promise<Blob>} El archivo PDF como un Blob.
   */
  getQuoteReceipt: (quoteId) => api.get(`/carts/quotes/${quoteId}/receipt/`, {
    responseType: 'blob', // Importante: le dice a axios que espere datos binarios
  }),

};

export default quoteAdminService;