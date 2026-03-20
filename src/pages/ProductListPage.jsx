import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import productService from '../services/productService';
import siteSettingsService from '../services/siteSettingsService';
import ProductCard from '../components/products/ProductCard';
import FiltersPanel from '../components/products/FiltersPanel'; // <-- Importa el nuevo componente
import BannerCarousel from '../components/common/BannerCarousel';
import { FaFilter, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

// --- Componentes Internos ---
const Loader = () => (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-secondary"></div>
      <p className="ml-3 text-color-secondary">Cargando productos...</p>
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pages = [];
    const MAX_PAGES_TO_SHOW = 3;
    let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_TO_SHOW / 2));
    let endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);
    if (endPage - startPage + 1 < MAX_PAGES_TO_SHOW && startPage > 1) startPage = Math.max(1, endPage - MAX_PAGES_TO_SHOW + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
        <nav aria-label="Paginación de productos" className="flex justify-center my-8">
            <ul className="inline-flex items-center -space-x-px">
                <li><button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="py-2 px-3 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">Anterior</button></li>
                {startPage > 1 && <><li><button onClick={() => onPageChange(1)} className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100">1</button></li>{startPage > 2 && <li className="py-2 px-3 border-y border-gray-300">...</li>}</>}
                {pages.map(page => <li key={page}><button onClick={() => onPageChange(page)} aria-current={currentPage === page ? 'page' : undefined} className={`py-2 px-3 border ${currentPage === page ? 'bg-color-secondary text-white border-color-secondary z-10' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>{page}</button></li>)}
                {endPage < totalPages && <> {endPage < totalPages - 1 && <li className="py-2 px-3 border-y border-gray-300">...</li>}<li><button onClick={() => onPageChange(totalPages)} className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100">{totalPages}</button></li></>}
                <li><button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="py-2 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">Siguiente</button></li>
            </ul>
        </nav>
    );
};

const MobileFilterOverlay = ({ onClick }) => (
    <div onClick={onClick} className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" aria-hidden="true" ></div>
);
// --- Fin Componentes Internos ---


function ProductListPage() {
  // --- Estados de Datos y UI ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [relevantTags, setRelevantTags] = useState([]);
  const [topBanner, setTopBanner] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0 });
  
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [error, setError] = useState(null);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // --- Lógica de Filtros basada en la URL ---
  const [searchParams, setSearchParams] = useSearchParams();
  const { categoryId: categoryIdFromRoute } = useParams();

  // 'initialFilters' se memoiza y solo se recalcula si la URL cambia.
  // Sirve para inicializar el FiltersPanel y para pasar como dependencia a otros hooks.
  const initialFilters = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return {
      category: categoryIdFromRoute || params.get('category') || '',
      subcategory: params.get('subcategory') || '',
      search: params.get('search') || '',
      ordering: params.get('ordering') || '',
      tags_name: params.getAll('tags_name') || [],
    };
  }, [searchParams, categoryIdFromRoute]);


  // --- EFECTOS PARA OBTENER DATOS ---

  // 1. Efecto Principal: Obtener productos CADA VEZ que searchParams cambie.
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setError(null);
      const apiParams = Object.fromEntries(searchParams.entries());

      try {
        const data = await productService.getProducts(apiParams);
        setProducts(data.results || []);
        setPagination({
          count: data.count || 0,
          totalPages: Math.ceil((data.count || 0) / 32),
          currentPage: parseInt(searchParams.get('page')) || 1,
        });
      } catch (err) {
        setError(err.message || "Error al cargar productos.");
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  // 2. Efecto para cargar los datos de los filtros (categorías, subcategorías, tags)
  //    cuando los filtros principales cambian.
  useEffect(() => {
    // Cargar categorías solo una vez.
    if (categories.length === 0) {
      productService.getCategories()
        .then(data => setCategories(data || []))
        .catch(() => toast.error("Error al cargar categorías."));
    }

    // Cargar subcategorías solo si una categoría está seleccionada.
    const categoryId = initialFilters.category;
    if (categoryId) {
      productService.getSubcategories({ category: categoryId })
        .then(data => setSubcategories(data || []));
    } else {
      setSubcategories([]);
    }

    // Cargar tags relevantes basados en los filtros actuales.
    const filtersForTags = {
        category: initialFilters.category,
        subcategory: initialFilters.subcategory,
        search: initialFilters.search,
    };
    Object.keys(filtersForTags).forEach(key => !filtersForTags[key] && delete filtersForTags[key]);

    setIsLoadingFilters(true); // Inicia la carga de filtros
    productService.getRelevantTags(filtersForTags)
      .then(data => setRelevantTags(data || []))
      .catch(() => setRelevantTags([]))
      .finally(() => setIsLoadingFilters(false)); // Termina la carga de filtros

  }, [initialFilters.category, initialFilters.subcategory, initialFilters.search]); // Dependencias estables

  // 3. Efecto para cargar el banner superior (solo una vez)
  useEffect(() => {
    const fetchBanner = async () => {
        try {
            const bannerData = await siteSettingsService.getBanners({ placement: 'product_list_top', limit: 1 });
            setTopBanner(bannerData || []);
        } catch (error) {
            console.error("Error fetching top banner:", error);
            // No es necesario mostrar un toast por un banner
        }
    };
    fetchBanner();
  }, []); // El array vacío asegura que se ejecute solo una vez

  // --- MANEJADORES DE EVENTOS (Estables gracias a useCallback) ---
  const handleFiltersApply = useCallback((allFilters) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', '1');

    // Construir la nueva URL a partir del estado de los filtros
    if (allFilters.search) newSearchParams.set('search', allFilters.search);
    if (allFilters.category) newSearchParams.set('category', allFilters.category);
    if (allFilters.subcategory) newSearchParams.set('subcategory', allFilters.subcategory);
    if (allFilters.ordering) newSearchParams.set('ordering', allFilters.ordering);
    if (allFilters.tags_name && allFilters.tags_name.length > 0) {
      allFilters.tags_name.forEach(tag => newSearchParams.append('tags_name', tag));
    }
    
    setSearchParams(newSearchParams);
    setShowMobileFilters(false);
  }, [setSearchParams]);

  const handlePageChange = useCallback((newPage) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', String(newPage));
    setSearchParams(newSearchParams);
    window.scrollTo(0, 0);
  }, [searchParams, setSearchParams]);


  // --- RENDERIZADO ---
  return (
    <div className="container mx-auto px-2 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-color-primary my-4 sm:my-6 text-center md:text-left">
        {initialFilters.category && categories.find(c => c.id.toString() === initialFilters.category) && ` ${categories.find(c => c.id.toString() === initialFilters.category)?.name}`}
        {initialFilters.subcategory && subcategories.find(s => s.id.toString() === initialFilters.subcategory) && ` > ${subcategories.find(s => s.id.toString() === initialFilters.subcategory)?.name}`}
      </h1>

      {/* Renderiza el banner si existe */}
      {topBanner.length > 0 && <BannerCarousel banners={topBanner} />}

      <div className="md:hidden mb-4">
        <button onClick={() => setShowMobileFilters(true)} className="flex items-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 active:bg-gray-100 shadow-sm w-full justify-center">
          <FaFilter className="mr-2 text-color-secondary" />
          Filtrar y Ordenar
        </button>
      </div>
      
      {showMobileFilters && <MobileFilterOverlay onClick={() => setShowMobileFilters(false)} />}

      <div className="flex flex-col md:flex-row md:gap-8">
        <aside className={`md:w-1/4 lg:w-1/5 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-8rem)] md:pr-4 transition-transform duration-300 ease-in-out fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-xl z-40 p-6 overflow-y-auto md:relative md:h-auto md:max-w-none md:bg-transparent md:shadow-none md:p-0 md:z-auto ${showMobileFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="flex justify-between items-center md:hidden mb-4 pb-2 border-b">
                <h2 className="font-semibold text-lg">Filtros</h2>
                <button onClick={() => setShowMobileFilters(false)} className="p-1"><FaTimes size={20} className="text-gray-500 hover:text-gray-800"/></button>
            </div>
            <FiltersPanel
                initialFilters={initialFilters}
                onFiltersApply={handleFiltersApply}
                isLoadingFilters={isLoadingFilters}
                categories={categories}
                subcategories={subcategories}
                relevantTags={relevantTags}
            />
        </aside>

        <section className="flex-grow md:w-3/4 lg:w-4/5">
          {isLoadingProducts && <Loader />}
          {error && <p className="text-red-500 text-center py-5">{error}</p>}
          {!isLoadingProducts && !error && products.length === 0 && (<p className="text-gray-600 text-center py-10">No se encontraron productos con los filtros actuales.</p>)}
          {!isLoadingProducts && !error && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.map(product => ( <ProductCard key={product.id} product={product} /> ))}
            </div>
          )}

          {!isLoadingProducts && !error && pagination.totalPages > 1 && ( <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} /> )}
        </section>
      </div>
    </div>
  );
} 

export default ProductListPage;