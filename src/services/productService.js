// src/services/productService.js
import apiClient from './api';

const getProducts = async (params = {}) => {
  // params puede ser: { page: 1, category: 2, subcategory: 5, tags_name: ['Oferta'], search: 'proyector', ordering: '-sale_price' }
  try {
    const response = await apiClient.get('/products/', { params }); // apiClient ya tiene la base /api/
    return response.data; // Debería ser { count, next, previous, results: [...] }
  } catch (error) {
    console.error("Error fetching products:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener productos");
  }
};

const getProductById = async (productId) => {
  try {
    const response = await apiClient.get(`/products/${productId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener el detalle del producto");
  }
};

const getCategories = async (params = {}) => {
  try {
    // Asume que el endpoint de categorías puede no estar paginado o que quieres todas
    // Si está paginado y quieres todas, necesitarías manejar la paginación aquí
    const response = await apiClient.get('/products/categories/', { params });
    return response.data.results || response.data; // Ajusta según si está paginado o no
  } catch (error) {
    console.error("Error fetching categories:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener categorías");
  }
};

const getSubcategories = async (params = {}) => { // ej: params = { category: 1 }
  try {
    const response = await apiClient.get('/products/subcategories/', { params });
    return response.data.results || response.data;
  } catch (error) {
    console.error("Error fetching subcategories:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener subcategorías");
  }
};

const getTags = async (params = {}) => {
  try {
    const response = await apiClient.get('/products/tags/', { params });
    return response.data.results || response.data; // Ajusta si está paginado
  } catch (error) {
    console.error("Error fetching tags:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener etiquetas");
  }
};

const getRelevantTags = async (productFilters = {}) => {
  // productFilters sería { category: 1, search: 'proyector', etc. }
  // NO debería incluir 'tags' o 'tags_name' que ya estén seleccionados
  // si quieres mostrar los tags disponibles para *refinar más* la búsqueda.

  try {
    const response = await apiClient.get('/products/relevant-tags/', { params: productFilters });

    return response.data; // Debería ser un array de { id, name, product_count }
  } catch (error) {
    console.error("Error fetching relevant tags:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener etiquetas relevantes");
  }
};

// Endpoints para productos destacados y más vendidos
const getFeaturedProducts = async (params = {}) => {
  try {
    const response = await apiClient.get('/products/featured/', { params });
    return response.data; // Asume que no está paginado por defecto o paginación manejada por params
  } catch (error) {
    console.error("Error fetching featured products:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener productos destacados");
  }
};

const getBestsellerProducts = async (params = {}) => { // Placeholder
  try {
    const response = await apiClient.get('/products/bestsellers/', { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching bestseller products:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener los más vendidos");
  }
};

const getNewProducts = async (params = {}) => { // Placeholder
  try {
    const response = await apiClient.get('/products/new-arrivals/', { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching new-arrivals products:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener los products mas nuevos");
  }
};

export default {
  getProducts,
  getProductById,
  getCategories,
  getSubcategories,
  getRelevantTags,
  getTags,
  getFeaturedProducts,
  getBestsellerProducts,
  getNewProducts,
};