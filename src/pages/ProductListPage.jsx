import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductCard from '../components/products/ProductCard'; // Asume que existe
import { FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Para notificaciones

// --- Componentes Internos (puedes moverlos a archivos separados si crecen) ---
const Loader = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-secondary"></div>
    <p className="ml-3 text-color-secondary">Cargando productos...</p>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  // Lógica para mostrar un rango de páginas si hay muchas (ej. ..., 3, 4, 5, ..., 10)
  // Por ahora, simple:
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
  const [relevantTags, setRelevantTags] = useState([]); // Estado para tags relevantes

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true); // Para carga inicial de categorías/tags
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [totalProducts, setTotalProducts] = useState(0); // No se usa directamente para renderizar
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTermInput, setSearchTermInput] = useState(searchParams.get('search') || '');
  const { categoryId: categoryIdFromRoute, subcategoryId: subcategoryIdFromRoute } = useParams();

  // Función memoizada para obtener los filtros activos de la URL
  const getActiveFilters = useCallback(() => {
    const filters = {};
    const page = parseInt(searchParams.get('page')) || 1; // Obtener página de searchParams
    
    const categoryParam = categoryIdFromRoute || searchParams.get('category');
    if (categoryParam) filters.category = categoryParam;
    
    const subcategoryParam = subcategoryIdFromRoute || searchParams.get('subcategory');
    if (subcategoryParam) filters.subcategory = subcategoryParam;
    
    if (searchParams.get('search')) filters.search = searchParams.get('search');
    if (searchParams.get('ordering')) filters.ordering = searchParams.get('ordering');
    
    const tagsQuery = searchParams.getAll('tags_name');
    if (tagsQuery.length > 0) filters.tags_name = tagsQuery;
    
    return { ...filters, page }; // Incluir la página en los filtros activos
  }, [searchParams, categoryIdFromRoute, subcategoryIdFromRoute]);

  // Cargar productos
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const activeFilters = getActiveFilters(); // Obtiene filtros incluyendo la página
    
    try {
      const data = await productService.getProducts(activeFilters); // Enviar todos los filtros
      setProducts(data.results || []);
      // setTotalProducts(data.count); // No es necesario si solo se usa para totalPages
      setTotalPages(Math.ceil(data.count / 12)); // Asumiendo 20 por página
      setCurrentPage(activeFilters.page); // Sincronizar currentPage con el de la URL
    } catch (err) {
      const errorMsg = err.message || "Error al cargar productos.";
      setError(errorMsg);
      toast.error(errorMsg);
      setProducts([]); // Limpiar productos en caso de error
    } finally {
      setIsLoading(false);
    }
  }, [getActiveFilters]);

  // Cargar datos para filtros (categorías)
  useEffect(() => {
    const loadCategoryData = async () => {
      setIsLoadingFilters(true);
      try {
        const catsData = await productService.getCategories();
        setCategories(catsData || []);
      } catch (err) {
        toast.error("Error al cargar categorías para filtros.");
      } finally {
        setIsLoadingFilters(false);
      }
    };
    loadCategoryData();
  }, []);

  // Cargar subcategorías cuando cambia la categoría seleccionada en los filtros
  useEffect(() => {
    const activeFilters = getActiveFilters();
    const selectedCategoryId = activeFilters.category;

    if (selectedCategoryId) {
      const loadSubcategories = async () => {
        setIsLoadingFilters(true); // Podrías tener un loader separado para subcategorías
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
      setSubcategories([]); // Limpiar si no hay categoría seleccionada
    }
  }, [getActiveFilters().category]); // Dependencia directa del valor del filtro de categoría


  // Cargar tags relevantes cuando cambian los filtros principales (categoría, subcategoría, búsqueda)
  useEffect(() => {
    const fetchRelTags = async () => {
        const currentProductFilters = getActiveFilters();
        const filtersForRelevantTags = { 
            category: currentProductFilters.category,
            subcategory: currentProductFilters.subcategory,
            name: currentProductFilters.search,
        };
        // Eliminar claves con valores undefined/null para no enviar query params vacíos
        Object.keys(filtersForRelevantTags).forEach(key => 
            (filtersForRelevantTags[key] === undefined || filtersForRelevantTags[key] === null || filtersForRelevantTags[key] === '') && delete filtersForRelevantTags[key]
        );

        setIsLoadingFilters(true); // Podrías tener un loader para la sección de tags
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

    // Ejecutar si no estamos cargando productos para evitar llamadas en cascada innecesarias,
    // o si los filtros principales han cambiado.
    if (!isLoading) { // Solo si no se están cargando productos actualmente
        fetchRelTags();
    }
  }, [getActiveFilters().category, getActiveFilters().subcategory, getActiveFilters().search, isLoading]); // Dependencias clave

  // Efecto para cargar productos cuando cambian los searchParams (que actualiza getActiveFilters)
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // fetchProducts está memoizado y depende de getActiveFilters
    useEffect(() => {
        setSearchTermInput(searchParams.get('search') || '');
    }, [searchParams]);
  // --- Manejadores de cambio para filtros ---
    const handleFilterChange = (filterName, value, isMulti = false) => {
        const newSearchParams = new URLSearchParams(searchParams);
        if (filterName !== 'search' && !searchTermInput && newSearchParams.has('search')) {
            newSearchParams.delete('search');
        }

        if (isMulti) { // Para tags_name
        newSearchParams.delete(filterName); // Borrar todos los valores existentes para esa clave
        if (value && value.length > 0) { // Si hay nuevos valores, añadirlos
            value.forEach(val => newSearchParams.append(filterName, val));
        }
        } else { // Para filtros de un solo valor
        if (value) {
            newSearchParams.set(filterName, value);
        } else {
            newSearchParams.delete(filterName);
        }
        }
        
        // Si cambia la categoría, limpiar la subcategoría
        if (filterName === 'category' && !value) { // Si se deselecciona la categoría
            newSearchParams.delete('subcategory');
        } else if (filterName === 'category' && value) { // Si se selecciona una nueva categoría
            newSearchParams.delete('subcategory'); // Limpiar subcategoría para forzar nueva selección o "todas"
        }

        if (filterName === 'page') {
            setCurrentPage(parseInt(value)); // Actualizar la página actual
            newSearchParams.set('page', value); // Cambiar solo la página
        } else {
            setCurrentPage(1); // Resetear a la página 1 si no es un cambio de página
            newSearchParams.set('page', '1'); // Volver a la página 1 con nuevos filtros
        }

        setSearchParams(newSearchParams);
    };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const searchTerm = event.target.elements.search.value;
    handleFilterChange('search', searchTerm.trim());
  };
  

  const handleSearchInputChange = (event) => {
        setSearchTermInput(event.target.value);
        // Opcional: Si quieres que el filtro se aplique mientras escribe (debounce es recomendado)
        // o si quieres que el parámetro 'search' se elimine de la URL si el input se vacía
        // sin necesidad de enviar el formulario.
        if (event.target.value === "" && searchParams.get('search')) {
            // Si el usuario borra el input y había un filtro de búsqueda, lo quitamos
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('search');
            newSearchParams.set('page', '1');
            setSearchParams(newSearchParams);
        }
    };


  const handleSortChange = (e) => {
    handleFilterChange('ordering', e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages) ) { // Permitir si totalPages es 0 inicialmente
      handleFilterChange('page', newPage.toString());
    }
  };

  const currentFilters = getActiveFilters();

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-color-primary my-6 text-center md:text-left">
        Listado de Productos
        {/* Lógica para mostrar el nombre de la categoría/subcategoría actual si está filtrado */}
        {currentFilters.category && categories.length > 0 &&
          ` en ${categories.find(c => c.id.toString() === currentFilters.category)?.name || 'Categoría Desconocida'}`}
        {currentFilters.subcategory && subcategories.length > 0 &&
          ` > ${subcategories.find(s => s.id.toString() === currentFilters.subcategory)?.name || 'Subcategoría Desconocida'}`}
      </h1>

      {/* Sección de Filtros y Búsqueda */}
      <div className="mb-8 p-4 bg-white shadow-lg rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-2 lg:col-span-2">
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
              <button type="submit" className="bg-color-secondary text-white px-4 py-2 rounded-r-md hover:bg-color-accent1 focus:z-10">
                <FaSearch />
              </button>
            </div>
          </form>

          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              id="category-filter"
              value={currentFilters.category || ""}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input-style w-full"
              disabled={isLoadingFilters}
            >
              <option value="">Todas</option>
              {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
            </select>
          </div>

          <div>
            <label htmlFor="subcategory-filter" className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
            <select
              id="subcategory-filter"
              value={currentFilters.subcategory || ""}
              onChange={(e) => handleFilterChange('subcategory', e.target.value)}
              className="input-style w-full"
              disabled={!currentFilters.category || subcategories.length === 0 || isLoadingFilters}
            >
              <option value="">Todas</option>
              {subcategories.map(subcat => ( <option key={subcat.id} value={subcat.id}>{subcat.name}</option> ))}
            </select>
          </div>
        </div>

        {/* Filtro de Tags y Ordenamiento en una nueva fila */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end mt-4">
            {relevantTags.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Etiquetas</label>
                <div className="flex flex-wrap gap-2">
                {relevantTags.map(tag => (
                    <label key={tag.id} className={`flex items-center space-x-2 px-3 py-1.5 border rounded-full cursor-pointer transition-colors text-sm
                                                    ${(currentFilters.tags_name || []).includes(tag.name) 
                                                        ? 'bg-color-accent2 text-white border-color-accent2' 
                                                        : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}>
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
                        handleFilterChange('tags_name', newSelectedTags, true); // true indica multi-select
                        }}
                        className="opacity-0 w-0 h-0" // Ocultar checkbox real, el label es clickeable
                    />
                    <span>{tag.name}</span>
                    {tag.product_count !== undefined && (
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full 
                                        ${(currentFilters.tags_name || []).includes(tag.name) 
                                            ? 'bg-white text-color-accent2' 
                                            : 'bg-color-neutral-light text-color-primary'}`}>
                        {tag.product_count}
                        </span>
                    )}
                    </label>
                ))}
                </div>
            </div>
            )}

            <div className="lg:col-start-4"> {/* Empuja a la última columna en pantallas grandes */}
                <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                <select id="sort-order" value={currentFilters.ordering || ""} onChange={handleSortChange} className="input-style w-full">
                    <option value="">Relevancia</option>
                    <option value="name">Nombre (A-Z)</option>
                    <option value="-name">Nombre (Z-A)</option>
                    <option value="final_sale_price">Precio (Menor a Mayor)</option> {/* Asume que ordenas por precio final */}
                    <option value="-final_sale_price">Precio (Mayor a Menor)</option>
                    <option value="-created_at">Más Recientes</option>
                </select>
            </div>
        </div>
      </div>

      {isLoading && <Loader />}
      {error && <p className="text-red-500 text-center py-5">{error}</p>}
      {!isLoading && !error && products.length === 0 && (
        <p className="text-gray-600 text-center py-10">No se encontraron productos con los filtros actuales.</p>
      )}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!isLoading && !error && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
}

export default ProductListPage;