// ===== INICIO: src/components/modals/DetailModal.jsx =====
import React, { useEffect } from 'react';
import feather from 'feather-icons';
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
  if (!isOpen) return null;
  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-secondary rounded-lg shadow-xl border border-main w-full max-w-lg modal-content flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-text-main/70 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          <ul className="space-y-2">
            {items.length === 0 && (
              <li className="text-center text-text-main/70 p-4">No hay movimientos para mostrar.</li>
            )}
            {items.map((item, index) => (
              <li key={item.id || index} className="p-3 bg-main/50 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white">{item.description}</p>
                    {item.date && (
                      <p className="text-xs text-text-main/70">
                        {new Date(item.date?.toDate()).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
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
        <div className="p-4 border-t border-main bg-main/50 rounded-b-lg flex justify-end items-center">
          <span className="text-lg font-bold text-white">Total: {formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};
export default DetailModal;
// ===== FIN: src/components/modals/DetailModal.jsx =====