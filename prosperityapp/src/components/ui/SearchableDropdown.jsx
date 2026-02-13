// ===== INICIO: src/components/ui/SearchableDropdown.jsx (Tema Corregido) =====
import React, { useState, useEffect, useRef } from 'react';
import feather from 'feather-icons';

const SearchableDropdown = ({ items = [], placeholder, onSelect, initialValue, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (initialValue) {
      setSelectedItem(initialValue);
      setSearchTerm(initialValue.name);
    } else {
      setSelectedItem(null);
      setSearchTerm('');
    }
  }, [initialValue]);

  useEffect(() => {
    feather.replace();
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // Si no se seleccionó nada válido, revertir al último seleccionado o limpiar
        if (!selectedItem && searchTerm !== '') {
           setSearchTerm('');
        } else if (selectedItem) {
           setSearchTerm(selectedItem.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef, selectedItem, searchTerm]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(item.name);
    setIsOpen(false);
    onSelect(item);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedItem(null); // Invalidar selección al escribir
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
         <input
          type="text"
          className="w-full bg-bg-tertiary border border-border-main rounded p-2 pr-8 text-text-main placeholder-text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
        />
        {selectedItem && !disabled && (
           <button 
             onClick={() => { 
               setSelectedItem(null); 
               setSearchTerm(''); 
               onSelect(null);
             }}
             className="absolute right-2 top-2.5 text-text-muted hover:text-red-400"
           >
             <i data-feather="x" className="w-4 h-4"></i>
           </button>
        )}
         {!selectedItem && !disabled && (
           <div className="absolute right-2 top-2.5 text-text-muted pointer-events-none">
             <i data-feather="search" className="w-4 h-4"></i>
           </div>
        )}
      </div>
     
      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full bg-bg-secondary border border-border-main rounded-b-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelect(item)}
                className="p-2 hover:bg-bg-tertiary cursor-pointer text-text-main border-b border-border-main/50 last:border-0 flex justify-between items-center transition-colors"
              >
                <span>{item.name}</span>
                {item.stock !== undefined && (
                     <span className={`text-xs font-bold ${item.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        Stock: {item.stock}
                     </span>
                )}
                {item.stockUnits !== undefined && (
                     <span className={`text-xs font-bold ${item.stockUnits > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        Stock: {item.stockUnits}
                     </span>
                )}
              </li>
            ))
          ) : (
            <li className="p-2 text-text-muted text-sm text-center">No se encontraron resultados</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableDropdown;
// ===== FIN: src/components/ui/SearchableDropdown.jsx (Tema Corregido) =====
