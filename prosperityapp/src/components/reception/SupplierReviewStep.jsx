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
    <div className="recepcion-field">
      <label className="recepcion-field-label">
        {label}{required && ' *'}
      </label>
      <input
        className="recepcion-input"
        value={form[key] || ''}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={`Ingresa ${label.toLowerCase()}`}
      />
    </div>
  );

  const handleNext = () => {
    if (!form.razonSocial) return;
    onNext({ supplier: form, supplierId: existing?.id || null, mode });
  };

  return (
    <div className="recepcion-step-body">
      {/* Badge de modo */}
      {searching ? (
        <div className="recepcion-badge searching">
          🔍 Buscando proveedor en base de datos…
        </div>
      ) : (
        <div className={`recepcion-badge ${mode === 'new' ? 'new' : 'update'}`}>
          {mode === 'new'
            ? '🆕 Proveedor nuevo — se creará en la base de datos'
            : `✏️ Proveedor existente — se actualizarán los datos de "${existing?.nombre}"`}
        </div>
      )}

      {/* Formulario */}
      <div className="recepcion-form-grid">
        {field('razonSocial', 'Razón Social', true)}
        {field('nombreFantasia', 'Nombre de Fantasía')}
        {field('rut', 'RUT / NIT', true)}
        {field('email', 'Correo Electrónico')}
        {field('telefono', 'Teléfono')}
        {field('direccion', 'Dirección')}
      </div>

      {/* Confidencia del parseo */}
      {data.supplier?.confidence && (
        <div className="recepcion-confidence">
          📊 Confianza del parseo: <strong>{data.supplier.confidence}</strong> — Verifica los datos antes de continuar.
        </div>
      )}

      <div className="recepcion-actions">
        <button onClick={handleNext} disabled={!form.razonSocial} className="recepcion-btn-primary">
          Siguiente →
        </button>
      </div>
    </div>
  );
}
