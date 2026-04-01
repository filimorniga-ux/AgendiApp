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
        className={`recepcion-dropzone ${dragging ? 'dragging' : ''}`}
      >
        {loading ? (
          <>
            <span className="recepcion-dropzone-icon">⏳</span>
            <p className="recepcion-dropzone-text muted">
              {progress > 0 ? `Leyendo imagen… ${progress}%` : 'Procesando factura…'}
            </p>
            {progress > 0 && (
              <div className="recepcion-progress-track">
                <div className="recepcion-progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        ) : (
          <>
            <span className="recepcion-dropzone-icon">📂</span>
            <p className="recepcion-dropzone-text">
              Arrastra tu factura aquí o haz clic para seleccionar
            </p>
            <p className="recepcion-dropzone-text muted small">
              Soporta: XML DTE (SII) · PDF · JPG · PNG
            </p>
            <div className="recepcion-badge-row">
              {Object.values(SOURCE_LABELS).map((s) => (
                <span key={s.label} className="recepcion-format-badge" style={{ '--badge-color': s.color }}>
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
        <div className="recepcion-detected-format">
          <span className="recepcion-dropzone-text muted small">Formato detectado:</span>
          <span className="recepcion-format-badge" style={{ '--badge-color': sourceBadge.color }}>
            {sourceBadge.icon} {sourceBadge.label}
          </span>
        </div>
      )}

      {error && (
        <div className="recepcion-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
