// src/components/admin/ProductFormModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaTimes, FaSave, FaTrash, FaUpload, FaPlus, FaCheck, 
  FaInfoCircle, FaDollarSign, FaBoxes, FaTags, FaImage, FaExternalLinkAlt,
  FaCopy, FaSearch
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import productService from '../../services/productService';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(value);
};

const ProductFormModal = ({ isOpen, onClose, product = null, onSaveSuccess, initialTab = null }) => {
  const isEditing = Boolean(product && product.id);

  // Pestaña activa: por defecto 'pricing' si estamos editando, 'general' si es nuevo producto
  const [activeTab, setActiveTab] = useState(initialTab || (isEditing ? 'pricing' : 'general'));

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    brand_id: '',
    supplier_id: '',
    tag_ids: [],
    purchase_price: '',
    sale_price: '',
    discount: '0',
    stock: '0',
    incoming_stock: '0',
    is_active: true,
    is_featured: false,
    is_service: false,
    is_combo: false,
  });

  // Listas de datos para selects
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [tags, setTags] = useState([]);

  // Estados de imágenes
  const [productImages, setProductImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estados de carga y modales rápidos
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Creación rápida inline
  const [quickNewBrand, setQuickNewBrand] = useState('');
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [quickNewSupplier, setQuickNewSupplier] = useState('');
  const [showNewSupplierInput, setShowNewSupplierInput] = useState(false);
  const [quickNewTag, setQuickNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  // Búsqueda y copia desde producto existente (al crear)
  const [searchCopyTerm, setSearchCopyTerm] = useState('');
  const [copySearchResults, setCopySearchResults] = useState([]);
  const [isSearchingCopy, setIsSearchingCopy] = useState(false);
  const [isLoadingCopy, setIsLoadingCopy] = useState(false);

  // Cargar catálogos auxiliares (Categorías, Marcas, Proveedores, Tags)
  useEffect(() => {
    if (!isOpen) return;

    const loadAuxData = async () => {
      setIsLoadingData(true);
      try {
        const [catsRes, subcatsRes, brandsRes, suppsRes, tagsRes] = await Promise.all([
          productService.getCategories({ limit: 100 }).catch(() => []),
          productService.getSubcategories({ limit: 300 }).catch(() => []),
          productService.getBrands({ limit: 100 }).catch(() => []),
          productService.getSuppliers({ limit: 100 }).catch(() => []),
          productService.getTags({ limit: 100 }).catch(() => []),
        ]);

        setCategories(catsRes?.results || catsRes || []);
        setSubcategories(subcatsRes?.results || subcatsRes || []);
        setBrands(brandsRes?.results || brandsRes || []);
        setSuppliers(suppsRes?.results || suppsRes || []);
        setTags(tagsRes?.results || tagsRes || []);
      } catch (err) {
        console.error("Error al cargar datos auxiliares:", err);
        toast.error("Error al cargar categorías y catálogos.");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAuxData();
  }, [isOpen]);

  // Rellenar formulario cuando cambia el producto o se abre
  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category_id: product.category?.id || product.category_id || '',
        subcategory_id: product.subcategory?.id || product.subcategory_id || '',
        brand_id: product.brand?.id || product.brand_id || '',
        supplier_id: product.supplier?.id || product.supplier_id || '',
        tag_ids: product.tags ? product.tags.map(t => t.id) : (product.tag_ids || []),
        purchase_price: product.purchase_price !== null && product.purchase_price !== undefined ? String(product.purchase_price) : '',
        sale_price: product.sale_price !== null && product.sale_price !== undefined ? String(product.sale_price) : (product.original_sale_price || ''),
        discount: product.discount !== null && product.discount !== undefined ? String(product.discount) : '0',
        stock: product.stock !== null && product.stock !== undefined ? String(product.stock) : '0',
        incoming_stock: product.incoming_stock !== null && product.incoming_stock !== undefined ? String(product.incoming_stock) : '0',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        is_service: product.is_service ?? false,
        is_combo: product.is_combo ?? false,
      });
      setProductImages(product.images || []);
    } else {
      // Formulario vacío para nuevo producto
      setFormData({
        name: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        brand_id: '',
        supplier_id: '',
        tag_ids: [],
        purchase_price: '',
        sale_price: '',
        discount: '0',
        stock: '0',
        incoming_stock: '0',
        is_active: true,
        is_featured: false,
        is_service: false,
        is_combo: false,
      });
      setProductImages([]);
    }
    setActiveTab(initialTab || (product?.id ? 'pricing' : 'general'));
  }, [product, isOpen, initialTab]);

  // Limpiar buscador de copia al cerrar el modal
  useEffect(() => {
    if (!isOpen) {
      setSearchCopyTerm('');
      setCopySearchResults([]);
    }
  }, [isOpen]);

  // Búsqueda con debounce para copiar datos de producto existente
  useEffect(() => {
    if (!searchCopyTerm.trim() || isEditing) {
      setCopySearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCopy(true);
      try {
        const res = await productService.getProducts({ search: searchCopyTerm.trim(), limit: 6 });
        setCopySearchResults(res?.results || res || []);
      } catch (err) {
        console.error("Error searching products to copy:", err);
      } finally {
        setIsSearchingCopy(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchCopyTerm, isEditing]);

  // Manejar copia de datos desde producto seleccionado
  const handleSelectProductToCopy = async (sourceId) => {
    try {
      setIsLoadingCopy(true);
      const fullProd = await productService.getProductById(sourceId);
      
      setFormData(prev => ({
        ...prev,
        name: `${fullProd.name} (Copia)`,
        description: fullProd.description || '',
        category_id: fullProd.category?.id || fullProd.category_id || '',
        subcategory_id: fullProd.subcategory?.id || fullProd.subcategory_id || '',
        brand_id: fullProd.brand?.id || fullProd.brand_id || '',
        supplier_id: fullProd.supplier?.id || fullProd.supplier_id || '',
        tag_ids: fullProd.tags ? fullProd.tags.map(t => t.id) : (fullProd.tag_ids || []),
        purchase_price: fullProd.purchase_price !== null && fullProd.purchase_price !== undefined ? String(fullProd.purchase_price) : '',
        sale_price: fullProd.sale_price !== null && fullProd.sale_price !== undefined ? String(fullProd.sale_price) : (fullProd.original_sale_price || ''),
        discount: fullProd.discount !== null && fullProd.discount !== undefined ? String(fullProd.discount) : '0',
        stock: '0',
        incoming_stock: '0',
        is_active: true,
        is_featured: false,
        is_service: fullProd.is_service ?? false,
        is_combo: fullProd.is_combo ?? false,
      }));
      // Por requerimiento estricto: NO se copian las fotos
      setProductImages([]);
      setSearchCopyTerm('');
      setCopySearchResults([]);
      toast.success(`Datos copiados de "${fullProd.name}" (sin fotos).`);
    } catch (err) {
      console.error("Error al copiar datos del producto:", err);
      toast.error("Error al obtener los datos del producto seleccionado.");
    } finally {
      setIsLoadingCopy(false);
    }
  };

  // Subcategorías filtradas por la categoría seleccionada
  const filteredSubcategories = subcategories.filter(sub => {
    if (!formData.category_id) return true;
    const catId = typeof sub.category === 'object' ? sub.category?.id : sub.category_id || sub.category;
    return String(catId) === String(formData.category_id);
  });

  // Manejador general de inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Si cambia de categoría y la subcategoría actual no pertenece, limpiarla
    if (name === 'category_id') {
      setFormData(prev => ({ ...prev, category_id: value, subcategory_id: '' }));
    }
  };

  // Toggle de tags
  const handleTagToggle = (tagId) => {
    setFormData(prev => {
      const exists = prev.tag_ids.includes(tagId);
      return {
        ...prev,
        tag_ids: exists 
          ? prev.tag_ids.filter(id => id !== tagId)
          : [...prev.tag_ids, tagId]
      };
    });
  };

  // Cálculos en tiempo real
  const numSalePrice = parseFloat(formData.sale_price) || 0;
  const numDiscount = parseFloat(formData.discount) || 0;
  const numPurchasePrice = parseFloat(formData.purchase_price) || 0;
  const calculatedFinalPrice = numDiscount > 0 ? numSalePrice * (1 - numDiscount / 100) : numSalePrice;
  const calculatedNetProfit = calculatedFinalPrice - numPurchasePrice;
  const calculatedProfitMargin = numPurchasePrice > 0 ? (calculatedNetProfit / numPurchasePrice) * 100 : 0;

  // Crear marca rápida
  const handleCreateQuickBrand = async () => {
    if (!quickNewBrand.trim()) return;
    try {
      const created = await productService.createBrand({ name: quickNewBrand.trim() });
      setBrands(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, brand_id: created.id }));
      setQuickNewBrand('');
      setShowNewBrandInput(false);
      toast.success(`Marca "${created.name}" creada.`);
    } catch (err) {
      toast.error("Error al crear la marca.");
    }
  };

  // Crear proveedor rápido
  const handleCreateQuickSupplier = async () => {
    if (!quickNewSupplier.trim()) return;
    try {
      const created = await productService.createSupplier({ name: quickNewSupplier.trim() });
      setSuppliers(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, supplier_id: created.id }));
      setQuickNewSupplier('');
      setShowNewSupplierInput(false);
      toast.success(`Proveedor "${created.name}" creado.`);
    } catch (err) {
      toast.error("Error al crear el proveedor.");
    }
  };

  // Crear etiqueta rápida
  const handleCreateQuickTag = async () => {
    if (!quickNewTag.trim()) return;
    try {
      const created = await productService.createTag({ name: quickNewTag.trim() });
      setTags(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, tag_ids: [...prev.tag_ids, created.id] }));
      setQuickNewTag('');
      setShowNewTagInput(false);
      toast.success(`Etiqueta "${created.name}" creada.`);
    } catch (err) {
      toast.error("Error al crear la etiqueta.");
    }
  };

  // Subir imagen para el producto
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isEditing) {
      toast.info("Guarda primero el producto para asociarle fotos en su galería.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploaded = await productService.uploadProductImage(product.id, file);
      setProductImages(prev => [...prev, uploaded]);
      toast.success("Imagen subida con éxito.");
    } catch (err) {
      toast.error("Error al subir imagen.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Eliminar imagen
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta imagen?")) return;
    try {
      await productService.deleteProductImage(imageId);
      setProductImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("Imagen eliminada.");
    } catch (err) {
      toast.error("Error al eliminar la imagen.");
    }
  };

  // Guardar producto
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre del producto es obligatorio.");
      setActiveTab('general');
      return;
    }
    if (!formData.category_id) {
      toast.error("Debes seleccionar una categoría.");
      setActiveTab('general');
      return;
    }
    if (!formData.subcategory_id) {
      toast.error("Debes seleccionar una subcategoría.");
      setActiveTab('general');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        category_id: Number(formData.category_id),
        subcategory_id: Number(formData.subcategory_id),
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        tag_ids: formData.tag_ids,
        purchase_price: formData.purchase_price !== '' ? parseFloat(formData.purchase_price) : null,
        sale_price: formData.sale_price !== '' ? parseFloat(formData.sale_price) : 0,
        discount: formData.discount !== '' ? parseFloat(formData.discount) : 0,
        stock: parseInt(formData.stock, 10) || 0,
        incoming_stock: parseInt(formData.incoming_stock, 10) || 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_service: formData.is_service,
        is_combo: formData.is_combo,
      };

      let result;
      if (isEditing) {
        result = await productService.updateProduct(product.id, payload);
        toast.success(`Producto "${result.name}" actualizado.`);
      } else {
        result = await productService.createProduct(payload);
        toast.success(`Producto "${result.name}" creado con éxito.`);
      }

      onSaveSuccess(result);
      onClose();
    } catch (err) {
      console.error("Error saving product:", err);
      const msg = typeof err === 'object' ? Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(' | ') : err.message;
      toast.error(`Error al guardar: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header del modal */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-color-accent1 rounded-lg text-white">
              <FaBoxes size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isEditing 
                  ? `Editar: ${product?.name}` 
                  : (product?.is_cloned ? `Crear Producto (Copia de: ${product?.cloned_from_name})` : 'Crear Nuevo Producto')}
              </h2>
              <p className="text-xs text-gray-400">
                {isEditing 
                  ? `ID: #${product?.id} | Completa o actualiza la ficha del producto` 
                  : (product?.is_cloned 
                      ? 'Se copiaron categorías, precios y datos (sin fotos ni inventario). Revisa y guarda para crear el nuevo producto.'
                      : 'Ingresa la información detallada para publicar o gestionar el producto')}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            aria-label="Cerrar modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Barra de pestañas */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center whitespace-nowrap transition-colors ${
              activeTab === 'general' 
                ? 'border-color-accent1 text-color-accent1 bg-white' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaInfoCircle className="mr-2" /> Datos Generales
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center whitespace-nowrap transition-colors ${
              activeTab === 'pricing' 
                ? 'border-color-accent1 text-color-accent1 bg-white' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaDollarSign className="mr-2" /> Precios e Inventario
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('options')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center whitespace-nowrap transition-colors ${
              activeTab === 'options' 
                ? 'border-color-accent1 text-color-accent1 bg-white' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaTags className="mr-2" /> Opciones y Estados
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center whitespace-nowrap transition-colors ${
              activeTab === 'images' 
                ? 'border-color-accent1 text-color-accent1 bg-white' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaImage className="mr-2" /> Galería de Fotos ({productImages.length})
          </button>
        </div>

        {/* Contenido scrolleable del formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Barra para copiar datos de un producto existente (Solo al crear un nuevo producto) */}
          {!isEditing && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-2.5 text-emerald-900">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 flex-shrink-0">
                    <FaCopy size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold">¿Deseas basarte en un producto existente?</h4>
                    <p className="text-[11px] text-emerald-700">
                      Copia categoría, marca, proveedor, precios y descripción (a excepción de fotos e inventario).
                    </p>
                  </div>
                </div>

                <div className="relative w-full sm:w-72 md:w-80">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchCopyTerm}
                      onChange={(e) => setSearchCopyTerm(e.target.value)}
                      placeholder="Buscar producto a copiar..."
                      disabled={isLoadingCopy}
                      className="w-full text-xs pl-8 pr-7 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 placeholder-gray-400 shadow-sm"
                    />
                    <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs" />
                    {isSearchingCopy && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {searchCopyTerm && !isSearchingCopy && (
                      <button
                        type="button"
                        onClick={() => { setSearchCopyTerm(''); setCopySearchResults([]); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>

                  {/* Resultados desplegables */}
                  {copySearchResults.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {copySearchResults.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectProductToCopy(item.id)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 flex items-center justify-between group transition-colors"
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold text-gray-800 group-hover:text-emerald-700 truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {item.category?.name || 'Sin categoría'} | {formatCurrency(item.sale_price)}
                            </div>
                          </div>
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded flex items-center space-x-1 flex-shrink-0 group-hover:bg-emerald-200">
                            <FaCopy size={10} />
                            <span>Copiar</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* TAB 1: DATOS GENERALES */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Nombre del Producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Portátil Dell Latitude 5420 i7 16GB"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary focus:border-transparent text-gray-900"
                  required
                />
              </div>

              {/* Categoría y Subcategoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary bg-white text-gray-900"
                    required
                  >
                    <option value="">-- Seleccionar Categoría --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Subcategoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subcategory_id"
                    value={formData.subcategory_id}
                    onChange={handleChange}
                    disabled={!formData.category_id}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">
                      {formData.category_id ? '-- Seleccionar Subcategoría --' : 'Primero selecciona una categoría'}
                    </option>
                    {filteredSubcategories.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Marca y Proveedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Marca con creación rápida */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-800">Marca</label>
                    <button
                      type="button"
                      onClick={() => setShowNewBrandInput(!showNewBrandInput)}
                      className="text-xs text-color-secondary hover:underline flex items-center font-medium"
                    >
                      <FaPlus className="mr-1 text-[10px]" /> {showNewBrandInput ? 'Cancelar' : '+ Nueva Marca'}
                    </button>
                  </div>

                  {showNewBrandInput ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={quickNewBrand}
                        onChange={(e) => setQuickNewBrand(e.target.value)}
                        placeholder="Nombre de la nueva marca"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleCreateQuickBrand}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                      >
                        Crear
                      </button>
                    </div>
                  ) : (
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary bg-white text-gray-900"
                    >
                      <option value="">-- Sin Marca / Genérico --</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Proveedor con creación rápida */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-800">Proveedor</label>
                    <button
                      type="button"
                      onClick={() => setShowNewSupplierInput(!showNewSupplierInput)}
                      className="text-xs text-color-secondary hover:underline flex items-center font-medium"
                    >
                      <FaPlus className="mr-1 text-[10px]" /> {showNewSupplierInput ? 'Cancelar' : '+ Nuevo Proveedor'}
                    </button>
                  </div>

                  {showNewSupplierInput ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={quickNewSupplier}
                        onChange={(e) => setQuickNewSupplier(e.target.value)}
                        placeholder="Nombre del nuevo proveedor"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleCreateQuickSupplier}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                      >
                        Crear
                      </button>
                    </div>
                  ) : (
                    <select
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary bg-white text-gray-900"
                    >
                      <option value="">-- Sin Proveedor Asignado --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Etiquetas / Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Etiquetas / Tags ({formData.tag_ids.length} seleccionadas)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewTagInput(!showNewTagInput)}
                    className="text-xs text-color-secondary hover:underline flex items-center font-medium"
                  >
                    <FaPlus className="mr-1 text-[10px]" /> {showNewTagInput ? 'Cancelar' : '+ Nueva Etiqueta'}
                  </button>
                </div>

                {showNewTagInput && (
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={quickNewTag}
                      onChange={(e) => setQuickNewTag(e.target.value)}
                      placeholder="Nombre de la nueva etiqueta"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleCreateQuickTag}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                    >
                      Crear
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-36 overflow-y-auto">
                  {tags.length === 0 ? (
                    <p className="text-xs text-gray-500">No hay etiquetas registradas.</p>
                  ) : (
                    tags.map(t => {
                      const isSelected = formData.tag_ids.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTagToggle(t.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                            isSelected 
                              ? 'bg-color-accent1 text-white shadow-sm' 
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {isSelected && <FaCheck className="text-[10px]" />}
                          <span>{t.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Descripción del Producto
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Características técnicas, estado, especificaciones, garantía..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRECIOS E INVENTARIO */}
          {activeTab === 'pricing' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Tarjeta de métricas proyectadas en vivo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Final al Cliente</span>
                  <p className="text-xl font-bold text-color-primary mt-1">
                    {formatCurrency(calculatedFinalPrice)}
                  </p>
                  {numDiscount > 0 && (
                    <p className="text-[11px] text-green-600 font-medium">
                      -{numDiscount}% descuento aplicado
                    </p>
                  )}
                </div>

                <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ganancia Neta Unitaria</span>
                  <p className={`text-xl font-bold mt-1 ${calculatedNetProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(calculatedNetProfit)}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    (Precio Final - Precio Compra)
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Margen sobre Costo</span>
                  <p className={`text-xl font-bold mt-1 ${calculatedProfitMargin >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                    {calculatedProfitMargin.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Rentabilidad unitaria
                  </p>
                </div>
              </div>

              {/* Precios y descuento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Precio de Compra ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary font-mono text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Último costo de adquisición</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Precio de Venta ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary font-mono font-bold text-gray-900"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Precio base al público</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Descuento Base (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary font-mono text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Porcentaje de rebaja promocional</p>
                </div>
              </div>

              {/* Inventario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Stock en Bodega (Físico)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary font-mono text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Unidades disponibles para venta inmediata</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Stock en Tránsito (Comprado)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="incoming_stock"
                    value={formData.incoming_stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-color-secondary font-mono text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Unidades compradas que aún no han llegado a bodega</p>
                </div>
              </div>

              {/* Costo promedio informativo si es edición */}
              {isEditing && product?.average_cost && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center justify-between">
                  <span>Costo Promedio Ponderado del Sistema:</span>
                  <strong className="font-mono text-gray-900">{formatCurrency(product.average_cost)}</strong>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPCIONES Y ESTADOS */}
          {activeTab === 'options' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                
                {/* is_active */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-color-accent1 rounded focus:ring-color-accent1"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 block">Producto Activo</span>
                    <span className="text-xs text-gray-500">
                      Si está activo, se muestra en el catálogo público y tienda. Si se desmarca, solo los administradores lo verán en POS y gestión.
                    </span>
                  </div>
                </label>

                {/* is_featured */}
                <label className="flex items-start space-x-3 cursor-pointer pt-3 border-t border-gray-200">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-color-accent1 rounded focus:ring-color-accent1"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 block">Producto Destacado</span>
                    <span className="text-xs text-gray-500">
                      Aparece en las secciones y carruseles principales de la página de inicio (Home).
                    </span>
                  </div>
                </label>

                {/* is_service */}
                <label className="flex items-start space-x-3 cursor-pointer pt-3 border-t border-gray-200">
                  <input
                    type="checkbox"
                    name="is_service"
                    checked={formData.is_service}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-color-accent1 rounded focus:ring-color-accent1"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 block">Es un Servicio (Mano de obra / Instalación)</span>
                    <span className="text-xs text-gray-500">
                      No es un producto físico y no descuenta inventario físico. Ideal para servicios técnicos o instalación.
                    </span>
                  </div>
                </label>

                {/* is_combo */}
                <label className="flex items-start space-x-3 cursor-pointer pt-3 border-t border-gray-200">
                  <input
                    type="checkbox"
                    name="is_combo"
                    checked={formData.is_combo}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-color-accent1 rounded focus:ring-color-accent1"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 block">Es un Kit / Combo</span>
                    <span className="text-xs text-gray-500">
                      Evita conteo doble en los reportes de valoración global de inventario.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: GALERÍA DE FOTOS */}
          {activeTab === 'images' && (
            <div className="space-y-6 animate-fadeIn">
              
              {!isEditing ? (
                <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                  <FaImage className="mx-auto text-gray-400 mb-2" size={36} />
                  <h4 className="font-bold text-gray-700">Primero guarda los datos del producto</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Una vez creado el producto en la base de datos, podrás subir y gestionar todas sus fotos aquí mismo en su galería.
                  </p>
                </div>
              ) : (
                <>
                  {/* Selector de subida */}
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">Añadir nueva imagen a la galería</h4>
                      <p className="text-xs text-gray-500">Formatos recomendados: JPG, PNG o WEBP (máx 5MB)</p>
                    </div>
                    <label className={`px-4 py-2 bg-color-accent1 hover:bg-opacity-90 text-white font-semibold rounded-lg text-sm cursor-pointer flex items-center shadow-sm transition-all ${
                      uploadingImage ? 'opacity-60 cursor-not-allowed' : ''
                    }`}>
                      <FaUpload className="mr-2" />
                      {uploadingImage ? 'Subiendo imagen...' : 'Subir Imagen'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Lista de imágenes actuales */}
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">
                      Fotos actuales ({productImages.length})
                    </h4>

                    {productImages.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Este producto aún no tiene fotos cargadas.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {productImages.map((img, idx) => (
                          <div key={img.id || idx} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                            <img 
                              src={img.image} 
                              alt={img.alt_text || 'Foto del producto'} 
                              className="w-full h-36 object-cover"
                            />
                            {idx === 0 && (
                              <span className="absolute top-1.5 left-1.5 bg-black bg-opacity-70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                Portada
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100 space-x-2">
                              <a 
                                href={img.image} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 bg-white rounded-full text-gray-700 hover:text-black shadow"
                                title="Ver en tamaño completo"
                              >
                                <FaExternalLinkAlt size={12} />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(img.id)}
                                className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 shadow"
                                title="Eliminar imagen"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer de acciones */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors text-sm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-color-accent1 hover:bg-opacity-90 text-white font-bold rounded-lg shadow-md transition-all flex items-center text-sm disabled:opacity-50"
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ProductFormModal;

