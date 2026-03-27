// ===== INICIO: src/pages/PreciosPage.jsx (Sprint 94) =====
import React, { useMemo, useEffect, useState } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import ServiceModal from '../components/modals/ServiceModal';
import { sbDelete } from '../supabase/db';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // <-- Importar

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const PreciosPage = () => {
  const { t } = useTranslation(); // <-- Hook
  const { services, isLoading } = useData();
  const loading = isLoading;
  const error = null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('name-asc');

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
        if (filteredServices.length > 0) {
          acc[category] = filteredServices;
        }
        return acc;
      }, {});
    }
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => {
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main">{t('prices.title')}</h2>
          <p className="text-text-muted">{t('prices.subtitle')}</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn-golden flex items-center">
          <i data-feather="plus" className="mr-2 h-5 w-5"></i>
          <span>{t('prices.addBtn')}</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('prices.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">{t('prices.allCategories')}</option>
          {orderedCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="name-asc">{t('prices.sort.nameAsc')}</option>
          <option value="name-desc">{t('prices.sort.nameDesc')}</option>
          <option value="price-asc">{t('prices.sort.priceAsc')}</option>
          <option value="price-desc">{t('prices.sort.priceDesc')}</option>
        </select>
      </div>
      <div id="servicios-list-container" className="flex-grow overflow-y-auto space-y-4 pr-2">
        {Object.keys(filteredAndSortedCategories).map(category => (
          <details key={category} className="bg-bg-secondary rounded-lg border border-border-main" open>
            <summary className="p-4 font-semibold text-lg cursor-pointer flex justify-between text-text-main hover:bg-bg-tertiary">
              {category}
              <i data-feather="chevron-down" className="text-text-muted"></i>
            </summary>
            <div className="p-4 border-t border-border-main">
              <ul className="space-y-2">
                {filteredAndSortedCategories[category].map((s) => (
                    <li key={s.id} className="flex justify-between items-center p-2 rounded-md hover:bg-bg-tertiary">
                      <span className="text-text-secondary">{s.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-accent">{formatCurrency(s.price)}</span>
                        <div>
                          <button onClick={() => handleOpenEditModal(s)} className="p-1 text-text-muted hover:text-accent">
                            <i data-feather="edit" className="w-4 h-4"></i>
                          </button>
                          <button onClick={() => handleDeleteService(s)} className="p-1 text-text-muted hover:text-red-400">
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