const pool = require("../db/connection");
const { verificarImprevistosNoUsados } = require("../service/NotificacionesService");
const {
  LIMITES,
  aNumero,
  validarMonto,
  validarTexto,
  primerError,
} = require("../service/validaciones");

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const ERROR_500 = (mensaje) => ({ ok: false, mensaje });

// Columnas de un perfil con el alias que esperan web y móvil.
const COLUMNAS_PERFIL = `
    id_presupuesto AS "ID_presupuesto",
    id_usuario AS "ID_usuario",
    nombre AS "Nombre",
    descripcion AS "Descripcion",
    activo AS "Activo",
    dia_corte AS "Dia_corte",
    porcentaje_gastos AS "Porcentaje_gastos",
    porcentaje_deudas AS "Porcentaje_deudas",
    porcentaje_imprevistos AS "Porcentaje_imprevistos",
    porcentaje_ahorros AS "Porcentaje_ahorros",
    porcentaje_emergencia AS "Porcentaje_emergencia",
    fecha_actualizacion AS "Fecha_actualizacion"`;

const CLAVES_PORCENTAJE = [
  "Porcentaje_gastos",
  "Porcentaje_deudas",
  "Porcentaje_imprevistos",
  "Porcentaje_ahorros",
  "Porcentaje_emergencia",
];

const toLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Interpreta 'YYYY-MM-DD' como fecha LOCAL. `new Date('2026-10-09')` la
// interpreta como UTC y, en servidores con zona horaria negativa (ej. Bogotá),
// retrocedía un día y desplazaba el cierre del período.
const parseFechaLocal = (valor) => {
  if (valor instanceof Date) return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  const [y, m, d] = String(valor).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

function calcularMontos(ingresoBase, saldoAnterior, perfil) {
  const total = Number(ingresoBase) + Number(saldoAnterior);
  return {
    Ingreso_estimado: Number(ingresoBase),
    Saldo_anterior: Number(saldoAnterior),
    Monto_gastos: parseFloat(((total * perfil.Porcentaje_gastos) / 100).toFixed(2)),
    Monto_deudas: parseFloat(((total * perfil.Porcentaje_deudas) / 100).toFixed(2)),
    Monto_imprevistos: parseFloat(((total * perfil.Porcentaje_imprevistos) / 100).toFixed(2)),
    Monto_ahorros: parseFloat(((total * perfil.Porcentaje_ahorros) / 100).toFixed(2)),
    Monto_emergencia: parseFloat(((total * perfil.Porcentaje_emergencia) / 100).toFixed(2)),
  };
}

function ultimoDiaDelMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

//  Calcula la fecha de fin de un período dado su fecha de inicio y el Dia_corte
//  del perfil.
//  Ej: inicio = 2025-03-15, dia_corte = 15 → fin = 2025-04-14
//
//  Si diaCorte no existe en el mes de destino (ej. 31 en un mes de 30 días, o
//  29/30/31 en febrero), se recorta al último día disponible de ese mes; nunca
//  se desborda al mes siguiente.
function calcularFechaFin(fechaInicio, diaCorte) {
  const inicio = parseFechaLocal(fechaInicio);

  let anio = inicio.getFullYear();
  let mes = inicio.getMonth() + 2; // mes siguiente

  if (mes > 12) {
    mes = 1;
    anio++;
  }

  const diaAjustado = Math.min(diaCorte, ultimoDiaDelMes(anio, mes));

  // Fecha fin = día anterior al corte en el mes siguiente
  const fin = new Date(anio, mes - 1, diaAjustado);
  fin.setDate(fin.getDate() - 1);

  // Si el corte cae antes del inicio, se avanza un mes más.
  if (fin <= inicio) {
    let anio2 = fin.getFullYear();
    let mes2 = fin.getMonth() + 2;
    if (mes2 > 12) {
      mes2 = 1;
      anio2++;
    }

    const diaAjustado2 = Math.min(diaCorte, ultimoDiaDelMes(anio2, mes2));
    const finRecalculado = new Date(anio2, mes2 - 1, diaAjustado2);
    finRecalculado.setDate(finRecalculado.getDate() - 1);
    return toLocalDate(finRecalculado);
  }

  return toLocalDate(fin);
}

// Valida un perfil COMPLETO (ya mezclado con defaults/valores actuales).
// Reglas (coinciden con los CHECK de supabase.sql):
//   · cada porcentaje entre 0 y 100, con máximo 2 decimales
//   · los cinco porcentajes suman exactamente 100
//   · día de corte entero entre 1 y 31
//   · nombre obligatorio (<= 80) y descripción <= 255
function validarPerfil(p) {
  const nombre = typeof p.Nombre === "string" ? p.Nombre.trim() : "";
  if (!nombre) return "El nombre del perfil es obligatorio";

  const errorTexto = primerError(
    validarTexto(nombre, LIMITES.nombre_presupuesto, "El nombre"),
    validarTexto(p.Descripcion, LIMITES.descripcion_presupuesto, "La descripción")
  );
  if (errorTexto) return errorTexto;

  const dia = aNumero(p.Dia_corte);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    return "El día de corte debe estar entre 1 y 31";
  }

  let sumaCent = 0;
  for (const clave of CLAVES_PORCENTAJE) {
    const n = aNumero(p[clave]);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return "Cada porcentaje debe estar entre 0 y 100";
    }
    if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) {
      return "Los porcentajes admiten como máximo 2 decimales";
    }
    sumaCent += Math.round(n * 100);
  }
  if (sumaCent !== 10000) {
    return `Los porcentajes deben sumar 100. Suma actual: ${(sumaCent / 100).toFixed(2)}`;
  }

  return null;
}

//   GET /presupuestos

const listarPerfiles = async (req, res) => {
  try {
    const { rows: perfiles } = await pool.query(
      `SELECT
          id_presupuesto AS "ID_presupuesto",
          nombre AS "Nombre",
          descripcion AS "Descripcion",
          activo AS "Activo",
          dia_corte AS "Dia_corte",
          porcentaje_gastos AS "Porcentaje_gastos",
          porcentaje_deudas AS "Porcentaje_deudas",
          porcentaje_imprevistos AS "Porcentaje_imprevistos",
          porcentaje_ahorros AS "Porcentaje_ahorros",
          porcentaje_emergencia AS "Porcentaje_emergencia",
          fecha_actualizacion AS "Fecha_actualizacion"
       FROM   presupuestos
       WHERE  id_usuario = $1
       ORDER  BY activo DESC, fecha_actualizacion DESC`,
      [req.usuario.id]
    );
    res.json({ ok: true, data: perfiles });
  } catch (err) {
    console.error("Error en listarPerfiles:", err.message);
    res.status(500).json(ERROR_500("Error al listar perfiles"));
  }
};

//  GET /presupuestos/:id (perfil específico)
const obtenerPerfil = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS_PERFIL}
         FROM presupuestos
        WHERE id_presupuesto = $1 AND id_usuario = $2`,
      [req.params.id, req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: "Perfil no encontrado" });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error("Error en obtenerPerfil:", err.message);
    res.status(500).json(ERROR_500("Error al obtener perfil"));
  }
};

//   POST /presupuestos (los porcentajes siempre deben dar 100%)
const crearPerfil = async (req, res) => {
  const b = req.body || {};
  const perfil = {
    Nombre: b.Nombre ?? "Mi presupuesto",
    Descripcion: b.Descripcion ?? null,
    Dia_corte: b.Dia_corte ?? 1,
    Porcentaje_gastos: b.Porcentaje_gastos ?? 40.0,
    Porcentaje_deudas: b.Porcentaje_deudas ?? 20.0,
    Porcentaje_imprevistos: b.Porcentaje_imprevistos ?? 15.0,
    Porcentaje_ahorros: b.Porcentaje_ahorros ?? 10.0,
    Porcentaje_emergencia: b.Porcentaje_emergencia ?? 15.0,
  };

  const error = validarPerfil(perfil);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  try {
    const { rows: result } = await pool.query(
      `INSERT INTO presupuestos
       (id_usuario, nombre, descripcion, activo, dia_corte,
        porcentaje_gastos, porcentaje_deudas, porcentaje_imprevistos,
        porcentaje_ahorros, porcentaje_emergencia)
       VALUES ($1, $2, $3, FALSE, $4, $5, $6, $7, $8, $9)
       RETURNING id_presupuesto`,
      [
        req.usuario.id,
        perfil.Nombre.trim(),
        typeof perfil.Descripcion === "string" && perfil.Descripcion.trim()
          ? perfil.Descripcion.trim()
          : null,
        Number(perfil.Dia_corte),
        Number(perfil.Porcentaje_gastos),
        Number(perfil.Porcentaje_deudas),
        Number(perfil.Porcentaje_imprevistos),
        Number(perfil.Porcentaje_ahorros),
        Number(perfil.Porcentaje_emergencia),
      ]
    );
    res.status(201).json({ ok: true, mensaje: "Perfil creado", ID_presupuesto: result[0].id_presupuesto });
  } catch (err) {
    console.error("Error en crearPerfil:", err.message);
    res.status(500).json(ERROR_500("Error al crear perfil"));
  }
};

//   PUT /presupuestos/:id
//   No se puede editar un perfil con un período abierto.
const editarPerfil = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS_PERFIL}
         FROM presupuestos
        WHERE id_presupuesto = $1 AND id_usuario = $2`,
      [id, req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: "Perfil no encontrado" });
    const actual = rows[0];

    // Bloquear edición si hay un período abierto asociado a este perfil
    const { rows: periodos } = await pool.query(
      `SELECT id_periodo FROM periodos_presupuesto
        WHERE id_presupuesto = $1 AND estado = 'abierto'`,
      [id]
    );
    if (periodos.length) {
      return res.status(409).json({
        ok: false,
        mensaje: "No puedes editar un perfil con un período activo. Cierra el período primero.",
      });
    }

    // Los campos no enviados conservan su valor actual; se valida el perfil
    // RESULTANTE (antes solo se validaba la suma si llegaban gastos o deudas, y
    // los campos omitidos contaban como 0).
    const b = req.body || {};
    const resultante = {
      Nombre: b.Nombre ?? actual.Nombre,
      Descripcion: b.Descripcion ?? actual.Descripcion,
      Dia_corte: b.Dia_corte ?? actual.Dia_corte,
    };
    for (const clave of CLAVES_PORCENTAJE) resultante[clave] = b[clave] ?? actual[clave];

    const error = validarPerfil(resultante);
    if (error) return res.status(400).json({ ok: false, mensaje: error });

    await pool.query(
      `UPDATE presupuestos
          SET nombre                 = $1,
              descripcion            = $2,
              dia_corte              = $3,
              porcentaje_gastos      = $4,
              porcentaje_deudas      = $5,
              porcentaje_imprevistos = $6,
              porcentaje_ahorros     = $7,
              porcentaje_emergencia  = $8
        WHERE id_presupuesto = $9`,
      [
        resultante.Nombre.trim(),
        typeof resultante.Descripcion === "string" && resultante.Descripcion.trim()
          ? resultante.Descripcion.trim()
          : null,
        Number(resultante.Dia_corte),
        Number(resultante.Porcentaje_gastos),
        Number(resultante.Porcentaje_deudas),
        Number(resultante.Porcentaje_imprevistos),
        Number(resultante.Porcentaje_ahorros),
        Number(resultante.Porcentaje_emergencia),
        id,
      ]
    );
    res.json({ ok: true, mensaje: "Perfil actualizado" });
  } catch (err) {
    console.error("Error en editarPerfil:", err.message);
    res.status(500).json(ERROR_500("Error al actualizar perfil"));
  }
};

//   DELETE /presupuestos/:id
//   No se puede eliminar si tiene períodos asociados o si es el perfil activo.
const eliminarPerfil = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT activo AS "Activo" FROM presupuestos WHERE id_presupuesto = $1 AND id_usuario = $2`,
      [id, req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: "Perfil no encontrado" });
    if (rows[0].Activo) {
      return res.status(409).json({ ok: false, mensaje: "No puedes eliminar el perfil activo" });
    }

    const { rows: periodos } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM periodos_presupuesto WHERE id_presupuesto = $1`,
      [id]
    );
    if (periodos[0].total > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: "El perfil tiene períodos registrados y no puede eliminarse",
      });
    }

    await pool.query(`DELETE FROM presupuestos WHERE id_presupuesto = $1`, [id]);
    res.json({ ok: true, mensaje: "Perfil eliminado" });
  } catch (err) {
    console.error("Error en eliminarPerfil:", err.message);
    res.status(500).json(ERROR_500("Error al eliminar perfil"));
  }
};

//   PUT /presupuestos/:id/activar
//   Solo se puede activar un perfil si el usuario no tiene un período abierto.
const activarPerfil = async (req, res) => {
  const { id } = req.params;
  const ID_usuario = req.usuario.id;

  let conn;
  try {
    const { rows } = await pool.query(
      `SELECT id_presupuesto FROM presupuestos WHERE id_presupuesto = $1 AND id_usuario = $2`,
      [id, ID_usuario]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: "Perfil no encontrado" });

    const { rows: periodoAbierto } = await pool.query(
      `SELECT pp.id_periodo FROM periodos_presupuesto pp
         JOIN presupuestos p ON pp.id_presupuesto = p.id_presupuesto
        WHERE p.id_usuario = $1 AND pp.estado = 'abierto'`,
      [ID_usuario]
    );
    if (periodoAbierto.length) {
      return res.status(409).json({
        ok: false,
        mensaje: "Tienes un período activo. Ciérralo antes de cambiar de perfil.",
      });
    }

    conn = await pool.connect();
    await conn.query("BEGIN");
    await conn.query(`UPDATE presupuestos SET activo = FALSE WHERE id_usuario = $1`, [ID_usuario]);
    await conn.query(`UPDATE presupuestos SET activo = TRUE WHERE id_presupuesto = $1`, [id]);
    await conn.query("COMMIT");
    res.json({ ok: true, mensaje: "Perfil activado correctamente" });
  } catch (err) {
    if (conn) {
      try {
        await conn.query("ROLLBACK");
      } catch (_) {
        /* conexión cerrada */
      }
    }
    console.error("Error en activarPerfil:", err.message);
    res.status(500).json(ERROR_500("Error al activar perfil"));
  } finally {
    if (conn) conn.release();
  }
};

// ─────────────────────────────────────────────────────────────
//  PERÍODOS — apertura y cierre
// ─────────────────────────────────────────────────────────────

//   POST /presupuestos/periodos/abrir
const abrirPeriodo = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { ingreso_estimado } = req.body || {};

  const errorIngreso = validarMonto(ingreso_estimado, {
    nombre: "El ingreso estimado",
    permitirCero: true,
  });
  if (errorIngreso) return res.status(400).json({ ok: false, mensaje: errorIngreso });

  try {
    // 1. Perfil activo
    const { rows: perfiles } = await pool.query(
      `SELECT ${COLUMNAS_PERFIL} FROM presupuestos WHERE id_usuario = $1 AND activo = TRUE`,
      [ID_usuario]
    );
    if (!perfiles.length) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "No tienes un perfil de presupuesto activo. Activa uno primero." });
    }
    const perfil = perfiles[0];

    const { rows: abiertos } = await pool.query(
      `SELECT id_periodo FROM periodos_presupuesto
        WHERE id_usuario = $1 AND estado = 'abierto'`,
      [ID_usuario]
    );
    if (abiertos.length) {
      return res
        .status(409)
        .json({ ok: false, mensaje: "Ya tienes un período abierto. Ciérralo antes de abrir uno nuevo." });
    }

    // Saldo sobrante del último período cerrado (presupuestado − asignado).
    const { rows: ultimos } = await pool.query(
      `SELECT (ingreso_estimado + saldo_anterior
               - monto_gastos - monto_deudas
               - monto_imprevistos - monto_ahorros - monto_emergencia) AS saldo_sobrante
         FROM periodos_presupuesto
        WHERE id_usuario = $1 AND estado = 'cerrado'
        ORDER BY fecha_fin DESC
        LIMIT 1`,
      [ID_usuario]
    );
    const saldoAnterior = ultimos.length ? Math.max(0, Number(ultimos[0].saldo_sobrante)) : 0;

    const fechaInicio = toLocalDate(new Date());
    const fechaFin = calcularFechaFin(fechaInicio, perfil.Dia_corte);
    const montos = calcularMontos(aNumero(ingreso_estimado), saldoAnterior, perfil);

    const { rows: result } = await pool.query(
      `INSERT INTO periodos_presupuesto
       (id_presupuesto, id_usuario, fecha_inicio, fecha_fin, estado,
        ingreso_estimado, ingreso_real, saldo_anterior,
        monto_gastos, monto_deudas, monto_imprevistos,
        monto_ahorros, monto_emergencia)
       VALUES ($1, $2, $3, $4, 'abierto', $5, 0.00, $6, $7, $8, $9, $10, $11)
       RETURNING id_periodo`,
      [
        perfil.ID_presupuesto,
        ID_usuario,
        fechaInicio,
        fechaFin,
        montos.Ingreso_estimado,
        montos.Saldo_anterior,
        montos.Monto_gastos,
        montos.Monto_deudas,
        montos.Monto_imprevistos,
        montos.Monto_ahorros,
        montos.Monto_emergencia,
      ]
    );
    res.status(201).json({
      ok: true,
      mensaje: "Período abierto correctamente",
      data: {
        ID_periodo: result[0].id_periodo,
        Fecha_inicio: fechaInicio,
        Fecha_fin: fechaFin,
        Saldo_anterior: saldoAnterior,
        Ingreso_estimado: Number(ingreso_estimado),
        ...montos,
      },
    });
  } catch (error) {
    // Índice único idx_periodo_abierto_unico: dos aperturas simultáneas.
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ ok: false, mensaje: "Ya tienes un período abierto. Ciérralo antes de abrir uno nuevo." });
    }
    console.error("Error en abrirPeriodo:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

//   PUT /presupuestos/periodos/cerrar
const cerrarPeriodo = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows: abiertos } = await pool.query(
      `SELECT
          id_periodo AS "ID_periodo",
          id_presupuesto AS "ID_presupuesto",
          id_usuario AS "ID_usuario",
          fecha_inicio AS "Fecha_inicio",
          fecha_fin AS "Fecha_fin",
          ingreso_estimado AS "Ingreso_estimado",
          ingreso_real AS "Ingreso_real",
          saldo_anterior AS "Saldo_anterior",
          estado AS "Estado",
          monto_gastos AS "Monto_gastos",
          monto_deudas AS "Monto_deudas",
          monto_imprevistos AS "Monto_imprevistos",
          monto_ahorros AS "Monto_ahorros",
          monto_emergencia AS "Monto_emergencia"
       FROM periodos_presupuesto
       WHERE id_usuario = $1 AND estado = 'abierto'`,
      [ID_usuario]
    );
    if (!abiertos.length) {
      return res.status(404).json({ ok: false, mensaje: "No tienes un período abierto." });
    }
    const periodo = abiertos[0];

    const { rows: ingresos } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total
         FROM ingresos i
         JOIN entrada e     ON i.id_entrada    = e.id_entrada
         JOIN movimientos m ON e.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1
          AND i.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const ingresoReal = Number(ingresos[0].total);

    await pool.query(
      `UPDATE periodos_presupuesto
          SET estado = 'cerrado', ingreso_real = $1
        WHERE id_periodo = $2`,
      [ingresoReal, periodo.ID_periodo]
    );

    // Post-cierre: si la porción de imprevistos casi no se usó, sugerir
    // redirigir ese dinero a ahorros (la notificación no puede tumbar el cierre).
    try {
      await verificarImprevistosNoUsados(ID_usuario, periodo);
    } catch (e) {
      console.error("Error en verificarImprevistosNoUsados:", e.message);
    }

    res.json({
      ok: true,
      mensaje: "Período cerrado correctamente",
      data: {
        ID_periodo: periodo.ID_periodo,
        Ingreso_real: ingresoReal,
        Fecha_inicio: periodo.Fecha_inicio,
        Fecha_fin: periodo.Fecha_fin,
      },
    });
  } catch (err) {
    console.error("Error en cerrarPeriodo:", err.message);
    res.status(500).json(ERROR_500("Error al cerrar período"));
  }
};

//  GET /presupuestos/periodos  (histórico paginado)
const listarPeriodos = async (req, res) => {
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  // Mínimo 1: un límite negativo producía LIMIT negativo → error 500.
  const limite = Math.min(50, Math.max(1, parseInt(req.query.limite) || 10));
  const offset = (pagina - 1) * limite;

  try {
    const { rows: periodos } = await pool.query(
      `SELECT
          pp.id_periodo AS "ID_periodo",
          pp.id_presupuesto AS "ID_presupuesto",
          pp.id_usuario AS "ID_usuario",
          pp.fecha_inicio AS "Fecha_inicio",
          pp.fecha_fin AS "Fecha_fin",
          pp.ingreso_estimado AS "Ingreso_estimado",
          pp.ingreso_real AS "Ingreso_real",
          pp.saldo_anterior AS "Saldo_anterior",
          pp.estado AS "Estado",
          pp.monto_gastos AS "Monto_gastos",
          pp.monto_deudas AS "Monto_deudas",
          pp.monto_imprevistos AS "Monto_imprevistos",
          pp.monto_ahorros AS "Monto_ahorros",
          pp.monto_emergencia AS "Monto_emergencia",
          p.nombre AS "Perfil_nombre"
       FROM   periodos_presupuesto pp
       JOIN   presupuestos p ON pp.id_presupuesto = p.id_presupuesto
       WHERE  pp.id_usuario = $1
       ORDER  BY pp.fecha_inicio DESC
       LIMIT  $2 OFFSET $3`,
      [req.usuario.id, limite, offset]
    );
    const { rows: [{ total }] } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM periodos_presupuesto WHERE id_usuario = $1`,
      [req.usuario.id]
    );
    res.json({ ok: true, data: periodos, total, pagina, limite });
  } catch (err) {
    console.error("Error en listarPeriodos:", err.message);
    res.status(500).json(ERROR_500("Error al listar períodos"));
  }
};

//  GET /presupuestos/periodos/activo
const obtenerPeriodoActivo = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows } = await pool.query(
      `SELECT
          pp.id_periodo AS "ID_periodo",
          pp.id_presupuesto AS "ID_presupuesto",
          pp.id_usuario AS "ID_usuario",
          pp.fecha_inicio AS "Fecha_inicio",
          pp.fecha_fin AS "Fecha_fin",
          pp.ingreso_estimado AS "Ingreso_estimado",
          pp.ingreso_real AS "Ingreso_real",
          pp.saldo_anterior AS "Saldo_anterior",
          pp.estado AS "Estado",
          pp.monto_gastos AS "Monto_gastos",
          pp.monto_deudas AS "Monto_deudas",
          pp.monto_imprevistos AS "Monto_imprevistos",
          pp.monto_ahorros AS "Monto_ahorros",
          pp.monto_emergencia AS "Monto_emergencia",
          p.nombre AS "Perfil_nombre",
          p.dia_corte AS "Dia_corte"
       FROM   periodos_presupuesto pp
       JOIN   presupuestos p ON pp.id_presupuesto = p.id_presupuesto
       WHERE  pp.id_usuario = $1 AND pp.estado = 'abierto'`,
      [ID_usuario]
    );
    if (!rows.length) return res.json({ ok: true, data: null });
    const periodo = rows[0];
    const rango = [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin];

    const { rows: gastosReal } = await pool.query(
      `SELECT COALESCE(SUM(g.monto), 0)::float AS total FROM gastos g
         JOIN salida s      ON g.id_salida     = s.id_salida
         JOIN movimientos m ON s.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1 AND g.fecha_registro BETWEEN $2 AND $3`,
      rango
    );

    // Deudas y ahorros se miden por lo REALMENTE pagado/abonado en el período
    // (abonos_deuda / abonos_ahorro), igual que el reporte de presupuesto de
    // RF-11. Antes se sumaba el monto total de la deuda o de la meta, lo que
    // hacía que panel y reporte mostraran cifras distintas.
    const { rows: deudasReal } = await pool.query(
      `SELECT COALESCE(SUM(ad.monto), 0)::float AS total FROM abonos_deuda ad
         JOIN deudas d      ON ad.id_deudas    = d.id_deudas
         JOIN salida s      ON d.id_salida     = s.id_salida
         JOIN movimientos m ON s.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1 AND ad.fecha_registro BETWEEN $2 AND $3`,
      rango
    );
    const { rows: imprevistosReal } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total FROM imprevistos i
         JOIN salida s      ON i.id_salida     = s.id_salida
         JOIN movimientos m ON s.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
      rango
    );
    const { rows: ahorrosReal } = await pool.query(
      `SELECT COALESCE(SUM(aa.monto), 0)::float AS total FROM abonos_ahorro aa
         JOIN ahorros a     ON aa.id_ahorros   = a.id_ahorros
         JOIN entrada e     ON a.id_entrada    = e.id_entrada
         JOIN movimientos m ON e.id_movimiento = m.id_movimiento
        WHERE m.id_usuario = $1 AND aa.fecha_registro BETWEEN $2 AND $3`,
      rango
    );

    const categoria = (presupuestado, ejecutado) => ({
      presupuestado: Number(presupuestado),
      ejecutado: Number(ejecutado),
      disponible: Number(presupuestado) - Number(ejecutado),
    });

    const ejecucion = {
      gastos: categoria(periodo.Monto_gastos, gastosReal[0].total),
      deudas: categoria(periodo.Monto_deudas, deudasReal[0].total),
      imprevistos: categoria(periodo.Monto_imprevistos, imprevistosReal[0].total),
      ahorros: categoria(periodo.Monto_ahorros, ahorrosReal[0].total),
    };

    res.json({ ok: true, data: { ...periodo, ejecucion } });
  } catch (err) {
    console.error("Error en obtenerPeriodoActivo:", err.message);
    res.status(500).json(ERROR_500("Error al obtener el período activo"));
  }
};

//  PATCH /presupuestos/periodos/ajustar-ingreso
const ajustarIngresoPeriodo = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { ingreso_estimado } = req.body || {};

  const errorIngreso = validarMonto(ingreso_estimado, {
    nombre: "El ingreso estimado",
    permitirCero: true,
  });
  if (errorIngreso) return res.status(400).json({ ok: false, mensaje: errorIngreso });

  try {
    const { rows } = await pool.query(
      `SELECT
          pp.id_periodo AS "ID_periodo",
          pp.saldo_anterior AS "Saldo_anterior",
          p.porcentaje_gastos AS "Porcentaje_gastos",
          p.porcentaje_deudas AS "Porcentaje_deudas",
          p.porcentaje_imprevistos AS "Porcentaje_imprevistos",
          p.porcentaje_ahorros AS "Porcentaje_ahorros",
          p.porcentaje_emergencia AS "Porcentaje_emergencia"
       FROM   periodos_presupuesto pp
       JOIN   presupuestos p ON pp.id_presupuesto = p.id_presupuesto
       WHERE  pp.id_usuario = $1 AND pp.estado = 'abierto'`,
      [ID_usuario]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: "No hay período activo" });

    const periodo = rows[0];
    const montos = calcularMontos(aNumero(ingreso_estimado), periodo.Saldo_anterior, periodo);

    await pool.query(
      `UPDATE periodos_presupuesto
          SET ingreso_estimado   = $1,
              monto_gastos       = $2,
              monto_deudas       = $3,
              monto_imprevistos  = $4,
              monto_ahorros      = $5,
              monto_emergencia   = $6
        WHERE id_periodo = $7`,
      [
        montos.Ingreso_estimado,
        montos.Monto_gastos,
        montos.Monto_deudas,
        montos.Monto_imprevistos,
        montos.Monto_ahorros,
        montos.Monto_emergencia,
        periodo.ID_periodo,
      ]
    );
    res.json({ ok: true, mensaje: "Ingreso ajustado y montos recalculados", data: montos });
  } catch (err) {
    console.error("Error en ajustarIngresoPeriodo:", err.message);
    res.status(500).json(ERROR_500("Error al ajustar ingreso"));
  }
};

// Recalcula ingreso_real del período abierto (suma de ingresos dentro del rango).
// Se invoca tras crear, editar o eliminar un ingreso.
const actualizarIngresoReal = async (ID_usuario, connection) => {
  const conn = connection || pool;

  const { rows: periodo } = await conn.query(
    `SELECT id_periodo, fecha_inicio, fecha_fin
       FROM periodos_presupuesto
      WHERE id_usuario = $1 AND estado = 'abierto'
      LIMIT 1`,
    [ID_usuario]
  );
  if (!periodo.length) return; // sin período activo, no hace nada

  const { id_periodo: ID_periodo, fecha_inicio: Fecha_inicio, fecha_fin: Fecha_fin } = periodo[0];

  const { rows: [{ total }] } = await conn.query(
    `SELECT COALESCE(SUM(i.monto), 0)::float AS total
       FROM ingresos i
       JOIN entrada e     ON i.id_entrada    = e.id_entrada
       JOIN movimientos m ON e.id_movimiento = m.id_movimiento
      WHERE m.id_usuario = $1
        AND i.fecha_registro BETWEEN $2 AND $3`,
    [ID_usuario, Fecha_inicio, Fecha_fin]
  );

  await conn.query(
    `UPDATE periodos_presupuesto SET ingreso_real = $1 WHERE id_periodo = $2`,
    [total, ID_periodo]
  );
};

// Wrapper HTTP: adapta actualizarIngresoReal(ID_usuario, connection) a la firma
// (req, res) de Express. El helper se sigue usando directamente (llamada
// interna) desde movimientosController.js.
const actualizarIngresoRealHandler = async (req, res) => {
  try {
    await actualizarIngresoReal(req.usuario.id);
    res.status(200).json({ ok: true, mensaje: "Ingreso real actualizado correctamente" });
  } catch (err) {
    console.error("Error en actualizarIngresoRealHandler:", err.message);
    res.status(500).json(ERROR_500("Error al actualizar ingreso real"));
  }
};

module.exports = {
  //* Perfiles
  listarPerfiles,
  obtenerPerfil,
  crearPerfil,
  editarPerfil,
  eliminarPerfil,
  activarPerfil,
  //* Períodos
  abrirPeriodo,
  cerrarPeriodo,
  listarPeriodos,
  obtenerPeriodoActivo,
  ajustarIngresoPeriodo,
  actualizarIngresoReal,
  actualizarIngresoRealHandler,
};
