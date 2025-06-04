// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback añadido
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import siteSettingsService from '../services/siteSettingsService';
import ProductCard from '../components/products/ProductCard';
import { FaChevronLeft, FaChevronRight, FaTags, FaStar, FaFire } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Loader = ({ message = "Cargando..." }) => (
  <div className="flex flex-col justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-secondary mb-3"></div>
    <p className="text-color-secondary">{message}</p>
  </div>
);

// Componente BannerCarousel CORREGIDO (Opción 1: Renderizar solo el banner activo)
const BannerCarousel = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!banners || banners.length === 0) return null;

  // Envolver nextSlide en useCallback para que la referencia sea estable para el useEffect
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };
  
  useEffect(() => {
    if (banners.length <= 1) return; // No iniciar temporizador si hay 0 o 1 banner
    const timer = setTimeout(nextSlide, 5000); // Cambia cada 5 segundos
    return () => clearTimeout(timer);
  }, [currentIndex, banners.length, nextSlide]); // Incluir nextSlide en dependencias

  const currentBanner = banners[currentIndex]; // Obtener el banner actual

  return (
    <div className="relative w-full h-64 md:h-96 lg:h-[500px] overflow-hidden rounded-lg shadow-xl mb-12 group"> {/* Añadido group para hover en botones */}
      {/* Renderizar solo el div y contenido del banner actual */}
      {currentBanner && (
        <div
          key={currentBanner.id} // key es buena aquí para forzar re-render si el banner cambia
          className="absolute inset-0 opacity-100 transition-opacity duration-700 ease-in-out" // La opacidad es para la transición del contenido
        >
          {currentBanner.link_url ? (
            <Link 
              to={currentBanner.link_url} 
              target={currentBanner.link_url.startsWith('http') ? '_blank' : '_self'} 
              rel="noopener noreferrer"
              className="block w-full h-full" // Asegurar que el Link ocupe todo
            >
              <img 
                src={currentBanner.image_url} /* Asumiendo que el campo es 'image' y contiene la URL */
                alt={currentBanner.alt_text || currentBanner.name} 
                className="w-full h-full object-cover" 
              />
            </Link>
          ) : (
            <img 
              src={currentBanner.image_url} /* Asumiendo que el campo es 'image' */
              alt={currentBanner.alt_text || currentBanner.name} 
              className="w-full h-full object-cover" 
            />
          )}
        </div>
      )}

      {/* Controles de Navegación (estos no se superponen con el contenido clickeable del banner) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute z-10 top-1/2 left-2 md:left-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 md:p-3 rounded-full hover:bg-opacity-50 focus:outline-none transition-all opacity-0 group-hover:opacity-100" 
            aria-label="Anterior banner"
          >
            <FaChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide} 
            className="absolute z-10 top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 md:p-3 rounded-full hover:bg-opacity-50 focus:outline-none transition-all opacity-0 group-hover:opacity-100" 
            aria-label="Siguiente banner"
          >
            <FaChevronRight size={24} />
          </button>
          <div className="absolute z-10 bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button 
                key={index} 
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors duration-300 ${index === currentIndex ? 'bg-white ring-2 ring-offset-1 ring-offset-black/30 ring-white' : 'bg-white bg-opacity-40 hover:bg-opacity-60'}`}
                aria-label={`Ir al banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
// --- FIN BannerCarousel ---

const ProductSection = ({ title, products, icon, isLoading, error }) => {
  // (Sin cambios aquí, asumiendo que ya está bien)
  if (isLoading) return <Loader message={`Cargando ${title.toLowerCase()}...`} />;
  if (error && (!products || products.length === 0)) return <p className="text-red-500 text-center py-4">Error al cargar {title.toLowerCase()}: {error}</p>;
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-12">
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
        const [bannersResponse, categoriesResponse, featuredResponse, bestsellersResponse] = await Promise.allSettled([ // Usar Promise.allSettled para que una falla no detenga las demás
          siteSettingsService.getBanners({ placement: 'home_main', limit: 5 }), // Aumenté límite por si quieres más
          productService.getCategories({ limit: 6 }),
          productService.getFeaturedProducts({ limit: 5 }),
          productService.getBestsellerProducts({ limit: 5 })
        ]);
        
        // Procesar resultados de Promise.allSettled
        if (bannersResponse.status === 'fulfilled') {
            setMainBanners(bannersResponse.value || []);
        } else {
            console.error("Error fetching banners:", bannersResponse.reason);
            toast.error("No se pudieron cargar los banners principales.");
        }

        if (categoriesResponse.status === 'fulfilled') {
            setCategories(categoriesResponse.value?.results || categoriesResponse.value || []);
        } else {
            console.error("Error fetching categories:", categoriesResponse.reason);
            toast.error("No se pudieron cargar las categorías.");
        }

        if (featuredResponse.status === 'fulfilled') {
            setFeaturedProducts(featuredResponse.value?.results || featuredResponse.value || []);
        } else {
            console.error("Error fetching featured products:", featuredResponse.reason);
        }
        
        if (bestsellersResponse.status === 'fulfilled') {
            setBestsellerProducts(bestsellersResponse.value?.results || bestsellersResponse.value || []);
        } else {
            console.error("Error fetching bestseller products:", bestsellersResponse.reason);
        }

        // Determinar el error general si todas las llamadas importantes fallaron
        if (bannersResponse.status === 'rejected' && categoriesResponse.status === 'rejected' && featuredResponse.status === 'rejected') {
            setError("Error al cargar los datos principales de la página.");
        }

      } catch (err) { // Este catch es para errores no manejados por Promise.allSettled (poco probable)
        const errorMsg = err.message || "Error general al cargar los datos de la página principal.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  // Mostrar un loader principal si isLoading es true y no hay NADA de datos aún
  if (isLoading && !mainBanners.length && !categories.length && !featuredProducts.length && !bestsellerProducts.length) {
    return <Loader message="Cargando página principal..." />;
  }
  
  // Mostrar un error general si ocurrió Y no hay datos importantes que mostrar
  if (error && !mainBanners.length && !categories.length && !featuredProducts.length && !bestsellerProducts.length) {
      return <p className="text-red-500 text-center py-10">Error al cargar la página: {error}</p>;
  }

  return (
    <div className="space-y-12">
      {/* Carrusel de Banners Principales */}
      {mainBanners.length > 0 && <BannerCarousel banners={mainBanners} />}
      
      {/* Sección de Categorías Destacadas */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-color-primary mb-6 flex items-center">
            <FaTags className="mr-3 text-color-accent1" /> Nuestras Categorías
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map(category => (
              <Link 
                to={`/category/${category.id}`} 
                key={category.id} 
                className="group block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden text-center p-1"
              >
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden"> {/* Para imágenes cuadradas usando aspect-ratio de Tailwind (si lo tienes configurado) o un padding-hack */}
                  <img 
                    src={category.image || 'https://images.wikidexcdn.net/mwuploads/esssbwiki/d/dc/latest/20180618214025/Solid_Snake_MGSTLC.jpg'} 
                    alt={category.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="mt-2 mb-1 py-2 font-semibold text-color-secondary group-hover:text-color-accent1 transition-colors text-sm md:text-base truncate" title={category.name}>
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sección de Productos Destacados */}
      <ProductSection 
        title="Productos Destacados" 
        products={featuredProducts} 
        icon={FaStar}
        // El loader/error dentro de ProductSection manejará su propio estado si se carga por separado,
        // pero aquí le pasamos el estado general de carga de la página para esa sección.
        isLoading={isLoading && featuredProducts.length === 0} 
        error={!isLoading && featuredProducts.length === 0 && error /* && error específico de esta sección si lo tuvieras */ ? "No se pudieron cargar destacados" : null}
      />
      
      {/* Sección de Más Vendidos */}
      <ProductSection 
        title="Los Más Vendidos" 
        products={bestsellerProducts}
        icon={FaFire}
        isLoading={isLoading && bestsellerProducts.length === 0}
        error={!isLoading && bestsellerProducts.length === 0 && error /* && error específico */ ? "No se pudieron cargar más vendidos" : null}
      />
    </div>
  );
}

export default HomePage;