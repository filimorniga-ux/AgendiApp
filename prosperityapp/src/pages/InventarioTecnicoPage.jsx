// ===== INICIO: src/pages/InventarioTecnicoPage.jsx =====
import React, { useMemo, useEffect, useState } from 'react';
import feather from 'feather-icons';
import TechProductModal from '../components/modals/TechProductModal';
import { sbDelete } from '../supabase/db';
import toast from 'react-hot-toast';
import { safeNum } from '../lib/mathUtils';
import { BarcodeScanner } from '../components/barcode/BarcodeScanner';
import { BarcodeScannerButton } from '../components/barcode/BarcodeScannerButton';
import { StockEntryModal } from '../components/inventory/StockEntryModal';
import { StockExitModal } from '../components/inventory/StockExitModal';
import { QuickCreateProductModal } from '../components/inventory/QuickCreateProductModal';
import { useBarcodeLookup } from '../hooks/useBarcodeLookup';
import { useInventory } from '../context/collections/InventoryContext';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const InventarioTecnicoPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20);

  const {
    technicalInventory: techInventory,
    loading: loadingInventory
  } = useInventory();

  const loading = loadingInventory;
  const error = null;

  // ── Barcode scanner ─────────────────────────────────────────────────────
  const [scannerActive, setScannerActive] = useState(false);
  const [scanMode, setScanMode] = useState('entry');
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

  const items = useMemo(() => {
    if (!techInventory) return [];
    let calculatedItems = techInventory.map(item => {
      const facturaCost = safeNum(item.facturaCost);
      const collabCost = safeNum(item.collabCost);
      const unitSize = safeNum(item.unitSize, 1);
      const stockUnits = safeNum(item.stockUnits);
      return {
        ...item,
        totalStockValue: stockUnits * facturaCost,
        costPerGram: item.sellMode === 'whole' ? collabCost : Number((collabCost / unitSize).toFixed(4))
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
    return [...calculatedItems].sort((a, b) => a.name.localeCompare(b.name));
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
      console.warn(err);
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
          <h2 className="text-3xl font-bold text-text-main">Inventario Técnico</h2>
          <p className="text-text-main/70">Gestiona los productos de uso interno (costos).</p>
        </div>
        <div className="flex items-center gap-2">
          {scannerActive && (
            <div className="flex rounded-md bg-bg-main/50 p-1 border border-border-main">
              <button onClick={() => setScanMode('entry')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${scanMode === 'entry' ? 'bg-green-600 text-white' : 'text-text-muted hover:text-text-main'}`}
              >📦 Entrada</button>
              <button onClick={() => setScanMode('exit')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${scanMode === 'exit' ? 'bg-orange-600 text-white' : 'text-text-muted hover:text-text-main'}`}
              >📤 Salida</button>
            </div>
          )}
          <BarcodeScannerButton active={scannerActive} onToggle={() => setScannerActive(v => !v)} />
          <button onClick={handleOpenCreateModal} className="btn-golden flex items-center">
            <i data-feather="plus" className="mr-2 h-5 w-5"></i>
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {scannerActive && (
        <BarcodeScanner active={scannerActive} onScan={handleBarcodeScan} onClose={() => setScannerActive(false)} mode="keyboard" />
      )}
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
                <th className="p-3 font-semibold text-center">Modo</th>
                <th className="p-3 font-semibold text-right">Costo Factura</th>
                <th className="p-3 font-semibold text-right">Costo Colab.</th>
                <th className="p-3 font-semibold text-right">Valor Total (Factura)</th>
                <th className="p-3 font-semibold text-right">Costo Unitario (Colab)</th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).slice(0, visibleCount).map(p => (
                <tr key={p.id} className="border-b border-border-main text-sm hover:bg-tertiary/50">
                  <td className="p-3 text-text-main font-semibold">{p.name}</td>
                  <td className="p-3">{p.brand}</td>
                  <td className="p-3 text-right font-bold">{p.stockUnits}</td>
                  <td className="p-3 text-right">{p.sellMode === 'whole' ? 'Unidad' : `${p.unitSize} ${p.unitOfMeasure}`}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      p.sellMode === 'whole'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {p.sellMode === 'whole' ? '📦 Completo' : '⚗️ Fraccionado'}
                    </span>
                  </td>
                  <td className="p-3 text-right text-yellow-400">{formatCurrency(p.facturaCost)}</td>
                  <td className="p-3 text-right text-cyan-400">{formatCurrency(p.collabCost)}</td>
                  <td className="p-3 text-right font-semibold text-text-main">{formatCurrency(p.totalStockValue)}</td>
                  <td className="p-3 text-right font-semibold text-accent">
                    {p.sellMode === 'whole'
                      ? formatCurrency(p.collabCost)
                      : `${formatCurrency(p.costPerGram)}/${p.unitOfMeasure || 'g'}`
                    }
                  </td>
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
      {items && visibleCount < items.length && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + 20)}
            className="px-6 py-2 bg-bg-tertiary text-text-main rounded-lg hover:bg-bg-main border border-border-main"
          >
            {t('common.loadMore') || 'Cargar más'}
          </button>
        </div>
      )}
      <TechProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
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
export default InventarioTecnicoPage;
// ===== FIN: src/pages/InventarioTecnicoPage.jsx =====