/**
 * parsePDF.js
 * Extrae texto de PDFs usando pdf.js (Mozilla).
 * Para PDFs digitales (texto seleccionable): extracción directa.
 * Para PDFs escaneados (imágenes): fallback a parseOCR.
 */
import * as pdfjsLib from 'pdfjs-dist';
import { extractFromText } from './invoiceExtractor.js';

// Worker de pdf.js (necesario para Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extrae texto de un archivo PDF y lo parsea como factura.
 * @param {File} file - Archivo PDF del usuario
 * @param {string} countryCode
 * @returns {{ supplier, invoice, items, raw_source }}
 */
export async function parsePDF(file, countryCode = 'CL') {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  let hasText = false;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
    if (pageText.trim().length > 50) hasText = true;
  }

  if (!hasText) {
    // PDF escaneado → usar OCR
    const { parseOCR } = await import('./parseOCR.js');
    return parseOCR(file, countryCode);
  }

  const result = extractFromText(fullText, countryCode);
  return { ...result, raw_source: 'pdf_text' };
}
