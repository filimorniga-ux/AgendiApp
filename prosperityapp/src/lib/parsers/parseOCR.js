/**
 * parseOCR.js
 * OCR local usando Tesseract.js — 100% en el browser, sin API externa.
 * Usado para: imágenes (JPG/PNG) y PDFs escaneados.
 */
import Tesseract from 'tesseract.js';
import { extractFromText } from './invoiceExtractor.js';

/**
 * Procesa una imagen o PDF escaneado con OCR y extrae datos de factura.
 * @param {File} file
 * @param {string} countryCode
 * @param {function} onProgress - callback(0-100) para barra de progreso
 * @returns {{ supplier, invoice, items, raw_source, confidence }}
 */
export async function parseOCR(file, countryCode = 'CL', onProgress = null) {
  // Determinar idioma Tesseract
  const lang = countryCode === 'CL' || countryCode === 'CO' ? 'spa' : 'spa+eng';

  const { data } = await Tesseract.recognize(
    file,
    lang,
    {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    }
  );

  const confidence = Math.round(data.confidence);
  const text = data.text;

  const result = extractFromText(text, countryCode);
  return { ...result, raw_source: 'image_ocr', confidence };
}
