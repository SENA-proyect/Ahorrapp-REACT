const db = require('../db/connection');
const PDFDocument = require('pdfkit');

// 📌 Helper: Escapa valores para CSV
const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

// 📌 Helper: Genera CSV en memoria
const generateCSV = (data) => {
  if (!data || !data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => escapeCSV(row[h])).join(','));
  return [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
};

// 📌 Helper: Genera PDF con pdfkit
const generatePDF = (data, tipo) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.font('Helvetica');
  
  // Título
  doc.fontSize(20).text(`Reporte de ${tipo.toUpperCase()}`, { align: 'center' });
  doc.fontSize(11).text(`Generado: ${new Date().toLocaleString('es-CO')}`, { align: 'center' });
  doc.moveDown(2);

  if (!data || data.length === 0) {
    doc.fontSize(12).text('No se encontraron registros para exportar.', { align: 'center' });
  } else {
    // Obtener headers y filtrar solo los campos importantes
    const headers = Object.keys(data[0]).filter(h => 
      !h.toLowerCase().includes('password') && 
      !h.toLowerCase().includes('token')
    );
    
    // Configurar columnas con anchos dinámicos
    const pageWidth = doc.page.width;
    const marginLeft = 40;
    const marginRight = 40;
    const availableWidth = pageWidth - marginLeft - marginRight;
    const colWidth = availableWidth / headers.length;
    
    let y = doc.y;
    const rowHeight = 20;

    // Encabezados de tabla
    doc.font('Helvetica-Bold').fontSize(10);
    headers.forEach((h, i) => {
      const x = marginLeft + i * colWidth;
      doc.text(h.replace('_', ' ').toUpperCase(), x, y, { 
        width: colWidth - 5, 
        align: 'left',
        ellipsis: true 
      });
    });
    y += rowHeight;
    
    // Línea separadora
    doc.moveTo(marginLeft, y).lineTo(pageWidth - marginRight, y).stroke();
    y += 10;

    // Datos de la tabla
    doc.font('Helvetica').fontSize(9);
    data.forEach((row, rowIndex) => {
      // Verificar si necesitamos nueva página
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 50;
      }

      headers.forEach((h, i) => {
        const x = marginLeft + i * colWidth;
        let value = row[h];
        
        // Formatear valores
        if (value instanceof Date) {
          value = value.toLocaleDateString('es-CO');
        } else if (typeof value === 'number' && (h.toLowerCase().includes('monto') || h.toLowerCase().includes('total'))) {
          value = `$${value.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
        } else if (value === null || value === undefined) {
          value = '-';
        } else {
          value = String(value);
        }
        
        // Truncar texto muy largo
        if (value.length > 25) {
          value = value.substring(0, 25) + '...';
        }
        
        doc.text(value, x, y, { 
          width: colWidth - 5, 
          align: 'left',
          ellipsis: true 
        });
      });
      y += rowHeight;
    });
  }
  
  return doc;
};

// 📌 Configuración de consultas según tipo de dato
const getQueryConfig = (tipo) => {
  const configs = {
    ingresos: {
      table: 'ingresos',
      join: 'INNER JOIN entrada ON ingresos.ID_entrada = entrada.ID_entrada INNER JOIN movimientos ON entrada.ID_movimiento = movimientos.ID_movimiento',
      userField: 'movimientos.ID_usuario',
      dateField: 'ingresos.Fecha_registro',
      selectFields: 'ingresos.ID_ingresos, ingresos.Monto, ingresos.Descripcion, ingresos.Fuente, ingresos.Fecha_registro'
    },
    gastos: {
      table: 'gastos',
      join: 'INNER JOIN salida ON gastos.ID_salida = salida.ID_salida INNER JOIN movimientos ON salida.ID_movimiento = movimientos.ID_movimiento',
      userField: 'movimientos.ID_usuario',
      dateField: 'gastos.Fecha_registro',
      selectFields: 'gastos.ID_gastos, gastos.Monto, gastos.Descripcion, gastos.Fecha_registro'
    },
    movimientos: {
      table: 'movimientos',
      join: '',
      userField: 'movimientos.ID_usuario',
      dateField: null,
      selectFields: 'movimientos.ID_movimiento, movimientos.Tipo_Flujo, movimientos.Subtipo_Modulo'
    },
    dependientes: {
      table: 'dependientes',
      join: '',
      userField: 'dependientes.ID_usuario',
      dateField: null,
      selectFields: 'dependientes.ID_dependientes, dependientes.Nombre, dependientes.Relacion, dependientes.Ocupacion, dependientes.Fecha_nacimiento, dependientes.Peso_economico'
    }
  };
  return configs[tipo];
};

// 📌 Endpoint principal
exports.exportarDatos = async (req, res) => {
  try {
    const { formato, tipo = 'movimientos', fechaInicio, fechaFin } = req.body;
    
    const userId = req.usuario?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No hay usuario autenticado' });
    }

    // Validación
    const formatos = ['json', 'csv', 'pdf'];
    const tiposValidos = ['gastos', 'ingresos', 'movimientos', 'dependientes'];
    
    if (!formatos.includes(formato)) {
      return res.status(400).json({ error: 'Formato inválido. Use: json, csv o pdf' });
    }
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Use: gastos, ingresos, movimientos o dependientes' });
    }

    // Obtener configuración de consulta
    const config = getQueryConfig(tipo);
    if (!config) {
      return res.status(400).json({ error: 'Tipo de datos no soportado' });
    }

    // Construir consulta SQL
    let sql = `SELECT ${config.selectFields} FROM ${config.table}`;
    
    if (config.join) {
      sql += ` ${config.join}`;
    }
    
    sql += ` WHERE ${config.userField} = ?`;
    let params = [userId];

    // Agregar filtros de fecha si aplica
    if (config.dateField) {
      if (fechaInicio) {
        sql += ` AND ${config.dateField} >= ?`;
        params.push(fechaInicio);
      }
      if (fechaFin) {
        sql += ` AND ${config.dateField} <= ?`;
        params.push(fechaFin);
      }
      sql += ` ORDER BY ${config.dateField} DESC`;
    }

    console.log('SQL:', sql);
    console.log('Params:', params);

    // Ejecutar consulta
    const [rows] = await db.query(sql, params);

    // Nombre del archivo
    const filename = `reporte_financiero_${new Date().toISOString().slice(0, 10)}`;

    // Respuesta según formato
    if (formato === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
      return res.json(rows);
    }

    if (formato === 'csv') {
      const csvContent = generateCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      return res.send(csvContent);
    }

    if (formato === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
      const doc = generatePDF(rows, tipo);
      doc.pipe(res);
      doc.end();
      return;
    }
  } catch (err) {
    console.error('❌ Error en exportación:', err);
    res.status(500).json({ error: 'Error interno al generar el reporte.' });
  }
};