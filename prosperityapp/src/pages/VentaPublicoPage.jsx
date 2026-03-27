// ===== INICIO: src/pages/VentaPublicoPage.jsx (CORREGIDO) =====
import React, { useMemo, useEffect, useState } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import RetailProductModal from '../components/modals/RetailProductModal';
import { db } from '../firebase/config';
import { doc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const VentaPublicoPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const { retailInventory, isLoading: loading } = useData();
  const error = null; // Removed as context handles it globally
  
  const filteredItems = useMemo(() => {
    if (!retailInventory) return [];
    let items = retailInventory.map(p => ({
      ...p,
      cost: p.cost || 0,
      price: p.price || 0,
      stock: p.stock || 0,
    }));
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }
    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    items.sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'stock-asc': return a.stock - b.stock;
        case 'stock-desc': return b.stock - a.stock;
        case 'name-desc': return b.name.localeCompare(a.name);
        default: return a.name.localeCompare(b.name);
      }
    });
    return items;
  }, [retailInventory, searchTerm, selectedCategory, sortOrder]);

  const categories = useMemo(() => {
    if (!retailInventory) return [];
    const cats = retailInventory.map(p => p.category || 'Sin Categoría');
    return [...new Set(cats)].sort();
  }, [retailInventory]);

  useEffect(() => {
    feather.replace();
  }, [filteredItems, isModalOpen]);

  const handleOpenCreateModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };
  const handleDelete = async (product) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${product.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'retailInventory', product.id));
      toast.success('Producto eliminado');
    } catch (err) {
      console.warn(err);
      toast.error(err.message);
    }
  };

  if (loading) {
    return <h1 className="text-2xl font-bold p-8">Cargando productos...</h1>;
  }
  if (error) {
    return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Venta al Público</h2>
          <p className="text-text-main/70">Gestiona los productos para la venta.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn-golden flex items-center">
          <i data-feather="plus" className="mr-2 h-5 w-5"></i>
          <span>Agregar Producto</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-4 mb-6 bg-secondary p-4 rounded-lg border border-border-main">
        <input 
          type="search" 
          className="flex-grow bg-tertiary border border-border-main rounded p-2 placeholder-text-main/40" 
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="bg-tertiary border border-border-main rounded p-2"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          className="bg-tertiary border border-border-main rounded p-2"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="name-asc">Nombre (A-Z)</option>
          <option value="name-desc">Nombre (Z-A)</option>
          <option value="price-asc">Precio (Menor a Mayor)</option>
          <option value="price-desc">Precio (Mayor a Menor)</option>
          <option value="stock-asc">Stock (Menor a Mayor)</option>
          <option value="stock-desc">Stock (Mayor a Menor)</option>
        </select>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {(filteredItems || []).map(p => {
            const ganancia = (p.price - p.cost);
            return (
              <div key={p.id} className="bg-secondary rounded-lg overflow-hidden border border-border-main group relative">
                <img 
                  src={p.photo || '[https://placehold.co/400x400/2d3748/f6e05e?text=G](https://placehold.co/400x400/2d3748/f6e05e?text=G)'} 
                  alt={p.name} 
                  className="h-48 w-full object-cover"
                />
                <div className="p-4">
                  <h4 className="font-bold text-white truncate" title={p.name}>{p.name}</h4>
                  <p className="text-sm text-text-main/70">{p.brand}</p>
                  <div className="mt-2">
                    <span className="font-bold text-lg text-accent">{formatCurrency(p.price)}</span>
                    <span className={`text-xs ml-2 font-semibold px-2 py-1 rounded-full ${
                      p.stock <= 3 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                    }`}>
                      {p.stock} en stock
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-text-main/70">
                    <div className="flex justify-between">
                      <span>Costo:</span>
                      <span className="font-semibold">{formatCurrency(p.cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ganancia:</span>
                      <span className="font-semibold text-green-400">{formatCurrency(ganancia)}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditModal(p)} className="p-2 bg-black/50 rounded-full text-white hover:bg-accent hover:text-accent-text">
                    <i data-feather="edit-2" className="w-4 h-4"></i>
                  </button>
                  <button onClick={() => handleDelete(p)} className="p-2 bg-black/50 rounded-full text-white hover:bg-red-500">
                    <i data-feather="trash-2" className="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        {filteredItems && filteredItems.length === 0 && (
          <p className="text-center text-text-main/70 p-8">No se encontraron productos.</p>
        )}
      </div>
      <RetailProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />
    </div>
  );
};
export default VentaPublicoPage;
// ===== FIN: src/pages/VentaPublicoPage.jsx =====