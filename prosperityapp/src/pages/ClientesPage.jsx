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
      console.error('Error eliminando cliente:', err);
      toast.error(t('clients.deleteError'));
    }
  };

  if (loading) {
    return null;
  }
  if (error) {
    return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main">{t('clients.title')}</h2>
          <p className="text-text-muted">{t('clients.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2">
            <i data-feather="upload" className="h-5 w-5"></i>
            <span>{t('clients.importButton')}</span>
          </button>
          <button onClick={handleOpenCreateModal} className="btn-golden flex items-center">
            <i data-feather="plus" className="mr-2 h-5 w-5"></i>
            <span>{t('clients.addBtn')}</span>
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
      <div id="client-cards-container" className="space-y-4">
        {(filteredClients || []).map(client => (
          <div key={client.id} className="bg-bg-secondary p-4 rounded-lg border border-border-main flex justify-between items-center">
            <div>
              <p className="font-bold text-text-main text-lg">{client.name} {client.lastName}</p>
              <p className="text-sm text-text-muted flex items-center">
                <i data-feather="phone" className="w-4 h-4 inline-block mr-2"></i>
                {client.phone || t('common.notAvailable')}
              </p>
              <p className="text-sm text-text-muted flex items-center">
                <i data-feather="mail" className="w-4 h-4 inline-block mr-2"></i>
                {client.email || t('common.notAvailable')}
              </p>
              <p className="text-sm text-text-muted flex items-center">
                <i data-feather="gift" className="w-4 h-4 inline-block mr-2"></i>
                {client.birthday || t('common.notAvailable')}
              </p>
              <p className="text-sm text-text-muted flex items-center">
                <i data-feather="calendar" className="w-4 h-4 inline-block mr-2"></i>
                {t('clients.lastVisit')} {client.lastVisit || t('common.notAvailable')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/clientes/${client.id}`}
                className="p-2 text-text-muted hover:text-accent rounded-md bg-bg-tertiary"
                title={t('clients.viewHistory')}
              >
                <i data-feather="list" className="w-4 h-4"></i>
              </Link>
              <button onClick={() => handleOpenEditModal(client)} className="p-2 text-text-muted hover:text-accent rounded-md bg-bg-tertiary" title={t('clients.editBtn')}>
                <i data-feather="edit-2" className="w-4 h-4"></i>
              </button>
              <button onClick={() => handleDeleteClient(client)} className="p-2 text-text-muted hover:text-red-400 rounded-md bg-bg-tertiary" title={t('clients.deleteBtn')}>
                <i data-feather="trash-2" className="w-4 h-4"></i>
              </button>
            </div>
          </div>
        ))}
        {filteredClients && filteredClients.length === 0 && (
          <p className="text-center text-text-muted p-8">{t('clients.noClientsFound')}</p>
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