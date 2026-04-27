import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabase/client';
import { DEFAULT_TEMPLATE_STEPS } from '../../lib/payrollEngine';
import FormulaBuilder from './FormulaBuilder';
import EmptyState from '../ui/EmptyState';
import toast from 'react-hot-toast';

import { useCollaborators } from '../../context/collections/CollaboratorsContext';
import { useBusiness } from '../../context/BusinessContext';

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

// ── Helpers ───────────────────────────────────────────────────────────────────
async function setDevBypassConfig(businessId) {
  if (!DEV_BYPASS) return;
  await supabase.rpc('set_config', { setting: 'app.business_id', value: businessId, is_local: false });
}

// ── Sección override por colaborador ─────────────────────────────────────────
const CollaboratorOverrideCard = ({ collab, override, defaultSteps, businessId, onSaved }) => {
  const isMounted = useRef(true);
  const [isOpen,  setIsOpen]  = useState(false);
  const [steps,   setSteps]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initSteps = () => {
    setSteps(override?.steps?.length ? [...override.steps] : [...defaultSteps]);
    setIsOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDevBypassConfig(businessId);
      if (override?.id) {
        const { error } = await supabase.from('collaborator_template_overrides')
          .update({ steps, updated_at: new Date().toISOString() })
          .eq('id', override.id)
          .eq('business_id', businessId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('collaborator_template_overrides').insert({
          business_id: businessId,
          collaborator_id: collab.id,
          steps,
        });
        if (error) throw error;
      }
      if (isMounted.current) {
        toast.success(`Override guardado para ${collab.name}`);
        onSaved();
        setIsOpen(false);
      }
    } catch (e) {
      console.warn("[TemplatesTab]", e?.message || e);
      if (isMounted.current) toast.error('Error al guardar override');
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const handleRemoveOverride = async () => {
    if (!override?.id) return;
    if (!window.confirm(`¿Eliminar configuración especial de ${collab.name}? Volverá a usar la plantilla global.`)) return;
    try {
      await setDevBypassConfig(businessId);
      const { error } = await supabase.from('collaborator_template_overrides')
        .delete()
        .eq('id', override.id)
        .eq('business_id', businessId);
      if (error) throw error;
      if (isMounted.current) {
        toast.success('Override eliminado');
        onSaved();
        setIsOpen(false);
      }
    } catch (e) {
      console.warn("[TemplatesTab]", e?.message || e);
      if (isMounted.current) toast.error('Error al eliminar override');
    }
  };

  return (
    <div className="border border-border-main bg-bg-secondary rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary transition-colors"
        onClick={isOpen ? () => setIsOpen(false) : initSteps}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-sm">
            {collab.name[0]}
          </div>
          <div>
            <p className="font-semibold text-text-main">{collab.name}</p>
            <p className="text-xs text-text-muted">
              {override ? '✏️ Tiene configuración personalizada' : '📋 Usando plantilla global'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {override && (
            <button
              onClick={e => { e.stopPropagation(); handleRemoveOverride(); }}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-400/30 rounded-lg"
            >
              Quitar override
            </button>
          )}
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {isOpen && steps && (
        <div className="border-t border-border-main p-4">
          <p className="text-xs text-text-muted mb-4">
            Esta fórmula aplica <strong>solo a {collab.name}</strong>. Arrastra para reordenar.
          </p>
          <FormulaBuilder steps={steps} onChange={setSteps} />
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-muted border border-border-main text-sm">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-accent text-accent-text font-semibold text-sm hover:brightness-110 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : `Guardar para ${collab.name}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Componente Principal ──────────────────────────────────────────────────────
const TemplatesTab = () => {
  const isMounted = useRef(true);

  const {
    collaborators
  } = useCollaborators();

  const {
    businessId
  } = useBusiness();

  const [templates,   setTemplates]   = useState([]);
  const [overrides,   setOverrides]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Plantilla activa siendo editada
  const [activeTemplate, setActiveTemplate] = useState(null);  // { id, name, steps }
  const [editName,       setEditName]       = useState('');
  const [editSteps,      setEditSteps]      = useState([]);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      await setDevBypassConfig(businessId);
      const [tmplRes, ovrRes] = await Promise.all([
        supabase.from('payroll_templates').select('*').eq('business_id', businessId).order('created_at'),
        supabase.from('collaborator_template_overrides').select('*').eq('business_id', businessId),
      ]);

      if (tmplRes.error) throw tmplRes.error;
      if (ovrRes.error) throw ovrRes.error;

      if (isMounted.current) {
        setTemplates(tmplRes.data || []);
        setOverrides(ovrRes.data || []);
      }
    } catch (e) {
      console.warn("[TemplatesTab]", e?.message || e);
      if (isMounted.current) toast.error('Error al cargar datos');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  const openTemplate = (tmpl) => {
    setActiveTemplate(tmpl);
    setEditName(tmpl.name);
    setEditSteps([...tmpl.steps]);
  };

  const openNewTemplate = () => {
    const draft = { id: null, name: 'Nueva Plantilla', steps: DEFAULT_TEMPLATE_STEPS, is_default: false };
    setActiveTemplate(draft);
    setEditName(draft.name);
    setEditSteps([...draft.steps]);
  };

  const handleSaveTemplate = async () => {
    if (!editName.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      await setDevBypassConfig(businessId);
      if (activeTemplate.id) {
        const { error } = await supabase.from('payroll_templates')
          .update({ name: editName, steps: editSteps, updated_at: new Date().toISOString() })
          .eq('id', activeTemplate.id)
          .eq('business_id', businessId);
        if (error) throw error;
        if (isMounted.current) toast.success('Plantilla actualizada ✓');
      } else {
        const { error } = await supabase.from('payroll_templates').insert({
          business_id: businessId,
          name: editName,
          steps: editSteps,
          is_default: templates.length === 0,
        });
        if (error) throw error;
        if (isMounted.current) toast.success('Plantilla creada ✓');
      }
      if (isMounted.current) {
        setActiveTemplate(null);
        load();
      }
    } catch (e) {
      console.warn("[TemplatesTab]", e?.message || e);
      if (isMounted.current) toast.error('Error al guardar');
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDevBypassConfig(businessId);
      // Quitar default de todas
      const { error: err1 } = await supabase.from('payroll_templates')
        .update({ is_default: false })
        .eq('business_id', businessId);
      if (err1) throw err1;

      const { error: err2 } = await supabase.from('payroll_templates')
        .update({ is_default: true })
        .eq('id', id)
        .eq('business_id', businessId);
      if (err2) throw err2;

      if (isMounted.current) {
        toast.success('Plantilla establecida como predeterminada');
        load();
      }
    } catch (e) {
      console.warn("[TemplatesTab]", e?.message || e);
      if (isMounted.current) toast.error('Error al establecer predeterminada');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    try {
      await setDevBypassConfig(businessId);
      const { error } = await supabase.from('payroll_templates')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;

      if (isMounted.current) {
        toast.success('Plantilla eliminada');
        if (activeTemplate?.id === id) setActiveTemplate(null);
        load();
      }
    } catch (e) {
      console.warn("[TemplatesTab]", e?.message || e);
      if (isMounted.current) toast.error('Error al eliminar plantilla');
    }
  };

  const activeCollabs = (collaborators || []).filter(c => c.status === 'active');
  const defaultSteps  = templates.find(t => t.is_default)?.steps || DEFAULT_TEMPLATE_STEPS;

  // ── Vista: editor de plantilla abierta ──────────────────────────────────
  if (activeTemplate !== null) {
    return (
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTemplate(null)}
            className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Todas las plantillas
          </button>
          <span className="text-text-muted/40">/</span>
          <span className="text-text-main font-semibold text-sm">{editName}</span>
        </div>

        {/* Nombre */}
        <div className="flex items-center gap-4 mb-6">
          <input
            className="text-2xl font-bold bg-transparent border-b-2 border-accent/30 focus:border-accent outline-none text-text-main flex-1 pb-1"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Nombre de la plantilla"
          />
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={() => setActiveTemplate(null)} className="px-4 py-2 rounded-lg bg-bg-tertiary border border-border-main text-text-muted text-sm">
              Cancelar
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-accent text-accent-text font-semibold text-sm hover:brightness-110 disabled:opacity-50 shadow-md"
            >
              {saving ? 'Guardando…' : '💾 Guardar Plantilla'}
            </button>
          </div>
        </div>

        <FormulaBuilder steps={editSteps} onChange={setEditSteps} />
      </div>
    );
  }

  // ── Vista principal: lista de plantillas + overrides ──────────────────────
  return (
    <div className="space-y-8">
      {/* ── Plantillas globales ── */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-main">Plantillas Globales</h3>
            <p className="text-sm text-text-muted">Definen cómo se calcula el pago de todos los colaboradores.</p>
          </div>
          <button
            onClick={openNewTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-text font-semibold rounded-xl text-sm hover:brightness-110 shadow-md transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Plantilla
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-text-muted">Cargando…</div>
        ) : templates.length === 0 ? (
          <div className="border-2 border-dashed border-border-main rounded-xl p-6 text-center">
            <EmptyState 
              title="No hay plantillas guardadas" 
              description="Se usa la fórmula por defecto del sistema." 
            />
            <button onClick={openNewTemplate} className="mt-4 px-5 py-2 rounded-lg bg-accent/20 text-accent font-semibold text-sm hover:bg-accent/30">
              Crear primera plantilla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                  tmpl.is_default
                    ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                    : 'border-border-main bg-bg-secondary hover:border-accent/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-text-main">{tmpl.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{tmpl.steps?.length || 0} pasos</p>
                  </div>
                  {tmpl.is_default && (
                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/40 px-2 py-0.5 rounded-full">
                      Por defecto
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(tmpl.steps || []).filter(s => s.enabled).slice(0, 5).map(s => (
                    <span key={s.id} className="text-[10px] bg-bg-tertiary border border-border-main rounded px-1.5 py-0.5 text-text-muted truncate max-w-[120px]">
                      {s.label}
                    </span>
                  ))}
                  {(tmpl.steps || []).filter(s => s.enabled).length > 5 && (
                    <span className="text-[10px] text-text-muted/50">+{(tmpl.steps || []).filter(s => s.enabled).length - 5} más</span>
                  )}
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-border-main">
                  <button onClick={() => openTemplate(tmpl)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-bg-tertiary text-text-muted hover:text-text-main border border-border-main hover:border-accent/50 transition-colors">
                    ✏️ Editar
                  </button>
                  {!tmpl.is_default && (
                    <button onClick={() => handleSetDefault(tmpl.id)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30 transition-colors">
                      ⭐ Usar por defecto
                    </button>
                  )}
                  <button onClick={() => handleDelete(tmpl.id)} className="py-1.5 px-2 text-xs rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Override por colaborador ── */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-text-main">Configuración Individual</h3>
          <p className="text-sm text-text-muted">
            Cada colaborador puede tener una fórmula de pago personalizada que reemplaza la plantilla global.
          </p>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-6 text-text-muted">Cargando configuración…</div>
          ) : (
            <>
              {activeCollabs.map(collab => (
                <CollaboratorOverrideCard
                  key={collab.id}
                  collab={collab}
                  override={overrides.find(o => o.collaborator_id === collab.id) || null}
                  defaultSteps={defaultSteps}
                  businessId={businessId}
                  onSaved={load}
                />
              ))}
              {activeCollabs.length === 0 && (
                <EmptyState 
                  title="No hay colaboradores activos" 
                  description="Debes crear y activar colaboradores para configurarles una plantilla individual." 
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatesTab;
