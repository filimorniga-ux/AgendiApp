import React, { useEffect, useState, useMemo } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import ClientModal from '../components/modals/ClientModal';
import ContactImportModal from '../components/modals/ContactImportModal';
import { sbDelete } from '../supabase/db';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ClientesPage = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { clients, isLoading } = useData();
  const loading = isLoading;
  const error = null;

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.lastName && c.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm))
    );
  }, [clients, searchTerm]);

  useEffect(() => {
    if (!isLoading) {
      feather.replace();
    }
  }, [clients, filteredClients, isModalOpen, isLoading]);

  const handleOpenCreateModal = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(t('clients.confirmDelete', { clientName: client.name }))) return;
    try {
      const { error } = await sbDelete('clients', client.id);
      if (error) throw error;
      toast.success(t('clients.deleteSuccess'));
    } catch (err) {
      console.warn('Error eliminando cliente:', err);
      toast.error(t('clients.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`skeleton-card animate-fadeInUp stagger-${i}`}>
            <div className="flex items-center gap-3 p-4">
              <div className="skeleton w-10 h-10 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="skeleton skeleton-text w-1/3"></div>
                <div className="skeleton skeleton-text w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main">{t('clients.title')}</h2>
          <p className="text-text-muted text-sm">{t('clients.subtitle')}</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2">
            <i data-feather="upload" className="h-4 w-4"></i>
            <span className="text-sm">{t('clients.importButton')}</span>
          </button>
          <button onClick={handleOpenCreateModal} className="flex-1 sm:flex-none btn-golden flex items-center justify-center gap-2">
            <i data-feather="plus" className="h-4 w-4"></i>
            <span className="text-sm">{t('clients.addBtn')}</span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('clients.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* Client list con padding inferior para bottom nav */}
      <div id="client-cards-container" className="space-y-3 pb-24 sm:pb-6">
        {(filteredClients || []).map((client, idx) => (
          <div key={client.id} className={`bg-bg-secondary p-3 sm:p-4 rounded-lg border border-border-main flex justify-between items-center gap-3 hover-lift animate-fadeInUp stagger-${Math.min(idx + 1, 8)}`}>
            {/* Avatar + info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center flex-shrink-0 text-sm">
                {(client.name || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-text-main text-sm sm:text-base truncate">{client.name} {client.lastName}</p>
                <p className="text-xs text-text-muted truncate">
                  {client.phone || client.email || t('common.notAvailable')}
                </p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link
                to={`/app/clientes/${client.id}`}
                className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-accent rounded-md bg-bg-tertiary transition-colors"
                title={t('clients.viewHistory')}
              >
                <i data-feather="list" className="w-4 h-4"></i>
              </Link>
              <button onClick={() => handleOpenEditModal(client)} className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-accent rounded-md bg-bg-tertiary transition-colors" title={t('clients.editBtn')}>
                <i data-feather="edit-2" className="w-4 h-4"></i>
              </button>
              <button onClick={() => handleDeleteClient(client)} className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-red-400 rounded-md bg-bg-tertiary transition-colors" title={t('clients.deleteBtn')}>
                <i data-feather="trash-2" className="w-4 h-4"></i>
              </button>
            </div>
          </div>
        ))}
        {filteredClients && filteredClients.length === 0 && (
          <div className="flex flex-col items-center py-16 text-text-muted animate-fadeInUp">
            <i data-feather="users" className="w-16 h-16 mb-4 opacity-20 animate-float"></i>
            <p className="text-lg font-semibold mb-1">{t('clients.noClientsFound')}</p>
            <p className="text-sm opacity-60">Agrega tu primer cliente con el botón de arriba</p>
          </div>
        )}
      </div>
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={clientToEdit}
      />
      <ContactImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => setIsImportModalOpen(false)}
      />
    </>
  );
};
export default ClientesPage;