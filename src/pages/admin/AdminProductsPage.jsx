// src/pages/admin/AdminProductsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaEye, 
  FaBoxes, FaCheck, FaTimes, FaStar, FaRegStar, FaChevronLeft, 
  FaChevronRight, FaSyncAlt, FaExclamationTriangle, FaTruckLoading,
  FaWarehouse, FaCheckDouble, FaCopy
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import productService from '../../services/productService';
import ProductFormModal from '../../components/admin/ProductFormModal';
import ReceiveStockModal from '../../components/admin/ReceiveStockModal';
import QuickTransitModal from '../../components/admin/QuickTransitModal';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(value);
};

const AdminProductsPage = () => {
  // Datos de productos
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Búsqueda: searchInput es lo que escribe el usuario; appliedSearch es lo que se envía al presionar Enter
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const activeRequestRef = useRef(0);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in_stock', 'out_of_stock', 'incoming'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'physical', 'service', 'combo'
  const [ordering, setOrdering] = useState('-incoming_stock,-created_at');

  // Catálogos auxiliares para filtros
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Selección múltiple de productos
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modales de inventario y tránsito
  const [receiveModalProducts, setReceiveModalProducts] = useState(null); // array de productos
  const [quickTransitProduct, setQuickTransitProduct] = useState(null); // producto individual

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [catsRes, subcatsRes, brandsRes] = await Promise.all([
          productService.getCategories({ limit: 100 }).catch(() => []),
          productService.getSubcategories({ limit: 300 }).catch(() => []),
          productService.getBrands({ limit: 100 }).catch(() => []),
        ]);
        setCategories(catsRes?.results || catsRes || []);
        setSubcategories(subcatsRes?.results || subcatsRes || []);
        setBrands(brandsRes?.results || brandsRes || []);
      } catch (err) {
        console.error("Error al cargar filtros auxiliares:", err);
      }
    };
    loadFiltersData();
  }, []);

  // Cargar productos
  const fetchProducts = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        ordering: ordering,
      };

      if (appliedSearch) params.search = appliedSearch;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedSubcategory) params.subcategory = selectedSubcategory;
      if (selectedBrand) params.brand = selectedBrand;

      if (statusFilter === 'active') params.is_active = true;
      if (statusFilter === 'inactive') params.is_active = false;

      if (typeFilter === 'service') params.is_service = true;
      if (typeFilter === 'physical') params.is_service = false;
      if (typeFilter === 'combo') params.is_combo = true;

      const data = await productService.getProducts(params);
      
      // Si otra petición se inició después, descartar esta respuesta para evitar race conditions
      if (requestId !== activeRequestRef.current) return;

      let fetchedList = data.results || data || [];

      // Filtro local complementario para stock si el backend no lo filtra directamente
      if (stockFilter === 'in_stock') {
        fetchedList = fetchedList.filter(p => p.stock > 0);
      } else if (stockFilter === 'out_of_stock') {
        fetchedList = fetchedList.filter(p => p.stock === 0);
      } else if (stockFilter === 'incoming') {
        fetchedList = fetchedList.filter(p => p.incoming_stock > 0);
      }

      setProducts(fetchedList);
      setTotalCount(data.count ?? fetchedList.length);
    } catch (err) {
      if (requestId !== activeRequestRef.current) return;
      console.error("Error fetching admin products:", err);
      setError("No se pudieron cargar los productos. Intenta de nuevo.");
      toast.error("Error al cargar productos.");
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, ordering, appliedSearch, selectedCategory, selectedSubcategory, selectedBrand, statusFilter, stockFilter, typeFilter]);

  // Recargar cuando cambian los filtros
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Manejar el submit de la búsqueda (solo al presionar Enter o clic en botón Buscar)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setCurrentPage(1);
  };

  // Limpiar campo y filtro de búsqueda
  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  // Manejo de reset de filtros
  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrand('');
    setStatusFilter('all');
    setStockFilter('all');
    setTypeFilter('all');
    setOrdering('-incoming_stock,-created_at');
    setCurrentPage(1);
  };

  // Toggle directo de is_active
  const handleToggleActive = async (product) => {
    const updatedStatus = !product.is_active;
    try {
      await productService.updateProduct(product.id, { is_active: updatedStatus });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: updatedStatus } : p));
      toast.info(`Producto "${product.name}" ${updatedStatus ? 'activado' : 'desactivado'}.`);
    } catch (err) {
      toast.error("Error al cambiar estado del producto.");
    }
  };

  // Toggle directo de is_featured
  const handleToggleFeatured = async (product) => {
    const updatedFeatured = !product.is_featured;
    try {
      await productService.updateProduct(product.id, { is_featured: updatedFeatured });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: updatedFeatured } : p));
      toast.info(`Producto "${product.name}" ${updatedFeatured ? 'marcado como destacado' : 'desmarcado de destacados'}.`);
    } catch (err) {
      toast.error("Error al actualizar estado destacado.");
    }
  };

  // Selección de filas
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectRow = (productId) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const isAllSelected = products.length > 0 && selectedProductIds.length === products.length;
  const selectedWithTransit = products.filter(p => selectedProductIds.includes(p.id) && p.incoming_stock > 0);

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Copiar/Duplicar producto existente para crear uno nuevo (sin fotos ni inventario)
  const handleDuplicateProduct = async (product) => {
    try {
      toast.info(`Copiando datos de "${product.name}"...`, { autoClose: 1200 });
      const fullProduct = await productService.getProductById(product.id);
      const clonedProduct = {
        ...fullProduct,
        id: null,
        name: `${fullProduct.name} (Copia)`,
        stock: 0,
        incoming_stock: 0,
        images: [],
        is_cloned: true,
        cloned_from_name: fullProduct.name,
      };
      setEditingProduct(clonedProduct);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error al obtener detalle para duplicar:", err);
      const clonedProduct = {
        ...product,
        id: null,
        name: `${product.name} (Copia)`,
        stock: 0,
        incoming_stock: 0,
        images: [],
        is_cloned: true,
        cloned_from_name: product.name,
      };
      setEditingProduct(clonedProduct);
      setIsModalOpen(true);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(deletingProduct.id);
      toast.success(`Producto "${deletingProduct.name}" eliminado correctamente.`);
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
      setTotalCount(prev => Math.max(0, prev - 1));
      setDeletingProduct(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("No se pudo eliminar el producto. Verifica que no tenga cotizaciones o movimientos asociados.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Guardado exitoso desde el modal
  const handleSaveSuccess = (savedProduct) => {
    fetchProducts();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Acciones Principales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-color-primary text-white rounded-lg">
              <FaBoxes size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Catálogo y Productos</h1>
              <p className="text-sm text-gray-500">
                Crea, edita y administra los productos, precios, fotos e inventario de la tienda
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-2.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="Recargar catálogo"
          >
            <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/products"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm flex items-center shadow-sm transition-colors"
          >
            <FaEye className="mr-2" /> Ver Tienda
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-color-accent1 hover:bg-opacity-90 text-white font-bold rounded-lg shadow-md transition-all text-sm flex items-center"
          >
            <FaPlus className="mr-2" /> + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Buscador de texto: solo busca al presionar Enter o dar clic en Buscar */}
          <form onSubmit={handleSearchSubmit} className="relative md:col-span-2">
            <div className="relative flex items-center">
              <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre, marca... (Presiona Enter)"
                className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-color-secondary focus:border-transparent text-gray-900"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-16 top-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <FaTimes size={13} />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-color-secondary hover:bg-color-primary text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                title="Presiona Enter o haz clic para buscar"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Categoría */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => { 
                setSelectedCategory(e.target.value); 
                setSelectedSubcategory(''); 
                setCurrentPage(1); 
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
            >
              <option value="">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Subcategoría */}
          <div>
            <select
              value={selectedSubcategory}
              onChange={(e) => { setSelectedSubcategory(e.target.value); setCurrentPage(1); }}
              disabled={!selectedCategory}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Todas las Subcategorías</option>
              {subcategories
                .filter(sub => {
                  if (!selectedCategory) return true;
                  const catId = typeof sub.category === 'object' ? sub.category?.id : sub.category_id || sub.category;
                  return String(catId) === String(selectedCategory);
                })
                .map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Filtros secundarios */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-gray-100 text-xs">
          {/* Marca */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Marca</label>
            <select
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-900"
            >
              <option value="">Todas las Marcas</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Estado Activo */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-900"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Inventario</label>
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-900"
            >
              <option value="all">Todo el Inventario</option>
              <option value="in_stock">Con Stock (&gt;0)</option>
              <option value="out_of_stock">Agotados (0)</option>
              <option value="incoming">Con Tránsito</option>
            </select>
          </div>

          {/* Tipo de Producto */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-900"
            >
              <option value="all">Cualquier Tipo</option>
              <option value="physical">Productos Físicos</option>
              <option value="service">Servicios</option>
              <option value="combo">Combos / Kits</option>
            </select>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Ordenar por</label>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-900"
            >
              <option value="-incoming_stock,-created_at">Tránsito (Mayor) y Recientes</option>
              <option value="-created_at">Más Recientes</option>
              <option value="name">Nombre A-Z</option>
              <option value="-sale_price">Mayor Precio</option>
              <option value="sale_price">Menor Precio</option>
              <option value="-stock">Mayor Stock Físico</option>
              <option value="stock">Menor Stock Físico</option>
            </select>
          </div>
        </div>

        {/* Resumen de resultados y botón limpiar */}
        <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-gray-500 gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <span>
              Mostrando <strong>{products.length}</strong> de <strong>{totalCount}</strong> productos registrados
            </span>
            {appliedSearch && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Filtro: "{appliedSearch}"
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  className="ml-1.5 text-blue-600 hover:text-blue-900 focus:outline-none"
                  title="Eliminar filtro de búsqueda"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={handleResetFilters}
            className="text-color-secondary hover:underline font-medium"
          >
            Limpiar todos los filtros
          </button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <FaSyncAlt className="mx-auto text-color-secondary animate-spin mb-3" size={32} />
            <p className="text-gray-600 font-semibold text-sm">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            <FaExclamationTriangle className="mx-auto mb-3" size={32} />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <FaBoxes className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-bold text-gray-700">No se encontraron productos</h3>
            <p className="text-sm text-gray-500 mt-1">
              Prueba cambiando los filtros o añade un nuevo producto al catálogo.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-color-accent1 text-white font-semibold rounded-lg text-sm"
            >
              + Crear Primer Producto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                      title="Seleccionar todos"
                    />
                  </th>
                  <th className="px-4 py-3 text-center w-16">Foto</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Precio Venta</th>
                  <th className="px-4 py-3 text-right">Precio Compra</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Destacado</th>
                  <th className="px-4 py-3 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-normal">
                {products.map((product) => {
                  const firstImage = product.images?.[0]?.image;
                  const hasDiscount = parseFloat(product.discount) > 0;
                  const finalPrice = product.final_sale_price || product.sale_price;
                  const purchasePrice = parseFloat(product.purchase_price) || 0;
                  const profitMargin = purchasePrice > 0 ? ((finalPrice - purchasePrice) / purchasePrice) * 100 : 0;
                  const isRowSelected = selectedProductIds.includes(product.id);

                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isRowSelected ? 'bg-emerald-50/40' : ''}`}>
                      {/* Checkbox de fila */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleSelectRow(product.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Imagen con hover preview */}
                      <td className="px-4 py-3 text-center">
                        {firstImage ? (
                          <div className="relative inline-block group">
                            <img
                              src={firstImage}
                              alt={product.name}
                              className="w-11 h-11 object-cover rounded-lg border border-gray-200 shadow-sm transition-transform duration-200 group-hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mx-auto border border-gray-200">
                            <FaBoxes size={18} />
                          </div>
                        )}
                      </td>

                      {/* Nombre y metadatos */}
                      <td className="px-4 py-3 max-w-xs sm:max-w-md">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 hover:text-color-secondary cursor-pointer" onClick={() => handleOpenEditModal(product)}>
                            {product.name}
                          </span>
                          {product.is_combo && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Combo
                            </span>
                          )}
                          {product.is_service && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Servicio
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-2">
                          {product.brand?.name && (
                            <span className="font-semibold text-gray-700">{product.brand.name}</span>
                          )}
                          {product.category?.name && (
                            <span>• {product.category.name}</span>
                          )}
                          {product.subcategory?.name && (
                            <span>/ {product.subcategory.name}</span>
                          )}
                        </div>

                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {product.tags.slice(0, 3).map(tag => (
                              <span key={tag.id} className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[10px]">
                                #{tag.name}
                              </span>
                            ))}
                            {product.tags.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{product.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Precio Venta y Descuento */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-gray-900 font-mono">
                          {formatCurrency(finalPrice)}
                        </div>
                        {hasDiscount && (
                          <div className="text-xs text-gray-400 line-through font-mono">
                            {formatCurrency(product.sale_price || product.original_sale_price)}
                            <span className="ml-1 text-[10px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">
                              -{parseFloat(product.discount)}%
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Precio Compra y Margen */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-xs font-mono text-gray-700">
                          {purchasePrice > 0 ? formatCurrency(purchasePrice) : '-'}
                        </div>
                        {purchasePrice > 0 && (
                          <span className={`text-[10px] font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {profitMargin.toFixed(0)}% mg
                          </span>
                        )}
                      </td>

                      {/* Stock físico y en tránsito con acciones rápidas */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center space-y-1.5">
                          {/* Stock físico en bodega */}
                          <div className="flex items-center space-x-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              product.stock > 5 
                                ? 'bg-green-100 text-green-800' 
                                : product.stock > 0 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {product.stock} un.
                            </span>
                          </div>

                          {/* Tránsito + Botón rápido para sumar o editar */}
                          <div className="flex items-center space-x-1">
                            {product.incoming_stock > 0 ? (
                              <button
                                type="button"
                                onClick={() => setQuickTransitProduct(product)}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                title="Hacer clic para editar o sumar más stock en tránsito"
                              >
                                <FaTruckLoading className="mr-1" /> +{product.incoming_stock} trans.
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setQuickTransitProduct(product)}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-gray-400 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-gray-300 hover:border-blue-300 transition-colors"
                                title="Añadir stock en tránsito con 1 clic"
                              >
                                <FaPlus className="mr-1 text-[8px]" /> Tránsito
                              </button>
                            )}
                          </div>

                          {/* Botón directo Recibir Stock cuando hay tránsito */}
                          {product.incoming_stock > 0 && (
                            <button
                              type="button"
                              onClick={() => setReceiveModalProducts([product])}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center space-x-1"
                              title={`Recibir las ${product.incoming_stock} unidades pendientes en bodega`}
                            >
                              <FaWarehouse className="text-[10px]" />
                              <span>Recibir</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Toggle Activo */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          className={`p-1.5 rounded-full transition-colors ${
                            product.is_active 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={product.is_active ? 'Producto Activo (Haz clic para desactivar)' : 'Producto Inactivo (Haz clic para activar)'}
                        >
                          {product.is_active ? <FaCheck size={12} /> : <FaTimes size={12} />}
                        </button>
                      </td>

                      {/* Toggle Destacado */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(product)}
                          className={`p-1.5 rounded-full transition-colors ${
                            product.is_featured 
                              ? 'text-amber-500 hover:text-amber-600' 
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                          title={product.is_featured ? 'Destacado en Home' : 'No destacado'}
                        >
                          {product.is_featured ? <FaStar size={16} /> : <FaRegStar size={16} />}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Editar ficha del producto"
                          >
                            <FaEdit size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(product)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Duplicar / Copiar datos para nuevo producto (sin fotos)"
                          >
                            <FaCopy size={15} />
                          </button>

                          <Link
                            to={`/products/${product.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                            title="Ver en la tienda"
                          >
                            <FaEye size={16} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar producto"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FaChevronLeft className="mr-1" /> Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoading}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Siguiente <FaChevronRight className="ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra flotante de acciones para productos seleccionados */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center space-x-4 animate-slideUp">
          <span className="text-xs sm:text-sm font-medium">
            <strong>{selectedProductIds.length}</strong> {selectedProductIds.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
            {selectedWithTransit.length > 0 && (
              <span className="text-emerald-400 font-semibold ml-1">
                ({selectedWithTransit.length} con stock en tránsito)
              </span>
            )}
          </span>

          {selectedWithTransit.length > 0 && (
            <button
              type="button"
              onClick={() => setReceiveModalProducts(selectedWithTransit)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center space-x-1.5 transition-all"
            >
              <FaWarehouse size={13} />
              <span>Recibir Tránsito de Seleccionados ({selectedWithTransit.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedProductIds([])}
            className="text-gray-400 hover:text-white text-xs underline"
          >
            Desmarcar
          </button>
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Modal de Recepción de Stock en Bodega (Individual o Masivo) */}
      <ReceiveStockModal
        isOpen={Boolean(receiveModalProducts)}
        onClose={() => setReceiveModalProducts(null)}
        products={receiveModalProducts || []}
        onSuccess={() => {
          setSelectedProductIds([]);
          fetchProducts();
        }}
      />

      {/* Modal Rápido de Stock en Tránsito */}
      <QuickTransitModal
        isOpen={Boolean(quickTransitProduct)}
        onClose={() => setQuickTransitProduct(null)}
        product={quickTransitProduct}
        onSuccess={fetchProducts}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center animate-fadeIn">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Eliminar producto?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Estás a punto de eliminar <strong>"{deletingProduct.name}"</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm disabled:opacity-50 flex items-center"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProductsPage;

