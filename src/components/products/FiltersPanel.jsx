import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';

// Componente memoizado para que no se re-renderice sin necesidad
const FiltersPanel = React.memo(({
  initialFilters,
  onFiltersApply,
  isLoadingFilters,
  categories,
  subcategories,
  relevantTags
}) => {
  
  // Estados locales para los campos del formulario
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialFilters.subcategory || '');
  const [selectedTags, setSelectedTags] = useState(initialFilters.tags_name || []);
  const [sortOrder, setSortOrder] = useState(initialFilters.ordering || '');

  // Sincronizar estado local si los filtros de la URL cambian (ej. botones de navegador)
  useEffect(() => {
    setSearchTerm(initialFilters.search || '');
    setSelectedCategory(initialFilters.category || '');
    setSelectedSubcategory(initialFilters.subcategory || '');
    setSelectedTags(initialFilters.tags_name || []);
    setSortOrder(initialFilters.ordering || '');
  }, [initialFilters]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onFiltersApply({
      search: searchTerm.trim(),
      category: selectedCategory,
      subcategory: selectedSubcategory,
      tags_name: selectedTags,
      ordering: sortOrder,
    });
  };
  
  const handleTagChange = (tagName, isChecked) => {
    const newTags = isChecked ? [...selectedTags, tagName] : selectedTags.filter(t => t !== tagName);
    setSelectedTags(newTags);
    // Para desktop, podríamos querer aplicar el filtro de tag instantáneamente
    if (window.innerWidth >= 768) { // md breakpoint
        onFiltersApply({
            search: searchTerm.trim(),
            category: selectedCategory,
            subcategory: selectedSubcategory,
            tags_name: newTags,
            ordering: sortOrder,
        });
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    let newFilters = {
        search: searchTerm.trim(),
        category: name === 'category' ? value : selectedCategory,
        subcategory: name === 'subcategory' ? value : selectedSubcategory,
        tags_name: selectedTags,
        ordering: name === 'ordering' ? value : sortOrder,
    };
    if (name === 'category') {
        setSelectedCategory(value);
        setSelectedSubcategory(''); // Resetear subcategoría
        newFilters.subcategory = '';
    } else if (name === 'subcategory') {
        setSelectedSubcategory(value);
    } else if (name === 'ordering') {
        setSortOrder(value);
    }

    // Aplicar filtro instantáneamente en desktop
    if (window.innerWidth >= 768) {
        onFiltersApply(newFilters);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Búsqueda */}
      <div className="md:hidden"> {/* Ocultar el form de búsqueda aquí si el submit es global */}
        <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <div className="flex">
          <input type="text" id="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style w-full rounded-md focus:z-10" placeholder="Nombre del producto..."/>
        </div>
      </div>
       <div className="hidden md:block"> {/* Formulario de búsqueda separado para desktop con submit instantáneo */}
        <label htmlFor="search-input-desktop" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <div className="flex">
          <input type="text" id="search-input-desktop" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleFormSubmit(e)} className="input-style w-full rounded-l-md !border-r-0 focus:z-10" placeholder="Nombre del producto..."/>
          <button type="submit" className="bg-color-secondary text-white px-3 sm:px-4 py-2 rounded-r-md hover:bg-color-accent1 focus:z-10"><FaSearch /></button>
        </div>
      </div>


      {/* Categoría */}
      <div>
        <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select name="category" id="category-filter" value={selectedCategory} onChange={handleSelectChange} className="input-style w-full" disabled={isLoadingFilters}>
            <option value="">Todas</option>
            {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
        </select>
      </div>

      {/* Subcategoría */}
      <div>
        <label htmlFor="subcategory-filter" className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
        <select name="subcategory" id="subcategory-filter" value={selectedSubcategory} onChange={handleSelectChange} className="input-style w-full" disabled={!selectedCategory || subcategories.length === 0 || isLoadingFilters}>
            <option value="">Todas</option>
            {subcategories.map(subcat => ( <option key={subcat.id} value={subcat.id}>{subcat.name}</option> ))}
        </select>
      </div>
      
      {/* Ordenamiento */}
<div>
                <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                <select 
                    id="sort-order" 
                    name="ordering" // Añadir name para el handleSelectChange
                    value={sortOrder} 
                    onChange={handleSelectChange} // Usar el manejador genérico
                    className="input-style w-full"
                >
                    <option value="">Relevancia</option>
                    <option value="name">Nombre (A-Z)</option>
                    <option value="-name">Nombre (Z-A)</option>
                    {/* El backend debe poder ordenar por este campo anotado o un campo de precio base */}
                    <option value="sale_price">Precio (Menor a Mayor)</option>
                    <option value="-sale_price">Precio (Mayor a Menor)</option>
                    <option value="-created_at">Más Recientes</option>
                </select>
            </div>

      {/* Tags */}
{relevantTags.length > 0 && (
    <div className="pt-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        {relevantTags.map(tag => (
            <label key={tag.id} className={`flex items-center justify-between w-full p-2 border rounded-md cursor-pointer transition-colors text-sm ${selectedTags.includes(tag.name) ? 'bg-color-accent2 text-white border-color-accent2' : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}`}>
            <span className="flex items-center">
                <input 
                    type="checkbox" 
                    value={tag.name} 
                    checked={selectedTags.includes(tag.name)} 
                    onChange={(e) => handleTagChange(tag.name, e.target.checked)} 
                    className="form-checkbox h-4 w-4 text-color-secondary focus:ring-color-accent1 rounded mr-2" 
                />
                {tag.name}
            </span>
            {tag.product_count !== undefined && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${selectedTags.includes(tag.name) ? 'bg-white text-color-accent2' : 'bg-gray-200 text-gray-600'}`}>
                    {tag.product_count}
                </span>
            )}
            </label>
        ))}
        </div>
    </div>
)}
      
      {/* Botón "Aplicar" ahora se renderiza aquí */}
      <div className="pt-4 border-t">
          <button type="submit" className="w-full flex items-center justify-center bg-color-accent1 text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80">
            <FaFilter className="mr-2"/> Aplicar Filtros
          </button>
      </div>
    </form>
  );
});

export default FiltersPanel;