const pool = require("../db/connection");
const { getPeriodoActivo } = require("../service/periodoHelper");


// ─────────────────────────────────────────────────────────────
//  GET /dashboard/resumen
// ─────────────────────────────────────────────────────────────
const getResumen = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const periodo = await getPeriodoActivo(ID_usuario);

    // Sin período activo → totales históricos como fallback
    if (!periodo) {
      const { rows: [ing] } = await pool.query(
        `SELECT COALESCE(SUM(i.monto), 0)::float AS total
        FROM ingresos i
        JOIN entrada e ON i.id_entrada = e.id_entrada
        JOIN movimientos m ON e.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1`, [ID_usuario]
      );
      const { rows: [gas] } = await pool.query(
        `SELECT COALESCE(SUM(g.monto), 0)::float AS total
        FROM gastos g
        JOIN salida s ON g.id_salida = s.id_salida
        JOIN movimientos m ON s.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1`, [ID_usuario]
      );
      const { rows: [aho] } = await pool.query(
        `SELECT COALESCE(SUM(monto_acumulado), 0)::float AS total
        FROM ahorros a
        JOIN entrada e ON a.id_entrada = e.id_entrada
        JOIN movimientos m ON e.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1`, [ID_usuario]
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
    const { rows: [ing] } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total
      FROM ingresos i
      JOIN entrada e ON i.id_entrada = e.id_entrada
      JOIN movimientos m ON e.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const { rows: [gas] } = await pool.query(
      `SELECT COALESCE(SUM(g.monto), 0)::float AS total
      FROM gastos g
      JOIN salida s ON g.id_salida = s.id_salida
      JOIN movimientos m ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1 AND g.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const { rows: [aho] } = await pool.query(
      `SELECT COALESCE(SUM(a.monto_acumulado), 0)::float AS total
      FROM ahorros a
      JOIN entrada e ON a.id_entrada = e.id_entrada
      JOIN movimientos m ON e.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1 AND a.fecha_registro BETWEEN $2 AND $3`,
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
// ─────────────────────────────────────────────────────────────
const getPresupuestoVsEjecutado = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const periodo = await getPeriodoActivo(ID_usuario);

    if (!periodo) {
      return res.json({ ok: true, sin_periodo: true, data: [] });
    }

    const { Fecha_inicio: fi, Fecha_fin: ff } = periodo;

    const { rows: [gasReal] } = await pool.query(
      `SELECT COALESCE(SUM(g.monto), 0)::float AS total FROM gastos g
      JOIN salida s ON g.id_salida = s.id_salida
      JOIN movimientos m ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1 AND g.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const { rows: [deuReal] } = await pool.query(
      `SELECT COALESCE(SUM(
          (d.monto / NULLIF(d.cuotas_total, 0)) * d.cuotas_pagadas
      ), 0)::float AS total
      FROM deudas d
      JOIN salida s ON d.id_salida = s.id_salida
      JOIN movimientos m ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND d.fecha_inicio <= $2
        AND (d.fecha_fin >= $3 OR d.fecha_fin IS NULL)`,
      [ID_usuario, ff, fi]
    );

    const { rows: [impReal] } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total FROM imprevistos i
      JOIN salida s ON i.id_salida = s.id_salida
      JOIN movimientos m ON s.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const { rows: [ahoReal] } = await pool.query(
      `SELECT COALESCE(SUM(aa.monto), 0)::float AS total
      FROM abonos_ahorro aa
      WHERE aa.id_usuario = $1
        AND aa.fecha_registro BETWEEN $2 AND $3`,
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
        ejecutado:     0, 
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
// ─────────────────────────────────────────────────────────────
const getFlujoPorSemana = async (req, res) => {
  const ID_usuario = req.usuario.id;

  // Helper: formatea un Date como YYYY-MM-DD usando componentes LOCALES,
  // evitando el desfase de día que produce toISOString() (que usa UTC).
  const toLocalISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

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
      const semInicio = toLocalISODate(cursor);
      const semFinDate = new Date(cursor);
      semFinDate.setDate(semFinDate.getDate() + 6);
      const semFin = toLocalISODate(semFinDate > fin ? fin : semFinDate);

      semanas.push({ label: `Sem ${num}`, inicio: semInicio, fin: semFin });
      cursor.setDate(cursor.getDate() + 7);
      num++;
    }

    // Consultar ingresos y gastos por semana en paralelo
    const data = await Promise.all(
      semanas.map(async ({ label, inicio: si, fin: sf }) => {
        const { rows: [ing] } = await pool.query(
          `SELECT COALESCE(SUM(i.monto), 0)::float AS total FROM ingresos i
          JOIN entrada e ON i.id_entrada = e.id_entrada
          JOIN movimientos m ON e.id_movimiento = m.id_movimiento
          WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
          [ID_usuario, si, sf]
        );

        const { rows: [gas] } = await pool.query(
          `SELECT COALESCE(SUM(g.monto), 0)::float AS total FROM gastos g
          JOIN salida s ON g.id_salida = s.id_salida
          JOIN movimientos m ON s.id_movimiento = m.id_movimiento
          WHERE m.id_usuario = $1 AND g.fecha_registro BETWEEN $2 AND $3`,
          [ID_usuario, si, sf]
        );

        const { rows: [imp] } = await pool.query(
          `SELECT COALESCE(SUM(i.monto), 0)::float AS total FROM imprevistos i
          JOIN salida s ON i.id_salida = s.id_salida
          JOIN movimientos m ON s.id_movimiento = m.id_movimiento
          WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
          [ID_usuario, si, sf]
        );

        const { rows: [deu] } = await pool.query(
          `SELECT COALESCE(SUM(
              (d.monto / NULLIF(d.cuotas_total, 0)) * d.cuotas_pagadas
          ), 0)::float AS total
          FROM deudas d
          JOIN salida s ON d.id_salida = s.id_salida
          JOIN movimientos m ON s.id_movimiento = m.id_movimiento
          WHERE m.id_usuario = $1
            AND d.fecha_inicio <= $2
            AND (d.fecha_fin >= $3 OR d.fecha_fin IS NULL)`,
          [ID_usuario, sf, si]
        );

        const ingresos = Number(ing.total);
        const salidas  = Number(gas.total) + Number(imp.total) + Number(deu.total);

        return {
          semana:   label,
          ingresos,
          gastos:   salidas,
          balance:  ingresos - salidas,
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