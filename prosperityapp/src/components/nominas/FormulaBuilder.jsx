import React, { useState, useMemo } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { calculatePayroll } from '../../lib/payrollEngine';
import StepConfigModal from './StepConfigModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// ── Colores de indicador ──────────────────────────────────────────────────────
const colorClass = {
  green:   'text-green-400',
  red:     'text-red-400',
  neutral: 'text-text-main',
};

// ── Un paso draggable ─────────────────────────────────────────────────────────
const SortableStep = ({ step, onEdit, onRemove, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        step.isSubtotal
          ? 'border-accent/40 bg-accent/5'
          : 'border-border-main bg-bg-tertiary'
      } ${!step.enabled ? 'opacity-40' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-text-muted/40 hover:text-text-muted cursor-grab active:cursor-grabbing p-1 touch-none"
        title="Arrastrar para reordenar"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${step.isSubtotal ? 'text-accent' : colorClass[step.color] || 'text-text-main'}`}>
          {step.isSubtotal && <span className="mr-1">──</span>}
          {step.label}
          {step.isSubtotal && <span className="ml-1">──</span>}
        </p>
        <p className="text-[11px] text-text-muted/60 mt-0.5">
          {step.source} · {step.operator}
          {step.value !== null && step.value !== undefined && step.value !== '' 
            ? ` · ${step.value}${['percent_add','percent_subtract','tax_pct','commission_pct'].some(o => step.operator === o || step.source === o) ? '%' : ''}` 
            : ['tax_pct', 'commission_pct'].includes(step.source) ? ' · (auto)' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggle(step.id)}
          title={step.enabled ? 'Desactivar' : 'Activar'}
          className={`w-6 h-6 rounded-full border text-[10px] font-bold transition-colors ${
            step.enabled
              ? 'border-green-500 text-green-500 hover:bg-green-500/10'
              : 'border-border-main text-text-muted hover:bg-bg-main'
          }`}
        >
          {step.enabled ? '✓' : '○'}
        </button>
        <button
          onClick={() => onEdit(step)}
          className="p-1.5 text-text-muted hover:text-accent transition-colors"
          title="Editar paso"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={() => onRemove(step.id)}
          className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
          title="Eliminar paso"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── Preview de cálculo con datos de ejemplo ──────────────────────────────────
const SAMPLE_DATA = {
  totalServices: 500000,
  totalTechCost: 45000,
  totalAdvances: -20000,
  totalSalesCommissions: 15000,
  totalPropinas: 8000,
  commissionPercent: 40,
  taxPercent: 19,
};

const PreviewPanel = ({ steps }) => {
  const { formatCurrency } = useCurrencyFormat();
  const { rows, finalPayment } = useMemo(() => calculatePayroll(SAMPLE_DATA, steps), [steps]);

  return (
    <div className="bg-bg-main rounded-xl border border-border-main p-4 h-full">
      <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
        Preview (datos de ejemplo)
      </p>
      <div className="space-y-1">
        {rows.map(row => (
          <div key={row.id}>
            {row.isSubtotal && <div className="border-t border-border-main my-2" />}
            <div className="flex justify-between items-center py-1">
              <span className={`text-xs ${row.isSubtotal ? 'font-bold text-text-main' : 'text-text-muted'}`}>
                {row.label}
              </span>
              <span className={`text-xs font-semibold ${
                row.display < 0 ? 'text-red-400' : row.display > 0 && !row.isSubtotal ? 'text-green-400' : 'text-text-main'
              }`}>
                {row.display < 0 ? '-' : '+'}{formatCurrency(Math.abs(row.value))}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-accent mt-3 pt-3 flex justify-between items-center">
        <span className="text-sm font-bold text-text-muted uppercase">Pago Final</span>
        <span className="text-xl font-black text-accent">{formatCurrency(finalPayment)}</span>
      </div>
      <p className="text-[10px] text-text-muted/40 mt-2 text-center">
        Prod. bruta: {formatCurrency(SAMPLE_DATA.totalServices)} · % part.: {SAMPLE_DATA.commissionPercent}%
      </p>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const FormulaBuilder = ({ steps, onChange }) => {
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingStep, setEditingStep]   = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(s => s.id === active.id);
      const newIndex = steps.findIndex(s => s.id === over.id);
      onChange(arrayMove(steps, oldIndex, newIndex));
    }
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setIsModalOpen(true);
  };

  const handleEditStep = (step) => {
    setEditingStep(step);
    setIsModalOpen(true);
  };

  const handleSaveStep = (stepData) => {
    if (editingStep) {
      onChange(steps.map(s => s.id === stepData.id ? stepData : s));
    } else {
      onChange([...steps, stepData]);
    }
  };

  const handleRemove = (id) => {
    if (window.confirm('¿Eliminar este paso?')) onChange(steps.filter(s => s.id !== id));
  };

  const handleToggle = (id) => {
    onChange(steps.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Editor (3/5) */}
      <div className="lg:col-span-3 space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {steps.map(step => (
              <SortableStep
                key={step.id}
                step={step}
                onEdit={handleEditStep}
                onRemove={handleRemove}
                onToggle={handleToggle}
              />
            ))}
          </SortableContext>
        </DndContext>

        {steps.length === 0 && (
          <div className="text-center py-10 text-text-muted/30 border-2 border-dashed border-border-main rounded-xl">
            <p className="text-sm">Sin pasos. Agrega el primero →</p>
          </div>
        )}

        <button
          onClick={handleAddStep}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-accent/40 text-accent/70 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all text-sm font-semibold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar Paso
        </button>
      </div>

      {/* Preview (2/5) */}
      <div className="lg:col-span-2 sticky top-24">
        <PreviewPanel steps={steps.filter(s => s.enabled)} />
      </div>

      <StepConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStep}
        initialStep={editingStep}
      />
    </div>
  );
};

export default FormulaBuilder;
