// ===== INICIO: src/pages/InventarioPage.jsx =====
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
import { BarcodeScanner } from '../components/barcode/BarcodeScanner';
import { BarcodeScannerButton } from '../components/barcode/BarcodeScannerButton';
import { StockEntryModal } from '../components/inventory/StockEntryModal';
import { StockExitModal } from '../components/inventory/StockExitModal';
import { QuickCreateProductModal } from '../components/inventory/QuickCreateProductModal';
import { useBarcodeLookup } from '../hooks/useBarcodeLookup';
import { LotRow } from '../components/inventory/LotRow';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Supabase: string ISO | Firestore legacy: { seconds }
  if (typeof timestamp === 'string' || timestamp instanceof Date) {
    return new Date(timestamp).toLocaleDateString('es-CL');
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-CL');
  }
  return 'N/A';
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
        costPerGram: item.sellMode === 'whole' ? collabCost : (collabCost / unitSize),
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
    } catch (err) { console.warn(err); toast.error(err.message); }
  };

  if (loading) return (
    <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
      <table className="w-full text-left min-w-[1200px]">
        <thead className="bg-bg-main/50">
          <tr>
            {[...Array(10)].map((_, i) => (
              <th key={i} className="p-3"><div className="skeleton h-3 w-20 rounded" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i} className="border-b border-border-main">
              {[...Array(10)].map((_, j) => (
                <td key={j} className="p-3">
                  <div className={`skeleton h-4 rounded ${j === 0 ? 'w-36' : 'w-16'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
              <th className="p-3 font-semibold text-center">Modo</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.invoiceCost')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.collabCost')}</th>
              <th className="p-3 font-semibold text-right">Costo Unitario</th>
              <th className="p-3 font-semibold">{t('inventory.table.created')}</th>
              <th className="p-3 font-semibold text-right">{t('inventory.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((p, i) => {
              const lowStockClass = p.isLowStock
                ? 'bg-red-500/10 border-l-2 border-l-red-500 animate-pulseSoft'
                : 'hover:bg-bg-tertiary transition-colors';
              return (
                <React.Fragment key={p.id}>
                  <tr className={`border-b border-border-main text-sm animate-fadeInUp stagger-${Math.min(i + 1, 8)} ${lowStockClass}`}>
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
                    <td className="p-3 text-right text-text-main">{p.sellMode === 'whole' ? 'Unidad' : `${p.unitSize} ${p.unitOfMeasure}`}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        p.sellMode === 'whole'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.sellMode === 'whole' ? '📦 Completo' : '⚗️ Fraccionado'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-yellow-700 dark:text-yellow-400">{formatCurrency(p.facturaCost)}</td>
                    <td className="p-3 text-right font-medium text-blue-700 dark:text-cyan-400">{formatCurrency(p.collabCost)}</td>
                    <td className="p-3 text-right font-bold text-text-main">
                      {p.sellMode === 'whole'
                        ? formatCurrency(p.collabCost)
                        : `${formatCurrency(p.costPerGram)}/${p.unitOfMeasure || 'g'}`
                      }
                    </td>
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
                  {/* Fila expandible de lotes */}
                  <tr className="border-b border-border-main/50">
                    <td colSpan={10} className="px-3 py-1">
                      <LotRow productId={p.id} inventoryType="technical" productName={p.name} sellMode={p.sellMode} unitSize={p.unitSize} unitOfMeasure={p.unitOfMeasure} />
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {items && items.length === 0 && (
          <div className="text-center text-text-muted p-12 animate-fadeInUp">
            <div className="animate-float inline-block mb-4">
              <i data-feather="package" className="w-16 h-16 mx-auto opacity-20"></i>
            </div>
            <p className="font-semibold text-lg mb-1">Sin productos</p>
            <p className="text-sm opacity-60">{t('dashboard.noData')}</p>
          </div>
        )}
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
    } catch (err) { console.warn(err); toast.error(err.message); }
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
                <React.Fragment key={p.id}>
                  <tr className={`border-b border-border-main text-sm ${lowStockClass}`}>
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
                  {/* Fila expandible de lotes */}
                  <tr className="border-b border-border-main/50">
                    <td colSpan={9} className="px-3 py-1">
                      <LotRow productId={p.id} inventoryType="retail" productName={p.name} />
                    </td>
                  </tr>
                </React.Fragment>
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

  // ── Barcode scanner state ─────────────────────────────────────────────────
  const [scannerActive, setScannerActive] = useState(false);
  const [scanMode, setScanMode] = useState('entry'); // 'entry' | 'exit'
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeInvType, setBarcodeInvType] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');
  const { lookup, loading: lookupLoading } = useBarcodeLookup();

  const handleBarcodeScan = async (code) => {
    if (lookupLoading) return;
    setLastBarcode(code);
    const { product, inventoryType, found } = await lookup(code);
    if (found) {
      setBarcodeProduct(product);
      setBarcodeInvType(inventoryType);
      if (scanMode === 'entry') setShowEntryModal(true);
      else setShowExitModal(true);
    } else {
      toast('Código no encontrado — crear producto', { icon: '🔍' });
      setShowQuickCreate(true);
    }
  };

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
    const stockField = 'stockCurrent';
    const tableName = collectionName;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-main">{t('inventory.title')}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Modo de escaneo */}
          {scannerActive && (
            <div className="flex rounded-md bg-bg-main/50 p-1 border border-border-main">
              <button
                onClick={() => setScanMode('entry')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  scanMode === 'entry' ? 'bg-green-600 text-white' : 'text-text-muted hover:text-text-main'
                }`}
              >📦 Entrada</button>
              <button
                onClick={() => setScanMode('exit')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  scanMode === 'exit' ? 'bg-orange-600 text-white' : 'text-text-muted hover:text-text-main'
                }`}
              >📤 Salida</button>
            </div>
          )}
          <BarcodeScannerButton
            active={scannerActive}
            onToggle={() => setScannerActive(v => !v)}
          />
          <Link
            to="/app/inventario/auditoria"
            className="btn-golden bg-bg-tertiary text-text-main text-sm py-2 px-3 flex items-center gap-2 border border-border-main rounded-md hover:bg-bg-main/50"
          >
            <i data-feather="archive" className="w-4 h-4"></i> <span className="hidden sm:inline">{t('inventory.auditBtn')}</span>
          </Link>
        </div>
      </div>

      {/* Scanner activo: barra indicadora */}
      {scannerActive && (
        <BarcodeScanner
          active={scannerActive}
          onScan={handleBarcodeScan}
          onClose={() => setScannerActive(false)}
          mode="keyboard"
        />
      )}

      <div className="flex flex-wrap gap-4 mb-4 bg-bg-secondary p-3 sm:p-4 rounded-lg border border-border-main overflow-x-auto">
        <div className="flex rounded-md bg-bg-main/50 p-1 min-w-max">
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded whitespace-nowrap ${activeTab === 'technical' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('inventory.tabs.tech')}
          </button>
          <button
            onClick={() => setActiveTab('retail')}
            className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded whitespace-nowrap ${activeTab === 'retail' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}
          >
            {t('inventory.tabs.retail')}
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pb-24 sm:pb-4">
        {activeTab === 'technical' && <TabInventarioTecnico handleOpenStockModal={handleOpenStockModal} />}
        {activeTab === 'retail' && <TabInventarioRetail handleOpenStockModal={handleOpenStockModal} />}
      </div>

      {/* Legacy stock modal */}
      <StockMovementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={currentProduct}
        movementType={movementType}
        onSave={handleSaveStockMovement}
      />

      {/* Barcode modals */}
      {showEntryModal && barcodeProduct && (
        <StockEntryModal
          product={barcodeProduct}
          inventoryType={barcodeInvType}
          onClose={() => { setShowEntryModal(false); setBarcodeProduct(null); }}
          onSuccess={({ newStock }) => toast.success(`✅ Stock actualizado → ${newStock}`)}
        />
      )}
      {showExitModal && barcodeProduct && (
        <StockExitModal
          product={barcodeProduct}
          inventoryType={barcodeInvType}
          onClose={() => { setShowExitModal(false); setBarcodeProduct(null); }}
          onSuccess={({ newStock }) => toast.success(`📤 Salida registrada → stock: ${newStock}`)}
        />
      )}
      {showQuickCreate && (
        <QuickCreateProductModal
          barcode={lastBarcode}
          onClose={() => setShowQuickCreate(false)}
          onCreated={({ product, inventoryType }) => {
            toast.success(`✅ Producto creado: ${product.name}`);
            setBarcodeProduct(product);
            setBarcodeInvType(inventoryType);
            if (scanMode === 'entry') setShowEntryModal(true);
            else setShowExitModal(true);
          }}
        />
      )}
    </div>
  );
};

export default InventarioPage;
// ===== FIN: src/pages/InventarioPage.jsx (Sprint 96 - Fix Auditoría) =====
