/**
 * InvoiceImporter.jsx
 * Drag & drop / click-to-upload para facturas.
 * Auto-detecta formato (XML DTE, PDF, imagen) y llama al parser correcto.
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const ACCEPTED = '.xml,.pdf,.jpg,.jpeg,.png,.webp';

const SOURCE_LABELS = {
  xml_dte:    { label: 'XML DTE (SII)',     color: '#22c55e', icon: '📋' },
  pdf_text:   { label: 'PDF Digital',       color: '#3b82f6', icon: '📄' },
  image_ocr:  { label: 'Imagen / Escaneado',color: '#f59e0b', icon: '📷' },
  pdf_scan:   { label: 'PDF Escaneado',     color: '#f59e0b', icon: '📷' },
};

export default function InvoiceImporter({ onParsed, countryCode = 'CL' }) {
  const { t } = useTranslation();
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const [sourceBadge, setSourceBadge] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    setLoading(true);
    setProgress(0);

    try {
      let result;
      const name = file.name.toLowerCase();

      if (name.endsWith('.xml')) {
        const { parseDTE } = await import('../../lib/parsers/parseDTE.js');
        const text = await file.text();
        result = parseDTE(text);
      } else if (name.endsWith('.pdf')) {
        const { parsePDF } = await import('../../lib/parsers/parsePDF.js');
        result = await parsePDF(file, countryCode);
      } else {
        // imagen
        const { parseOCR } = await import('../../lib/parsers/parseOCR.js');
        result = await parseOCR(file, countryCode, setProgress);
      }

      setSourceBadge(SOURCE_LABELS[result.raw_source] || null);
      onParsed(result);
    } catch (err) {
      console.error('[InvoiceImporter]', err);
      setError('No se pudo procesar el archivo: ' + err.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [onParsed, countryCode]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      <label
        htmlFor="invoice-file-input"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-main)'}`,
          borderRadius: '1rem',
          padding: '2.5rem 1.5rem',
          cursor: loading ? 'default' : 'pointer',
          background: dragging ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg-secondary)',
          transition: 'all 0.2s',
          minHeight: '180px',
        }}
      >
        {loading ? (
          <>
            <span style={{ fontSize: '2rem' }}>⏳</span>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              {progress > 0 ? `Leyendo imagen… ${progress}%` : 'Procesando factura…'}
            </p>
            {progress > 0 && (
              <div style={{ width: '200px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
              </div>
            )}
          </>
        ) : (
          <>
            <span style={{ fontSize: '2.5rem' }}>📂</span>
            <p style={{ color: 'var(--text-main)', fontWeight: 600, margin: 0, textAlign: 'center' }}>
              Arrastra tu factura aquí o haz clic para seleccionar
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>
              Soporta: XML DTE (SII) · PDF · JPG · PNG
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.25rem' }}>
              {Object.values(SOURCE_LABELS).map((s) => (
                <span key={s.label} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: s.color + '22', color: s.color, border: `1px solid ${s.color}44` }}>
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
          </>
        )}
      </label>

      <input
        id="invoice-file-input"
        type="file"
        accept={ACCEPTED}
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={loading}
      />

      {sourceBadge && (
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formato detectado:</span>
          <span style={{ fontSize: '0.8rem', padding: '2px 10px', borderRadius: '999px', background: sourceBadge.color + '22', color: sourceBadge.color, border: `1px solid ${sourceBadge.color}44` }}>
            {sourceBadge.icon} {sourceBadge.label}
          </span>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#ef444422', border: '1px solid #ef444444', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
