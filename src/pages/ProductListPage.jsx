import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductCard from '../components/products/ProductCard';
import { FaSearch, FaFilter, FaTimes, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa'; // FaTimes añadido
import { toast } from 'react-toastify';

// --- Componentes Internos (Loader, Pagination como antes) ---
const Loader = ({ message = "Cargando..." }) => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-secondary"></div>
    <p className="ml-3 text-color-secondary">{message}</p>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // ... (código de Pagination como antes) ...
  if (totalPages <= 1) return null;
  const pages = [];
  const MAX_PAGES_TO_SHOW = 5;
  let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_TO_SHOW / 2));
  let endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);

  if (endPage - startPage + 1 < MAX_PAGES_TO_SHOW && startPage > 1) {
    startPage = Math.max(1, endPage - MAX_PAGES_TO_SHOW + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Paginación de productos" className="flex justify-center my-8">
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="py-2 px-3 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
        </li>
        {startPage > 1 && (
            <>
                <li>
                    <button onClick={() => onPageChange(1)} className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700">1</button>
                </li>
                {startPage > 2 && <li className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300">...</li>}
            </>
        )}
        {pages.map(page => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`py-2 px-3 leading-tight border ${currentPage === page ? 'bg-color-secondary text-white border-color-secondary z-10' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {page}
            </button>
          </li>
        ))}
        {endPage < totalPages && (
            <>
                {endPage < totalPages - 1 && <li className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300">...</li>}
                <li>
                    <button onClick={() => onPageChange(totalPages)} className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700">{totalPages}</button>
                </li>
            </>
        )}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="py-2 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </li>
      </ul>
    </nav>
  );
};
// --- Fin Componentes Internos ---


function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [relevantTags, setRelevantTags] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1); // Aunque se lee de searchParams, mantenerlo para lógica local
  const [totalPages, setTotalPages] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const { categoryId: categoryIdFromRoute, subcategoryId: subcategoryIdFromRoute } = useParams();

  const [showMobileFilters, setShowMobileFilters] = useState(false); // NUEVO ESTADO

  // --- getActiveFilters, fetchProducts, y useEffects de carga de datos (sin cambios grandes) ---
  const getActiveFilters = useCallback(() => {
    const filters = {};
    const page = parseInt(searchParams.get('page')) || 1;
    
    const categoryParam = categoryIdFromRoute || searchParams.get('category');
    if (categoryParam) filters.category = categoryParam;
    
    const subcategoryParam = subcategoryIdFromRoute || searchParams.get('subcategory');
    if (subcategoryParam) filters.subcategory = subcategoryParam;
    
    if (searchParams.get('search')) filters.search = searchParams.get('search');
    if (searchParams.get('ordering')) filters.ordering = searchParams.get('ordering');
    
    const tagsQuery = searchParams.getAll('tags_name');
    if (tagsQuery.length > 0) filters.tags_name = tagsQuery;
    
    return { ...filters, page };
  }, [searchParams, categoryIdFromRoute, subcategoryIdFromRoute]);

  const [searchTermInput, setSearchTermInput] = useState(getActiveFilters().search || '');

  useEffect(() => {
    setSearchTermInput(getActiveFilters().search || '');
  }, [getActiveFilters().search]);


  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const activeFilters = getActiveFilters();
    
    try {
      const data = await productService.getProducts(activeFilters);
      setProducts(data.results || []);
      setTotalPages(Math.ceil(data.count / 20)); 
      setCurrentPage(activeFilters.page);
    } catch (err) {
      const errorMsg = err.message || "Error al cargar productos.";
      setError(errorMsg);
      // toast.error(errorMsg); // El toast ya está en los efectos de filtro
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [getActiveFilters]);

  useEffect(() => {
    const loadBaseFilterData = async () => {
      setIsLoadingFilters(true);
      try {
        const catsData = await productService.getCategories();
        setCategories(catsData || []);
      } catch (err) {
        toast.error("Error al cargar categorías.");
      } finally {
        setIsLoadingFilters(false);
      }
    };
    loadBaseFilterData();
  }, []);

  useEffect(() => {
    const selectedCategoryId = getActiveFilters().category;
    if (selectedCategoryId) {
      const loadSubcategories = async () => {
        setIsLoadingFilters(true);
        try {
          const subcatsData = await productService.getSubcategories({ category: selectedCategoryId });
          setSubcategories(subcatsData || []);
        } catch (err) {
          setSubcategories([]);
          toast.error("Error al cargar subcategorías.");
        } finally {
          setIsLoadingFilters(false);
        }
      };
      loadSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [getActiveFilters().category]);

  useEffect(() => {
    const fetchRelTags = async () => {
        const currentProductFilters = getActiveFilters();
        const filtersForRelevantTags = { 
            category: currentProductFilters.category,
            subcategory: currentProductFilters.subcategory,
            search: currentProductFilters.search,
        };
        Object.keys(filtersForRelevantTags).forEach(key => 
            (filtersForRelevantTags[key] === undefined || filtersForRelevantTags[key] === null || filtersForRelevantTags[key] === '') && delete filtersForRelevantTags[key]
        );
        setIsLoadingFilters(true);
        try {
            const tagsData = await productService.getRelevantTags(filtersForRelevantTags);
            setRelevantTags(tagsData || []);
        } catch (err) {
            toast.error("Error al cargar etiquetas relevantes.");
            setRelevantTags([]);
        } finally {
            setIsLoadingFilters(false);
        }
    };
    if (!isLoading) {
        fetchRelTags();
    }
  }, [getActiveFilters().category, getActiveFilters().subcategory, getActiveFilters().search, isLoading]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // fetchProducts ahora es la única dependencia aquí

  // --- Manejadores de cambio para filtros ---
  const handleFilterChange = (filterName, value, isMulti = false) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Si el input de búsqueda está vacío y estamos cambiando otro filtro, borra 'search'
    if (filterName !== 'search' && searchTermInput === '' && newSearchParams.has('search')) {
        newSearchParams.delete('search');
    }
    
    if (isMulti) {
      newSearchParams.delete(filterName);
      if (value && value.length > 0) {
        value.forEach(val => newSearchParams.append(filterName, val));
      }
    } else {
      if (value) {
        newSearchParams.set(filterName, value);
      } else {
        newSearchParams.delete(filterName);
      }
    }
    
    if (filterName === 'category') {
        newSearchParams.delete('subcategory');
        if (!value) newSearchParams.delete('category');
    }

    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
    if (showMobileFilters && filterName !== 'page') { // Cerrar filtros móviles después de aplicar uno, excepto paginación
        setShowMobileFilters(false);
    }
  };
  
  const handleSearchInputChange = (e) => {
    setSearchTermInput(e.target.value);
    // Opcional: eliminar el parámetro 'search' de la URL si el input se vacía en tiempo real
    if (e.target.value === "" && searchParams.get('search')) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('search');
        newSearchParams.set('page', '1'); // Resetear página
        setSearchParams(newSearchParams);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    handleFilterChange('search', searchTermInput.trim());
     if (showMobileFilters) setShowMobileFilters(false); // Cerrar filtros en móvil
  };
  
  const handleSortChange = (e) => {
    handleFilterChange('ordering', e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages) ) {
      handleFilterChange('page', newPage.toString());
      window.scrollTo(0, 0); // Scroll al inicio al cambiar de página
    }
  };

  const currentFilters = getActiveFilters(); // Para usar en los valores de los selectores

  // Componente para el panel de filtros
  const FiltersPanel = () => (
    <div className="space-y-4"> {/* Espacio entre grupos de filtros */}
      {/* Búsqueda */}
      <form onSubmit={handleSearchSubmit}>
        <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <div className="flex">
          <input
            type="text"
            name="search"
            id="search-input"
            value={searchTermInput}
            onChange={handleSearchInputChange}
            className="input-style w-full rounded-l-md !border-r-0 focus:z-10"
            placeholder="Nombre del producto..."
          />
          <button type="submit" className="bg-color-secondary text-white px-3 sm:px-4 py-2 rounded-r-md hover:bg-color-accent1 focus:z-10">
            <FaSearch />
          </button>
        </div>
      </form>

      {/* Filtro de Categoría */}
      <div>
        <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select id="category-filter" value={currentFilters.category || ""} onChange={(e) => handleFilterChange('category', e.target.value)} className="input-style w-full" disabled={isLoadingFilters}>
          <option value="">Todas</option>
          {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
        </select>
      </div>

      {/* Filtro de Subcategoría */}
      <div>
        <label htmlFor="subcategory-filter" className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
        <select id="subcategory-filter" value={currentFilters.subcategory || ""} onChange={(e) => handleFilterChange('subcategory', e.target.value)} className="input-style w-full" disabled={!currentFilters.category || subcategories.length === 0 || isLoadingFilters}>
          <option value="">Todas</option>
          {subcategories.map(subcat => ( <option key={subcat.id} value={subcat.id}>{subcat.name}</option> ))}
        </select>
      </div>
      
      {/* Filtro de Tags */}
      {relevantTags.length > 0 && (
      <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1"> {/* Scroll para muchos tags */}
          {relevantTags.map(tag => (
              <label key={tag.id} className={`flex items-center justify-between w-full p-2 border rounded-md cursor-pointer transition-colors text-sm
                                          ${(currentFilters.tags_name || []).includes(tag.name) 
                                              ? 'bg-color-accent2 text-white border-color-accent2' 
                                              : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}`}>
              <span className="flex items-center">
                  <input
                  type="checkbox"
                  value={tag.name}
                  checked={(currentFilters.tags_name || []).includes(tag.name)}
                  onChange={(e) => {
                  const currentSelectedTags = currentFilters.tags_name || [];
                  let newSelectedTags;
                  if (e.target.checked) {
                      newSelectedTags = [...currentSelectedTags, tag.name];
                  } else {
                      newSelectedTags = currentSelectedTags.filter(tName => tName !== tag.name);
                  }
                  handleFilterChange('tags_name', newSelectedTags, true);
                  }}
                  className="form-checkbox h-4 w-4 text-color-secondary focus:ring-color-accent1 rounded mr-2"
                  />
                  {tag.name}
              </span>
              {tag.product_count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full 
                                  ${(currentFilters.tags_name || []).includes(tag.name) 
                                      ? 'bg-white text-color-accent2' 
                                      : 'bg-gray-200 text-gray-600'}`}>
                  {tag.product_count}
                  </span>
              )}
              </label>
          ))}
          </div>
      </div>
      )}
      
      {/* Ordenamiento */}
      <div>
          <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
          <select id="sort-order" value={currentFilters.ordering || ""} onChange={handleSortChange} className="input-style w-full">
              <option value="">Relevancia</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="-name">Nombre (Z-A)</option>
              <option value="final_sale_price">Precio (Menor a Mayor)</option>
              <option value="-final_sale_price">Precio (Mayor a Menor)</option>
              <option value="-created_at">Más Recientes</option>
          </select>
      </div>
      {/* Botón para aplicar/cerrar filtros en móvil */}
      <div className="md:hidden pt-4">
          <button 
            onClick={() => setShowMobileFilters(false)}
            className="w-full bg-color-accent1 text-white py-2 px-4 rounded-md hover:bg-opacity-80"
          >
            Aplicar Filtros y Ver Productos
          </button>
      </div>
    </div>
  );


  return (
    <div className="container mx-auto px-2 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-color-primary my-4 sm:my-6 text-center md:text-left">
        Listado de Productos
        {currentFilters.category && categories.find(c => c.id.toString() === currentFilters.category) && 
          ` en ${categories.find(c => c.id.toString() === currentFilters.category)?.name}`}
        {currentFilters.subcategory && subcategories.find(s => s.id.toString() === currentFilters.subcategory) &&
          ` > ${subcategories.find(s => s.id.toString() === currentFilters.subcategory)?.name}`}
      </h1>

      {/* Botón para mostrar/ocultar filtros en móvil */}
      <div className="md:hidden mb-4 flex justify-between items-center">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center bg-color-secondary text-white py-2 px-4 rounded-md hover:bg-color-accent1"
        >
          {showMobileFilters ? <FaTimes className="mr-2" /> : <FaFilter className="mr-2" />}
          {showMobileFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
        {/* Podrías mover el selector de ordenamiento aquí también para móvil si quieres */}
      </div>
      
      <div className="flex flex-col md:flex-row md:gap-6">
        {/* Panel de Filtros: Oculto en móvil por defecto, visible en desktop */}
        {/* Opciones de visualización: 
            1. Siempre visible en desktop, colapsable en móvil (actual)
            2. Modal/Off-canvas en móvil */}
        <aside 
          className={`
            md:w-1/4 lg:w-1/5 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-10rem)] md:overflow-y-auto 
            bg-white p-4 rounded-lg shadow-lg md:block mb-6 md:mb-0
            transition-all duration-300 ease-in-out
            ${showMobileFilters ? 'block' : 'hidden'} 
          `}
        > {/* `md:sticky` para que la barra de filtros se quede fija al hacer scroll */}
          <FiltersPanel />
        </aside>

        {/* Listado de Productos */}
        <section className="flex-grow md:w-3/4 lg:w-4/5">
          {isLoading && <Loader />}
          {error && <p className="text-red-500 text-center py-5">{error}</p>}
          {!isLoading && !error && products.length === 0 && (
            <p className="text-gray-600 text-center py-10">No se encontraron productos con los filtros actuales.</p>
          )}
          {!isLoading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"> {/* Ajusta columnas para el nuevo layout */}
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!isLoading && !error && totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </section>
      </div>
    </div>
  );
} 

export default ProductListPage;