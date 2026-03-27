// ===== INICIO: src/pages/InventarioPage.jsx (Sprint 96 - Fix Auditoría) =====
import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import TechProductModal from '../components/modals/TechProductModal';
import RetailProductModal from '../components/modals/RetailProductModal';
import StockMovementModal from '../components/modals/StockMovementModal';
import { sbDelete, sbUpdate, sbCreate } from '../supabase/db';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('es-CL');
};

// --- Pestaña 1: Inventario Técnico ---
const TabInventarioTecnico = ({ handleOpenStockModal }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { technicalInventory, isLoading } = useData();
  const loading = isLoading;
  const error = null;

  const items = useMemo(() => {
    if (!technicalInventory) return [];
    let calculatedItems = technicalInventory.map(item => {
      const facturaCost = item.facturaCost || 0;
      const collabCost = item.collabCost || 0;
      const unitSize = item.unitSize || 1;
      const stockUnits = item.stockUnits || 0;
      const minStock = item.minStock || 3;
      return {
        ...item, stockUnits, facturaCost, collabCost, minStock,
        costPerGram: collabCost / unitSize,
        ganancia: collabCost - facturaCost,
        totalFacturaValue: stockUnits * facturaCost,
        totalCollabValue: stockUnits * collabCost,
        isLowStock: stockUnits <= minStock
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
  }, [technicalInventory, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    if (!technicalInventory) return [];
    const cats = technicalInventory.map(p => p.category || 'Sin Categoría');
    return [...new Set(cats)].sort();
  }, [technicalInventory]);

  useEffect(() => {
    if (!isLoading) feather.replace();
  }, [items, isModalOpen, isLoading]);

  const handleOpenCreateModal = () => { setProductToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (product) => { setProductToEdit(product); setIsModalOpen(true); };
  const handleDelete = async (product) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      const { error } = await sbDelete('technicalInventory', product.id);
      if (error) throw error;
      toast.success(t('common.success'));
    } catch (err) { console.error(err); toast.error(err.message); }
  };

  if (loading) return null;
  if (error) return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('inventory.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleOpenCreateModal} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded flex items-center">
          <i data-feather="plus" className="mr-2 h-5 w-5 text-black"></i>
          <span>{t('inventory.addTechBtn')}</span>
        </button>
      </div>
      <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
        <table className="w-full text-left min-w-[1200px]">
          <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
            <tr>
              <th className="p-3 font-semibold">{t('inventory.table.product')}</th>
              <th className="p-3 font-semibold text-center">{t('inventory.table.stock')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.minStock')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.size')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.invoiceCost')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.collabCost')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.costPerGram')}</th>
              <th className="p-3 font-semibold">{t('inventory.table.created')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map(p => {
              const lowStockClass = p.isLowStock ? 'bg-red-100 dark:bg-red-900/30' : 'hover:bg-bg-tertiary';
              return (
                <tr key={p.id} className={`border-b border-border-main text-sm ${lowStockClass}`}>
                  <td className="p-3 text-text-main font-semibold">{p.name} ({p.brand})</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenStockModal(p, 'salida', 'technicalInventory')} className="p-1 bg-red-200 hover:bg-red-300 dark:bg-red-700 dark:hover:bg-red-600 text-red-900 dark:text-white rounded-full">
                        <i data-feather="minus" className="w-4 h-4"></i>
                      </button>
                      <span className={`font-bold text-lg ${p.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-text-main'}`}>{p.stockUnits}</span>
                      <button onClick={() => handleOpenStockModal(p, 'ingreso', 'technicalInventory')} className="p-1 bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600 text-green-900 dark:text-white rounded-full">
                        <i data-feather="plus" className="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right text-text-muted">{p.minStock || 3}</td>
                  <td className="p-3 text-right text-text-main">{p.unitSize} {p.unitOfMeasure}</td>
                  <td className="p-3 text-right font-medium text-yellow-700 dark:text-yellow-400">{formatCurrency(p.facturaCost)}</td>
                  <td className="p-3 text-right font-medium text-blue-700 dark:text-cyan-400">{formatCurrency(p.collabCost)}</td>
                  <td className="p-3 text-right font-bold text-text-main">{formatCurrency(p.costPerGram)}</td>
                  <td className="p-3 text-text-muted text-xs">{formatDate(p.createdAt)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenEditModal(p)} className="p-1 text-text-muted hover:text-accent">
                      <i data-feather="edit" className="w-4 h-4"></i>
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1 text-text-muted hover:text-red-400">
                      <i data-feather="trash-2" className="w-4 h-4"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items && items.length === 0 && (<p className="text-center text-text-muted p-8">{t('dashboard.noData')}</p>)}
      </div>
      <TechProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />
    </div>
  );
}

// --- Pestaña 2: Inventario Retail ---
const TabInventarioRetail = ({ handleOpenStockModal }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { retailInventory, isLoading } = useData();
  const loading = isLoading;
  const error = null;

  const items = useMemo(() => {
    if (!retailInventory) return [];
    let calculatedItems = retailInventory.map(item => {
      const cost = item.cost || 0;
      const price = item.price || 0;
      const stock = item.stock || 0;
      const minStock = item.minStock || 3;
      return {
        ...item, stock, cost, price, minStock,
        ganancia: price - cost,
        totalStockValue: stock * cost,
        isLowStock: stock <= minStock
      }
    });
    if (selectedCategory !== 'all') {
      calculatedItems = calculatedItems.filter(item => item.category === selectedCategory);
    }
    if (searchTerm) {
      calculatedItems = calculatedItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    calculatedItems.sort((a, b) => a.name.localeCompare(b.name));
    return calculatedItems;
  }, [retailInventory, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    if (!retailInventory) return [];
    const cats = retailInventory.map(p => p.category || 'Sin Categoría');
    return [...new Set(cats)].sort();
  }, [retailInventory]);

  useEffect(() => {
    if (!isLoading) feather.replace();
  }, [items, isModalOpen, isLoading]);

  const handleOpenCreateModal = () => { setProductToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (product) => { setProductToEdit(product); setIsModalOpen(true); };
  const handleDelete = async (product) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      const { error } = await sbDelete('retailInventory', product.id);
      if (error) throw error;
      toast.success(t('common.success'));
    } catch (err) { console.error(err); toast.error(err.message); }
  };

  if (loading) return null;
  if (error) return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('inventory.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleOpenCreateModal} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded flex items-center">
          <i data-feather="plus" className="mr-2 h-5 w-5 text-black"></i>
          <span>{t('inventory.addRetailBtn')}</span>
        </button>
      </div>
      <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
            <tr>
              <th className="p-3 font-semibold">{t('inventory.table.product')}</th>
              <th className="p-3 font-semibold text-center">{t('inventory.table.stock')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.minStock')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.invoiceCost')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.salePrice')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.profit')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.totalValue')}</th>
              <th className="p-3 font-semibold">{t('inventory.table.created')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map(p => {
              const lowStockClass = p.isLowStock ? 'bg-red-100 dark:bg-red-900/30' : 'hover:bg-bg-tertiary';
              return (
                <tr key={p.id} className={`border-b border-border-main text-sm ${lowStockClass}`}>
                  <td className="p-3 text-text-main font-semibold">{p.name} ({p.brand})</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenStockModal(p, 'salida', 'retailInventory')} className="p-1 bg-red-200 hover:bg-red-300 dark:bg-red-700 dark:hover:bg-red-600 text-red-900 dark:text-white rounded-full">
                        <i data-feather="minus" className="w-4 h-4"></i>
                      </button>
                      <span className={`font-bold text-lg ${p.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-text-main'}`}>{p.stock}</span>
                      <button onClick={() => handleOpenStockModal(p, 'ingreso', 'retailInventory')} className="p-1 bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600 text-green-900 dark:text-white rounded-full">
                        <i data-feather="plus" className="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right text-text-muted">{p.minStock || 3}</td>
                  <td className="p-3 text-right font-medium text-yellow-700 dark:text-yellow-400">{formatCurrency(p.cost)}</td>
                  <td className="p-3 text-right font-medium text-blue-700 dark:text-cyan-400">{formatCurrency(p.price)}</td>
                  <td className="p-3 text-right font-medium text-green-700 dark:text-green-400">{formatCurrency(p.ganancia)}</td>
                  <td className="p-3 text-right font-bold text-text-main">{formatCurrency(p.totalStockValue)}</td>
                  <td className="p-3 text-text-muted text-xs">{formatDate(p.createdAt)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenEditModal(p)} className="p-1 text-text-muted hover:text-accent">
                      <i data-feather="edit" className="w-4 h-4"></i>
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1 text-text-muted hover:text-red-400">
                      <i data-feather="trash-2" className="w-4 h-4"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items && items.length === 0 && (<p className="text-center text-text-muted p-8">{t('dashboard.noData')}</p>)}
      </div>
      <RetailProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />
    </div>
  );
}

// --- Componente Principal de la Página ---
const InventarioPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('technical');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [movementType, setMovementType] = useState('ingreso');
  const [collectionName, setCollectionName] = useState('technicalInventory');
  const { isLoading, businessId } = useData();

  useEffect(() => {
    if (!isLoading) feather.replace();
  }, [activeTab, isLoading]);

  const handleOpenStockModal = (product, type, collection) => {
    setCurrentProduct(product);
    setMovementType(type);
    setCollectionName(collection);
    setIsStockModalOpen(true);
  };

  const handleSaveStockMovement = async (product, amount, reason, newStock) => {
    const stockField = collectionName === 'technicalInventory' ? 'stockCurrent' : 'stockCurrent';
    const tableName = collectionName; // ya está mapeado en tableMap.js
    await Promise.all([
      sbUpdate(tableName, product.id, { [stockField]: newStock }),
      sbCreate('stockMovements', {
        product_id: product.id,
        product_name: product.name,
        amount,
        reason,
        new_stock: newStock,
        collection_name: collectionName,
      }, businessId),
    ]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-main">{t('inventory.title')}</h2>
        <Link
          to="/app/inventario/auditoria"
          className="btn-golden bg-bg-tertiary text-text-main text-sm py-2 px-3 flex items-center gap-2 border border-border-main rounded-md hover:bg-bg-main/50" // <-- FIX BOTON AUDITORIA
        >
          <i data-feather="archive" className="w-4 h-4"></i> {t('inventory.auditBtn')}
        </Link>
      </div>
      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <div className="flex rounded-md bg-bg-main/50 p-1">
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'technical' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('inventory.tabs.tech')}
          </button>
          <button
            onClick={() => setActiveTab('retail')}
            className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'retail' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('inventory.tabs.retail')}
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {activeTab === 'technical' && <TabInventarioTecnico handleOpenStockModal={handleOpenStockModal} />}
        {activeTab === 'retail' && <TabInventarioRetail handleOpenStockModal={handleOpenStockModal} />}
      </div>

      <StockMovementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={currentProduct}
        movementType={movementType}
        onSave={handleSaveStockMovement}
      />
    </div>
  );
};

export default InventarioPage;
// ===== FIN: src/pages/InventarioPage.jsx (Sprint 96 - Fix Auditoría) =====
