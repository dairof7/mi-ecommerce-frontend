import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Para enlaces internos
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function BannerCarousel({ banners, autoPlayInterval = 5000 }) { // autoPlayInterval como prop
  const [currentIndex, setCurrentIndex] = useState(0);

  // Si no hay banners o solo hay uno, no necesitamos carrusel ni controles
  if (!banners || banners.length === 0) {
    return null; 
  }
  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <div className="relative w-full h-64 md:h-96 lg:h-[500px] overflow-hidden rounded-lg shadow-xl mb-12">
        {banner.link_url ? (
          <Link 
            to={banner.link_url} 
            target={banner.link_url.startsWith('http') ? '_blank' : '_self'} 
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img src={banner.image} alt={banner.alt_text || banner.name} className="w-full h-full object-cover" />
          </Link>
        ) : (
          <img src={banner.image} alt={banner.alt_text || banner.name} className="w-full h-full object-cover" />
        )}
      </div>
    );
  }

  // Funciones para cambiar de slide
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };
  
  // Efecto para el auto-scroll
  useEffect(() => {
    if (banners.length <= 1 || !autoPlayInterval) return; // No auto-play si solo hay 1 o intervalo es 0/null

    const timer = setTimeout(nextSlide, autoPlayInterval);
    return () => clearTimeout(timer); // Limpiar el timer al desmontar o cambiar dependencias
  }, [currentIndex, banners.length, nextSlide, autoPlayInterval]);

  // Obtener el banner actual para renderizar
  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-64 md:h-96 lg:h-[500px] overflow-hidden rounded-lg shadow-xl mb-12">
      {/* Renderizar solo el contenido del banner actual */}
      {currentBanner && (
        <div
          key={currentBanner.id || currentIndex} // Añadir key para ayudar a React con la transición si el contenido cambia drásticamente
          className="absolute inset-0 opacity-100 transition-opacity duration-700 ease-in-out" 
          // Si quieres animaciones de entrada/salida más complejas, considera librerías como framer-motion o react-transition-group
        >
          {currentBanner.link_url ? (
            <Link 
              to={currentBanner.link_url} 
              target={currentBanner.link_url.startsWith('http') ? '_blank' : '_self'} 
              rel="noopener noreferrer"
              className="block w-full h-full" // Asegurar que el Link ocupe todo el espacio
              aria-label={`Banner: ${currentBanner.alt_text || currentBanner.name}`}
            >
              <img 
                src={currentBanner.image} 
                alt={currentBanner.alt_text || currentBanner.name} 
                className="w-full h-full object-cover" 
              />
            </Link>
          ) : (
            <img 
              src={currentBanner.image} 
              alt={currentBanner.alt_text || currentBanner.name} 
              className="w-full h-full object-cover" 
            />
          )}
        </div>
      )}

      {/* Controles de Navegación (botones y puntos) */}
      <> {/* Fragmento para agrupar los controles que siempre se muestran si hay más de un banner */}
        <button 
          onClick={prevSlide} 
          className="absolute z-10 top-1/2 left-2 sm:left-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-white transition-all" 
          aria-label="Anterior banner"
        >
          <FaChevronLeft size={20} className="sm:size-24" />
        </button>
        <button 
          onClick={nextSlide} 
          className="absolute z-10 top-1/2 right-2 sm:right-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-white transition-all" 
          aria-label="Siguiente banner"
        >
          <FaChevronRight size={20} className="sm:size-24" />
        </button>
        <div className="absolute z-10 bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button 
              key={`dot-${index}`} 
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ease-in-out
                          ${index === currentIndex 
                            ? 'bg-white scale-125 ring-2 ring-offset-1 ring-offset-black/30 ring-white' 
                            : 'bg-white bg-opacity-40 hover:bg-opacity-60'}`}
              aria-label={`Ir al banner ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      </>
    </div>
  );
}

export default BannerCarousel;