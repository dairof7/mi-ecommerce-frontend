// src/services/siteSettingsService.js
import apiClient from './api';

const getBanners = async (params = {}) => {
  try {
    const response = await apiClient.get('/marketing/banners/', { params }); // Asume que tu URL es /api/marketing/banners/
    return response.data?.results || response.data || []; // Maneja paginación o respuesta directa
  } catch (error) {
    console.error("Error fetching banners:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener banners");
  }
};

export default {
  getBanners,
};