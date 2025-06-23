import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import siteSettingsService from '../services/siteSettingsService';
import ProductCard from '../components/products/ProductCard';
import { FaChevronLeft, FaChevronRight, FaTags, FaStar, FaFire } from 'react-icons/fa';
import { toast } from 'react-toastify';

// --- Componentes Internos (Loader, BannerCarousel) ---
const Loader = ({ message = "Cargando..." }) => (
  <div className="flex flex-col justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-secondary mb-3"></div>
    <p className="text-color-secondary">{message}</p>
  </div>
);

const BannerCarousel = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners]); // Dependencia: banners

  const prevSlide = () => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };
  
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setTimeout(nextSlide, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, banners, nextSlide]); // nextSlide añadido como dependencia

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-64 md:h-96 lg:h-[360px] overflow-hidden rounded-lg shadow-xl mb-12">
      {banners.map((banner, index) => (
        <div
          key={banner.id || index}
          className={`
            absolute inset-0 
            transition-opacity duration-700 ease-in-out 
            ${index === currentIndex ? 'opacity-100 z-10 visible' : 'opacity-0 z-0 invisible pointer-events-none'}
          `}
        >
          {banner.link_url ? (
            <Link 
              to={banner.link_url} 
              target={banner.link_url.startsWith('http') ? '_blank' : '_self'} 
              rel="noopener noreferrer"
              className="block w-full h-full"
              tabIndex={index === currentIndex ? 0 : -1}
            >
              <img src={banner.image_url} alt={banner.alt_text || banner.name} className="w-full h-full object-cover" />
            </Link>
          ) : (
            <img src={banner.image_url} alt={banner.alt_text || banner.name} className="w-full h-full object-cover" />
          )}
        </div>
      ))}
      {banners.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute z-20 top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity" aria-label="Anterior banner">
            <FaChevronLeft size={24} />
          </button>
          <button onClick={nextSlide} className="absolute z-20 top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity" aria-label="Siguiente banner">
            <FaChevronRight size={24} />
          </button>
          <div className="absolute z-20 bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button 
                key={`dot-${index}`}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-white ring-2 ring-offset-1 ring-offset-black/50 ring-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'}`}
                aria-label={`Ir al banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};


const CategoryCarousel = ({ categories }) => {
  if (!categories || categories.length === 0) return null;

  // Lógica para el scroll del carrusel (simplificada)
  // Para un carrusel real, usarías refs y scrollLeft, o una librería.
  // Esta es una representación para la idea.
  const scrollContainerRef = React.useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Ajusta esto
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <div className="relative">
      <div 
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-color-secondary scrollbar-track-gray-100" // Clases para scroll horizontal
      >
        {categories.map(category => (
          <Link
            to={`/products?category=${category.id}`}
            key={category.id}
            className="group flex-shrink-0 w-32 h-40 sm:w-36 sm:h-44 md:w-40 md:h-48 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col items-center p-2"
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg overflow-hidden mb-2 border-1 border-transparent group-hover:border-color-accent1 transition-all">
              <img
                src={category.image || 'https://via.placeholder.com/150'}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-color-secondary group-hover:text-color-accent1 text-xs sm:text-sm text-center truncate w-full" title={category.name}>
              {category.name}
            </h3>
          </Link>
        ))}
      </div>
      {/* Botones de scroll (opcional, el scroll táctil/rueda funciona) */}
      {categories.length > 5 && ( // Mostrar botones solo si hay suficientes items para scrollear
        <>
        <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md text-color-primary disabled:opacity-50" aria-label="Scroll Izquierda">
            <FaChevronLeft />
        </button>
        <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md text-color-primary disabled:opacity-50" aria-label="Scroll Derecha">
            <FaChevronRight />
        </button>
        </>
      )}
    </div>
  );
};


const ProductSection = ({ title, products, icon, isLoading, error, sectionId }) => {
  // Mostrar loader solo si esta sección específica está cargando y no hay productos aún
  const showLoader = isLoading && (!products || products.length === 0);
  // Mostrar error solo si no está cargando, no hay productos, y hay un error específico para esta sección (o general)
  const showError = !isLoading && (!products || products.length === 0) && error;

  if (showLoader) return <Loader message={`Cargando ${title.toLowerCase()}...`} />;
  if (showError) return <p className="text-red-500 text-center py-6">Error al cargar {title.toLowerCase()}: {error}</p>;
  if (!isLoading && (!products || products.length === 0)) return null; // No renderizar si no hay productos y no está cargando/con error

  return (
    <section id={sectionId || title.toLowerCase().replace(/\s+/g, '-')} className="mb-12">
      <h2 className="text-3xl font-bold text-color-primary mb-6 flex items-center">
        {icon && React.createElement(icon, { className: "mr-3 text-color-accent1"})}
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
// --- Fin Componentes Internos ---


function HomePage() {
  const [mainBanners, setMainBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);

  // Estados de carga individuales para cada sección
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingBestsellers, setIsLoadingBestsellers] = useState(true);
  
  const [generalError, setGeneralError] = useState(null); // Un error general si alguna carga falla

  useEffect(() => {
    const fetchHomePageData = async () => {
      // Iniciar todas las cargas
      setIsLoadingBanners(true);
      setIsLoadingCategories(true);
      setIsLoadingFeatured(true);
      setIsLoadingBestsellers(true);
      setGeneralError(null);

      try {
        // Fetch Banners
        siteSettingsService.getBanners({ placement: 'home_main', limit: 3 })
          .then(data => setMainBanners(data || []))
          .catch(err => {
            toast.error("Error al cargar banners principales.");
            console.error("Banner fetch error:", err);
            setMainBanners([]); // Asegurar que es un array
          })
          .finally(() => setIsLoadingBanners(false));

        // Fetch Categories
        productService.getCategories({ limit: 6 })
          .then(data => setCategories(data?.results || data || []))
          .catch(err => {
            toast.error("Error al cargar categorías.");
            console.error("Category fetch error:", err);
            setCategories([]);
          })
          .finally(() => setIsLoadingCategories(false));

        // Fetch Featured Products
        productService.getFeaturedProducts({ limit: 5 })
          .then(data => setFeaturedProducts(data?.results || data || [])) // Asume que puede ser paginado o no
          .catch(err => {
            toast.error("Error al cargar productos destacados.");
            console.error("Featured products fetch error:", err);
            setFeaturedProducts([]);
          })
          .finally(() => setIsLoadingFeatured(false));
        
        // Fetch Bestseller Products (usando placeholder)
        productService.getBestsellerProducts({ limit: 5 })
          .then(data => setBestsellerProducts(data?.results || data || [])) // Asume que puede ser paginado o no
          .catch(err => {
            toast.error("Error al cargar los más vendidos.");
            console.error("Bestseller products fetch error:", err);
            setBestsellerProducts([]);
          })
          .finally(() => setIsLoadingBestsellers(false));

      } catch (err) { // Este catch es para errores en Promise.all si lo usaras, menos relevante ahora
        const errorMsg = err.message || "Error al cargar los datos de la página principal.";
        setGeneralError(errorMsg);
        toast.error(errorMsg);
      }
      // No hay un setIsLoading(false) general aquí porque cada sección maneja su carga
    };

    fetchHomePageData();
  }, []); // Se ejecuta solo una vez al montar

  // Loader principal si todos los datos iniciales importantes están cargando
  const showOverallLoader = isLoadingBanners && isLoadingCategories && isLoadingFeatured;
  if (showOverallLoader) {
    return <Loader message="Cargando página principal..." />;
  }
  
  return (
    <div className="space-y-12">
      {/* Carrusel de Banners Principales */}
      {isLoadingBanners && mainBanners.length === 0 && <Loader message="Cargando banners..." />}
      {!isLoadingBanners && mainBanners.length > 0 && <BannerCarousel banners={mainBanners} />}
      {!isLoadingBanners && mainBanners.length === 0 && !generalError && (
        <div className="text-center py-6 text-gray-500">No hay banners para mostrar.</div>
      )}

      {/* Sección de Categorías Destacadas */}  
 {isLoadingCategories && categories.length === 0 && <Loader message="Cargando categorías..." />}
 {!isLoadingCategories && categories.length > 0 && (
   <section className="mb-12">
     <h2 className="text-3xl font-bold text-color-primary mb-6 flex items-center">
       <FaTags className="mr-3 text-color-accent1" /> Nuestras Categorías
     </h2>
     <CategoryCarousel categories={categories} />
   </section>
 )}

      {/* Sección de Productos Destacados */}
      <ProductSection 
        title="Productos Destacados" 
        products={featuredProducts} 
        icon={FaStar}
        isLoading={isLoadingFeatured}
        error={!isLoadingFeatured && featuredProducts.length === 0 && generalError /* Podrías tener un error específico */}
        sectionId="featured-products"
      />
      
      {/* Sección de Más Vendidos */}
      <ProductSection 
        title="Los Más Vendidos" 
        products={bestsellerProducts}
        icon={FaFire}
        isLoading={isLoadingBestsellers}
        error={!isLoadingBestsellers && bestsellerProducts.length === 0 && generalError}
        sectionId="bestseller-products"
      />
      
      {generalError && (!mainBanners.length && !categories.length && !featuredProducts.length && !bestsellerProducts.length) && (
        <p className="text-red-500 text-center py-10">Ocurrió un error al cargar algunos datos de la página: {generalError}</p>
      )}
    </div>
  );
}

export default HomePage;