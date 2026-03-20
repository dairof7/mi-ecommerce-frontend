import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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

  // --- SUB-COMPONENTE PARA LA IMAGEN CON FALLBACK ---
  const BannerImage = ({ banner }) => (
    <img
      src={banner.image_url || '/logo.png'}
      alt={banner.alt_text || banner.name}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/logo.png';
      }}
    />
  );

  return (
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
          {/* Lógica de enlace simplificada usando el sub-componente */}
          {banner.link_url ? (
            <Link
              to={banner.link_url}
              target={banner.link_url.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="block w-full h-full"
              tabIndex={index === currentIndex ? 0 : -1}
            >
              <BannerImage banner={banner} />
            </Link>
          ) : (
            <BannerImage banner={banner} />
          )}
        </div>
      ))}

      {/* Controles de navegación */}
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

export default BannerCarousel;