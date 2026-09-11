import jsPDF from "jspdf";

/*
 * ============================================================
 * CONFIGURACIÓN VISUAL
 * ============================================================
 */

const COLORS = {
  background: [15, 23, 42],
  panel: [30, 41, 59],
  panelLight: [51, 65, 85],

  primary: [245, 158, 11],
  primaryLight: [251, 191, 36],

  text: [241, 245, 249],
  textMuted: [148, 163, 184],

  success: [52, 211, 153],
  danger: [248, 113, 113],
  info: [96, 165, 250],

  white: [255, 255, 255],
};

const PAGE = {
  width: 210,
  height: 297,

  marginLeft: 14,
  marginRight: 14,
  marginTop: 18,
  marginBottom: 18,
};

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

const numero = (valor) => Number(valor) || 0;

const formatoCOP = (valor) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numero(valor));
};

const porcentaje = (valor) => {
  return `${numero(valor).toFixed(1)}%`;
};

const texto = (valor, fallback = "—") => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return fallback;
  }

  return String(valor);
};

const obtenerArray = (objeto, posiblesClaves = []) => {
  if (Array.isArray(objeto)) {
    return objeto;
  }

  for (const clave of posiblesClaves) {
    if (Array.isArray(objeto?.[clave])) {
      return objeto[clave];
    }
  }

  return [];
};

const valorPrimero = (objeto, claves, fallback = 0) => {
  for (const clave of claves) {
    if (
      objeto &&
      objeto[clave] !== undefined &&
      objeto[clave] !== null
    ) {
      return objeto[clave];
    }
  }

  return fallback;
};

/*
 * ============================================================
 * DOCUMENTO
 * ============================================================
 */

const crearDocumento = () => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  return doc;
};

const fondoPagina = (doc) => {
  doc.setFillColor(...COLORS.background);

  doc.rect(
    0,
    0,
    PAGE.width,
    PAGE.height,
    "F"
  );
};

const agregarPiePagina = (doc, numeroPagina) => {
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);

  doc.text(
    `AhorrApp · Informe financiero · Página ${numeroPagina}`,
    PAGE.marginLeft,
    PAGE.height - 8
  );
};

const asegurarEspacio = (
  doc,
  y,
  alturaNecesaria,
  numeroPagina
) => {
  if (
    y + alturaNecesaria >
    PAGE.height - PAGE.marginBottom
  ) {
    agregarPiePagina(doc, numeroPagina);

    doc.addPage();
    fondoPagina(doc);

    return PAGE.marginTop;
  }

  return y;
};

const tituloSeccion = (
  doc,
  titulo,
  subtitulo,
  y
) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...COLORS.primaryLight);

  doc.text(titulo, PAGE.marginLeft, y);

  if (subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textMuted);

    doc.text(
      subtitulo,
      PAGE.marginLeft,
      y + 5
    );

    return y + 13;
  }

  return y + 9;
};

/*
 * ============================================================
 * TARJETAS
 * ============================================================
 */

const tarjeta = (
  doc,
  x,
  y,
  width,
  height,
  titulo,
  valor,
  color = COLORS.primary
) => {
  doc.setFillColor(...COLORS.panel);

  doc.roundedRect(
    x,
    y,
    width,
    height,
    4,
    4,
    "F"
  );

  doc.setDrawColor(
    color[0],
    color[1],
    color[2]
  );

  doc.setLineWidth(0.6);

  doc.roundedRect(
    x,
    y,
    width,
    height,
    4,
    4,
    "S"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);

  doc.text(
    titulo.toUpperCase(),
    x + 5,
    y + 8
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);

  doc.text(
    valor,
    x + 5,
    y + 18
  );
};

/*
 * ============================================================
 * TABLAS
 * ============================================================
 */

const tabla = (
  doc,
  columnas,
  filas,
  x,
  y,
  anchoTotal,
  opciones = {}
) => {
  const altoFila = opciones.altoFila || 7;
  const altoHeader = opciones.altoHeader || 8;

  const anchos =
    opciones.anchos ||
    columnas.map(
      () => anchoTotal / columnas.length
    );

  let actualY = y;

  doc.setFillColor(...COLORS.panelLight);

  doc.rect(
    x,
    actualY,
    anchoTotal,
    altoHeader,
    "F"
  );

  let actualX = x;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.text);

  columnas.forEach((columna, index) => {
    doc.text(
      columna,
      actualX + 2,
      actualY + 5,
      {
        maxWidth: anchos[index] - 4,
      }
    );

    actualX += anchos[index];
  });

  actualY += altoHeader;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  
  filas.forEach((fila, filaIndex) => {
    const alto =
      fila.alto || altoFila;

    if (actualY + alto > PAGE.height - 20) {
      return;
    }

    if (filaIndex % 2 === 0) {
      doc.setFillColor(
        24,
        35,
        52
      );

      doc.rect(
        x,
        actualY,
        anchoTotal,
        alto,
        "F"
      );
    }

    actualX = x;

    fila.valores.forEach(
      (valor, index) => {
        doc.setTextColor(
          ...(index === 0
            ? COLORS.text
            : COLORS.textMuted)
        );

        doc.text(
          texto(valor),
          actualX + 2,
          actualY + 4.8,
          {
            maxWidth:
              anchos[index] - 4,
          }
        );

        actualX += anchos[index];
      }
    );

    actualY += alto;
  });

  return actualY + 4;
};

/*
 * ============================================================
 * GRÁFICO DE BARRAS
 * ============================================================
 */

const graficoBarras = (
  doc,
  titulo,
  datos,
  x,
  y,
  width,
  height
) => {
  if (!datos.length) {
    return y;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);

  doc.text(
    titulo,
    x,
    y
  );

  const chartY = y + 6;
  const chartHeight = height - 14;

  const maximo = Math.max(
    ...datos.map((item) =>
      numero(item.valor)
    ),
    1
  );

  const anchoBarra =
    width / datos.length * 0.58;

  datos.forEach((item, index) => {
    const valor = numero(item.valor);

    const altoBarra =
      (valor / maximo) *
      chartHeight;

    const posX =
      x +
      index *
        (width / datos.length) +
      anchoBarra * 0.35;

    const posY =
      chartY +
      chartHeight -
      altoBarra;

    doc.setFillColor(
      ...COLORS.primary
    );

    doc.roundedRect(
      posX,
      posY,
      anchoBarra,
      altoBarra,
      1.5,
      1.5,
      "F"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(
      ...COLORS.textMuted
    );

    const etiqueta =
      texto(item.nombre).length > 13
        ? `${texto(item.nombre).slice(
            0,
            11
          )}…`
        : texto(item.nombre);

    doc.text(
      etiqueta,
      posX + anchoBarra / 2,
      chartY + chartHeight + 5,
      {
        align: "center",
        maxWidth: 25,
      }
    );
  });

  return y + height;
};

/*
 * ============================================================
 * GRÁFICO DE LÍNEA
 * ============================================================
 */

const graficoLinea = (
  doc,
  titulo,
  datos,
  x,
  y,
  width,
  height
) => {
  if (!datos.length) {
    return y;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);

  doc.text(titulo, x, y);

  const chartTop = y + 7;
  const chartBottom =
    chartTop + height - 15;

  const chartWidth = width;

  const valores = datos.map(
    (item) =>
      numero(
        item.balance ??
          item.saldo ??
          item.valor
      )
  );

  const minimo = Math.min(
    ...valores,
    0
  );

  const maximo = Math.max(
    ...valores,
    1
  );

  const rango =
    maximo - minimo || 1;

  doc.setDrawColor(
    71,
    85,
    105
  );

  doc.setLineWidth(0.3);

  doc.line(
    x,
    chartBottom,
    x + chartWidth,
    chartBottom
  );

  let anterior = null;

  datos.forEach((item, index) => {
    const valor = numero(
      item.balance ??
        item.saldo ??
        item.valor
    );

    const posicionX =
      x +
      (index /
        Math.max(datos.length - 1, 1)) *
        chartWidth;

    const posicionY =
      chartBottom -
      ((valor - minimo) /
        rango) *
        (height - 22);

    if (anterior) {
      doc.setDrawColor(
        ...COLORS.primary
      );

      doc.setLineWidth(1);

      doc.line(
        anterior.x,
        anterior.y,
        posicionX,
        posicionY
      );
    }

    doc.setFillColor(
      ...COLORS.primaryLight
    );

    doc.circle(
      posicionX,
      posicionY,
      1,
      "F"
    );

    anterior = {
      x: posicionX,
      y: posicionY,
    };
  });

  return y + height;
};

/*
 * ============================================================
 * BARRA DE PROGRESO
 * ============================================================
 */

const barraProgreso = (
  doc,
  titulo,
  porcentajeActual,
  x,
  y,
  width
) => {
  const porcentajeSeguro = Math.max(
    0,
    Math.min(100, numero(porcentajeActual))
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.text);

  doc.text(
    titulo,
    x,
    y
  );

  doc.text(
    `${porcentajeSeguro.toFixed(1)}%`,
    x + width,
    y,
    { align: "right" }
  );

  doc.setFillColor(
    51,
    65,
    85
  );

  doc.roundedRect(
    x,
    y + 3,
    width,
    4,
    2,
    2,
    "F"
  );

  if (porcentajeSeguro > 0) {
    doc.setFillColor(
      ...COLORS.primary
    );

    doc.roundedRect(
      x,
      y + 3,
      width *
        (porcentajeSeguro / 100),
      4,
      2,
      2,
      "F"
    );
  }

  return y + 12;
};

/*
 * ============================================================
 * RESUMEN
 * ============================================================
 */

const generarResumen = (
  doc,
  informe,
  y
) => {
  const resumen =
    informe.resumen || {};

  y = tituloSeccion(
    doc,
    "1. Resumen financiero",
    "Principales indicadores del período seleccionado.",
    y
  );

  const valores = [
    {
      titulo: "Ingresos",
      valor: formatoCOP(
        valorPrimero(resumen, [
          "totalIngresos",
          "total_ingresos",
        ])
      ),
      color: COLORS.success,
    },
    {
      titulo: "Gastos",
      valor: formatoCOP(
        valorPrimero(resumen, [
          "totalGastos",
          "total_gastos",
        ])
      ),
      color: COLORS.danger,
    },
    {
      titulo: "Ahorros",
      valor: formatoCOP(
        valorPrimero(resumen, [
          "totalAhorros",
          "total_ahorros",
        ])
      ),
      color: COLORS.info,
    },
    {
      titulo: "Deudas",
      valor: formatoCOP(
        valorPrimero(resumen, [
          "totalDeudas",
          "total_deudas",
        ])
      ),
      color: COLORS.primary,
    },
    {
      titulo: "Imprevistos",
      valor: formatoCOP(
        valorPrimero(resumen, [
          "totalImprevistos",
          "total_imprevistos",
        ])
      ),
      color: COLORS.danger,
    },
    {
      titulo: "Balance",
      valor: formatoCOP(
        valorPrimero(resumen, [
          "balance",
        ])
      ),
      color: COLORS.primaryLight,
    },
  ];

  const ancho =
    (PAGE.width -
      PAGE.marginLeft -
      PAGE.marginRight -
      10) /
    3;

  valores.forEach(
    (item, index) => {
      const fila =
        Math.floor(index / 3);

      const columna =
        index % 3;

      const x =
        PAGE.marginLeft +
        columna *
          (ancho + 5);

      const tarjetaY =
        y +
        fila * 29;

      tarjeta(
        doc,
        x,
        tarjetaY,
        ancho,
        24,
        item.titulo,
        item.valor,
        item.color
      );
    }
  );

  return y + 68;
};

/*
 * ============================================================
 * INGRESOS
 * ============================================================
 */

const generarIngresos = (
  doc,
  informe,
  y
) => {
  y = asegurarEspacio(
    doc,
    y,
    100,
    1
  );

  y = tituloSeccion(
    doc,
    "2. Ingresos",
    "Distribución de los ingresos registrados durante el período.",
    y
  );

  const categorias =
    obtenerArray(
      informe.ingresosCategoria,
      ["categorias", "data"]
    );

  const fuentes =
    obtenerArray(
      informe.ingresosFuente,
      ["fuentes", "data"]
    );

  const datosCategorias =
    categorias.map((item) => ({
      nombre:
        item.nombre ??
        item.categoria ??
        "Sin categoría",

      valor: numero(
        item.total ??
          item.total_ingresos ??
          item.monto ??
          item.valor
      ),
    }));

  const datosFuentes =
    fuentes.map((item) => ({
      nombre:
        item.fuente ??
        item.nombre ??
        "Sin fuente",

      valor: numero(
        item.total ??
          item.total_ingresos ??
          item.monto ??
          item.valor
      ),
    }));

  if (datosCategorias.length) {
    graficoBarras(
      doc,
      "Ingresos por categoría",
      datosCategorias,
      PAGE.marginLeft,
      y,
      85,
      60
    );
  }

  if (datosFuentes.length) {
    graficoBarras(
      doc,
      "Ingresos por fuente",
      datosFuentes,
      110,
      y,
      85,
      60
    );
  }

  y += 68;

  const filas = datosCategorias
    .slice(0, 8)
    .map((item) => ({
      valores: [
        item.nombre,
        formatoCOP(item.valor),
      ],
    }));

  if (filas.length) {
    y = tabla(
      doc,
      ["Categoría", "Total"],
      filas,
      PAGE.marginLeft,
      y,
      95,
      {
        anchos: [65, 30],
      }
    );
  }

  return y + 5;
};

/*
 * ============================================================
 * GASTOS
 * ============================================================
 */

const generarGastos = (
  doc,
  informe,
  y
) => {
  y = asegurarEspacio(
    doc,
    y,
    100,
    1
  );

  y = tituloSeccion(
    doc,
    "3. Gastos",
    "Distribución de gastos por categoría y dependiente.",
    y
  );

  const categorias =
    obtenerArray(
      informe.gastosCategoria,
      ["categorias", "data"]
    );

  const dependientes =
    obtenerArray(
      informe.gastosDependiente,
      ["dependientes", "data"]
    );

  const datosCategorias =
    categorias.map((item) => ({
      nombre:
        item.nombre ??
        item.categoria ??
        "Sin categoría",

      valor: numero(
        item.total ??
          item.total_gastos ??
          item.monto ??
          item.valor
      ),
    }));

  const datosDependientes =
    dependientes.map((item) => ({
      nombre:
        item.nombre ??
        item.dependiente ??
        "Gasto propio",

      valor: numero(
        item.total ??
          item.total_gastos ??
          item.monto ??
          item.valor
      ),
    }));

  if (datosCategorias.length) {
    graficoBarras(
      doc,
      "Gastos por categoría",
      datosCategorias,
      PAGE.marginLeft,
      y,
      85,
      60
    );
  }

  if (datosDependientes.length) {
    graficoBarras(
      doc,
      "Gastos por dependiente",
      datosDependientes,
      110,
      y,
      85,
      60
    );
  }

  y += 68;

  const filas = datosCategorias
    .slice(0, 8)
    .map((item) => ({
      valores: [
        item.nombre,
        formatoCOP(item.valor),
      ],
    }));

  if (filas.length) {
    y = tabla(
      doc,
      ["Categoría", "Total"],
      filas,
      PAGE.marginLeft,
      y,
      95,
      {
        anchos: [65, 30],
      }
    );
  }

  return y + 5;
};

/*
 * ============================================================
 * AHORROS
 * ============================================================
 */

const generarAhorros = (
  doc,
  informe,
  y
) => {
  y = asegurarEspacio(
    doc,
    y,
    90,
    1
  );

  y = tituloSeccion(
    doc,
    "4. Ahorros",
    "Aportes realizados durante el período y estado actual de las metas.",
    y
  );

  const ahorros =
    obtenerArray(
      informe.ahorros,
      ["ahorros", "abonos", "data"]
    );

  const estados =
    obtenerArray(
      informe.estadoAhorros,
      ["ahorros", "metas", "data"]
    );

  const filas = ahorros
    .slice(0, 10)
    .map((item) => ({
      valores: [
        item.descripcion ??
          item.nombre ??
          "Ahorro",

        formatoCOP(
          item.monto ??
            item.monto_abono ??
            item.total
        ),

        texto(
          item.fecha_registro ??
            item.fecha
        ),
      ],
    }));

  if (filas.length) {
    y = tabla(
      doc,
      ["Ahorro", "Abono", "Fecha"],
      filas,
      PAGE.marginLeft,
      y,
      182,
      {
        anchos: [85, 55, 42],
      }
    );
  }

  if (estados.length) {
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    doc.text(
      "Estado actual de metas",
      PAGE.marginLeft,
      y
    );

    y += 8;

    estados
      .slice(0, 7)
      .forEach((item) => {
        const meta = numero(
          item.meta ??
            item.monto ??
            item.objetivo
        );

        const acumulado = numero(
          item.monto_acumulado ??
            item.acumulado ??
            item.total_abonado
        );

        const porcentajeMeta =
          item.porcentaje_cumplimiento ??
          (meta > 0
            ? (acumulado / meta) *
              100
            : 0);

        y = barraProgreso(
          doc,
          texto(
            item.descripcion ??
              item.nombre ??
              "Meta de ahorro"
          ),
          porcentajeMeta,
          PAGE.marginLeft,
          y,
          180
        );
      });
  }

  return y + 5;
};

/*
 * ============================================================
 * DEUDAS
 * ============================================================
 */

const generarDeudas = (
  doc,
  informe,
  y
) => {
  y = asegurarEspacio(
    doc,
    y,
    90,
    1
  );

  y = tituloSeccion(
    doc,
    "5. Deudas",
    "Pagos realizados y estado actual de las obligaciones.",
    y
  );

  const pagos =
    obtenerArray(
      informe.deudas,
      ["deudas", "abonos", "pagos", "data"]
    );

  const estados =
    obtenerArray(
      informe.estadoDeudas,
      ["deudas", "data"]
    );

  const filas = pagos
    .slice(0, 10)
    .map((item) => ({
      valores: [
        item.descripcion ??
          item.nombre ??
          "Deuda",

        formatoCOP(
          item.monto ??
            item.monto_abono ??
            item.total_pagado
        ),

        texto(
          item.fecha_registro ??
            item.fecha
        ),
      ],
    }));

  if (filas.length) {
    y = tabla(
      doc,
      ["Deuda", "Pago", "Fecha"],
      filas,
      PAGE.marginLeft,
      y,
      182,
      {
        anchos: [85, 55, 42],
      }
    );
  }

  if (estados.length) {
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    doc.text(
      "Estado actual de deudas",
      PAGE.marginLeft,
      y
    );

    y += 8;

    estados
      .slice(0, 7)
      .forEach((item) => {
        const total =
          numero(
            item.monto_total ??
              item.total ??
              item.monto
          );

        const pagado =
          numero(
            item.monto_pagado ??
              item.pagado
          );

        const progreso =
          item.porcentaje_pagado ??
          (total > 0
            ? (pagado / total) *
              100
            : 0);

        y = barraProgreso(
          doc,
          texto(
            item.descripcion ??
              item.nombre ??
              "Deuda"
          ),
          progreso,
          PAGE.marginLeft,
          y,
          180
        );
      });
  }

  return y + 5;
};

/*
 * ============================================================
 * IMPREVISTOS
 * ============================================================
 */

const generarImprevistos = (
  doc,
  informe,
  y
) => {
  y = asegurarEspacio(
    doc,
    y,
    75,
    1
  );

  y = tituloSeccion(
    doc,
    "6. Imprevistos",
    "Distribución de imprevistos registrados durante el período.",
    y
  );

  const datos =
    obtenerArray(
      informe.imprevistosCategoria,
      ["categorias", "data"]
    ).map((item) => ({
      nombre:
        item.nombre ??
        item.categoria ??
        "Sin categoría",

      valor: numero(
        item.total ??
          item.total_imprevistos ??
          item.monto ??
          item.valor
      ),
    }));

  if (datos.length) {
    y = graficoBarras(
      doc,
      "Imprevistos por categoría",
      datos,
      PAGE.marginLeft,
      y,
      180,
      70
    );
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);

    doc.text(
      "No se registraron imprevistos durante el período.",
      PAGE.marginLeft,
      y
    );

    y += 10;
  }

  return y + 5;
};

/*
 * ============================================================
 * FONDO DE EMERGENCIA
 * ============================================================
 */

const generarFondoEmergencia = (
  doc,
  informe,
  y
) => {
  y = asegurarEspacio(
    doc,
    y,
    85,
    1
  );

  y = tituloSeccion(
    doc,
    "7. Fondo de emergencia",
    "Movimientos del período y estado actual del fondo.",
    y
  );

  const periodo =
    informe.fondoEmergencia || {};

  const estado =
    informe.estadoFondoEmergencia || {};

  const aportes = numero(
    periodo.aportes ??
      periodo.total_aportes
  );

  const retiros = numero(
    periodo.retiros ??
      periodo.total_retiros
  );

  const saldo =
    numero(
      estado.saldo_actual ??
        estado.saldo ??
        estado.balance
    );

  const meta =
    numero(
      estado.meta ??
        periodo.meta
    );

  const progreso =
    estado.porcentaje_meta ??
    (meta > 0
      ? (saldo / meta) * 100
      : 0);

  tarjeta(
    doc,
    PAGE.marginLeft,
    y,
    55,
    25,
    "Aportes",
    formatoCOP(aportes),
    COLORS.success
  );

  tarjeta(
    doc,
    PAGE.marginLeft + 62,
    y,
    55,
    25,
    "Retiros",
    formatoCOP(retiros),
    COLORS.danger
  );

  tarjeta(
    doc,
    PAGE.marginLeft + 124,
    y,
    58,
    25,
    "Saldo actual",
    formatoCOP(saldo),
    COLORS.primary
  );

  y += 35;

  y = barraProgreso(
    doc,
    `Progreso de meta · ${formatoCOP(
      meta
    )}`,
    progreso,
    PAGE.marginLeft,
    y,
    180
  );

  return y + 5;
};

/*
 * ============================================================
 * PRESUPUESTO
 * ============================================================
 */

const generarPresupuesto = (
  doc,
  informe,
  y
) => {
  const presupuesto =
    informe.presupuesto;

  if (!presupuesto) {
    return y;
  }

  y = asegurarEspacio(
    doc,
    y,
    100,
    1
  );

  y = tituloSeccion(
    doc,
    "8. Presupuesto",
    "Comparación entre los valores planeados y la ejecución real.",
    y
  );

  const categorias =
    obtenerArray(
      presupuesto.categorias,
      ["data", "detalle", "resultados"]
    );

  const datos =
    categorias.map((item) => ({
      nombre:
        item.nombre ??
        item.categoria ??
        "Categoría",

      planeado: numero(
        item.planeado
      ),

      ejecutado: numero(
        item.ejecutado
      ),
    }));

  if (datos.length) {
    const filas = datos
      .slice(0, 8)
      .map((item) => ({
        valores: [
          item.nombre,
          formatoCOP(item.planeado),
          formatoCOP(item.ejecutado),
          formatoCOP(
            item.planeado -
              item.ejecutado
          ),
        ],
      }));

    y = tabla(
      doc,
      [
        "Categoría",
        "Planeado",
        "Ejecutado",
        "Diferencia",
      ],
      filas,
      PAGE.marginLeft,
      y,
      182,
      {
        anchos: [54, 43, 43, 42],
      }
    );

    const comparacion = datos
      .slice(0, 5)
      .map((item) => ({
        nombre: item.nombre,
        valor:
          item.ejecutado,
      }));

    y = graficoBarras(
      doc,
      "Ejecución del presupuesto",
      comparacion,
      PAGE.marginLeft,
      y + 4,
      180,
      60
    );
  }

  return y + 5;
};

/*
 * ============================================================
 * EVOLUCIÓN
 * ============================================================
 */

const generarEvolucion = (
  doc,
  informe,
  y
) => {
  y = asegurarEspacio(
    doc,
    y,
    105,
    1
  );

  y = tituloSeccion(
    doc,
    "9. Evolución temporal",
    "Comportamiento del balance durante el período seleccionado.",
    y
  );

  const datos =
    obtenerArray(
      informe.evolucion,
      ["datos", "data"]
    );

  if (datos.length) {
    y = graficoLinea(
      doc,
      "Evolución del balance",
      datos,
      PAGE.marginLeft,
      y,
      180,
      85
    );
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);

    doc.text(
      "No existen datos suficientes para representar la evolución temporal.",
      PAGE.marginLeft,
      y
    );

    y += 10;
  }

  return y + 5;
};

/*
 * ============================================================
 * GENERADOR PRINCIPAL
 * ============================================================
 */

export const generarReportePDF = async (
  informe
) => {
  if (!informe) {
    throw new Error(
      "No existe información para generar el informe."
    );
  }

  const doc = crearDocumento();

  let numeroPagina = 1;

  fondoPagina(doc);

  /*
   * PORTADA
   */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...COLORS.primaryLight);

  doc.text(
    "AhorrApp",
    PAGE.marginLeft,
    48
  );

  doc.setFontSize(21);
  doc.setTextColor(...COLORS.text);

  doc.text(
    "Informe financiero",
    PAGE.marginLeft,
    61
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textMuted);

  const fechaInicio =
    informe.periodo?.fecha_inicio ??
    "";

  const fechaFin =
    informe.periodo?.fecha_fin ??
    "";

  doc.text(
    `Período: ${fechaInicio} — ${fechaFin}`,
    PAGE.marginLeft,
    72
  );

  const fechaGeneracion =
    new Date().toLocaleDateString(
      "es-CO"
    );

  doc.text(
    `Generado: ${fechaGeneracion}`,
    PAGE.marginLeft,
    79
  );

  doc.setDrawColor(
    ...COLORS.primary
  );

  doc.setLineWidth(1);

  doc.line(
    PAGE.marginLeft,
    88,
    PAGE.width -
      PAGE.marginRight,
    88
  );

  doc.setFontSize(10);

  const descripcion =
    "Este informe presenta información financiera registrada en AhorrApp para el período seleccionado. Los valores son informativos y representan los registros almacenados en el sistema.";

  const lineasDescripcion =
    doc.splitTextToSize(
      descripcion,
      170
    );

  doc.text(
    lineasDescripcion,
    PAGE.marginLeft,
    102
  );

  /*
   * RESUMEN
   */

  let y = 125;

  y = generarResumen(
    doc,
    informe,
    y
  );

  agregarPiePagina(
    doc,
    numeroPagina
  );

  /*
   * INGRESOS
   */

  doc.addPage();

  numeroPagina++;

  fondoPagina(doc);

  y = PAGE.marginTop;

  y = generarIngresos(
    doc,
    informe,
    y
  );

  /*
   * GASTOS
   */

  y = asegurarEspacio(
    doc,
    y,
    100,
    numeroPagina
  );

  y = generarGastos(
    doc,
    informe,
    y
  );

  /*
   * AHORROS
   */

  y = asegurarEspacio(
    doc,
    y,
    85,
    numeroPagina
  );

  y = generarAhorros(
    doc,
    informe,
    y
  );

  agregarPiePagina(
    doc,
    numeroPagina
  );

  /*
   * DEUDAS
   */

  doc.addPage();

  numeroPagina++;

  fondoPagina(doc);

  y = PAGE.marginTop;

  y = generarDeudas(
    doc,
    informe,
    y
  );

  /*
   * IMPREVISTOS
   */

  y = asegurarEspacio(
    doc,
    y,
    75,
    numeroPagina
  );

  y = generarImprevistos(
    doc,
    informe,
    y
  );

  /*
   * FONDO DE EMERGENCIA
   */

  y = asegurarEspacio(
    doc,
    y,
    85,
    numeroPagina
  );

  y = generarFondoEmergencia(
    doc,
    informe,
    y
  );

  agregarPiePagina(
    doc,
    numeroPagina
  );

  /*
   * PRESUPUESTO
   */

  doc.addPage();

  numeroPagina++;

  fondoPagina(doc);

  y = PAGE.marginTop;

  y = generarPresupuesto(
    doc,
    informe,
    y
  );

  /*
   * EVOLUCIÓN
   */

  y = asegurarEspacio(
    doc,
    y,
    105,
    numeroPagina
  );

  y = generarEvolucion(
    doc,
    informe,
    y
  );

  agregarPiePagina(
    doc,
    numeroPagina
  );

  /*
   * DESCARGA
   */

  const fechaArchivo =
    new Date()
      .toISOString()
      .slice(0, 10);

  doc.save(
    `AhorrApp_Informe_Financiero_${fechaArchivo}.pdf`
  );

  return true;
};

export default generarReportePDF;