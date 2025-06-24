// src/components/common/FloatingButtons.jsx
import React from 'react';
import { FaWhatsapp, FaFacebookF } from 'react-icons/fa'; // O FaFacebookMessenger

const FloatingButtons = ({ whatsappNumber, facebookPageUrl }) => {
  // Número de WhatsApp debe incluir el código de país, sin +, sin espacios ni guiones.
  // Ejemplo: 573001234567 para Colombia
  const whatsappLink = whatsappNumber 
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` // Eliminar no dígitos
    : null; 

  // URL completa de tu página de Facebook
  const facebookLink = facebookPageUrl || null;

  if (!whatsappLink && !facebookLink) {
    return null; // No renderizar nada si no hay enlaces configurados
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3">
      {/* Botón de WhatsApp */}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-150 ease-in-out"
        >
          <FaWhatsapp size={28} />
        </a>
      )}

      {/* Botón de Facebook */}
      {facebookLink && (
        <a
          href={facebookLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visitar nuestra página de Facebook"
          className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-150 ease-in-out"
        >
          <FaFacebookF size={24} /> 
          {/* O usa FaFacebookMessenger si es para Messenger */}
        </a>
      )}
      {/* Puedes añadir más botones aquí (Instagram, Telegram, etc.) */}
    </div>
  );
};

export default FloatingButtons;