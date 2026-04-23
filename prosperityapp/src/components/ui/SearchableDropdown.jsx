// ===== INICIO: src/components/ui/SearchableDropdown.jsx (Fixed Dropdown – overflow-safe) =====
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import feather from 'feather-icons';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * SearchableDropdown
 * - Búsqueda con cuadro de texto
 * - Scroll en la lista (max-h-60)
 * - Selección con puntero
 * - El menú se renderiza via Portal con position:fixed para no ser cortado
 *   por contenedores con overflow:hidden (acordeones <details>, etc.)
 * - Soporte para entradas manuales (allowManual + onManualInput)
 */
const SearchableDropdown = ({
  items = [],
  placeholder,
  onSelect,
  initialValue,
  disabled = false,
  allowManual = false,
  onManualInput = null,
}) => {
  const [isOpen, setIsOpen]           = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuStyle, setMenuStyle]     = useState({});

  const inputRef   = useRef(null);
  const wrapperRef = useRef(null);
  const menuRef    = useRef(null);

  // Sincronizar con initialValue externo
  useEffect(() => {
    if (initialValue) {
      setSelectedItem(initialValue);
      setSearchTerm(initialValue.name ?? '');
    } else {
      setSelectedItem(null);
      setSearchTerm('');
    }
  }, [initialValue]);

  // Reemplazar iconos Feather en cada render
  useEffect(() => { feather.replace(); });

  // Calcular posición del menú relativo al input (para position:fixed)
  const calculateMenuPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top:   rect.bottom + window.scrollY,
      left:  rect.left   + window.scrollX,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const clickedWrapper = wrapperRef.current?.contains(e.target);
      const clickedMenu    = menuRef.current?.contains(e.target);
      if (!clickedWrapper && !clickedMenu) {
        setIsOpen(false);
        // Revertir el texto si no hay selección válida
        if (!selectedItem) {
          if (allowManual && searchTerm) {
            // Mantener el texto manual
          } else {
            setSearchTerm('');
          }
        } else {
          setSearchTerm(selectedItem.name ?? '');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedItem, searchTerm, allowManual]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredItems = items.filter(item =>
    (item.name ?? '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(item.name ?? '');
    setIsOpen(false);
    onSelect(item);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSelectedItem(null);
    setIsOpen(true);
    calculateMenuPosition();
    if (allowManual && onManualInput) onManualInput(val);
  };

  const handleFocus = () => {
    if (!disabled) {
      calculateMenuPosition();
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setSelectedItem(null);
    setSearchTerm('');
    onSelect(null);
    inputRef.current?.focus();
  };

  const menuContent = isOpen && !disabled && (
    <ul
      ref={menuRef}
      style={{ ...menuStyle, maxHeight: '15rem', overflowY: 'auto' }}
      className="bg-bg-secondary border border-border-main rounded-b-md shadow-2xl"
    >
      {filteredItems.length > 0 ? (
        filteredItems.map((item) => (
          <li
            key={item.id}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
            className="p-2 hover:bg-bg-tertiary cursor-pointer text-text-main border-b border-border-main/50 last:border-0 flex justify-between items-center transition-colors text-sm"
          >
            <span>{item.name}</span>
            <span className="flex items-center gap-2">
              {item.price != null && (
                <span className="text-xs text-accent font-medium">
                  ${item.price?.toLocaleString('es-CL')}
                </span>
              )}
              {item.stock != null && (
                <span className={`text-xs font-bold ${item.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Stock: {item.stock}
                </span>
              )}
              {item.stockUnits != null && (
                <span className={`text-xs font-bold ${item.stockUnits > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Stock: {item.stockUnits}
                </span>
              )}
            </span>
          </li>
        ))
      ) : (
        <li className="p-2 text-text-muted text-sm text-center">
          {allowManual && searchTerm
            ? `Usar "${searchTerm}" como nuevo`
            : 'No se encontraron resultados'}
        </li>
      )}
    </ul>
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full bg-bg-input border border-border-input rounded p-2 pr-8 text-text-main placeholder-text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50 text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
        />
        {selectedItem && !disabled ? (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            className="absolute right-2 top-2.5 text-text-muted hover:text-red-400 transition-colors"
          >
            <i data-feather="x" className="w-4 h-4"></i>
          </button>
        ) : !disabled ? (
          <div className="absolute right-2 top-2.5 text-text-muted pointer-events-none">
            <i data-feather="search" className="w-4 h-4"></i>
          </div>
        ) : null}
      </div>

      {/* Portal: renderiza el menú fuera del flujo DOM para evitar overflow:hidden */}
      {isOpen && !disabled && createPortal(menuContent, document.body)}
    </div>
  );
};

export default SearchableDropdown;
// ===== FIN: src/components/ui/SearchableDropdown.jsx (Fixed Dropdown – overflow-safe) =====
