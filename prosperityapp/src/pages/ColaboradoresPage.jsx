// ===== INICIO: src/pages/ColaboradoresPage.jsx (Sprint 91) =====
import React, { useEffect, useState, useMemo } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { sbDelete, sbUpdate } from '../supabase/db';
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
      className={`bg-bg-secondary rounded-lg border border-border-main p-3 sm:p-4 flex items-center gap-3 hover-lift transition-all duration-200 ${isDragging ? 'shadow-xl border-accent z-50 opacity-80' : ''}`}
    >
      {/* Drag Handle */}
      {sortBy === 'custom' && (
        <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-text-muted hover:text-accent touch-none flex-shrink-0">
          <i data-feather="move" className="w-4 h-4"></i>
        </div>
      )}

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center flex-shrink-0 text-sm">
        {(collaborator.name || '?')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-text-main text-sm truncate">{collaborator.name} {collaborator.lastName}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-xs text-text-muted">{collaborator.role || t('common.notAvailable')}</span>
          {collaborator.commissionPercent ? (
            <span className="text-xs text-accent font-semibold">{collaborator.commissionPercent}%</span>
          ) : null}
          <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${collaborator.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {collaborator.status === 'active' ? t('common.active') : t('common.inactive')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(collaborator)} className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-accent rounded-md bg-bg-tertiary" title={t('common.edit')}>
          <i data-feather="edit-2" className="w-4 h-4"></i>
        </button>
        <button onClick={() => onDelete(collaborator)} className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-red-500 rounded-md bg-bg-tertiary" title={t('common.delete')}>
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
  const { collaborators, isLoading } = useData();
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
      const { error } = await sbDelete('collaborators', collaborator.id);
      if (error) console.warn('Error eliminando colaborador:', error);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCollabList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Actualizar Supabase en paralelo
        const updates = newItems.map((collab, index) => {
          collab.displayOrder = index;
          return sbUpdate('collaborators', collab.id, { displayOrder: index });
        });
        Promise.all(updates).catch(console.warn);
        return newItems;
      });
    }
  };

  if (loading) return (
    <div className="space-y-2 pb-24 sm:pb-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-bg-secondary rounded-lg border border-border-main p-3 sm:p-4 flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
          <div className="skeleton w-9 h-9 rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  );
  if (error) return <h1 className="text-2xl font-bold text-red-500 p-8">{error}</h1>;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main">{t('collaborators.title')}</h2>
          <p className="text-text-muted text-sm">{t('collaborators.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy(prev => prev === 'custom' ? 'alphabetical' : 'custom')}
            className="px-3 py-2 rounded-lg border border-border-main bg-bg-secondary text-text-main hover:bg-bg-tertiary transition-colors flex items-center gap-2"
          >
            <i data-feather="list" className="w-4 h-4"></i>
            <span className="hidden sm:inline text-sm">{sortBy === 'custom' ? 'Orden Personalizado' : 'Orden A-Z'}</span>
          </button>

          <button onClick={handleOpenCreateModal} className="flex-1 sm:flex-none btn-golden flex items-center justify-center gap-2">
            <i data-feather="plus" className="h-4 w-4"></i>
            <span className="text-sm">{t('collaborators.addBtn')}</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          className="w-full bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('collaborators.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredCollabList.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pb-24 sm:pb-6">
            {filteredCollabList.map((c, i) => (
              <div key={c.id} className={`animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}>
                <SortableCollaboratorRow
                  collaborator={c}
                  sortBy={sortBy}
                  t={t}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDelete}
                />
              </div>
            ))}
            {filteredCollabList.length === 0 && (
              <div className="text-center text-text-muted p-12 animate-fadeInUp">
                <div className="animate-float inline-block mb-4">
                  <i data-feather="users" className="w-16 h-16 mx-auto opacity-20"></i>
                </div>
                <p className="font-semibold text-lg mb-1">Sin colaboradores</p>
                <p className="text-sm opacity-60">Agrega tu primer colaborador con el botón de arriba.</p>
              </div>
            )}
          </div>
        </SortableContext>
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