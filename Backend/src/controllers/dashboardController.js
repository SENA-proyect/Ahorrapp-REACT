// ============================================================
//  AhorrApp — dashboardController.js
//  Endpoints que alimentan el dashboard y las gráficas
// ============================================================

const pool = require("../db/connection");

// ─────────────────────────────────────────────────────────────
//  HELPER: obtiene el período activo del usuario
//  Retorna el período o null si no hay ninguno abierto
// ─────────────────────────────────────────────────────────────
const getPeriodoActivo = async (ID_usuario) => {
  const [rows] = await pool.query(
    `SELECT pp.*, p.Porcentaje_gastos, p.Porcentaje_deudas,
            p.Porcentaje_imprevistos, p.Porcentaje_ahorros,
            p.Porcentaje_emergencia, p.Nombre AS perfil_nombre
     FROM   PERIODOS_PRESUPUESTO pp
     JOIN   PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto
     WHERE  pp.ID_usuario = ? AND pp.Estado = 'abierto'
     LIMIT  1`,
    [ID_usuario]
  );
  return rows[0] ?? null;
};

// ─────────────────────────────────────────────────────────────
//  GET /dashboard/resumen
//  Alimenta las 4 stat cards del Dashboard.jsx
//  Respuesta:
//  {
//    totalIngresos, totalGastos, totalAhorros, balance,
//    periodo: { fecha_inicio, fecha_fin, ingreso_estimado, ingreso_real },
//    sin_periodo: bool
//  }
// ─────────────────────────────────────────────────────────────
const getResumen = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const periodo = await getPeriodoActivo(ID_usuario);

    // Sin período activo → totales históricos como fallback
    if (!periodo) {
      const [[ing]]  = await pool.query(
        `SELECT COALESCE(SUM(i.Monto), 0) AS total
         FROM INGRESOS i
         JOIN ENTRADA e  ON i.ID_entrada    = e.ID_entrada
         JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
         WHERE m.ID_usuario = ?`, [ID_usuario]
      );
      const [[gas]]  = await pool.query(
        `SELECT COALESCE(SUM(g.Monto), 0) AS total
         FROM GASTOS g
         JOIN SALIDA s   ON g.ID_salida      = s.ID_salida
         JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
         WHERE m.ID_usuario = ?`, [ID_usuario]
      );
      const [[aho]]  = await pool.query(
        `SELECT COALESCE(SUM(Monto_acumulado), 0) AS total
         FROM AHORROS a
         JOIN ENTRADA e  ON a.ID_entrada    = e.ID_entrada
         JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
         WHERE m.ID_usuario = ?`, [ID_usuario]
      );

      return res.json({
        ok: true,
        sin_periodo: true,
        totalIngresos: Number(ing.total),
        totalGastos:   Number(gas.total),
        totalAhorros:  Number(aho.total),
        balance:       Number(ing.total) - Number(gas.total),
        periodo:       null,
      });
    }

    const { Fecha_inicio: fi, Fecha_fin: ff } = periodo;

    // Totales del período activo
    const [[ing]] = await pool.query(
      `SELECT COALESCE(SUM(i.Monto), 0) AS total
       FROM INGRESOS i
       JOIN ENTRADA e     ON i.ID_entrada    = e.ID_entrada
       JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );
    const [[gas]] = await pool.query(
      `SELECT COALESCE(SUM(g.Monto), 0) AS total
       FROM GASTOS g
       JOIN SALIDA s      ON g.ID_salida      = s.ID_salida
       JOIN MOVIMIENTOS m ON s.ID_movimiento  = m.ID_movimiento
       WHERE m.ID_usuario = ? AND g.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );
    const [[aho]] = await pool.query(
      `SELECT COALESCE(SUM(a.Monto_acumulado), 0) AS total
       FROM AHORROS a
       JOIN ENTRADA e     ON a.ID_entrada    = e.ID_entrada
       JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ? AND a.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );

    res.json({
      ok:            true,
      sin_periodo:   false,
      totalIngresos: Number(ing.total),
      totalGastos:   Number(gas.total),
      totalAhorros:  Number(aho.total),
      balance:       Number(ing.total) - Number(gas.total),
      periodo: {
        fecha_inicio:      periodo.Fecha_inicio,
        fecha_fin:         periodo.Fecha_fin,
        perfil_nombre:     periodo.perfil_nombre,
        ingreso_estimado:  Number(periodo.Ingreso_estimado),
        ingreso_real:      Number(periodo.Ingreso_real),
        saldo_anterior:    Number(periodo.Saldo_anterior),
      },
    });
  } catch (error) {
    console.error("Error en getResumen:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /dashboard/presupuesto-vs-ejecutado
//  Alimenta la gráfica de barras: presupuestado vs real
//  por cada categoría del período activo
//  Respuesta: array de 5 objetos:
//  [{ categoria, presupuestado, ejecutado, disponible, porcentaje }]
// ─────────────────────────────────────────────────────────────
const getPresupuestoVsEjecutado = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const periodo = await getPeriodoActivo(ID_usuario);

    if (!periodo) {
      return res.json({ ok: true, sin_periodo: true, data: [] });
    }

    const { Fecha_inicio: fi, Fecha_fin: ff } = periodo;

    const [[gasReal]]        = await pool.query(
      `SELECT COALESCE(SUM(g.Monto), 0) AS total FROM GASTOS g
       JOIN SALIDA s ON g.ID_salida = s.ID_salida
       JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ? AND g.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );
    const [[deuReal]]        = await pool.query(
      `SELECT COALESCE(SUM(d.Monto), 0) AS total FROM DEUDAS d
       JOIN SALIDA s ON d.ID_salida = s.ID_salida
       JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ? AND d.Fecha_inicio BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );
    const [[impReal]]        = await pool.query(
      `SELECT COALESCE(SUM(i.Monto), 0) AS total FROM IMPREVISTOS i
       JOIN SALIDA s ON i.ID_salida = s.ID_salida
       JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );
    const [[ahoReal]]        = await pool.query(
      `SELECT COALESCE(SUM(a.Monto_acumulado), 0) AS total FROM AHORROS a
       JOIN ENTRADA e ON a.ID_entrada = e.ID_entrada
       JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ? AND a.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );

    const pct = (eje, pre) =>
      pre > 0 ? parseFloat(((eje / pre) * 100).toFixed(1)) : 0;

    const data = [
      {
        categoria:     "Gastos",
        presupuestado: Number(periodo.Monto_gastos),
        ejecutado:     Number(gasReal.total),
        disponible:    Number(periodo.Monto_gastos) - Number(gasReal.total),
        porcentaje:    pct(Number(gasReal.total), Number(periodo.Monto_gastos)),
      },
      {
        categoria:     "Deudas",
        presupuestado: Number(periodo.Monto_deudas),
        ejecutado:     Number(deuReal.total),
        disponible:    Number(periodo.Monto_deudas) - Number(deuReal.total),
        porcentaje:    pct(Number(deuReal.total), Number(periodo.Monto_deudas)),
      },
      {
        categoria:     "Imprevistos",
        presupuestado: Number(periodo.Monto_imprevistos),
        ejecutado:     Number(impReal.total),
        disponible:    Number(periodo.Monto_imprevistos) - Number(impReal.total),
        porcentaje:    pct(Number(impReal.total), Number(periodo.Monto_imprevistos)),
      },
      {
        categoria:     "Ahorros",
        presupuestado: Number(periodo.Monto_ahorros),
        ejecutado:     Number(ahoReal.total),
        disponible:    Number(periodo.Monto_ahorros) - Number(ahoReal.total),
        porcentaje:    pct(Number(ahoReal.total), Number(periodo.Monto_ahorros)),
      },
      {
        categoria:     "Emergencia",
        presupuestado: Number(periodo.Monto_emergencia),
        ejecutado:     0, // fondo de emergencia no se "gasta", es reserva
        disponible:    Number(periodo.Monto_emergencia),
        porcentaje:    0,
      },
    ];

    res.json({ ok: true, sin_periodo: false, data });
  } catch (error) {
    console.error("Error en getPresupuestoVsEjecutado:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /dashboard/flujo-semanal
//  Alimenta la gráfica de área: ingresos vs gastos por semana
//  dentro del período activo
//  Respuesta: array de semanas:
//  [{ semana: "Sem 1", ingresos, gastos, balance }]
// ─────────────────────────────────────────────────────────────
const getFlujoPorSemana = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const periodo = await getPeriodoActivo(ID_usuario);

    if (!periodo) {
      return res.json({ ok: true, sin_periodo: true, data: [] });
    }

    const inicio = new Date(periodo.Fecha_inicio);
    const fin    = new Date(periodo.Fecha_fin);

    // Construir semanas del período
    const semanas = [];
    let cursor = new Date(inicio);
    let num = 1;

    while (cursor <= fin) {
      const semInicio = cursor.toISOString().split("T")[0];
      const semFinDate = new Date(cursor);
      semFinDate.setDate(semFinDate.getDate() + 6);
      const semFin = (semFinDate > fin ? fin : semFinDate)
        .toISOString().split("T")[0];

      semanas.push({ label: `Sem ${num}`, inicio: semInicio, fin: semFin });
      cursor.setDate(cursor.getDate() + 7);
      num++;
    }

    // Consultar ingresos y gastos por semana en paralelo
    const data = await Promise.all(
      semanas.map(async ({ label, inicio: si, fin: sf }) => {
        const [[ing]] = await pool.query(
          `SELECT COALESCE(SUM(i.Monto), 0) AS total FROM INGRESOS i
           JOIN ENTRADA e ON i.ID_entrada = e.ID_entrada
           JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
           WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`,
          [ID_usuario, si, sf]
        );
        const [[gas]] = await pool.query(
          `SELECT COALESCE(SUM(g.Monto), 0) AS total FROM GASTOS g
           JOIN SALIDA s ON g.ID_salida = s.ID_salida
           JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
           WHERE m.ID_usuario = ? AND g.Fecha_registro BETWEEN ? AND ?`,
          [ID_usuario, si, sf]
        );

        const ingresos = Number(ing.total);
        const gastos   = Number(gas.total);

        return {
          semana:   label,
          ingresos,
          gastos,
          balance:  ingresos - gastos,
        };
      })
    );

    res.json({ ok: true, sin_periodo: false, data });
  } catch (error) {
    console.error("Error en getFlujoPorSemana:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  getResumen,
  getPresupuestoVsEjecutado,
  getFlujoPorSemana,
};