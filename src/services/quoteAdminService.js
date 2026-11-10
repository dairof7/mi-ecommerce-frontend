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

  /**
   * Obtiene la factura o cotización formal en PDF (formato A4/Carta).
   * @param {number} quoteId - El ID de la cotización.
   * @returns {Promise<Blob>} El archivo PDF como un Blob.
   */
  getInvoicePdf: (quoteId) => api.get(`/carts/quotes/${quoteId}/invoice-pdf/`, {
    responseType: 'blob',
  }),

  /**
   * Reenvía la factura o cotización en PDF por correo electrónico al cliente.
   * @param {number} quoteId - El ID de la cotización.
   * @param {object} data - { email, type }
   * @returns {Promise<object>} Mensaje de confirmación.
   */
  resendEmail: (quoteId, data = {}) => api.post(`/carts/quotes/${quoteId}/resend-email/`, data),

  /**
   * Actualiza los datos de una cotización (abono, notas, comprador, etc).
   * @param {number} quoteId - El ID de la cotización.
   * @param {object} data - Datos a actualizar (ej: { paid_amount, notes }).
   * @returns {Promise<object>} La cotización actualizada.
   */
  updateQuote: (quoteId, data) => api.patch(`/carts/quotes/${quoteId}/`, data),

  /**
   * Obtiene las métricas y series para el Dashboard de Ventas.
   * @param {object} params - { start_date, end_date }
   * @returns {Promise<object>} Datos del dashboard.
   */
  getSalesDashboard: async (params = {}) => {
    const response = await api.get('/carts/quotes/sales-dashboard/', { params });
    return response.data;
  },

};

export default quoteAdminService;