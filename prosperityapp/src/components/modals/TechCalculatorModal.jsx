import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../../context/DataContext';
import SearchableDropdown from '../ui/SearchableDropdown';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import CurrencyInput from '../ui/CurrencyInput';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

const calculateCostPerUnit = (item) => {
  const collabCost = item.collabCost || 0;
  const unitSize = item.unitSize || 1;
  return collabCost / unitSize;
};

const TechCalculatorModal = ({ isOpen, onClose, onSubmit, serviceName, initialProducts = [] }) => {
  const { t } = useTranslation();
  const { technicalInventory, isLoading } = useData();
  const { formatCurrency } = useCurrencyFormat();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [usedProducts, setUsedProducts] = useState(initialProducts);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', cost: '' });

  useEffect(() => {
    if (isOpen) {
      setUsedProducts(initialProducts || []);
      setSelectedProduct(null);
      setQuantity('');
      setManualItem({ name: '', cost: '' });
      setShowManualEntry(false);
      setTimeout(() => feather.replace(), 50);
    }
  }, [isOpen, initialProducts]);

  useEffect(() => {
    feather.replace();
  }, [usedProducts, showManualEntry]);

  const totalCost = useMemo(() => {
    if (!technicalInventory) return 0;
    return usedProducts.reduce((sum, usedProd) => {
      if (usedProd.id) {
        const productData = technicalInventory.find(item => item.id === usedProd.id);
        if (!productData) return sum;
        const costPerUnit = calculateCostPerUnit(productData);
        return sum + (costPerUnit * usedProd.quantity);
      }
      return sum + (usedProd.cost || 0);
    }, 0);
  }, [usedProducts, technicalInventory]);

  const handleAddProduct = () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      toast.error(t('modals.errors.selectProduct'));
      return;
    }
    const existing = usedProducts.find(p => p.id === selectedProduct.id);
    if (existing) {
      setUsedProducts(prev => prev.map(p =>
        p.id === selectedProduct.id ? { ...p, quantity: p.quantity + parseFloat(quantity) } : p
      ));
    } else {
      setUsedProducts(prev => [...prev, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        unit: selectedProduct.unitOfMeasure,
        quantity: parseFloat(quantity)
      }]);
    }
    setSelectedProduct(null);
    setQuantity('');
  };

  const handleAddManualProduct = () => {
    if (!manualItem.name || !manualItem.cost || manualItem.cost <= 0) {
      toast.error(t('modals.errors.completeFields'));
      return;
    }
    setUsedProducts(prev => [...prev, {
      id: null,
      name: manualItem.name,
      unit: 'manual',
      quantity: 1,
      cost: parseFloat(manualItem.cost)
    }]);
    setManualItem({ name: '', cost: '' });
  };

  const handleRemoveProduct = (index) => {
    setUsedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit(totalCost, usedProducts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-bg-secondary rounded-lg shadow-xl border-2 border-accent w-full max-w-lg modal-content flex flex-col">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-text-main">{t('modals.titles.techCalc')}</h3>
            <p className="text-sm text-text-muted">{serviceName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <SearchableDropdown
                items={technicalInventory || []}
                placeholder={isLoading ? t('common.loading') : t('modals.forms.productSearch')}
                onSelect={(p) => setSelectedProduct(p)}
                initialValue={selectedProduct}
                disabled={isLoading}
              />
            </div>
            <input
              type="number"
              placeholder={selectedProduct ? selectedProduct.unitOfMeasure : 'g/ml'}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
            />
            <button onClick={handleAddProduct} className="bg-bg-tertiary px-3 py-2 rounded hover:bg-bg-main/50 text-text-main">
              <i data-feather="plus" className="w-5 h-5"></i>
            </button>
          </div>

          <div className="text-center">
            <button type="button" onClick={() => setShowManualEntry(s => !s)} className="text-xs text-accent hover:underline">
              {t('modals.buttons.addManualItem')}
            </button>
          </div>

          <div className={`space-y-3 ${showManualEntry ? '' : 'hidden'}`}>
            <hr className="border-border-main/50" />
            <h4 className="font-semibold text-text-main text-sm">{t('modals.forms.manualRegistry')}</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('modals.forms.desc')}
                value={manualItem.name}
                onChange={(e) => setManualItem(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
              />
              <CurrencyInput
                placeholder={t('modals.forms.amount')}
                value={manualItem.cost}
                onChange={(e) => setManualItem(p => ({ ...p, cost: e.target.value }))}
                className="w-28 bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
              />
              <button onClick={handleAddManualProduct} className="bg-bg-tertiary px-3 py-2 rounded hover:bg-bg-main/50 text-text-main">
                <i data-feather="plus" className="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <div id="used-tech-products-list" className="text-sm text-text-main space-y-2 max-h-40 overflow-y-auto p-2 bg-bg-main/50 rounded">
            {usedProducts.length === 0 && !isLoading && <p className="text-text-muted">{t('modals.errors.noItems')}</p>}
            {usedProducts.map((p, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>
                  {p.id ? `${t('common.separator')} ${p.quantity}${p.unit} ${p.name}` : `${t('common.separator')} ${p.name} (${formatCurrency(p.cost)})`}
                </span>
                <button onClick={() => handleRemoveProduct(index)} className="text-red-400 hover:text-red-300">
                  <i data-feather="trash-2" className="w-4 h-4"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border-main flex justify-between items-center bg-bg-secondary rounded-b-lg">
          <p className="font-semibold text-text-main">{t('modals.forms.total')} <span className="text-accent text-lg">{formatCurrency(totalCost)}</span></p>
          <button onClick={handleSubmit} className="btn-golden py-2 px-4">
            {t('modals.buttons.saveCost')}
          </button>
        </div>
      </div>
    </div>
  );
};
export default TechCalculatorModal;