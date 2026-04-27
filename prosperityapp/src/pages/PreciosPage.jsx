// ===== INICIO: src/pages/PreciosPage.jsx (Sprint 94) =====
import React, { useMemo, useEffect, useState } from 'react';
import feather from 'feather-icons';
import ServiceModal from '../components/modals/ServiceModal';
import { sbDelete } from '../supabase/db';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // <-- Importar
import { safeNum } from '../lib/mathUtils';
import { useServices } from '../context/collections/ServicesContext';

const formatCurrency = (value) => {
  const num = safeNum(value);
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num);
};

const PreciosPage = () => {
  const { t } = useTranslation(); // <-- Hook

  const {
    services,
    loading: loadingServices
  } = useServices();

  const isLoading = loadingServices;
  const loading = isLoading;
  const error = null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [visibleCount, setVisibleCount] = useState(5);

  const servicesByCategory = useMemo(() => {
    if (!services) return {};
    return services.reduce((acc, service) => {
      const category = service.category || t('inventory.noCategory'); // Usar traducción si está vacía
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});
  }, [services, t]);

  const filteredAndSortedCategories = useMemo(() => {
    let categories = {};
    if (selectedCategory !== 'all') {
      if (servicesByCategory[selectedCategory]) {
        categories[selectedCategory] = servicesByCategory[selectedCategory];
      }
    } else {
      categories = { ...servicesByCategory };
    }
    if (searchTerm) {
      categories = Object.keys(categories).reduce((acc, category) => {
        const filteredServices = categories[category].filter(service =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if ((filteredServices || []).length > 0) {
          acc[category] = filteredServices;
        }
        return acc;
      }, {});
    }
    Object.keys(categories).forEach(category => {
      categories[category] = [...categories[category]].sort((a, b) => {
        switch (sortOrder) {
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          case 'name-desc': return b.name.localeCompare(a.name);
          default: return a.name.localeCompare(b.name);
        }
      });
    });
    return categories;
  }, [servicesByCategory, searchTerm, selectedCategory, sortOrder]);

  const orderedCategories = useMemo(() => Object.keys(servicesByCategory).sort(), [servicesByCategory]);

  useEffect(() => {
    if (!isLoading) {
      feather.replace();
    }
  }, [isLoading, services, filteredAndSortedCategories, isModalOpen]);

  const handleOpenCreateModal = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (service) => {
    setServiceToEdit(service);
    setIsModalOpen(true);
  };
  const handleDeleteService = async (service) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      const { error } = await sbDelete('services', service.id);
      if (error) throw error;
      toast.success(t('common.success'));
    } catch (err) {
      console.warn(err);
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return null;
  }
  if (error) {
    return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main">{t('prices.title')}</h2>
          <p className="text-text-muted text-sm">{t('prices.subtitle')}</p>
        </div>
        <button onClick={handleOpenCreateModal} className="sm:flex-none btn-golden flex items-center justify-center gap-2">
          <i data-feather="plus" className="h-4 w-4"></i>
          <span className="text-sm">{t('prices.addBtn')}</span>
        </button>
      </div>
      {/* Filtros - stack vertical en mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 bg-bg-secondary p-3 sm:p-4 rounded-lg border border-border-main">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main text-sm"
          placeholder={t('prices.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <select 
            className="flex-1 bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">{t('prices.allCategories')}</option>
            {orderedCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="flex-1 bg-bg-tertiary border border-border-main rounded p-2 text-text-main text-sm"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="name-asc">{t('prices.sort.nameAsc')}</option>
            <option value="name-desc">{t('prices.sort.nameDesc')}</option>
            <option value="price-asc">{t('prices.sort.priceAsc')}</option>
            <option value="price-desc">{t('prices.sort.priceDesc')}</option>
          </select>
        </div>
      </div>
      <div id="servicios-list-container" className="flex-grow overflow-y-auto space-y-3 pb-24 sm:pb-4">
        {Object.keys(filteredAndSortedCategories).slice(0, visibleCount).map((category, index) => (
          <details key={category} className="bg-bg-secondary rounded-lg border border-border-main" open={index < 5}>
            <summary className="p-3 sm:p-4 font-semibold text-base sm:text-lg cursor-pointer flex justify-between items-center text-text-main hover:bg-bg-tertiary rounded-lg">
              <span>{category}</span>
              <i data-feather="chevron-down" className="text-text-muted w-4 h-4 flex-shrink-0"></i>
            </summary>
            <div className="p-3 border-t border-border-main">
              <ul className="space-y-1">
                {filteredAndSortedCategories[category].map((s) => (
                    <li key={s.id} className="flex justify-between items-center p-2 rounded-md hover:bg-bg-tertiary">
                      <span className="text-text-secondary text-sm">{s.name}</span>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="font-semibold text-accent text-sm">{formatCurrency(s.price)}</span>
                        <div className="flex gap-0.5">
                          <button onClick={() => handleOpenEditModal(s)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent">
                            <i data-feather="edit" className="w-4 h-4"></i>
                          </button>
                          <button onClick={() => handleDeleteService(s)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-red-400">
                            <i data-feather="trash-2" className="w-4 h-4"></i>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </details>
        ))}
         {Object.keys(filteredAndSortedCategories).length === 0 && (
            <div className="text-center p-8 bg-bg-secondary rounded-lg">
              <p className="text-text-muted">{t('prices.noServices')}</p>
            </div>
         )}
         {visibleCount < Object.keys(filteredAndSortedCategories).length && (
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="px-6 py-2 bg-bg-tertiary text-text-main rounded-lg hover:bg-bg-main border border-border-main"
              >
                {t('prices.loadMore') || 'Cargar más'}
              </button>
            </div>
         )}
      </div>
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceToEdit={serviceToEdit}
      />
    </div>
  );
};
export default PreciosPage;
// ===== FIN: src/pages/PreciosPage.jsx (Sprint 94) =====