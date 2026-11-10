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

const getRelevantBrands = async (productFilters = {}) => {
  try {
    const response = await apiClient.get('/products/relevant-brands/', { params: productFilters });
    return response.data;
  } catch (error) {
    console.error("Error fetching relevant brands:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener marcas relevantes");
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

// --- MÉTODOS ADMINISTRATIVOS ---

const createProduct = async (productData) => {
  try {
    const response = await apiClient.post('/products/', productData);
    return response.data;
  } catch (error) {
    console.error("Error creating product:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear producto");
  }
};

const updateProduct = async (productId, productData) => {
  try {
    const response = await apiClient.patch(`/products/${productId}/`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al actualizar producto");
  }
};

const deleteProduct = async (productId) => {
  try {
    const response = await apiClient.delete(`/products/${productId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al eliminar producto");
  }
};

const uploadProductImage = async (productId, file, altText = '') => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('product_id', productId);
    if (altText) {
      formData.append('alt_text', altText);
    }
    const response = await apiClient.post('/products/product-images/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading product image:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al subir imagen");
  }
};

const deleteProductImage = async (imageId) => {
  try {
    const response = await apiClient.delete(`/products/product-images/${imageId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting product image ${imageId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al eliminar imagen");
  }
};

const getBrands = async (params = {}) => {
  try {
    const response = await apiClient.get('/products/brands/', { params });
    return response.data.results || response.data;
  } catch (error) {
    console.error("Error fetching brands:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener marcas");
  }
};

const createBrand = async (brandData) => {
  try {
    const response = await apiClient.post('/products/brands/', brandData);
    return response.data;
  } catch (error) {
    console.error("Error creating brand:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear marca");
  }
};

const getSuppliers = async (params = {}) => {
  try {
    const response = await apiClient.get('/products/suppliers/', { params });
    return response.data.results || response.data;
  } catch (error) {
    console.error("Error fetching suppliers:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener proveedores");
  }
};

const createSupplier = async (supplierData) => {
  try {
    const response = await apiClient.post('/products/suppliers/', supplierData);
    return response.data;
  } catch (error) {
    console.error("Error creating supplier:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear proveedor");
  }
};

const createTag = async (tagData) => {
  try {
    const response = await apiClient.post('/products/tags/', tagData);
    return response.data;
  } catch (error) {
    console.error("Error creating tag:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear etiqueta");
  }
};

const receiveStock = async (productId, data = {}) => {
  try {
    const response = await apiClient.post(`/products/${productId}/receive-stock/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error receiving stock for product ${productId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al recibir stock en bodega");
  }
};

const receiveMultipleStock = async (items = []) => {
  try {
    const response = await apiClient.post('/products/receive-multiple-stock/', { items });
    return response.data;
  } catch (error) {
    console.error("Error receiving multiple stock:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al recibir stock múltiple");
  }
};

export default {
  getProducts,
  getProductById,
  getCategories,
  getSubcategories,
  getRelevantTags,
  getRelevantBrands,
  getTags,
  getFeaturedProducts,
  getBestsellerProducts,
  getNewProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  getBrands,
  createBrand,
  getSuppliers,
  createSupplier,
  createTag,
  receiveStock,
  receiveMultipleStock,
};