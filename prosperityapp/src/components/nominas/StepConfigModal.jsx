import React, { useState, useEffect } from 'react';

const OPERATORS = [
  { value: 'add',              label: '(+) Sumar valor fijo'       },
  { value: 'subtract',         label: '(-) Restar valor fijo'       },
  { value: 'percent_add',      label: '(+) Sumar % de una base'    },
  { value: 'percent_subtract', label: '(-) Restar % de una base'   },
  { value: 'set',              label: '(=) Definir subtotal'        },
];

const SOURCES = [
  { value: 'gross',          label: 'Producción Bruta (servicios)'    },
  { value: 'tech_cost',      label: 'Costo Técnico'                   },
  { value: 'commissions',    label: 'Comisiones de Venta'             },
  { value: 'tips',           label: 'Propinas'                        },
  { value: 'advances',       label: 'Adelantos'                       },
  { value: 'commission_pct', label: '% Participación del colaborador' },
  { value: 'tax_pct',        label: '% Impuesto configurable'         },
  { value: 'result',         label: 'Resultado acumulado actual'      },
  { value: 'fixed',          label: 'Valor fijo personalizado'        },
];

const REFERENCES = [
  { value: 'gross',    label: 'Producción Bruta' },
  { value: 'result',   label: 'Resultado acumulado' },
  { value: 'net_base', label: 'Base Neta' },
];

const COLORS = [
  { value: 'green',   label: '🟢 Positivo' },
  { value: 'red',     label: '🔴 Descuento' },
  { value: 'neutral', label: '⚪ Neutro' },
];

const empty = {
  label: '',
  operator: 'add',
  source: 'fixed',
  value: 0,
  reference: 'gross',
  enabled: true,
  isSubtotal: false,
  isNetBase: false,
  color: 'neutral',
};

const StepConfigModal = ({ isOpen, onClose, onSave, initialStep = null }) => {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (isOpen) setForm(initialStep ? { ...empty, ...initialStep } : { ...empty });
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const showValue    = ['fixed', 'tax_pct', 'commission_pct', 'percent_add', 'percent_subtract'].includes(form.source) || ['percent_add', 'percent_subtract'].includes(form.operator);
  const showRef      = ['percent_add', 'percent_subtract'].includes(form.operator) && !['commission_pct', 'tax_pct'].includes(form.source);
  const showFixed    = form.source === 'fixed';

  const handleSave = () => {
    if (!form.label.trim()) return;
    onSave({
      ...form,
      id: initialStep?.id || `step_${Date.now()}`,
      value: Number(form.value) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 modal-backdrop">
      <div className="bg-bg-secondary rounded-xl border border-border-main shadow-2xl w-full max-w-md p-6 modal-content">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-text-main">
            {initialStep ? 'Editar Paso' : 'Nuevo Paso de Fórmula'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Nombre del paso *</label>
            <input
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main focus:border-accent focus:outline-none"
              placeholder="Ej: (-) Retención PYME"
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
            />
          </div>

          {/* Operator */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Operación</label>
            <select
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main focus:border-accent focus:outline-none"
              value={form.operator}
              onChange={e => setForm({ ...form, operator: e.target.value })}
            >
              {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Fuente del dato</label>
            <select
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main focus:border-accent focus:outline-none"
              value={form.source}
              onChange={e => setForm({ ...form, source: e.target.value })}
            >
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Value (for %, fixed, etc.) */}
          {showValue && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                {showFixed ? 'Monto fijo' : 'Porcentaje (%)'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main focus:border-accent focus:outline-none"
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
              />
            </div>
          )}

          {/* Reference base for % */}
          {showRef && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Base del porcentaje</label>
              <select
                className="w-full bg-bg-tertiary border border-border-main rounded-lg p-2.5 text-text-main focus:border-accent focus:outline-none"
                value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
              >
                {REFERENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Color indicador</label>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                    form.color === c.value
                      ? 'border-accent bg-accent/20 text-accent font-semibold'
                      : 'border-border-main bg-bg-tertiary text-text-muted hover:border-accent/50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isSubtotal}
                onChange={e => setForm({ ...form, isSubtotal: e.target.checked })}
                className="accent-accent w-4 h-4"
              />
              <span className="text-sm text-text-muted">Es subtotal (muestra línea)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isNetBase}
                onChange={e => setForm({ ...form, isNetBase: e.target.checked })}
                className="accent-accent w-4 h-4"
              />
              <span className="text-sm text-text-muted">Define "Base Neta"</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="py-2 px-5 rounded-lg bg-bg-tertiary text-text-muted hover:bg-bg-main border border-border-main">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.label.trim()}
            className="py-2 px-6 rounded-lg bg-accent text-accent-text font-semibold hover:brightness-110 disabled:opacity-40 transition-all"
          >
            {initialStep ? 'Guardar Cambios' : 'Agregar Paso'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepConfigModal;
