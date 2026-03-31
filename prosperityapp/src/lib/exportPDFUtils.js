import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Exporta un array de objetos a un archivo PDF con formato corporativo.
 * 
 * @param {Array<Object>} data - Los datos a exportar.
 * @param {string} filename - El nombre base del archivo a generar.
 * @param {string} title - El título del reporte dentro del PDF.
 */
export const exportToPDF = (data, filename = 'Reporte_AgendiApp', title = 'Reporte') => {
  if (!data || data.length === 0) {
    import('react-hot-toast').then(({ default: toast }) => 
      toast.error('No hay datos para exportar')
    );
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Configuración corporativa (colores y fuentes)
    const primaryColor = [11, 25, 44]; // Navy blue (#0b192c)
    const secondaryColor = [255, 101, 0]; // Orange (#ff6500)
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AgendiApp', 14, 20);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const today = format(new Date(), 'dd/MM/yyyy HH:mm');
    doc.text(`Fecha: ${today}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });

    // Título del Reporte
    doc.setTextColor(...primaryColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 45);

    // Preparar datos para AutoTable
    const headers = Object.keys(data[0]);
    const body = data.map(row => Object.values(row).map(val => (val !== null && val !== undefined) ? String(val) : ''));

    // Generar la tabla
    doc.autoTable({
      startY: 55,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10 }
    });

    // Paginación al pie de página
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.setTextColor(100);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    // Descargar
    doc.save(`${filename}.pdf`);

    import('react-hot-toast').then(({ default: toast }) => 
      toast.success('PDF exportado correctamente')
    );
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    import('react-hot-toast').then(({ default: toast }) => 
      toast.error('Ocurrió un error al generar el PDF')
    );
  }
};
