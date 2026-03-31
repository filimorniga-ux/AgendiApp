/**
 * parseDTE.js
 * Parser para facturas electrónicas DTE del SII (Chile).
 * No requiere ninguna dependencia externa — usa DOMParser nativo del browser.
 */

/**
 * Parsea un string XML de DTE chileno y retorna un objeto estructurado.
 * @param {string} xmlString - Contenido XML del DTE
 * @returns {{ supplier, invoice, items }}
 */
export function parseDTE(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('XML inválido: ' + parseError.textContent);

  const get = (parent, tag) => parent?.querySelector(tag)?.textContent?.trim() ?? '';

  // ── Emisor (proveedor) ──────────────────────────────────────────
  const emisor = doc.querySelector('Emisor');
  const supplier = {
    rut: formatRut(get(emisor, 'RUTEmisor')),
    razonSocial: get(emisor, 'RznSoc'),
    nombreFantasia: get(emisor, 'GiroEmis') || get(emisor, 'GiroEmisor'),
    direccion: get(emisor, 'DirOrigen'),
    telefono: get(emisor, 'Telefono') || get(emisor, 'Fono'),
    email: get(emisor, 'CorreoEmisor') || get(emisor, 'Email'),
    country_code: 'CL',
  };

  // ── Cabecera de la factura ──────────────────────────────────────
  const idDoc = doc.querySelector('IdDoc');
  const totales = doc.querySelector('Totales');
  const invoice = {
    folio: get(idDoc, 'Folio'),
    invoiceDate: get(idDoc, 'FchEmis'),
    invoiceNumber: get(idDoc, 'Folio'),
    tipoDoc: get(idDoc, 'TipoDTE'),
    montoBruto: parseNum(get(totales, 'MntBruto') || get(totales, 'MntTotal')),
    montoNeto: parseNum(get(totales, 'MntNeto')),
    montoIva: parseNum(get(totales, 'IVA')),
    total: parseNum(get(totales, 'MntTotal')),
    tasaIva: parseNum(get(totales, 'TasaIVA')) || 19,
  };

  // ── Detalle (líneas de productos) ───────────────────────────────
  const detalles = doc.querySelectorAll('Detalle');
  const items = Array.from(detalles).map((d) => {
    const qty = parseNum(get(d, 'QtyItem'));
    const unitCost = parseNum(get(d, 'PrcItem'));
    const totalCost = parseNum(get(d, 'MontoItem')) || qty * unitCost;
    return {
      description: get(d, 'NmbItem'),
      skuProveedor: get(d, 'CdgItem') || get(d, 'VlrCodigo') || '',
      barcode: extractBarcode(get(d, 'NmbItem') + ' ' + get(d, 'CdgItem')),
      quantityInvoiced: qty,
      quantityReceived: qty, // default: todo recibido (usuario ajusta)
      unitCost,
      totalCost,
      ivaPct: invoice.tasaIva,
      status: 'pending',
      isNewProduct: false,
    };
  });

  return { supplier, invoice, items, raw_source: 'xml_dte' };
}

// ── Utilidades ──────────────────────────────────────────────────────

function parseNum(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatRut(rut) {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return rut;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}

function extractBarcode(text) {
  // EAN-13 o EAN-8 dentro del texto del ítem
  const match = text.match(/\b(\d{8}|\d{12,13}|\d{14})\b/);
  return match ? match[1] : '';
}
