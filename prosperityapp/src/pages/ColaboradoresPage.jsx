// ===== INICIO: src/pages/ColaboradoresPage.jsx (Sprint 91) =====
import React, { useEffect, useState, useMemo } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { db } from '../firebase/config';
import { doc, writeBatch } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CollaboratorModal from '../components/modals/CollaboratorModal';
import { useTranslation } from 'react-i18next';

// Componente Sortable para cada fila
const SortableCollaboratorRow = ({ collaborator, sortBy, t, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collaborator.id, disabled: sortBy === 'alphabetical' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-4 border-t border-border-main hover:bg-bg-tertiary ${isDragging ? 'shadow-xl bg-bg-secondary border-accent z-50' : ''}`}
    >
      {/* Drag Handle - Only visible in custom mode */}
      {sortBy === 'custom' && (
        <div {...attributes} {...listeners} className="w-10 cursor-grab active:cursor-grabbing text-text-muted hover:text-accent touch-none">
          <i data-feather="move" className="w-4 h-4"></i>
        </div>
      )}
      {sortBy !== 'custom' && <span className="w-10"></span>} {/* Placeholder for alignment */}

      <span className="flex-1 font-bold text-text-main">{collaborator.name} {collaborator.lastName}</span>
      <span className="w-1/3 text-sm text-text-muted">{collaborator.role || t('common.notAvailable')}</span>
      <span className="w-24 text-center font-semibold text-accent">{collaborator.commissionPercent ? `${collaborator.commissionPercent}% ` : 'N/A'}</span>
      <span className="w-24 text-center">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${collaborator.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {collaborator.status === 'active' ? t('common.active') : t('common.inactive')}
        </span>
      </span>
      <div className="w-20 flex justify-end gap-2">
        <button
          onClick={() => onEdit(collaborator)}
          className="p-1 text-text-muted hover:text-accent transition-colors"
          title={t('common.edit')}
        >
          <i data-feather="edit-2" className="w-4 h-4"></i>
        </button>
        <button
          onClick={() => onDelete(collaborator)}
          className="p-1 text-text-muted hover:text-red-500 transition-colors"
          title={t('common.delete')}
        >
          <i data-feather="trash-2" className="w-4 h-4"></i>
        </button>
      </div>
    </div>
  );
};

const ColaboradoresPage = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collaboratorToEdit, setCollaboratorToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('custom'); // 'custom' | 'alphabetical'
  const { collaborators, isLoading, deleteCollaborator } = useData();
  const loading = isLoading;
  const error = null;

  const [collabList, setCollabList] = useState([]);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (collaborators) {
      setCollabList(collaborators);
    }
  }, [collaborators]);

  const filteredCollabList = useMemo(() => {
    if (!collabList) return [];

    let filtered = collabList;
    if (searchTerm) {
      filtered = collabList.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.lastName && c.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Custom order (by displayOrder)
    return [...filtered].sort((a, b) => {
      const orderA = a.displayOrder ?? 999;
      const orderB = b.displayOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [collabList, searchTerm, sortBy]);

  useEffect(() => {
    if (!isLoading) {
      feather.replace();
    }
  }, [filteredCollabList, isModalOpen, isLoading, sortBy]);

  const handleOpenCreateModal = () => {
    setCollaboratorToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (collaborator) => {
    setCollaboratorToEdit(collaborator);
    setIsModalOpen(true);
  };

  const handleDelete = async (collaborator) => {
    if (window.confirm(t('common.confirmDelete'))) {
      await deleteCollaborator(collaborator.id);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCollabList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update Firestore
        const batch = writeBatch(db);
        newItems.forEach((collab, index) => {
          // Update local object
          collab.displayOrder = index;
          const docRef = doc(db, 'collaborators', collab.id);
          batch.update(docRef, { displayOrder: index });
        });
        batch.commit().catch(console.warn);

        return newItems;
      });
    }
  };

  if (loading) return null;
  if (error) return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main">{t('collaborators.title')}</h2>
          <p className="text-text-muted">{t('collaborators.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          {/* Botón de Ordenar */}
          <button
            onClick={() => setSortBy(prev => prev === 'custom' ? 'alphabetical' : 'custom')}
            className="px-4 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2"
            title={sortBy === 'custom' ? t('common.sortAlphabetical') || 'Cambiar a orden alfabético' : t('common.sortCustom') || 'Cambiar a orden personalizado'}
          >
            <i data-feather="list" className="w-4 h-4"></i>
            <span className="hidden sm:inline text-sm">{sortBy === 'custom' ? 'Orden Personalizado' : 'Orden A-Z'}</span>
          </button>

          <button onClick={handleOpenCreateModal} className="btn-golden flex items-center">
            <i data-feather="plus" className="mr-2 h-5 w-5"></i>
            <span>{t('collaborators.addBtn')}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('collaborators.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-bg-secondary rounded-lg border border-border-main overflow-hidden">
          <div className="bg-bg-main/50 flex p-4 text-xs uppercase text-text-muted">
            {sortBy === 'custom' && <span className="w-10"><i data-feather="move" className="w-4 h-4"></i></span>}
            <span className="flex-1">{t('collaborators.table.name')}</span>
            <span className="w-1/3">{t('collaborators.table.role')}</span>
            <span className="w-24 text-center">{t('collaborators.table.commission')}</span>
            <span className="w-24 text-center">{t('collaborators.table.status')}</span>
            <span className="w-20 text-right">{t('collaborators.table.actions')}</span>
          </div>

          <SortableContext
            items={filteredCollabList.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredCollabList.map((c) => (
              <SortableCollaboratorRow
                key={c.id}
                collaborator={c}
                sortBy={sortBy}
                t={t}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {isModalOpen && (
        <CollaboratorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          collaboratorToEdit={collaboratorToEdit}
        />
      )}
    </>
  );
};

export default ColaboradoresPage;
// ===== FIN: src/pages/ColaboradoresPage.jsx (Sprint 91) =====