// src/components/products/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCartPlus } from 'react-icons/fa'; // Icono para añadir al carrito

// Helper para formatear moneda (puedes crear un util para esto)
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits:0, maximumFractionDigits:0 }).format(value);
};

function ProductCard({ product }) {
  if (!product) return null;

  // Asume que el serializador envía la URL completa de la imagen principal
  // Si 'images' es un array, toma la primera o una por defecto.
  const imageUrl = product.images && product.images.length > 0 
                   ? product.images[0].image // product.images[0].image_url si así se llama en el serializador
                   : 'https://via.placeholder.com/300x300.png?text=Sin+Imagen'; // Placeholder

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col">
      <Link to={`/products/${product.id}`} className="block">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-56 object-cover" // Ajusta h- según necesites
        />
      </Link>
      <div className="p-5 flex flex-col flex-grow">
        <h5 className="text-xl font-semibold tracking-tight text-color-primary mb-1 truncate" title={product.name}>
          <Link to={`/products/${product.id}`} className="hover:text-color-accent1">
            {product.name}
          </Link>
        </h5>
        
        {/* Mostrar tags (opcional, primeras 2-3) */}
        {product.tags && product.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag.id} className="text-xs bg-color-neutral-light text-color-primary px-2 py-0.5 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto"> {/* Empuja precios y botón hacia abajo */}
          <div className="flex items-center justify-between mb-3">
            {product.has_discount ? (
              <div>
                <span className="text-2xl font-bold text-color-accent2">
                  {formatCurrency(product.final_sale_price)}
                </span>
                <span className="text-sm text-gray-500 line-through ml-2">
                  {formatCurrency(product.original_sale_price)}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-color-primary">
                {formatCurrency(product.original_sale_price)}
              </span>
            )}
          </div>

          {product.has_discount && product.applied_discount_percentage > 0 && (
             <p className="text-sm text-green-600 font-semibold mb-2">
                Ahorras: {formatCurrency(product.discount_amount_saved)} ({parseFloat(product.applied_discount_percentage).toFixed(0)}%)
             </p>
          )}

          {/* TODO: Implementar la lógica de añadir al carrito */}
          <button 
            // onClick={() => addToCart(product.id, 1)} // Ejemplo
            className="w-full flex items-center justify-center text-white bg-color-secondary hover:bg-color-accent1 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
            // disabled={product.stock === 0} // Deshabilitar si no hay stock
          >
            <FaCartPlus className="mr-2" />
            {product.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;