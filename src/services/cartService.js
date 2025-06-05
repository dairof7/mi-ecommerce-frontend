// src/services/cartService.js
import apiClient from './api';

// Obtener el carrito del usuario actual
const getCart = async () => {
  try {
    // El endpoint de lista /api/carts/carts/ ya devuelve el carrito del usuario
    // si está autenticado (basado en tu CartViewSet.get_queryset)
    const response = await apiClient.get('/carts/carts/'); 
    // Si la respuesta es una lista y tu ViewSet devuelve el carrito del usuario como el primer (y único) elemento:
    if (Array.isArray(response.data.items) && response.data.items.length > 0) {
        return response.data; // Asume que es el primer elemento si get_queryset devuelve un filter()
    }
    // Si tu endpoint de listado para CartViewSet ya devuelve directamente el objeto del carrito del usuario:
    // return response.data; // O si es response.data.results[0] si está paginado pero solo hay uno.
    // Revisa tu API: GET /api/carts/carts/ ¿devuelve un array con un objeto o el objeto directamente?
    // Basado en tu schema.json para GET /api/carts/carts/, devuelve PaginatedCartList,
    // lo que significa que es response.data.results. Y si solo hay un carrito para el usuario, sería results[0].
    if (response.data && response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
    }
    return null; // O un carrito vacío por defecto si no se encuentra o está vacío
  } catch (error) {
    console.error("Error fetching cart:", error.response?.data || error.message);
    if (error.response && error.response.status === 404) {
        return null; // No hay carrito, lo cual puede ser normal para un nuevo usuario
    }
    throw error.response?.data || new Error("Error al obtener el carrito");
  }
};

// Añadir un item al carrito
const addItemToCart = async (productId, quantity) => {
  try {
    // Tu endpoint es una acción personalizada en CartViewSet
    // Asumimos que es POST /api/carts/carts/add_item/
    // El schema.json para esta acción (carts_carts_add_item_create) tiene un requestBody
    // que referencia #/components/schemas/Cart, lo cual no es correcto para el payload de add_item.
    // El payload real debería ser { product_id: ..., quantity: ... }
    const payload = { product_id: productId, quantity };
    const response = await apiClient.post('/carts/carts/add_item/', payload);
    return response.data; // Debería devolver el CartItem creado/actualizado o el carrito completo
  } catch (error) {
    console.error("Error adding item to cart:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al añadir item al carrito");
  }
};

// Actualizar la cantidad de un item (si tienes un endpoint específico o reusas add_item)
// Si reusas add_item, el backend debe manejar la actualización de cantidad si el item ya existe.
// Lo que tu vista add_item ya hace.
const updateItemQuantity = async (productId, quantity) => {
    // Esta función es esencialmente la misma que addItemToCart si el backend maneja la actualización
    return addItemToCart(productId, quantity);
};

// Eliminar un item del carrito
const removeItemFromCart = async (itemId) => {
  try {
    // Tu endpoint es /api/carts/carts/remove_item/{item_id}/
    await apiClient.delete(`/carts/carts/remove_item/${itemId}/`);
    return { itemId }; // Devolver el ID del item eliminado para actualizar el estado
  } catch (error) {
    console.error(`Error removing item ${itemId} from cart:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al eliminar item del carrito");
  }
};

// Crear una cotización desde el carrito
const createQuoteFromCart = async () => {
  try {
    // Tu endpoint es POST /api/carts/carts/create_quote/
    // El schema.json para esta acción indica un requestBody de #/components/schemas/Cart,
    // lo cual probablemente no es necesario si la acción opera sobre el carrito actual del usuario.
    const response = await apiClient.post('/carts/carts/create_quote/');
    return response.data; // Debería devolver la Quote creada
  } catch (error) {
    console.error("Error creating quote:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear la cotización");
  }
};

const addOneProductToCart = async (productId) => {
  try {
    const payload = { product_id: productId };
    // Asumiendo que el endpoint 'add_one_to_cart' está en /api/carts/carts/add-one/
    const response = await apiClient.post('/carts/carts/add-one/', payload);
    return response.data; // Devuelve el carrito actualizado
  } catch (error) {
    console.error("Error adding one item to cart:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al añadir un item al carrito");
  }
};

const getQuotes = async (params = {}) => { // params para paginación o filtros futuros
  try {
    // Endpoint: GET /api/carts/quotes/
    const response = await apiClient.get('/carts/quotes/', { params });
    return response.data; // Debería ser { count, next, previous, results: [...] }
  } catch (error) {
    console.error("Error fetching quotes:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener las cotizaciones");
  }
};

const getQuoteById = async (quoteId) => {
  try {
    // Endpoint: GET /api/carts/quotes/{id}/
    const response = await apiClient.get(`/carts/quotes/${quoteId}/`);
    return response.data; // Objeto Quote con sus items anidados
  } catch (error) {
    console.error(`Error fetching quote ${quoteId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener el detalle de la cotización");
  }
};

const cancelQuote = async (quoteId) => {
  try {
    // Endpoint: POST /api/carts/quotes/{id}/cancel_quote/
    // No espera cuerpo de solicitud según tu schema.json
    const response = await apiClient.post(`/carts/quotes/${quoteId}/cancel_quote/`);
    return response.data; // Debería devolver la cotización actualizada con status 'cancelled'
  } catch (error) {
    console.error(`Error cancelling quote ${quoteId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al cancelar la cotización");
  }
};



export default {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  createQuoteFromCart,
  addOneProductToCart,
  getQuotes,
  getQuoteById,
  cancelQuote,
};