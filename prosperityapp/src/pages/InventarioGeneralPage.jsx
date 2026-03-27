// ===== INICIO: src/pages/InventarioGeneralPage.jsx =====
import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const InventarioGeneralPage = () => {
  const [activeTab, setActiveTab] = useState('technical');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { technicalInventory: techInventory, retailInventory, isLoading } = useData();

  useEffect(() => {
    feather.replace();
  }, [activeTab, searchTerm, techInventory, retailInventory]);

  const { categories, totalValue } = useMemo(() => {
    const inventory = activeTab === 'technical' ? techInventory : retailInventory;
    if (!inventory) return { categories: {}, totalValue: 0 };
    
    let totalValue = 0;
    const categories = inventory
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .reduce((acc, item) => {
        const category = item.category || 'Sin Categoría';
        if (!acc[category]) {
          acc[category] = { items: [], totalStock: 0, totalValue: 0 };
        }
        
        // Usar el nuevo modelo de datos
        const stock = item.stockUnits || item.stock || 0;
        const cost = item.facturaCost || item.cost || 0;
        const itemValue = stock * cost;

        acc[category].items.push({ ...item, stock, cost, itemValue });
        acc[category].totalStock += stock;
        acc[category].totalValue += itemValue;
        totalValue += itemValue;
        
        return acc;
      }, {});
      
    return { categories: Object.entries(categories).sort(([a], [b]) => a.localeCompare(b)), totalValue };
  }, [activeTab, searchTerm, techInventory, retailInventory]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Inventario General</h2>
          <p className="text-text-main/70">Vista general de existencias y valorización.</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-border-main">
          <p className="text-sm text-text-main/70">Valor Total del Inventario</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-secondary p-4 rounded-lg border border-border-main">
        <div className="flex rounded-md bg-main/50 p-1">
          <button 
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'technical' ? 'bg-accent text-accent-text' : 'text-text-main/70 hover:text-white'}`}
          >
            Inventario Técnico
          </button>
          <button 
            onClick={() => setActiveTab('retail')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'retail' ? 'bg-accent text-accent-text' : 'text-text-main/70 hover:text-white'}`}
          >
            Inventario Retail (Venta)
          </button>
        </div>
        <input
          type="search"
          className="flex-grow bg-tertiary border border-border-main rounded p-2 placeholder-text-main/40"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {isLoading ? (
          <p>Cargando inventario...</p>
        ) : categories.length === 0 ? (
          <p className="text-text-main/70 text-center p-8">No hay productos en esta categoría.</p>
        ) : (
          categories.map(([categoryName, data]) => (
            <details key={categoryName} className="bg-secondary rounded-lg border border-border-main" open>
              <summary className="p-4 font-semibold text-lg cursor-pointer flex justify-between text-white hover:bg-tertiary/50">
                <span>{categoryName} <span className="text-sm text-text-main/70">({data.totalStock} items)</span></span>
                <span className="text-accent">{formatCurrency(data.totalValue)}</span>
              </summary>
              <div className="p-4 border-t border-border-main">
                <ul className="space-y-1">
                  {data.items.map(item => (
                    <li key={item.id} className="grid grid-cols-3 items-center p-2 text-sm">
                      <span className="text-text-main/90">{item.name}</span>
                      <span className="text-center">{item.stock} uds.</span>
                      <span className="text-right font-semibold">{formatCurrency(item.itemValue)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
};
export default InventarioGeneralPage;
// ===== FIN: src/pages/InventarioGeneralPage.jsx =====