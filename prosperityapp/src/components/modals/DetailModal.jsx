// ===== INICIO: src/components/modals/DetailModal.jsx =====
import React, { useRef,  useEffect  } from 'react';
import feather from 'feather-icons';
import { parseDate } from '../../lib/dateUtils';
const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};
const DetailModal = ({ isOpen, onClose, title, items = [] }) => {
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => feather.replace(), 50);
    }
  }, [isOpen, items]);


  const modalRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Foco inicial
      setTimeout(() => {
        if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
           const focusableElements = modalRef.current.querySelectorAll(
             'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
           );
           if (focusableElements.length > 0) {
             focusableElements[0].focus();
           }
        }
      }, 100);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);


  if (!isOpen) return null;
  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop" ref={modalRef} tabIndex="-1">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-lg modal-content flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          <ul className="space-y-2">
            {items.length === 0 && (
              <li className="text-center text-text-main/70 p-4">No hay movimientos para mostrar.</li>
            )}
            {items.map((item, index) => (
              <li key={item.id || index} className="p-3 bg-bg-main/50 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-text-main">{item.description}</p>
                    {item.date && (
                      <p className="text-xs text-text-main/70">
                        {parseDate(item.date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <span className={`font-semibold ${item.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                {item.productsUsed && item.productsUsed.length > 0 && (
                  <ul className="mt-2 pl-4 border-l border-border-main/50 space-y-1">
                    {item.productsUsed.map((prod, idx) => (
                      <li key={idx} className="text-xs text-text-main/80">
                        - {prod.quantity}{prod.unit || 'g'} {prod.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t border-border-main bg-bg-main/50 rounded-b-lg flex justify-end items-center">
          <span className="text-lg font-bold text-text-main">Total: {formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};
export default DetailModal;
// ===== FIN: src/components/modals/DetailModal.jsx =====