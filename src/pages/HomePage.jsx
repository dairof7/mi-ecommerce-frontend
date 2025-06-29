import React, { useState, useEffect, useCallback, useRef } from 'react'; // useRef añadido
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import siteSettingsService from '../services/siteSettingsService';
import ProductCard from '../components/products/ProductCard';
import { FaChevronLeft, FaChevronRight, FaTags, FaStar, FaFire } from 'react-icons/fa';
import { toast } from 'react-toastify';

// --- Componentes Internos ---
const Loader = ({ message = "Cargando..." }) => (
  <div className="flex flex-col justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-secondary mb-3"></div>
    <p className="text-color-secondary">{message}</p>
  </div>
);

// Componente BannerCarousel ACTUALIZADO para responsividad
const BannerCarousel = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners]);

  const prevSlide = () => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };
  
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setTimeout(nextSlide, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, banners, nextSlide]);

  if (!banners || banners.length === 0) return null;
  return (
    // CAMBIO: Altura responsiva. Más apaisado en móvil, más alto en desktop.
    <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[450px] overflow-hidden rounded-lg shadow-xl mb-12">
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
          <button onClick={prevSlide} className="absolute z-20 top-1/2 left-2 sm:left-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-50 focus:outline-none transition-opacity" aria-label="Anterior banner">
            <FaChevronLeft size={20} className="sm:size-24" />
          </button>
          <button onClick={nextSlide} className="absolute z-20 top-1/2 right-2 sm:right-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-50 focus:outline-none transition-opacity" aria-label="Siguiente banner">
            <FaChevronRight size={20} className="sm:size-24" />
          </button>
          <div className="absolute z-20 bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button 
                key={`dot-${index}`}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-white ring-2 ring-offset-1 ring-offset-black/50 ring-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'}`}
                aria-label={`Ir al banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Componente CategoryCarousel ACTUALIZADO
const CategoryCarousel = ({ categories }) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.75; // Scroll 75% del ancho visible
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (!categories || categories.length === 0) return null;
  return (
    <div className="relative group"> {/* Añadido 'group' para mostrar botones de scroll al hacer hover en desktop */}
      <div 
        ref={scrollContainerRef}
        // Clases para un scroll horizontal suave y ocultar la barra de scroll
        className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory
                   scrollbar-hide" // O scrollbar-thin si prefieres una barra fina
      >
        {categories.map(category => (
          <Link
            to={`/products?category=${category.id}`}
            key={category.id}
            className="flex-shrink-0 w-28 sm:w-32 md:w-36 snap-start" // Ancho fijo para cada item del carrusel y snap
          >
            <div
              className="group/item block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden text-center"
            >
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={category.image || '/logo.png'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="px-1 py-2 font-semibold text-color-secondary group-hover/item:text-color-accent1 transition-colors text-xs sm:text-sm truncate" title={category.name}>
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
      {/* Botones de scroll (visibles solo en pantallas grandes al hacer hover sobre el contenedor) */}
      <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md text-color-primary disabled:opacity-50
                                                      opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" aria-label="Scroll Izquierda">
          <FaChevronLeft />
      </button>
      <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md text-color-primary disabled:opacity-50
                                                       opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" aria-label="Scroll Derecha">
          <FaChevronRight />
      </button>
    </div>
  );
};


const ProductSection = ({ title, products, icon, isLoading, error, sectionId }) => {
  const showLoader = isLoading && (!products || products.length === 0);
  const showError = !isLoading && (!products || products.length === 0) && error;

  if (showLoader) return <Loader message={`Cargando ${title.toLowerCase()}...`} />;
  if (showError) return <p className="text-red-500 text-center py-6">Error al cargar {title.toLowerCase()}: {error}</p>;
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section id={sectionId || title.toLowerCase().replace(/\s+/g, '-')} className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-color-primary mb-6 flex items-center justify-center md:justify-start">
        {icon && React.createElement(icon, { className: "mr-3 text-color-accent1"})}
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};


function HomePage() {
  const [mainBanners, setMainBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomePageData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ejecutar todas las llamadas en paralelo para una carga más rápida
        const [bannersData, categoriesData, featuredData, bestsellersData] = await Promise.all([
          siteSettingsService.getBanners({ placement: 'home_main', limit: 3 }).catch(e => { console.error("Banner fetch failed:", e); return []; }),
          productService.getCategories({ limit: 12 }).catch(e => { console.error("Category fetch failed:", e); return null; }),
          productService.getFeaturedProducts({ limit: 5 }).catch(e => { console.error("Featured products fetch failed:", e); return null; }),
          productService.getBestsellerProducts({ limit: 5 }).catch(e => { console.error("Bestseller products fetch failed:", e); return null; })
        ]);
        
        setMainBanners(bannersData || []);
        setCategories(categoriesData?.results || categoriesData || []);
        setFeaturedProducts(featuredData?.results || featuredData || []);
        setBestsellerProducts(bestsellersData?.results || bestsellersData || []);

      } catch (err) {
        const errorMsg = err.message || "Error al cargar los datos de la página principal.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  if (isLoading) {
    return <Loader message="Cargando página principal..." />;
  }
  
  if (error) {
    return <p className="text-red-500 text-center py-10">Ocurrió un error al cargar la página: {error}</p>;
  }

  return (
    <div className="space-y-8 md:space-y-12">
      {mainBanners.length > 0 && <BannerCarousel banners={mainBanners} />}

      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-color-primary mb-6 flex items-center justify-center md:justify-start">
            <FaTags className="mr-3 text-color-accent1" /> Nuestras Categorías
          </h2>
          <CategoryCarousel categories={categories} />
        </section>
      )}

      <ProductSection 
        title="Productos Destacados" 
        products={featuredProducts} 
        icon={FaStar}
        isLoading={false} // La carga principal ya terminó
        sectionId="featured-products"
      />
      
      <ProductSection 
        title="Los Más Vendidos" 
        products={bestsellerProducts}
        icon={FaFire}
        isLoading={false}
        sectionId="bestseller-products"
      />
    </div>
  );
}

export default HomePage;