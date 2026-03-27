// ===== INICIO: src/pages/InventarioTecnicoPage.jsx (FINAL) =====
import React, { useMemo, useEffect, useState } from 'react';
import feather from 'feather-icons';
import { useCollection } from '../hooks/useCollection';
import TechProductModal from '../components/modals/TechProductModal';
import { sbDelete } from '../supabase/db';
import toast from 'react-hot-toast';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const InventarioTecnicoPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: techInventory, loading, error } = useCollection('technicalInventory');

  const items = useMemo(() => {
    if (!techInventory) return [];
    let calculatedItems = techInventory.map(item => {
      const facturaCost = item.facturaCost || 0;
      const collabCost = item.collabCost || 0;
      const unitSize = item.unitSize || 1;
      const stockUnits = item.stockUnits || 0;
      return {
        ...item,
        totalStockValue: stockUnits * facturaCost,
        costPerGram: collabCost / unitSize
      }
    });
    if (selectedCategory !== 'all') {
      calculatedItems = calculatedItems.filter(item => item.category === selectedCategory);
    }
    if (searchTerm) {
      calculatedItems = calculatedItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    calculatedItems.sort((a, b) => a.name.localeCompare(b.name));
    return calculatedItems;
  }, [techInventory, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    if (!techInventory) return [];
    const cats = techInventory.map(p => p.category || 'Sin Categoría');
    return [...new Set(cats)].sort();
  }, [techInventory]);

  useEffect(() => {
    feather.replace();
  }, [items, isModalOpen]);

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
      const { error } = await sbDelete('technicalInventory', product.id);
      if (error) throw error;
      toast.success('Producto eliminado');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  if (loading) {
    return <h1 className="text-2xl font-bold p-8">Cargando inventario técnico...</h1>;
  }
  if (error) {
    return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Inventario Técnico</h2>
          <p className="text-text-main/70">Gestiona los productos de uso interno (costos).</p>
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
          placeholder="Buscar por producto o marca..."
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
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="bg-secondary rounded-lg border border-border-main overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-main/50 text-xs uppercase text-text-main/70">
              <tr>
                <th className="p-3 font-semibold">Producto</th>
                <th className="p-3 font-semibold">Marca</th>
                <th className="p-3 font-semibold text-right">Unid. Stock</th>
                <th className="p-3 font-semibold text-right">Tamaño (g/ml)</th>
                <th className="p-3 font-semibold text-right">Costo Factura</th>
                <th className="p-3 font-semibold text-right">Costo Colab.</th>
                <th className="p-3 font-semibold text-right">Valor Total (Factura)</th>
                <th className="p-3 font-semibold text-right">Costo / g(ml) (Colab)</th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map(p => (
                <tr key={p.id} className="border-b border-border-main text-sm hover:bg-tertiary/50">
                  <td className="p-3 text-white font-semibold">{p.name}</td>
                  <td className="p-3">{p.brand}</td>
                  <td className="p-3 text-right font-bold">{p.stockUnits}</td>
                  <td className="p-3 text-right">{p.unitSize} {p.unitOfMeasure}</td>
                  <td className="p-3 text-right text-yellow-400">{formatCurrency(p.facturaCost)}</td>
                  <td className="p-3 text-right text-cyan-400">{formatCurrency(p.collabCost)}</td>
                  <td className="p-3 text-right font-semibold text-white">{formatCurrency(p.totalStockValue)}</td>
                  <td className="p-3 text-right font-semibold text-accent">{formatCurrency(p.costPerGram)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenEditModal(p)} className="p-1 text-text-main/70 hover:text-accent">
                      <i data-feather="edit" className="w-4 h-4"></i>
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1 text-text-main/70 hover:text-red-400">
                      <i data-feather="trash-2" className="w-4 h-4"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items && items.length === 0 && (
            <p className="text-center text-text-main/70 p-8">No se encontraron productos.</p>
          )}
        </div>
      </div>
      <TechProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />
    </div>
  );
};
export default InventarioTecnicoPage;
// ===== FIN: src/pages/InventarioTecnicoPage.jsx (FINAL) =====