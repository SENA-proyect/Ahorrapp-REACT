const pool = require("../db/connection");


/* =========================================================
   UTILIDADES
========================================================= */

const validarFechas = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) {
    return false;
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return false;
  }

  return inicio <= fin;
};

/* =========================================================
   1. RESUMEN FINANCIERO
========================================================= */

const getReporteResumen = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    /* -------------------------
       INGRESOS
    ------------------------- */

    const { rows: [ingresos] } = await pool.query(
      `
      SELECT COALESCE(SUM(i.monto), 0) AS total
      FROM ingresos i
      INNER JOIN entrada e
        ON i.id_entrada = e.id_entrada
      INNER JOIN movimientos m
        ON e.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    /* -------------------------
       GASTOS
    ------------------------- */

    const { rows: [gastos] } = await pool.query(
      `
      SELECT COALESCE(SUM(g.monto), 0) AS total
      FROM gastos g
      INNER JOIN salida s
        ON g.id_salida = s.id_salida
      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND g.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    /* -------------------------
       IMPREVISTOS
    ------------------------- */

    const { rows: [imprevistos] } = await pool.query(
      `
      SELECT COALESCE(SUM(i.monto), 0) AS total
      FROM imprevistos i
      INNER JOIN salida s
        ON i.id_salida = s.id_salida
      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    /* -------------------------
       AHORROS
    ------------------------- */

    const { rows: [ahorros] } = await pool.query(
      `
      SELECT COALESCE(SUM(aa.monto), 0) AS total
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
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    /* -------------------------
       PAGOS DE DEUDAS
    ------------------------- */

    const { rows: [deudas] } = await pool.query(
      `
      SELECT
        COALESCE(SUM(ad.monto), 0) AS total,
        COALESCE(SUM(ad.cuotas), 0) AS cuotas
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
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    /* -------------------------
       FONDO DE EMERGENCIA
    ------------------------- */

    const { rows: [fondo] } = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'aporte' THEN mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS aportes,

        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'retiro' THEN mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS retiros

      FROM movimientos_fondo_emergencia mfe
      INNER JOIN fondos_emergencia fe
        ON mfe.id_fondo = fe.id_fondo
      WHERE fe.id_usuario = $1
        AND mfe.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    const totalIngresos = Number(ingresos.total);
    const totalGastos = Number(gastos.total);
    const totalImprevistos = Number(imprevistos.total);
    const totalAhorros = Number(ahorros.total);
    const totalDeudas = Number(deudas.total);
    const aportesEmergencia = Number(fondo.aportes);
    const retirosEmergencia = Number(fondo.retiros);

    /*
     * El retiro del fondo vuelve a estar disponible.
     */
    const balance =
      totalIngresos
      - totalGastos
      - totalImprevistos
      - totalAhorros
      - totalDeudas
      - aportesEmergencia
      + retirosEmergencia;


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      resumen: {
        ingresos: totalIngresos,
        gastos: totalGastos,
        imprevistos: totalImprevistos,
        ahorros: totalAhorros,
        pagos_deudas: totalDeudas,

        fondo_emergencia: {
          aportes: aportesEmergencia,
          retiros: retirosEmergencia,
          neto: aportesEmergencia - retirosEmergencia
        },

        balance
      },

      deudas: {
        monto_pagado: totalDeudas,
        cuotas_pagadas: Number(deudas.cuotas)
      }
    });

  } catch (error) {

    console.error("Error generando resumen:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   2. GASTOS POR CATEGORÍA
========================================================= */

const getGastosPorCategoria = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(c.id_categoria, 0) AS id_categoria,
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

      GROUP BY
        c.id_categoria,
        c.nombre

      ORDER BY total DESC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      datos: rows
    });

  } catch (error) {

    console.error("Error obteniendo gastos por categoría:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   3. GASTOS POR DEPENDIENTE
========================================================= */

const getGastosPorDependiente = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(d.id_dependientes, 0) AS id_dependiente,

        COALESCE(
          d.nombre,
          'Gasto propio'
        ) AS dependiente,

        COALESCE(
          SUM(g.monto),
          0
        ) AS total

      FROM gastos g

      INNER JOIN salida s
        ON g.id_salida = s.id_salida

      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento

      LEFT JOIN dependientes d
        ON g.id_dependientes = d.id_dependientes

      WHERE m.id_usuario = $1
        AND g.fecha_registro BETWEEN $2 AND $3

      GROUP BY
        d.id_dependientes,
        d.nombre

      ORDER BY total DESC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      datos: rows
    });

  } catch (error) {

    console.error("Error obteniendo gastos por dependiente:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   4. INGRESOS POR CATEGORÍA
========================================================= */

const getIngresosPorCategoria = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(c.id_categoria, 0) AS id_categoria,
        COALESCE(c.nombre, 'Sin categoría') AS categoria,
        COALESCE(SUM(i.monto), 0) AS total

      FROM ingresos i

      INNER JOIN entrada e
        ON i.id_entrada = e.id_entrada

      INNER JOIN movimientos m
        ON e.id_movimiento = m.id_movimiento

      LEFT JOIN categorias c
        ON i.id_categoria = c.id_categoria

      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3

      GROUP BY
        c.id_categoria,
        c.nombre

      ORDER BY total DESC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      datos: rows
    });

  } catch (error) {

    console.error("Error obteniendo ingresos por categoría:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   5. INGRESOS POR FUENTE
========================================================= */

const getIngresosPorFuente = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(i.fuente, 'Sin fuente') AS fuente,
        COALESCE(SUM(i.monto), 0) AS total

      FROM ingresos i

      INNER JOIN entrada e
        ON i.id_entrada = e.id_entrada

      INNER JOIN movimientos m
        ON e.id_movimiento = m.id_movimiento

      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3

      GROUP BY i.fuente

      ORDER BY total DESC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      datos: rows
    });

  } catch (error) {

    console.error("Error obteniendo ingresos por fuente:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   6. HISTORIAL DE AHORROS
========================================================= */

const getReporteAhorros = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows } = await pool.query(
      `
      SELECT
        aa.id_abono,
        aa.id_ahorros,
        aa.monto,
        aa.fecha_registro,

        a.monto AS meta_monto,
        a.monto_acumulado,
        a.descripcion,
        a.meta

      FROM abonos_ahorro aa

      INNER JOIN ahorros a
        ON aa.id_ahorros = a.id_ahorros

      INNER JOIN entrada e
        ON a.id_entrada = e.id_entrada

      INNER JOIN movimientos m
        ON e.id_movimiento = m.id_movimiento

      WHERE m.id_usuario = $1
        AND aa.fecha_registro BETWEEN $2 AND $3

      ORDER BY aa.fecha_registro DESC, aa.id_abono DESC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      total_ahorrado: rows.reduce(
        (total, item) => total + Number(item.monto),
        0
      ),

      datos: rows
    });

  } catch (error) {

    console.error("Error generando reporte de ahorros:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   7. HISTORIAL DE PAGOS DE DEUDA
========================================================= */

const getReporteDeudas = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows } = await pool.query(
      `
      SELECT

        ad.id_abono_deuda,
        ad.id_deudas,
        ad.cuotas,
        ad.monto,
        ad.fecha_registro,
        ad.descripcion,

        d.fuente,
        d.monto AS monto_total_deuda,
        d.cuotas_total,
        d.cuotas_pagadas,
        d.estado

      FROM abonos_deuda ad

      INNER JOIN deudas d
        ON ad.id_deudas = d.id_deudas

      INNER JOIN salida s
        ON d.id_salida = s.id_salida

      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento

      WHERE m.id_usuario = $1
        AND ad.fecha_registro BETWEEN $2 AND $3

      ORDER BY ad.fecha_registro DESC, ad.id_abono_deuda DESC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    const totalPagado = rows.reduce(
      (total, item) => total + Number(item.monto),
      0
    );

    const cuotasPagadas = rows.reduce(
      (total, item) => total + Number(item.cuotas),
      0
    );


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      resumen: {
        total_pagado: totalPagado,
        cuotas_pagadas: cuotasPagadas
      },

      datos: rows
    });

  } catch (error) {

    console.error("Error generando reporte de deudas:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   8. IMPREVISTOS POR CATEGORÍA
========================================================= */

const getImprevistosPorCategoria = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(c.id_categoria, 0) AS id_categoria,
        COALESCE(c.nombre, 'Sin categoría') AS categoria,
        COALESCE(SUM(i.monto), 0) AS total

      FROM imprevistos i

      INNER JOIN salida s
        ON i.id_salida = s.id_salida

      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento

      LEFT JOIN categorias c
        ON i.id_categoria = c.id_categoria

      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3

      GROUP BY
        c.id_categoria,
        c.nombre

      ORDER BY total DESC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      datos: rows
    });

  } catch (error) {

    console.error("Error obteniendo imprevistos por categoría:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


/* =========================================================
   9. FONDO DE EMERGENCIA
========================================================= */

const getReporteFondoEmergencia = async (req, res) => {
  const ID_usuario = req.usuario.id;

  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {

    const { rows: [fondo] } = await pool.query(
      `
      SELECT
        fe.id_fondo,
        fe.meta,

        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'aporte'
              THEN mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS aportes,

        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'retiro'
              THEN mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS retiros

      FROM fondos_emergencia fe

      LEFT JOIN movimientos_fondo_emergencia mfe
        ON fe.id_fondo = mfe.id_fondo
        AND mfe.fecha_registro BETWEEN $2 AND $3

      WHERE fe.id_usuario = $1

      GROUP BY
        fe.id_fondo,
        fe.meta
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );


    if (!fondo) {
      return res.status(404).json({
        ok: false,
        mensaje: "El usuario no tiene fondo de emergencia"
      });
    }


    const aportes = Number(fondo.aportes);
    const retiros = Number(fondo.retiros);
    const meta = Number(fondo.meta);

    return res.status(200).json({
      ok: true,

      periodo: {
        fecha_inicio,
        fecha_fin
      },

      resumen: {
        aportes,
        retiros,
        movimiento_neto: aportes - retiros,
        meta
      }
    });

  } catch (error) {

    console.error("Error generando reporte del fondo:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};

const getReportePresupuesto = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id_periodo } = req.params;

  if (!id_periodo || isNaN(Number(id_periodo))) {
    return res.status(400).json({
      ok: false,
      mensaje: "El id_periodo debe ser válido"
    });
  }

  try {
    // ============================================================
    // 1. OBTENER EL PERIODO Y VALIDAR PROPIEDAD DEL USUARIO
    // ============================================================

    const { rows: periodos } = await pool.query(
      `
      SELECT
        pp.id_periodo,
        pp.id_presupuesto,
        pp.fecha_inicio,
        pp.fecha_fin,
        pp.ingreso_estimado,
        pp.ingreso_real,
        pp.saldo_anterior,
        pp.estado,

        pp.monto_gastos,
        pp.monto_deudas,
        pp.monto_imprevistos,
        pp.monto_ahorros,
        pp.monto_emergencia,

        p.nombre AS presupuesto,
        p.descripcion AS presupuesto_descripcion,
        p.porcentaje_gastos,
        p.porcentaje_deudas,
        p.porcentaje_imprevistos,
        p.porcentaje_ahorros,
        p.porcentaje_emergencia

      FROM periodos_presupuesto pp

      INNER JOIN presupuestos p
        ON pp.id_presupuesto = p.id_presupuesto

      WHERE pp.id_periodo = $1
        AND pp.id_usuario = $2
      `,
      [id_periodo, ID_usuario]
    );

    if (periodos.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "El periodo de presupuesto no existe"
      });
    }

    const periodo = periodos[0];

    const fechaInicio = periodo.fecha_inicio;
    const fechaFin = periodo.fecha_fin;

    // ============================================================
    // 2. INGRESOS REALES
    // ============================================================

    const { rows: [ingresos] } = await pool.query(
      `
      SELECT COALESCE(SUM(i.monto), 0) AS total
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

    // ============================================================
    // 3. GASTOS REALES
    // ============================================================

    const { rows: [gastos] } = await pool.query(
      `
      SELECT COALESCE(SUM(g.monto), 0) AS total
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

    // ============================================================
    // 4. IMPREVISTOS REALES
    // ============================================================

    const { rows: [imprevistos] } = await pool.query(
      `
      SELECT COALESCE(SUM(i.monto), 0) AS total
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

    // ============================================================
    // 5. AHORROS REALES
    // ============================================================

    const { rows: [ahorros] } = await pool.query(
      `
      SELECT COALESCE(SUM(aa.monto), 0) AS total
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

    // ============================================================
    // 6. PAGOS DE DEUDAS REALES
    // ============================================================

    const { rows: [deudas] } = await pool.query(
      `
      SELECT COALESCE(SUM(ad.monto), 0) AS total
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

    // ============================================================
    // 7. APORTES AL FONDO DE EMERGENCIA
    // ============================================================

    const { rows: [emergencia] } = await pool.query(
      `
      SELECT COALESCE(SUM(mfe.monto), 0) AS total
      FROM movimientos_fondo_emergencia mfe

      INNER JOIN fondos_emergencia fe
        ON mfe.id_fondo = fe.id_fondo

      WHERE fe.id_usuario = $1
        AND mfe.tipo = 'aporte'
        AND mfe.fecha_registro BETWEEN $2 AND $3
      `,
      [ID_usuario, fechaInicio, fechaFin]
    );

    // ============================================================
    // 8. CONVERTIR VALORES NUMÉRICOS
    // ============================================================

    const ingresoReal = Number(ingresos.total);

    const ejecutado = {
      gastos: Number(gastos.total),
      deudas: Number(deudas.total),
      imprevistos: Number(imprevistos.total),
      ahorros: Number(ahorros.total),
      emergencia: Number(emergencia.total)
    };

    const planeado = {
      gastos: Number(periodo.monto_gastos),
      deudas: Number(periodo.monto_deudas),
      imprevistos: Number(periodo.monto_imprevistos),
      ahorros: Number(periodo.monto_ahorros),
      emergencia: Number(periodo.monto_emergencia)
    };

    // ============================================================
    // 9. CALCULAR DIFERENCIAS Y PORCENTAJES
    // ============================================================

    const calcularCategoria = (planeado, ejecutado) => ({
      planeado,
      ejecutado,
      diferencia: planeado - ejecutado,
      porcentaje_usado:
        planeado > 0
          ? (ejecutado / planeado) * 100
          : 0
    });

    const categorias = {
      gastos: calcularCategoria(
        planeado.gastos,
        ejecutado.gastos
      ),

      deudas: calcularCategoria(
        planeado.deudas,
        ejecutado.deudas
      ),

      imprevistos: calcularCategoria(
        planeado.imprevistos,
        ejecutado.imprevistos
      ),

      ahorros: calcularCategoria(
        planeado.ahorros,
        ejecutado.ahorros
      ),

      emergencia: calcularCategoria(
        planeado.emergencia,
        ejecutado.emergencia
      )
    };

    // ============================================================
    // 10. TOTALES DEL PERIODO
    // ============================================================

    const totalPlaneado =
      planeado.gastos +
      planeado.deudas +
      planeado.imprevistos +
      planeado.ahorros +
      planeado.emergencia;

    const totalEjecutado =
      ejecutado.gastos +
      ejecutado.deudas +
      ejecutado.imprevistos +
      ejecutado.ahorros +
      ejecutado.emergencia;

    const diferenciaTotal =
      totalPlaneado - totalEjecutado;

    const porcentajeGeneral =
      totalPlaneado > 0
        ? (totalEjecutado / totalPlaneado) * 100
        : 0;

    // ============================================================
    // 11. SALDO DISPONIBLE
    // ============================================================

    const saldoAnterior = Number(periodo.saldo_anterior);

    const saldoDisponible =
      saldoAnterior +
      ingresoReal -
      ejecutado.gastos -
      ejecutado.deudas -
      ejecutado.imprevistos -
      ejecutado.ahorros -
      ejecutado.emergencia;

    // ============================================================
    // 12. RESPUESTA
    // ============================================================

    return res.status(200).json({
      ok: true,

      periodo: {
        id_periodo: periodo.id_periodo,
        id_presupuesto: periodo.id_presupuesto,
        fecha_inicio: periodo.fecha_inicio,
        fecha_fin: periodo.fecha_fin,
        estado: periodo.estado
      },

      presupuesto: {
        nombre: periodo.presupuesto,
        descripcion: periodo.presupuesto_descripcion,

        porcentajes: {
          gastos: Number(periodo.porcentaje_gastos),
          deudas: Number(periodo.porcentaje_deudas),
          imprevistos: Number(periodo.porcentaje_imprevistos),
          ahorros: Number(periodo.porcentaje_ahorros),
          emergencia: Number(periodo.porcentaje_emergencia)
        }
      },

      ingresos: {
        estimado: Number(periodo.ingreso_estimado),
        real: ingresoReal
      },

      saldo: {
        anterior: saldoAnterior,
        disponible: saldoDisponible
      },

      categorias,

      resumen: {
        total_planeado: totalPlaneado,
        total_ejecutado: totalEjecutado,
        diferencia: diferenciaTotal,
        porcentaje_ejecucion: porcentajeGeneral
      }
    });

  } catch (error) {
    console.error("Error generando reporte de presupuesto:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};

const getEvolucionTemporal = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { fecha_inicio, fecha_fin } = req.query;

  if (!validarFechas(fecha_inicio, fecha_fin)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe proporcionar fecha_inicio y fecha_fin válidas"
    });
  }

  try {
    const { rows } = await pool.query(
      `
      WITH fechas AS (
        SELECT generate_series(
          $2::date,
          $3::date,
          INTERVAL '1 day'
        )::date AS fecha
      ),

      ingresos AS (
        SELECT
        SUM(
            (
              COALESCE(i.total, 0)
              - COALESCE(g.total, 0)
              - COALESCE(imp.total, 0)
              - COALESCE(a.total, 0)
              - COALESCE(d.total, 0)
              - COALESCE(fe.aportes, 0)
              + COALESCE(fe.retiros, 0)
            )
          ) OVER (
            ORDER BY f.fecha
          )::numeric AS balance_acumulado
          i.fecha_registro AS fecha,
          COALESCE(SUM(i.monto), 0) AS total
        FROM ingresos i
        INNER JOIN entrada e
          ON i.id_entrada = e.id_entrada
        INNER JOIN movimientos m
          ON e.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1
          AND i.fecha_registro BETWEEN $2 AND $3
        GROUP BY i.fecha_registro
      ),

      gastos AS (
        SELECT
          g.fecha_registro AS fecha,
          COALESCE(SUM(g.monto), 0) AS total
        FROM gastos g
        INNER JOIN salida s
          ON g.id_salida = s.id_salida
        INNER JOIN movimientos m
          ON s.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1
          AND g.fecha_registro BETWEEN $2 AND $3
        GROUP BY g.fecha_registro
      ),

      imprevistos AS (
        SELECT
          i.fecha_registro AS fecha,
          COALESCE(SUM(i.monto), 0) AS total
        FROM imprevistos i
        INNER JOIN salida s
          ON i.id_salida = s.id_salida
        INNER JOIN movimientos m
          ON s.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1
          AND i.fecha_registro BETWEEN $2 AND $3
        GROUP BY i.fecha_registro
      ),

      ahorros AS (
        SELECT
          aa.fecha_registro AS fecha,
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
        GROUP BY aa.fecha_registro
      ),

      deudas AS (
        SELECT
          ad.fecha_registro AS fecha,
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
        GROUP BY ad.fecha_registro
      ),

      fondo_emergencia AS (
        SELECT
          mfe.fecha_registro AS fecha,

          COALESCE(
            SUM(
              CASE
                WHEN mfe.tipo = 'aporte'
                THEN mfe.monto
                ELSE 0
              END
            ),
            0
          ) AS aportes,

          COALESCE(
            SUM(
              CASE
                WHEN mfe.tipo = 'retiro'
                THEN mfe.monto
                ELSE 0
              END
            ),
            0
          ) AS retiros

        FROM movimientos_fondo_emergencia mfe
        INNER JOIN fondos_emergencia fe
          ON mfe.id_fondo = fe.id_fondo
        WHERE fe.id_usuario = $1
          AND mfe.fecha_registro BETWEEN $2 AND $3
        GROUP BY mfe.fecha_registro
      )

      SELECT
        f.fecha,

        COALESCE(i.total, 0)::numeric AS ingresos,
        COALESCE(g.total, 0)::numeric AS gastos,
        COALESCE(imp.total, 0)::numeric AS imprevistos,
        COALESCE(a.total, 0)::numeric AS ahorros,
        COALESCE(d.total, 0)::numeric AS pagos_deudas,

        COALESCE(fe.aportes, 0)::numeric AS aportes_emergencia,
        COALESCE(fe.retiros, 0)::numeric AS retiros_emergencia,

        (
          COALESCE(i.total, 0)
          - COALESCE(g.total, 0)
          - COALESCE(imp.total, 0)
          - COALESCE(a.total, 0)
          - COALESCE(d.total, 0)
          - COALESCE(fe.aportes, 0)
          + COALESCE(fe.retiros, 0)
        )::numeric AS balance

      FROM fechas f

      LEFT JOIN ingresos i
        ON f.fecha = i.fecha

      LEFT JOIN gastos g
        ON f.fecha = g.fecha

      LEFT JOIN imprevistos imp
        ON f.fecha = imp.fecha

      LEFT JOIN ahorros a
        ON f.fecha = a.fecha

      LEFT JOIN deudas d
        ON f.fecha = d.fecha

      LEFT JOIN fondo_emergencia fe
        ON f.fecha = fe.fecha

      ORDER BY f.fecha ASC
      `,
      [ID_usuario, fecha_inicio, fecha_fin]
    );

    const datos = rows.map((item) => ({
      fecha: item.fecha,
      ingresos: Number(item.ingresos),
      gastos: Number(item.gastos),
      imprevistos: Number(item.imprevistos),
      ahorros: Number(item.ahorros),
      pagos_deudas: Number(item.pagos_deudas),
      aportes_emergencia: Number(item.aportes_emergencia),
      retiros_emergencia: Number(item.retiros_emergencia),
      balance: Number(item.balance),
      balance_acumulado: Number(item.balance_acumulado)
    }));

    return res.status(200).json({
      ok: true,
      periodo: {
        fecha_inicio,
        fecha_fin
      },
      datos
    });

  } catch (error) {
    console.error("Error generando evolución temporal:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};

const getEstadoAhorros = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        a.id_ahorros,
        a.monto AS meta,
        a.monto_acumulado,
        a.fecha_registro,
        a.fecha_meta,
        a.descripcion,

        COALESCE(
          SUM(aa.monto),
          0
        ) AS total_abonado

      FROM ahorros a

      INNER JOIN entrada e
        ON a.id_entrada = e.id_entrada

      INNER JOIN movimientos m
        ON e.id_movimiento = m.id_movimiento

      LEFT JOIN abonos_ahorro aa
        ON a.id_ahorros = aa.id_ahorros

      WHERE m.id_usuario = $1

      GROUP BY
        a.id_ahorros,
        a.monto,
        a.monto_acumulado,
        a.fecha_registro,
        a.fecha_meta,
        a.descripcion

      ORDER BY a.fecha_registro DESC
      `,
      [ID_usuario]
    );

    const datos = rows.map((item) => {
      const meta = Number(item.meta);
      const acumulado = Number(item.monto_acumulado);

      return {
        id_ahorro: item.id_ahorros,
        meta,
        monto_acumulado: acumulado,
        porcentaje_cumplimiento:
          meta > 0
            ? (acumulado / meta) * 100
            : 0,
        total_abonado: Number(item.total_abonado),
        fecha_registro: item.fecha_registro,
        fecha_meta: item.fecha_meta,
        descripcion: item.descripcion
      };
    });

    const metaTotal = datos.reduce(
      (total, item) => total + item.meta,
      0
    );

    const acumuladoTotal = datos.reduce(
      (total, item) => total + item.monto_acumulado,
      0
    );

    return res.status(200).json({
      ok: true,

      resumen: {
        cantidad_metas: datos.length,
        meta_total: metaTotal,
        acumulado_total: acumuladoTotal,
        porcentaje_cumplimiento:
          metaTotal > 0
            ? (acumuladoTotal / metaTotal) * 100
            : 0
      },

      datos
    });

  } catch (error) {
    console.error("Error obteniendo estado de ahorros:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};

const getEstadoDeudas = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        d.id_deudas,
        d.monto AS monto_total,
        d.fuente,
        d.descripcion,
        d.fecha_inicio,
        d.cuotas_total,
        d.cuotas_pagadas,
        d.estado,

        COALESCE(
          SUM(ad.monto),
          0
        ) AS monto_pagado,

        COALESCE(
          SUM(ad.cuotas),
          0
        ) AS cuotas_registradas

      FROM deudas d

      INNER JOIN salida s
        ON d.id_salida = s.id_salida

      INNER JOIN movimientos m
        ON s.id_movimiento = m.id_movimiento

      LEFT JOIN abonos_deuda ad
        ON d.id_deudas = ad.id_deudas

      WHERE m.id_usuario = $1

      GROUP BY
        d.id_deudas,
        d.monto,
        d.fuente,
        d.descripcion,
        d.fecha_inicio,
        d.cuotas_total,
        d.cuotas_pagadas,
        d.estado

      ORDER BY d.fecha_inicio DESC
      `,
      [ID_usuario]
    );

    const datos = rows.map((item) => {
      const montoTotal = Number(item.monto_total);
      const cuotasTotal = Number(item.cuotas_total);
      const cuotasPagadas = Number(item.cuotas_pagadas);
      const montoPagado = Number(item.monto_pagado);

      const montoPendiente = Math.max(
        0,
        montoTotal - montoPagado
      );

      const cuotasPendientes = Math.max(
        0,
        cuotasTotal - cuotasPagadas
      );

      return {
        id_deuda: item.id_deudas,
        fuente: item.fuente,
        descripcion: item.descripcion,

        fecha_inicio: item.fecha_inicio,

        monto_total: montoTotal,
        monto_pagado: montoPagado,
        monto_pendiente: montoPendiente,

        cuotas_total: cuotasTotal,
        cuotas_pagadas: cuotasPagadas,
        cuotas_pendientes: cuotasPendientes,

        porcentaje_pagado:
          montoTotal > 0
            ? (montoPagado / montoTotal) * 100
            : 0,

        estado: item.estado
      };
    });

    const montoTotal = datos.reduce(
      (total, item) => total + item.monto_total,
      0
    );

    const montoPagado = datos.reduce(
      (total, item) => total + item.monto_pagado,
      0
    );

    const montoPendiente = datos.reduce(
      (total, item) => total + item.monto_pendiente,
      0
    );

    const cuotasTotal = datos.reduce(
      (total, item) => total + item.cuotas_total,
      0
    );

    const cuotasPagadas = datos.reduce(
      (total, item) => total + item.cuotas_pagadas,
      0
    );

    return res.status(200).json({
      ok: true,

      resumen: {
        cantidad_deudas: datos.length,

        monto_total: montoTotal,
        monto_pagado: montoPagado,
        monto_pendiente: montoPendiente,

        cuotas_total: cuotasTotal,
        cuotas_pagadas: cuotasPagadas,
        cuotas_pendientes:
          Math.max(0, cuotasTotal - cuotasPagadas),

        porcentaje_pagado:
          montoTotal > 0
            ? (montoPagado / montoTotal) * 100
            : 0
      },

      datos
    });

  } catch (error) {
    console.error("Error obteniendo estado de deudas:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};

const getEstadoFondoEmergencia = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        fe.id_fondo,
        fe.meta,
        fe.fecha_creacion,

        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'aporte'
              THEN mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS aportes,

        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'retiro'
              THEN mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS retiros

      FROM fondos_emergencia fe

      LEFT JOIN movimientos_fondo_emergencia mfe
        ON fe.id_fondo = mfe.id_fondo

      WHERE fe.id_usuario = $1

      GROUP BY
        fe.id_fondo,
        fe.meta,
        fe.fecha_creacion
      `,
      [ID_usuario]
    );

    if (!rows.length) {
      return res.status(404).json({
        ok: false,
        mensaje: "El usuario no tiene fondo de emergencia"
      });
    }

    const fondo = rows[0];

    const meta = Number(fondo.meta);
    const aportes = Number(fondo.aportes);
    const retiros = Number(fondo.retiros);

    const saldoActual = Math.max(
      0,
      aportes - retiros
    );

    const porcentajeMeta =
      meta > 0
        ? (saldoActual / meta) * 100
        : 0;

    return res.status(200).json({
      ok: true,

      data: {
        id_fondo: fondo.id_fondo,

        meta,

        aportes,
        retiros,

        saldo_actual: saldoActual,

        porcentaje_meta: porcentajeMeta,

        fecha_creacion: fondo.fecha_creacion
      }
    });

  } catch (error) {
    console.error(
      "Error obteniendo estado del fondo de emergencia:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};

/* =========================================================
   EXPORTACIONES
========================================================= */


module.exports = {
  getReporteResumen,
  getGastosPorCategoria,
  getGastosPorDependiente,
  getIngresosPorCategoria,
  getIngresosPorFuente,
  getReporteAhorros,
  getReporteDeudas,
  getImprevistosPorCategoria,
  getReporteFondoEmergencia,
  getReportePresupuesto,
  getEvolucionTemporal,

  // Estados actuales
  getEstadoAhorros,
  getEstadoDeudas,
  getEstadoFondoEmergencia
};