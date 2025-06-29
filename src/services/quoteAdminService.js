// src/services/quoteAdminService.js
import apiClient from './api';

const finalizeSale = async (quoteId) => {
    try {
        const response = await apiClient.post(`/carts/quotes/${quoteId}/finalize_sale/`);
        return response.data.quote; // Asume que la respuesta es { message, quote }
    } catch (error) {
        throw error.response?.data || new Error("Error al finalizar la venta.");
    }
};

const markAsShipped = async (quoteId) => {
    try {
        const response = await apiClient.post(`/carts/quotes/${quoteId}/mark-as-shipped/`);
        return response.data; // Asume que la API devuelve la cotización actualizada
    } catch (error) {
        throw error.response?.data || new Error("Error al marcar como enviado.");
    }
};

// Podrías tener una función para actualizar notas aquí si la implementas
// const updateAdminNotes = async (quoteId, notes) => { ... }

export default {
    finalizeSale,
    markAsShipped,
};