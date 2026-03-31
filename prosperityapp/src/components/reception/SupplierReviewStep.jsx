/**
 * SupplierReviewStep.jsx
 * Paso 2: Revisar y confirmar/editar datos del proveedor extraídos.
 * Busca en suppliers si el RUT ya existe → muestra modo actualizar.
 * Si es nuevo → modo crear.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client.js';

export default function SupplierReviewStep({ data, onNext }) {
  const [form, setForm]         = useState(data.supplier || {});
  const [existing, setExisting] = useState(null);
  const [mode, setMode]         = useState('new'); // 'new' | 'update' | 'existing'
  const [searching, setSearching] = useState(false);

  // Buscar si el RUT ya existe en BD
  useEffect(() => {
    if (!form.rut) return;
    setSearching(true);
    supabase
      .from('suppliers')
      .select('*')
      .eq('rut', form.rut)
      .maybeSingle()
      .then(({ data: found }) => {
        if (found) {
          setExisting(found);
          setMode('update');
          setForm(prev => ({ ...found, ...prev })); // merge: prioriza datos extraídos
        } else {
          setMode('new');
        }
        setSearching(false);
      });
  }, [form.rut]);

  const field = (key, label, required = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        {label}{required && ' *'}
      </label>
      <input
        className="form-input"
        value={form[key] || ''}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.9rem' }}
      />
    </div>
  );

  const handleNext = () => {
    if (!form.razonSocial) return;
    onNext({ supplier: form, supplierId: existing?.id || null, mode });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Badge de modo */}
      {searching ? (
        <div style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          🔍 Buscando proveedor en base de datos…
        </div>
      ) : (
        <div style={{
          padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
          background: mode === 'new' ? '#22c55e22' : '#3b82f622',
          color: mode === 'new' ? '#22c55e' : '#3b82f6',
          border: `1px solid ${mode === 'new' ? '#22c55e44' : '#3b82f644'}`,
        }}>
          {mode === 'new' ? '🆕 Proveedor nuevo — se creará en la base de datos' : `✏️ Proveedor existente — se actualizarán los datos de "${existing?.nombre}"`}
        </div>
      )}

      {/* Formulario */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {field('razonSocial', 'Razón Social', true)}
        {field('nombreFantasia', 'Nombre de Fantasía')}
        {field('rut', 'RUT / NIT', true)}
        {field('email', 'Correo Electrónico')}
        {field('telefono', 'Teléfono')}
        {field('direccion', 'Dirección')}
      </div>

      {/* Confidencia del parseo */}
      {data.supplier?.confidence && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
          📊 Confianza del parseo: <strong>{data.supplier.confidence}</strong> — Verifica los datos antes de continuar.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleNext}
          disabled={!form.razonSocial}
          className="btn-primary"
          style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 600 }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
