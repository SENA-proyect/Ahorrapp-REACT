const pool = require("../db/connection");

/*
 * Obtener resumen financiero de un período
 *
 * El período se recibe mediante:
 * ?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
 *
 * Si no se especifican fechas, se utiliza el mes actual.
 */
const getReporteResumen = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const fechaInicio =
    req.query.fecha_inicio ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];

  const fechaFin =
    req.query.fecha_fin ||
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

  try {
    /*
     * INGRESOS
     */
    const { rows: [ingresos] } = await pool.query(
      `
      SELECT
        COALESCE(SUM(i.monto), 0) AS total
      FROM ingresos i
      INNER JOIN entrada e
        ON i.id_entrada = e.id_entrada
      INNER JOIN movimientos m
        ON e.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    /*
     * GASTOS
     */
    const { rows: [gastos] } = await pool.query(
      `
      SELECT
        COALESCE(SUM(g.monto), 0) AS total
      FROM gastos g
      INNER JOIN salida s
        ON g.id_salida = s.id_salida
      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND g.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    /*
     * IMPREVISTOS
     */
    const { rows: [imprevistos] } = await pool.query(
      `
      SELECT
        COALESCE(SUM(i.monto), 0) AS total
      FROM imprevistos i
      INNER JOIN salida s
        ON i.id_salida = s.id_salida
      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    /*
     * AHORROS
     *
     * Importante:
     * No utilizamos ahorros.monto_acumulado porque representa
     * el estado actual del ahorro.
     *
     * Para el reporte utilizamos los abonos realizados dentro
     * del período seleccionado.
     */
    const { rows: [ahorros] } = await pool.query(
      `
      SELECT
        COALESCE(SUM(aa.monto), 0) AS total
      FROM abonos_ahorro aa
      INNER JOIN ahorros a
        ON aa.id_ahorros = a.id_ahorros
      INNER JOIN entrada e
        ON a.id_entrada = e.id_entrada
      INNER JOIN movimientos m
        ON e.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND aa.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    /*
     * PAGOS DE DEUDAS
     *
     * Igual que con ahorros, utilizamos el histórico
     * de abonos y no deudas.monto.
     */
    const { rows: [deudas] } = await pool.query(
      `
      SELECT
        COALESCE(SUM(ad.monto), 0) AS total
      FROM abonos_deuda ad
      INNER JOIN deudas d
        ON ad.id_deudas = d.id_deudas
      INNER JOIN salida s
        ON d.id_salida = s.id_salida
      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND ad.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    /*
     * FONDO DE EMERGENCIA
     *
     * Los aportes aumentan el fondo.
     * Los retiros lo disminuyen.
     */
    const { rows: [fondoEmergencia] } = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'aporte' THEN mfe.monto
              WHEN mfe.tipo = 'retiro' THEN -mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS total
      FROM movimientos_fondo_emergencia mfe
      INNER JOIN fondos_emergencia fe
        ON mfe.id_fondo = fe.id_fondo
      WHERE fe.id_usuario = $1
        AND mfe.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    const totalIngresos = Number(ingresos.total);
    const totalGastos = Number(gastos.total);
    const totalImprevistos = Number(imprevistos.total);
    const totalAhorros = Number(ahorros.total);
    const totalDeudas = Number(deudas.total);
    const totalFondoEmergencia = Number(fondoEmergencia.total);

    /*
     * Resultado disponible.
     *
     * Los ahorros, pagos de deuda y aportes al fondo
     * representan dinero destinado a esos objetivos.
     */
    const dineroDestinado =
      totalGastos +
      totalImprevistos +
      totalAhorros +
      totalDeudas +
      totalFondoEmergencia;

    const balance = totalIngresos - dineroDestinado;

    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      },

      resumen: {
        ingresos: totalIngresos,
        gastos: totalGastos,
        imprevistos: totalImprevistos,
        ahorros: totalAhorros,
        pagos_deudas: totalDeudas,
        fondo_emergencia: totalFondoEmergencia,
        balance
      }
    });

  } catch (error) {
    console.error("Error generando reporte resumen:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/*
 * Gastos agrupados por categoría
 */
const getReporteGastosPorCategoria = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const fechaInicio = req.query.fecha_inicio;
  const fechaFin = req.query.fecha_fin;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({
      ok: false,
      mensaje: "fecha_inicio y fecha_fin son requeridas"
    });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(c.nombre, 'Sin categoría') AS categoria,
        COALESCE(SUM(g.monto), 0) AS total
      FROM gastos g
      INNER JOIN salida s
        ON g.id_salida = s.id_salida
      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento
      LEFT JOIN categorias c
        ON g.id_categoria = c.id_categoria
      WHERE m.id_usuario = $1
        AND g.fecha_registro BETWEEN $2 AND $3
      GROUP BY c.nombre
      ORDER BY total DESC
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    return res.status(200).json({
      ok: true,
      periodo: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      },
      datos: rows
    });

  } catch (error) {
    console.error("Error generando reporte de gastos:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/*
 * Obtener detalle de movimientos del período
 */
const getReporteMovimientos = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const fechaInicio = req.query.fecha_inicio;
  const fechaFin = req.query.fecha_fin;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({
      ok: false,
      mensaje: "fecha_inicio y fecha_fin son requeridas"
    });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        m.id_movimiento,
        m.tipo_flujo,
        m.subtipo_modulo,

        CASE
          WHEN m.subtipo_modulo = 'Ingreso' THEN i.monto
          WHEN m.subtipo_modulo = 'Gasto' THEN g.monto
          WHEN m.subtipo_modulo = 'Imprevisto' THEN imp.monto
          WHEN m.subtipo_modulo = 'Ahorro' THEN aa.monto
          WHEN m.subtipo_modulo = 'Deuda' THEN ad.monto
          ELSE 0
        END AS monto,

        CASE
          WHEN m.subtipo_modulo = 'Ingreso' THEN i.fecha_registro
          WHEN m.subtipo_modulo = 'Gasto' THEN g.fecha_registro
          WHEN m.subtipo_modulo = 'Imprevisto' THEN imp.fecha_registro
          WHEN m.subtipo_modulo = 'Ahorro' THEN aa.fecha_registro
          WHEN m.subtipo_modulo = 'Deuda' THEN ad.fecha_registro
          ELSE NULL
        END AS fecha_registro

      FROM movimientos m

      LEFT JOIN entrada e
        ON m.id_movimiento = e.id_movimiento

      LEFT JOIN ingresos i
        ON e.id_entrada = i.id_entrada

      LEFT JOIN ahorros a
        ON e.id_entrada = a.id_entrada

      LEFT JOIN abonos_ahorro aa
        ON a.id_ahorros = aa.id_ahorros

      LEFT JOIN salida s
        ON m.id_movimiento = s.id_movimiento

      LEFT JOIN gastos g
        ON s.id_salida = g.id_salida

      LEFT JOIN imprevistos imp
        ON s.id_salida = imp.id_salida

      LEFT JOIN deudas d
        ON s.id_salida = d.id_salida

      LEFT JOIN abonos_deuda ad
        ON d.id_deudas = ad.id_deudas

      WHERE m.id_usuario = $1
        AND (
          (i.fecha_registro BETWEEN $2 AND $3)
          OR (g.fecha_registro BETWEEN $2 AND $3)
          OR (imp.fecha_registro BETWEEN $2 AND $3)
          OR (aa.fecha_registro BETWEEN $2 AND $3)
          OR (ad.fecha_registro BETWEEN $2 AND $3)
        )

      ORDER BY fecha_registro DESC
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    return res.status(200).json({
      ok: true,
      periodo: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      },
      datos: rows
    });

  } catch (error) {
    console.error("Error obteniendo movimientos del reporte:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


module.exports = {
  getReporteResumen,
  getReporteGastosPorCategoria,
  getReporteMovimientos
};
