import React, { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { useDebounce } from '../../hooks/useDebounce';

const ScrollableSelector = ({
  items = [],
  placeholder = 'Buscar...',
  onSelect,
  initialValue,
  disabled = false,
  allowManual = false,
  onManualInput = null,
  displayMode = 'horizontal' // 'horizontal' | 'grid'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    feather.replace();
  });

  useEffect(() => {
    if (initialValue) {
      setSelectedItem(initialValue);
      // Solo seteamos el search term a manual si NO tiene un ID predefinido (por ende es un input manual previo)
      if (!initialValue.id && allowManual && initialValue.name) {
        setSearchTerm(initialValue.name);
      } else {
        setSearchTerm(''); 
      }
    } else {
      setSelectedItem(null);
      setSearchTerm('');
    }
  }, [initialValue, allowManual]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredItems = items.filter(item =>
    (item.name ?? '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(''); // Limpia la búsqueda para que vuelva a ver todo
    onSelect(item);
  };

  const handleManualInput = () => {
    if (allowManual && onManualInput && searchTerm.trim()) {
      onManualInput(searchTerm.trim());
      setSelectedItem({ name: searchTerm.trim() });
    }
  };

  const containerClasses = displayMode === 'horizontal'
    ? "flex flex-nowrap overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x"
    : "grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin";

  const renderItemContent = (item, isSelected) => {
    if (displayMode === 'horizontal') {
      return (
        <button
          type="button"
          key={item.id}
          disabled={disabled}
          onClick={() => handleSelect(item)}
          className={`flex-shrink-0 snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
            isSelected 
              ? 'bg-accent text-bg-main border-accent shadow-md shadow-accent/20' 
              : 'bg-bg-tertiary text-text-main border-border-main hover:border-accent/50'
          }`}
        >
          {item.name}
        </button>
      );
    }

    // Grid mode
    return (
      <button
        type="button"
        key={item.id}
        disabled={disabled}
        onClick={() => handleSelect(item)}
        className={`flex flex-col text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${
          isSelected 
            ? 'bg-accent text-bg-main border-accent shadow-md shadow-accent/20' 
            : 'bg-bg-tertiary border-border-main text-text-main hover:border-text-muted/30'
        }`}
      >
        <div className={`font-semibold truncate ${isSelected ? 'text-bg-main' : 'text-text-main'}`}>
          {item.name}
        </div>
        {(item.price != null || item.stock != null || item.stockUnits != null) && (
          <div className="flex justify-between items-center mt-1 w-full flex-wrap gap-1">
            {item.price != null && (
              <span className={`text-xs ${isSelected ? 'text-bg-main font-bold' : 'text-accent'}`}>
                ${item.price?.toLocaleString('es-CL')}
              </span>
            )}
            <div className="flex gap-1">
              {item.stock != null && (
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                   isSelected ? (item.stock > 0 ? 'bg-bg-main/30 text-white' : 'bg-red-700/50 text-white') :
                   (item.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')
                 }`}>
                   Disp: {item.stock}
                 </span>
              )}
              {item.stockUnits != null && (
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                   isSelected ? (item.stockUnits > 0 ? 'bg-bg-main/30 text-white' : 'bg-red-700/50 text-white') :
                   (item.stockUnits > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')
                 }`}>
                   Disp: {item.stockUnits}
                 </span>
              )}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Input de Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
          <i data-feather="search" className="w-4 h-4"></i>
        </div>
        <input
          type="text"
          className="w-full bg-bg-input border border-border-input rounded-lg pl-10 pr-10 py-2 text-text-main placeholder-text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50 text-sm shadow-inner"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
        />
        {searchTerm && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-red-400 transition-colors"
          >
            <i data-feather="x" className="w-4 h-4"></i>
          </button>
        )}
      </div>

      {/* Lista de Elementos Scrolleable */}
      {filteredItems.length > 0 ? (
        <div className={containerClasses}>
          {filteredItems.map(item => renderItemContent(item, selectedItem?.id === item.id || selectedItem?.name === item.name))}
        </div>
      ) : (
        <div className="text-sm text-text-muted text-center py-4 bg-bg-main/30 rounded border border-dashed border-border-main">
          {allowManual && searchTerm ? (
            <div className="flex flex-col items-center gap-2">
              <span>¿Ingresar "{searchTerm}"?</span>
              <button 
                type="button" 
                onClick={handleManualInput}
                className="bg-accent text-bg-main py-1 px-4 text-xs font-bold rounded-full hover:bg-yellow-400 transition-colors"
              >
                Agregar Cliente
              </button>
            </div>
          ) : (
            <span>No se encontraron resultados</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ScrollableSelector;
