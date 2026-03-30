/**
 * BarcodeScanner.jsx
 * Componente universal de lectura de códigos de barras.
 *
 * Soporta dos modos:
 *  - 'keyboard' (default): captura input de lector USB/Bluetooth que emite caracteres + Enter
 *  - 'camera': usa @zxing/library para decodificar desde la cámara del dispositivo
 *
 * Props:
 *  - onScan(barcode: string)   Callback cuando se detecta un código válido
 *  - onClose()                 Callback para cerrar el scanner
 *  - active: boolean           Si false, el scanner no escucha eventos
 *  - mode: 'keyboard'|'camera'
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const MIN_BARCODE_LENGTH = 4;
const KEYBOARD_TIMEOUT_MS = 80; // ms entre teclas de un lector físico (muy rápido)

export function BarcodeScanner({ onScan, onClose, active = true, mode = 'keyboard' }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timerRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  // ── Modo teclado: captura el stream de chars del lector físico ────────────
  const handleKeyDown = useCallback((e) => {
    if (!active || mode !== 'keyboard') return;

    const now = Date.now();

    // Si pasa mucho tiempo entre teclas, limpiar buffer (fue el usuario, no el lector)
    if (now - lastKeyTimeRef.current > 300) {
      bufferRef.current = '';
    }
    lastKeyTimeRef.current = now;

    if (e.key === 'Enter') {
      const code = bufferRef.current.trim();
      bufferRef.current = '';
      if (code.length >= MIN_BARCODE_LENGTH) {
        onScan(code);
      }
      return;
    }

    // Solo acumular caracteres imprimibles
    if (e.key.length === 1) {
      bufferRef.current += e.key;
    }

    // Algunos lectores no envían Enter — disparar por velocidad
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const code = bufferRef.current.trim();
      bufferRef.current = '';
      if (code.length >= MIN_BARCODE_LENGTH) {
        const elapsed = Date.now() - lastKeyTimeRef.current;
        // Solo disparar por tiempo si los chars llegaron muy rápido (lector, no teclado humano)
        if (elapsed < KEYBOARD_TIMEOUT_MS * 2) {
          onScan(code);
        }
      }
    }, 150);
  }, [active, mode, onScan]);

  useEffect(() => {
    if (mode !== 'keyboard') return;
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [handleKeyDown, mode]);

  // ── Modo cámara: ZXing ────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'camera' || !active) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setCameraError(null);

    reader.listVideoInputDevices().then(devices => {
      if (!devices?.length) {
        setCameraError('No se encontró cámara disponible.');
        return;
      }
      const deviceId = devices[devices.length - 1]?.deviceId; // prefiere cámara trasera
      setCameraReady(true);
      reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          onScan(result.getText());
        }
      });
    }).catch(() => setCameraError('No se pudo acceder a la cámara.'));

    return () => {
      reader.reset();
      setCameraReady(false);
    };
  }, [mode, active, onScan]);

  // ── Render: modo teclado es invisible (solo escucha) ─────────────────────
  if (mode === 'keyboard') {
    return (
      <div className="bc-scanner-keyboard-indicator">
        <span className="bc-scanner-dot" />
        <span>Scanner activo — escanea o escribe el código</span>
        <button onClick={onClose} className="bc-scanner-close" aria-label="Cerrar scanner">✕</button>
      </div>
    );
  }

  // ── Render: modo cámara ───────────────────────────────────────────────────
  return (
    <div className="bc-scanner-camera-wrapper">
      <div className="bc-scanner-camera-header">
        <span>📷 Apunta la cámara al código</span>
        <button onClick={onClose} className="bc-scanner-close" aria-label="Cerrar scanner">✕</button>
      </div>
      {cameraError && <p className="bc-scanner-error">{cameraError}</p>}
      <div className="bc-scanner-viewport">
        <video ref={videoRef} className="bc-scanner-video" />
        <div className="bc-scanner-crosshair" />
      </div>
      {!cameraReady && !cameraError && (
        <p className="bc-scanner-hint">Iniciando cámara…</p>
      )}
    </div>
  );
}
