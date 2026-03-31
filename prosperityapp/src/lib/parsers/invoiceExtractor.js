/**
 * invoiceExtractor.js
 * Motor de regex multi-país para extraer campos de texto bruto de facturas.
 * Usado después de OCR (Tesseract) o extracción de PDF.
 */

// ── Patrones por país ───────────────────────────────────────────────

const PATTERNS = {
  // Chile
  rut_cl: /\b(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])\b/gi,
  // Colombia
  nit_co: /\bNIT\.?\s*(\d{3}\.?\d{3}\.?\d{3}-?\d?)\b/gi,
  // Genérico
  email: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
  phone_cl: /(?:\+?56\s?)?(?:9\s?\d{4}\s?\d{4}|\d{2}\s?\d{3,4}\s?\d{4})/g,
  phone_co: /(?:\+?57\s?)?(?:3\d{2}\s?\d{3}\s?\d{4}|\d{1,3}\s?\d{3,4}\s?\d{4})/g,
  barcode: /\b(\d{8}|\d{12,13}|\d{14})\b/g,
  price: /\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/g,
  iva: /IVA[^\d]*(\d{2}(?:[.,]\d+)?)\s*%/gi,
};

// ── Palabras clave para extraer razón social ────────────────────────
const SUPPLIER_KEYWORDS = [
  /raz[oó]n social[:\s]+(.+)/i,
  /empresa[:\s]+(.+)/i,
  /proveedor[:\s]+(.+)/i,
  /factura\s+de[:\s]+(.+)/i,
  /emit(?:e|ido\s+por)[:\s]+(.+)/i,
  /s\.?a\.?s?\.?\s*$/im,
  /ltda\.?\s*$/im,
  /e\.?i\.?r\.?l\.?\s*$/im,
  /spa\.?\s*$/im,
];

/**
 * Extrae todos los campos estructurados de un bloque de texto bruto.
 * @param {string} text - Texto bruto (de OCR o PDF)
 * @param {string} countryCode - 'CL' | 'CO' | 'PE' | 'MX' | 'ANY'
 * @returns {{ supplier, invoice, items }}
 */
export function extractFromText(text, countryCode = 'ANY') {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const supplier = extractSupplier(text, lines, countryCode);
  const invoice = extractInvoiceMeta(text, lines);
  const items = extractLineItems(lines);

  return { supplier, invoice, items, raw_source: 'text_parsed' };
}

// ── Extracción de proveedor ─────────────────────────────────────────

function extractSupplier(text, lines, countryCode) {
  // RUT / identificador fiscal
  let rut = '';
  if (countryCode === 'CL' || countryCode === 'ANY') {
    const m = [...text.matchAll(PATTERNS.rut_cl)];
    if (m.length) rut = m[0][1];
  }
  if (!rut && (countryCode === 'CO' || countryCode === 'ANY')) {
    const m = [...text.matchAll(PATTERNS.nit_co)];
    if (m.length) rut = m[0][1];
  }

  // Razón social: primera línea larga que no sea número/fecha o la que sigue a una keyword
  let razonSocial = '';
  for (const line of lines) {
    if (line.length > 8 && !/^\d/.test(line) && !razonSocial) {
      razonSocial = line;
      break;
    }
  }
  for (const pattern of SUPPLIER_KEYWORDS) {
    const m = text.match(pattern);
    if (m && m[1]?.trim().length > 3) {
      razonSocial = m[1].trim().split('\n')[0].trim();
      break;
    }
  }

  // Email
  const emails = [...text.matchAll(PATTERNS.email)].map(m => m[0]);
  const email = emails[0] || '';

  // Teléfono
  const phonePattern = countryCode === 'CO' ? PATTERNS.phone_co : PATTERNS.phone_cl;
  const phones = [...text.matchAll(phonePattern)].map(m => m[0]);
  const telefono = phones[0] || '';

  return {
    rut,
    razonSocial,
    nombreFantasia: '',
    email,
    telefono,
    country_code: countryCode === 'ANY' ? 'CL' : countryCode,
    confidence: rut ? 'high' : 'medium',
  };
}

// ── Extracción de metadata de factura ──────────────────────────────

function extractInvoiceMeta(text, lines) {
  // Folio / número de factura
  const folioMatch = text.match(/(?:folio|n[uú]mero|n[°º]|fact(?:ura)?)[.\s#]*(\d{4,10})/i);
  const folio = folioMatch ? folioMatch[1] : '';

  // Fecha
  const dateMatch = text.match(/(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/);
  const invoiceDate = dateMatch ? normalizeDate(dateMatch[1]) : '';

  // Total
  const totalMatch = text.match(/total[^\d]*(\d[\d.,]+)/i);
  const total = totalMatch ? parseTextNum(totalMatch[1]) : 0;

  // IVA
  const ivaMatch = text.match(/IVA[^\d]*(\d[\d.,]+)/i);
  const montoIva = ivaMatch ? parseTextNum(ivaMatch[1]) : 0;

  // Tasa IVA
  const tasaMatch = [...text.matchAll(PATTERNS.iva)];
  const tasaIva = tasaMatch[0] ? parseFloat(tasaMatch[0][1]) : 19;

  return { folio, invoiceDate, invoiceNumber: folio, total, montoIva, tasaIva };
}

// ── Extracción de líneas de productos ──────────────────────────────

function extractLineItems(lines) {
  const items = [];
  // Detectar líneas que parecen ítems: tienen números separados al final
  const itemLineRe = /^(.{3,40}?)\s{2,}(\d[\d.,]*)\s+\$?\s*([\d.,]+)\s+\$?\s*([\d.,]+)\s*$/;

  for (const line of lines) {
    const m = line.match(itemLineRe);
    if (!m) continue;
    const qty = parseTextNum(m[2]);
    const unitCost = parseTextNum(m[3]);
    const totalCost = parseTextNum(m[4]) || qty * unitCost;
    if (qty <= 0 && unitCost <= 0) continue;

    const barcode = (line.match(PATTERNS.barcode) || [])[0] || '';
    items.push({
      description: m[1].trim(),
      skuProveedor: '',
      barcode,
      quantityInvoiced: qty,
      quantityReceived: qty,
      unitCost,
      totalCost,
      ivaPct: 19,
      status: 'pending',
      isNewProduct: false,
    });
  }

  // Si no encontramos ítems con el patrón estricto, intentamos heurística simple
  if (items.length === 0) {
    return extractItemsSimple(lines);
  }

  return items;
}

function extractItemsSimple(lines) {
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const priceMatch = line.match(/\$?\s*([\d.,]{4,})/g);
    if (priceMatch && priceMatch.length >= 2 && line.length > 10) {
      const prices = priceMatch.map(p => parseTextNum(p));
      items.push({
        description: line.replace(/\$?[\d.,]+/g, '').trim() || `Ítem ${i + 1}`,
        skuProveedor: '',
        barcode: '',
        quantityInvoiced: 1,
        quantityReceived: 1,
        unitCost: Math.min(...prices),
        totalCost: Math.max(...prices),
        ivaPct: 19,
        status: 'pending',
        isNewProduct: false,
      });
    }
  }
  return items;
}

// ── Utilidades ──────────────────────────────────────────────────────

function parseTextNum(str) {
  if (!str) return 0;
  // Elimina símbolo $, espacios
  const clean = str.replace(/\$|\s/g, '');
  // Si tiene coma como decimal (1.234,56) → swap
  if (/\d\.\d{3},/.test(clean)) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // Si tiene punto como decimal (1,234.56)
  if (/\d,\d{3}\./.test(clean)) {
    return parseFloat(clean.replace(/,/g, '')) || 0;
  }
  // Puntos como separadores de miles
  return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
}

function normalizeDate(str) {
  const parts = str.split(/[\/\-\.]/);
  if (parts.length !== 3) return str;
  const [d, m, y] = parts;
  const year = y.length === 2 ? '20' + y : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
