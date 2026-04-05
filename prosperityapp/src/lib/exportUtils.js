/**
 * exportUtils.js
 * Utilidades de exportación profesional para reportes de inventario.
 * Soporta: Excel (.xlsx) con formato profesional y PDF con tablas.
 */
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================
// CONSTANTES DE ESTILO
// ============================================================
const BRAND_COLOR = { r: 212, g: 160, b: 23 };    // Dorado AgendiApp
const HEADER_BG   = { r: 26,  g: 26,  b: 46 };    // #1a1a2e
const ALT_ROW_BG  = { r: 240, g: 240, b: 245 };   // Fila alterna
const BORDER_COLOR = { r: 200, g: 200, b: 210 };

// ============================================================
// EXPORTAR A EXCEL PROFESIONAL
// ============================================================
export function exportToExcel({ data, columns, filename, title, subtitle, summary }) {
  const wb = XLSX.utils.book_new();
  const headerRow = columns.map(c => c.header);
  const dataRows = data.map(row =>
    columns.map(col => {
      const val = row[col.key];
      if (col.format === 'currency' && typeof val === 'number') return val;
      if (col.format === 'date' && val) return formatDateExcel(val);
      return val ?? '';
    })
  );

  const wsData = [];
  wsData.push([title || 'Reporte de Inventario']);
  if (subtitle) wsData.push([subtitle]);
  wsData.push([`Generado: ${new Date().toLocaleString('es-CL')}`]);
  wsData.push([]);
  wsData.push(headerRow);
  wsData.push(...dataRows);

  if (summary && summary.length > 0) {
    wsData.push([]);
    summary.forEach(s => {
      const row = new Array(columns.length).fill('');
      row[0] = s.label;
      row[1] = s.format === 'currency' ? formatCurrency(s.value) : s.value;
      wsData.push(row);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = columns.map(col => ({ wch: col.width || 18 }));

  const titleEndCol = Math.max(columns.length - 1, 0);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: titleEndCol } },
  ];
  if (subtitle) {
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: titleEndCol } });
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, `${filename || 'reporte'}.xlsx`);
}

// ============================================================
// EXPORTAR A PDF PROFESIONAL
// ============================================================
export function exportToPDF({ data, columns, filename, title, subtitle, summary, orientation = 'landscape' }) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Barra dorada superior
  doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  doc.rect(0, 0, pageWidth, 2, 'F');

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(HEADER_BG.r, HEADER_BG.g, HEADER_BG.b);
  doc.text(title || 'Reporte de Inventario', 14, 14);

  let yPos = 20;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, yPos);
    yPos += 5;
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 14, yPos);
  yPos += 4;

  // Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  doc.text('AgendiApp', pageWidth - 14, 14, { align: 'right' });

  // Tabla
  const tableHeaders = columns.map(c => c.header);
  const tableData = data.map(row =>
    columns.map(col => {
      const val = row[col.key];
      if (col.format === 'currency') return formatCurrency(val);
      if (col.format === 'date') return formatDatePDF(val);
      if (col.format === 'number') return typeof val === 'number' ? val.toLocaleString('es-CL') : val ?? '';
      return val ?? '';
    })
  );

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPos + 4,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [HEADER_BG.r, HEADER_BG.g, HEADER_BG.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [ALT_ROW_BG.r, ALT_ROW_BG.g, ALT_ROW_BG.b],
    },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.format === 'currency' || col.format === 'number') {
        acc[i] = { halign: 'right' };
      }
      return acc;
    }, {}),
    didDrawPage: (pageData) => {
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Pagina ${pageData.pageNumber} de ${pageNumber}`,
        pageWidth - 14, doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
      doc.setDrawColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      doc.setLineWidth(0.5);
      doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth - 14, doc.internal.pageSize.getHeight() - 12);
    },
  });

  // Resumen
  if (summary && summary.length > 0) {
    const finalY = doc.lastAutoTable?.finalY || yPos + 50;
    let summaryY = finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(HEADER_BG.r, HEADER_BG.g, HEADER_BG.b);
    doc.text('Resumen', 14, summaryY);
    summaryY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summary.forEach(s => {
      const valueStr = s.format === 'currency' ? formatCurrency(s.value) : String(s.value);
      doc.setTextColor(80, 80, 80);
      doc.text(`${s.label}:`, 14, summaryY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      doc.text(valueStr, 80, summaryY);
      doc.setFont('helvetica', 'normal');
      summaryY += 5;
    });
  }

  doc.save(`${filename || 'reporte'}.pdf`);
}

// ============================================================
// HELPERS
// ============================================================
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

function formatDateExcel(val) {
  if (!val) return '';
  try { return new Date(val).toLocaleDateString('es-CL'); }
  catch { return String(val); }
}

function formatDatePDF(val) {
  if (!val) return '-';
  try { return new Date(val).toLocaleDateString('es-CL'); }
  catch { return String(val); }
}

// ============================================================
// PLANTILLAS DE COLUMNAS PREDEFINIDAS
// ============================================================
export const KARDEX_COLUMNS = [
  { key: 'date',         header: 'Fecha',             width: 14, format: 'date' },
  { key: 'type',         header: 'Tipo',              width: 12 },
  { key: 'reason',       header: 'Motivo',            width: 28 },
  { key: 'lotNumber',    header: 'Lote',              width: 14 },
  { key: 'supplierName', header: 'Proveedor',         width: 20 },
  { key: 'invoiceNumber',header: 'Factura',           width: 14 },
  { key: 'amount',       header: 'Cantidad',          width: 12, format: 'number' },
  { key: 'newStock',     header: 'Stock Resultante',  width: 14, format: 'number' },
  { key: 'costPerUnit',  header: 'Costo/u',           width: 12, format: 'currency' },
];

export const LOTS_COLUMNS = [
  { key: 'lotNumber',      header: 'N Lote',          width: 14 },
  { key: 'productName',    header: 'Producto',        width: 28 },
  { key: 'supplierName',   header: 'Proveedor',       width: 20 },
  { key: 'invoiceNumber',  header: 'Factura',         width: 14 },
  { key: 'purchaseDate',   header: 'F. Compra',       width: 14, format: 'date' },
  { key: 'receptionDate',  header: 'F. Recepcion',    width: 14, format: 'date' },
  { key: 'quantityInitial',header: 'Cant. Inicial',   width: 12, format: 'number' },
  { key: 'quantityRemaining', header: 'Cant. Actual',  width: 12, format: 'number' },
  { key: 'costPerUnit',    header: 'Costo/u',         width: 12, format: 'currency' },
  { key: 'status',         header: 'Estado',          width: 12 },
];

export const CRITICAL_STOCK_COLUMNS = [
  { key: 'name',          header: 'Producto',         width: 28 },
  { key: 'brand',         header: 'Marca',            width: 16 },
  { key: 'category',      header: 'Categoria',        width: 16 },
  { key: 'inventoryType', header: 'Tipo',             width: 10 },
  { key: 'stockCurrent',  header: 'Stock Actual',     width: 12, format: 'number' },
  { key: 'stockMin',      header: 'Stock Min.',       width: 12, format: 'number' },
  { key: 'deficit',       header: 'Deficit',          width: 12, format: 'number' },
];

export const VALUATION_COLUMNS = [
  { key: 'name',          header: 'Producto',         width: 28 },
  { key: 'brand',         header: 'Marca',            width: 16 },
  { key: 'category',      header: 'Categoria',        width: 16 },
  { key: 'inventoryType', header: 'Tipo',             width: 10 },
  { key: 'stockCurrent',  header: 'Stock',            width: 10, format: 'number' },
  { key: 'costPerUnit',   header: 'Costo/u',          width: 12, format: 'currency' },
  { key: 'totalValue',    header: 'Valor Total',      width: 14, format: 'currency' },
];
