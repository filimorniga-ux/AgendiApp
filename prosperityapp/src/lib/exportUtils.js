import * as XLSX from 'xlsx';

/**
 * Exporta un array de objetos a un archivo Excel (.xlsx) con un formato básico.
 * 
 * @param {Array<Object>} data - Los datos a exportar. Cada clave será una columna.
 * @param {string} filename - El nombre base del archivo a generar.
 */
export const exportToExcel = (data, filename = 'Reporte_AgendiApp') => {
  if (!data || data.length === 0) {
    import('react-hot-toast').then(({ default: toast }) => 
      toast.error('No hay datos para exportar')
    );
    return;
  }

  try {
    // 1. Crear el libro de trabajo (workbook)
    const wb = XLSX.utils.book_new();

    // 2. Convertir JSON a hoja de cálculo (worksheet)
    const ws = XLSX.utils.json_to_sheet(data);

    // 3. (Opcional) Ajustar el ancho de las columnas (básico, basado en la longitud de las cabeceras)
    const colWidths = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length + 5, 15) }));
    ws['!cols'] = colWidths;

    // 4. Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");

    // 5. Generar archivo y descargarlo
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    import('react-hot-toast').then(({ default: toast }) => 
      toast.success('Excel exportado correctamente')
    );
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    import('react-hot-toast').then(({ default: toast }) => 
      toast.error('Ocurrió un error al generar el Excel')
    );
  }
};
