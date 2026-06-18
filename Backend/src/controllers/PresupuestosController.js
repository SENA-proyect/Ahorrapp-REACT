// const db = require('../db/connection'); 
const pool = require("../db/connection");

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

// *******************************************************************
//  Dado un ingreso base y los porcentajes del perfil,  
//  calcula los montos destinados a cada categoría.
//  El Saldo_anterior se suma al ingreso base antes de distribuir.
// *******************************************************************
// Agrega este helper al inicio del archivo junto a calcularMontos
const toLocalDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}


function calcularMontos(ingresoBase, saldoAnterior, perfil) {
    const total = Number(ingresoBase) + Number(saldoAnterior);
    return {
        Ingreso_estimado: Number(ingresoBase),
        Saldo_anterior:   Number(saldoAnterior),
        Monto_gastos:       parseFloat((total * perfil.Porcentaje_gastos       / 100).toFixed(2)),
        Monto_deudas:       parseFloat((total * perfil.Porcentaje_deudas       / 100).toFixed(2)),
        Monto_imprevistos:  parseFloat((total * perfil.Porcentaje_imprevistos  / 100).toFixed(2)),
        Monto_ahorros:      parseFloat((total * perfil.Porcentaje_ahorros      / 100).toFixed(2)),
        Monto_emergencia:   parseFloat((total * perfil.Porcentaje_emergencia   / 100).toFixed(2)),
    };
}


//  Calcula la fecha de fin de un período dado su fecha de inicio
//  y el Dia_corte del perfil.
//  Ej: inicio = 2025-03-15, dia_corte = 15 → fin = 2025-04-14

function calcularFechaFin(fechaInicio, diaCorte) {
  const inicio = new Date(fechaInicio);

  let anio = inicio.getFullYear();
  let mes  = inicio.getMonth() + 2; // mes siguiente

  if (mes > 12) { mes = 1; anio++; }

  // Fecha fin = día anterior al corte en el mes siguiente
  // Si corte es 1, fin es el último día del mes actual
  // Si corte es 15, fin es el 14 del mes siguiente
  const fin = new Date(anio, mes - 1, diaCorte);
  fin.setDate(fin.getDate() - 1);

  // Garantizar que fin > inicio
  if (fin <= inicio) {
    fin.setMonth(fin.getMonth() + 1);
  }

  return toLocalDate(fin);
};
// ─────────────────────────────────────────────────────────────
//  PERFILES DE PRESUPUESTO — CRUD
// ─────────────────────────────────────────────────────────────


//   GET /presupuestos
//  Lista todos los perfiles del usuario autenticado.

const listarPerfiles = async (req, res) => {
    try {
        const [perfiles] = await pool.query(
            `SELECT ID_presupuesto, Nombre, Descripcion, Activo,
                    Dia_corte,
                    Porcentaje_gastos, Porcentaje_deudas,
                    Porcentaje_imprevistos, Porcentaje_ahorros,
                    Porcentaje_emergencia, Fecha_actualizacion
             FROM   PRESUPUESTOS
             WHERE  ID_usuario = ?
             ORDER  BY Activo DESC, Fecha_actualizacion DESC`,
            [req.usuario.id]
        );
        res.json({ ok: true, data: perfiles });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al listar perfiles', error: err.message });
    }
};


//  * GET /presupuestos/:id
//  * Devuelve un perfil específico (solo si pertenece al usuario).

const obtenerPerfil = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM PRESUPUESTOS
             WHERE ID_presupuesto = ? AND ID_usuario = ?`,
            [req.params.id, req.usuario.id]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
        res.json({ ok: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener perfil', error: err.message });
    }
};


//   POST /presupuestos
//   Crea un nuevo perfil de presupuesto.
//   Valida que los porcentajes sumen exactamente 100.

const crearPerfil = async (req, res) => {
    const {
        Nombre = 'Mi presupuesto',
        Descripcion = null,
        Dia_corte = 1,
        Porcentaje_gastos      = 40.00,
        Porcentaje_deudas      = 20.00,
        Porcentaje_imprevistos = 15.00,
        Porcentaje_ahorros     = 10.00,
        Porcentaje_emergencia  = 15.00,
    } = req.body;

    // Validar que sumen 100
    const suma = (
        Number(Porcentaje_gastos) +
        Number(Porcentaje_deudas) +
        Number(Porcentaje_imprevistos) +
        Number(Porcentaje_ahorros) +
        Number(Porcentaje_emergencia)
    );
    if (Math.abs(suma - 100) > 0.01) {
        return res.status(400).json({
            ok: false,
            mensaje: `Los porcentajes deben sumar 100. Suma actual: ${suma.toFixed(2)}`
        });
    }

    if (Dia_corte < 1 || Dia_corte > 28) {
        return res.status(400).json({ ok: false, mensaje: 'El día de corte debe estar entre 1 y 28' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO PRESUPUESTOS
             (ID_usuario, Nombre, Descripcion, Activo, Dia_corte,
              Porcentaje_gastos, Porcentaje_deudas, Porcentaje_imprevistos,
              Porcentaje_ahorros, Porcentaje_emergencia)
             VALUES (?, ?, ?, FALSE, ?, ?, ?, ?, ?, ?)`,
            [
                req.usuario.id, Nombre, Descripcion, Dia_corte,
                Porcentaje_gastos, Porcentaje_deudas, Porcentaje_imprevistos,
                Porcentaje_ahorros, Porcentaje_emergencia
            ]
        );
        res.status(201).json({ ok: true, mensaje: 'Perfil creado', ID_presupuesto: result.insertId });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al crear perfil', error: err.message });
    }
};


//   PUT /presupuestos/:id
//   Edita un perfil existente.
//   No se puede editar un perfil con un período abierto.

const editarPerfil = async (req, res) => {
    const { id } = req.params;

    // Verificar que el perfil pertenece al usuario
    const [rows] = await pool.query(
        `SELECT ID_presupuesto FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`,
        [id, req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });

    // Bloquear edición si hay un período abierto asociado a este perfil
    const [periodos] = await pool.query(
        `SELECT ID_periodo FROM PERIODOS_PRESUPUESTO
         WHERE ID_presupuesto = ? AND Estado = 'abierto'`,
        [id]
    );
    if (periodos.length) {
        return res.status(409).json({
            ok: false,
            mensaje: 'No puedes editar un perfil con un período activo. Cierra el período primero.'
        });
    }

    const {
        Nombre, Descripcion, Dia_corte,
        Porcentaje_gastos, Porcentaje_deudas,
        Porcentaje_imprevistos, Porcentaje_ahorros, Porcentaje_emergencia
    } = req.body;

    // Validar porcentajes si se envían
    if (
        Porcentaje_gastos !== undefined ||
        Porcentaje_deudas !== undefined
    ) {
        const suma = (
            Number(Porcentaje_gastos      ?? 0) +
            Number(Porcentaje_deudas      ?? 0) +
            Number(Porcentaje_imprevistos ?? 0) +
            Number(Porcentaje_ahorros     ?? 0) +
            Number(Porcentaje_emergencia  ?? 0)
        );
        if (Math.abs(suma - 100) > 0.01) {
            return res.status(400).json({
                ok: false,
                mensaje: `Los porcentajes deben sumar 100. Suma actual: ${suma.toFixed(2)}`
            });
        }
    }

    try {
        await pool.query(
            `UPDATE PRESUPUESTOS
             SET Nombre                = COALESCE(?, Nombre),
                 Descripcion           = COALESCE(?, Descripcion),
                 Dia_corte             = COALESCE(?, Dia_corte),
                 Porcentaje_gastos     = COALESCE(?, Porcentaje_gastos),
                 Porcentaje_deudas     = COALESCE(?, Porcentaje_deudas),
                 Porcentaje_imprevistos= COALESCE(?, Porcentaje_imprevistos),
                 Porcentaje_ahorros    = COALESCE(?, Porcentaje_ahorros),
                 Porcentaje_emergencia = COALESCE(?, Porcentaje_emergencia)
             WHERE ID_presupuesto = ?`,
            [
                Nombre ?? null, Descripcion ?? null, Dia_corte ?? null,
                Porcentaje_gastos ?? null, Porcentaje_deudas ?? null,
                Porcentaje_imprevistos ?? null, Porcentaje_ahorros ?? null,
                Porcentaje_emergencia ?? null,
                id
            ]
        );
        res.json({ ok: true, mensaje: 'Perfil actualizado' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar perfil', error: err.message });
    }
};


//   DELETE /presupuestos/:id
//   Elimina un perfil. No se puede eliminar si tiene períodos asociados
//   o si es el perfil activo.

const eliminarPerfil = async (req, res) => {
    const { id } = req.params;

    const [rows] = await pool.query(
        `SELECT Activo FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`,
        [id, req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
    if (rows[0].Activo) {
        return res.status(409).json({ ok: false, mensaje: 'No puedes eliminar el perfil activo' });
    }

    const [periodos] = await pool.query(
        `SELECT COUNT(*) AS total FROM PERIODOS_PRESUPUESTO WHERE ID_presupuesto = ?`,
        [id]
    );
    if (periodos[0].total > 0) {
        return res.status(409).json({
            ok: false,
            mensaje: 'El perfil tiene períodos registrados y no puede eliminarse'
        });
    }

    try {
        await pool.query(`DELETE FROM PRESUPUESTOS WHERE ID_presupuesto = ?`, [id]);
        res.json({ ok: true, mensaje: 'Perfil eliminado' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar perfil', error: err.message });
    }
};


//   PUT /presupuestos/:id/activar
// Activa un perfil y desactiva todos los demás del usuario.
// Solo se puede activar un perfil si no hay un período abierto en el perfil que estaba activo anteriormente.

const activarPerfil = async (req, res) => {
    const { id } = req.params;
    const ID_usuario = req.usuario.id;

    const [rows] = await pool.query(
        `SELECT ID_presupuesto FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`,
        [id, ID_usuario]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });

    // Si hay un período abierto en otro perfil, no se puede cambiar
    const [periodoAbierto] = await pool.query(
        `SELECT pp.ID_periodo FROM PERIODOS_PRESUPUESTO pp
         JOIN   PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto
         WHERE  p.ID_usuario = ? AND pp.Estado = 'abierto'`,
        [ID_usuario]
    );
    if (periodoAbierto.length) {
        return res.status(409).json({
            ok: false,
            mensaje: 'Tienes un período activo. Ciérralo antes de cambiar de perfil.'
        });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            `UPDATE PRESUPUESTOS SET Activo = FALSE WHERE ID_usuario = ?`,
            [ID_usuario]
        );
        await conn.query(
            `UPDATE PRESUPUESTOS SET Activo = TRUE WHERE ID_presupuesto = ?`,
            [id]
        );
        await conn.commit();
        res.json({ ok: true, mensaje: 'Perfil activado correctamente' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ ok: false, mensaje: 'Error al activar perfil', error: err.message });
    } finally {
        conn.release();
    }
};

// ─────────────────────────────────────────────────────────────
//  PERÍODOS — apertura y cierre
// ─────────────────────────────────────────────────────────────

/**
 * POST /presupuestos/periodos/abrir
 * Abre un nuevo período usando el perfil activo del usuario.
 * Body: { ingreso_estimado: Number }
 *
 * Flujo:
 *   1. Obtiene el perfil activo del usuario.
 *   2. Verifica que no haya un período ya abierto.
 *   3. Recupera el saldo sobrante del último período cerrado.
 *   4. Calcula montos con ingreso_estimado + saldo_anterior.
 *   5. Inserta el nuevo período con Estado = 'abierto'.
 */
const abrirPeriodo = async (req, res) => {
    const { ingreso_estimado } = req.body;
    const ID_usuario = req.usuario.id;

    if (ingreso_estimado === undefined || Number(ingreso_estimado) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'ingreso_estimado es requerido y debe ser >= 0' });
    }

    // 1. Perfil activo
    const [perfiles] = await pool.query(
        `SELECT * FROM PRESUPUESTOS WHERE ID_usuario = ? AND Activo = TRUE`,
        [ID_usuario]
    );
    if (!perfiles.length) {
        return res.status(400).json({ ok: false, mensaje: 'No tienes un perfil de presupuesto activo. Activa uno primero.' });
    }
    const perfil = perfiles[0];

    // 2. Verificar que no haya período abierto
    const [abiertos] = await pool.query(
        `SELECT ID_periodo FROM PERIODOS_PRESUPUESTO
         WHERE ID_usuario = ? AND Estado = 'abierto'`,
        [ID_usuario]
    );
    if (abiertos.length) {
        return res.status(409).json({ ok: false, mensaje: 'Ya tienes un período abierto. Ciérralo antes de abrir uno nuevo.' });
    }

    // 3. Saldo sobrante del último período cerrado
    const [ultimos] = await pool.query(
        `SELECT (Ingreso_estimado + Saldo_anterior
                 - Monto_gastos - Monto_deudas
                 - Monto_imprevistos - Monto_ahorros - Monto_emergencia) AS saldo_sobrante
         FROM   PERIODOS_PRESUPUESTO
         WHERE  ID_usuario = ? AND Estado = 'cerrado'
         ORDER  BY Fecha_fin DESC
         LIMIT  1`,
        [ID_usuario]
    );
    const saldoAnterior = ultimos.length
        ? Math.max(0, Number(ultimos[0].saldo_sobrante))
        : 0;

    // 4. Calcular montos
    const fechaInicio = toLocalDate(new Date());
    const fechaFin    = calcularFechaFin(fechaInicio, perfil.Dia_corte);
    const montos      = calcularMontos(ingreso_estimado, saldoAnterior, perfil);

    console.log('Fecha inicio:', fechaInicio);
    console.log('Fecha fin:', fechaFin);
    console.log('Montos:', montos);

    // 5. Insertar período
    try {
        const [result] = await pool.query(
            `INSERT INTO PERIODOS_PRESUPUESTO
             (ID_presupuesto, ID_usuario, Fecha_inicio, Fecha_fin, Estado,
              Ingreso_estimado, Ingreso_real, Saldo_anterior,
              Monto_gastos, Monto_deudas, Monto_imprevistos,
              Monto_ahorros, Monto_emergencia)
             VALUES (?, ?, ?, ?, 'abierto', ?, 0.00, ?, ?, ?, ?, ?, ?)`,
            [
                perfil.ID_presupuesto, ID_usuario,
                fechaInicio, fechaFin,
                montos.Ingreso_estimado, montos.Saldo_anterior,
                montos.Monto_gastos, montos.Monto_deudas,
                montos.Monto_imprevistos, montos.Monto_ahorros,
                montos.Monto_emergencia
            ]
        );
        res.status(201).json({
            ok: true,
            mensaje: 'Período abierto correctamente',
            data: {
                ID_periodo:       result.insertId,
                Fecha_inicio:     fechaInicio,
                Fecha_fin:        fechaFin,
                Saldo_anterior:   saldoAnterior,
                Ingreso_estimado: Number(ingreso_estimado),
                ...montos
            }
        });
    } catch (error) {
    console.error("Error en abrirPeriodo:", error.message, error.stack);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
    }
};

/**
 * PUT /presupuestos/periodos/cerrar
 * Cierra el período activo del usuario.
 * Recalcula Ingreso_real sumando los INGRESOS reales del período.
 */
const cerrarPeriodo = async (req, res) => {
    const ID_usuario = req.usuario.id;

    const [abiertos] = await pool.query(
        `SELECT * FROM PERIODOS_PRESUPUESTO
         WHERE ID_usuario = ? AND Estado = 'abierto'`,
        [ID_usuario]
    );
    if (!abiertos.length) {
        return res.status(404).json({ ok: false, mensaje: 'No tienes un período abierto.' });
    }
    const periodo = abiertos[0];

    // Sumar ingresos reales registrados en el período
    const [ingresos] = await pool.query(
        `SELECT COALESCE(SUM(i.Monto), 0) AS total
         FROM   INGRESOS i
         JOIN   MOVIMIENTOS m ON i.ID_entrada = (
                    SELECT e.ID_entrada FROM ENTRADA e
                    WHERE  e.ID_movimiento = m.ID_movimiento
                )
         WHERE  m.ID_usuario = ?
           AND  i.Fecha_registro BETWEEN ? AND ?`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const ingresoReal = Number(ingresos[0].total);

    try {
        await pool.query(
            `UPDATE PERIODOS_PRESUPUESTO
             SET Estado = 'cerrado', Ingreso_real = ?
             WHERE ID_periodo = ?`,
            [ingresoReal, periodo.ID_periodo]
        );
        res.json({
            ok: true,
            mensaje: 'Período cerrado correctamente',
            data: {
                ID_periodo:    periodo.ID_periodo,
                Ingreso_real:  ingresoReal,
                Fecha_inicio:  periodo.Fecha_inicio,
                Fecha_fin:     periodo.Fecha_fin,
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al cerrar período', error: err.message });
    }
};

/**
 * GET /presupuestos/periodos
 * Lista todos los períodos del usuario, paginados.
 * Query params: ?pagina=1&limite=10
 */
const listarPeriodos = async (req, res) => {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(50, parseInt(req.query.limite) || 10);
    const offset = (pagina - 1) * limite;

    try {
        const [periodos] = await pool.query(
            `SELECT pp.*, p.Nombre AS Perfil_nombre
             FROM   PERIODOS_PRESUPUESTO pp
             JOIN   PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto
             WHERE  pp.ID_usuario = ?
             ORDER  BY pp.Fecha_inicio DESC
             LIMIT  ? OFFSET ?`,
            [req.usuario.id, limite, offset]
        );
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM PERIODOS_PRESUPUESTO WHERE ID_usuario = ?`,
            [req.usuario.id]
        );
        res.json({ ok: true, data: periodos, total, pagina, limite });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al listar períodos', error: err.message });
    }
};

/**
 * GET /presupuestos/periodos/activo
 * Devuelve el período actualmente abierto del usuario con
 * el estado de ejecución de cada categoría en tiempo real.
 */
const obtenerPeriodoActivo = async (req, res) => {
    const ID_usuario = req.usuario.id;

    const [rows] = await pool.query(
        `SELECT pp.*, p.Nombre AS Perfil_nombre, p.Dia_corte
         FROM   PERIODOS_PRESUPUESTO pp
         JOIN   PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto
         WHERE  pp.ID_usuario = ? AND pp.Estado = 'abierto'`,
        [ID_usuario]
    );
    if (!rows.length) return res.json({ ok: true, data: null });
    const periodo = rows[0];

    // Gastos reales acumulados en el período
    const [gastosReal] = await pool.query(
        `SELECT COALESCE(SUM(Monto), 0) AS total FROM GASTOS g
         JOIN SALIDA s ON g.ID_salida = s.ID_salida
         JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
         WHERE m.ID_usuario = ? AND g.Fecha_registro BETWEEN ? AND ?`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const [deudasReal] = await pool.query(
        `SELECT COALESCE(SUM(Monto), 0) AS total FROM DEUDAS d
         JOIN SALIDA s ON d.ID_salida = s.ID_salida
         JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
         WHERE m.ID_usuario = ? AND d.Fecha_inicio BETWEEN ? AND ?`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const [imprevistosReal] = await pool.query(
        `SELECT COALESCE(SUM(Monto), 0) AS total FROM IMPREVISTOS i
         JOIN SALIDA s ON i.ID_salida = s.ID_salida
         JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
         WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const [ahorrosReal] = await pool.query(
        `SELECT COALESCE(SUM(Monto), 0) AS total FROM AHORROS a
         JOIN ENTRADA e ON a.ID_entrada = e.ID_entrada
         JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
         WHERE m.ID_usuario = ? AND a.Fecha_registro BETWEEN ? AND ?`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );

    const ejecucion = {
        gastos: {
            presupuestado: Number(periodo.Monto_gastos),
            ejecutado:     Number(gastosReal[0].total),
            disponible:    Number(periodo.Monto_gastos) - Number(gastosReal[0].total),
        },
        deudas: {
            presupuestado: Number(periodo.Monto_deudas),
            ejecutado:     Number(deudasReal[0].total),
            disponible:    Number(periodo.Monto_deudas) - Number(deudasReal[0].total),
        },
        imprevistos: {
            presupuestado: Number(periodo.Monto_imprevistos),
            ejecutado:     Number(imprevistosReal[0].total),
            disponible:    Number(periodo.Monto_imprevistos) - Number(imprevistosReal[0].total),
        },
        ahorros: {
            presupuestado: Number(periodo.Monto_ahorros),
            ejecutado:     Number(ahorrosReal[0].total),
            disponible:    Number(periodo.Monto_ahorros) - Number(ahorrosReal[0].total),
        },
    };

    res.json({ ok: true, data: { ...periodo, ejecucion } });
};

/**
 * PATCH /presupuestos/periodos/ajustar-ingreso
 * Ajusta el ingreso estimado del período activo y recalcula montos.
 * Body: { ingreso_estimado: Number }
 */
const ajustarIngresoPeriodo = async (req, res) => {
    const { ingreso_estimado } = req.body;
    const ID_usuario = req.usuario.id;

    if (ingreso_estimado === undefined || Number(ingreso_estimado) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'ingreso_estimado debe ser >= 0' });
    }

    const [rows] = await pool.query(
        `SELECT pp.*, p.Porcentaje_gastos, p.Porcentaje_deudas,
                p.Porcentaje_imprevistos, p.Porcentaje_ahorros, p.Porcentaje_emergencia
         FROM   PERIODOS_PRESUPUESTO pp
         JOIN   PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto
         WHERE  pp.ID_usuario = ? AND pp.Estado = 'abierto'`,
        [ID_usuario]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'No hay período activo' });

    const periodo = rows[0];
    const montos  = calcularMontos(ingreso_estimado, periodo.Saldo_anterior, periodo);

    try {
        await pool.query(
            `UPDATE PERIODOS_PRESUPUESTO
             SET Ingreso_estimado   = ?,
                 Monto_gastos       = ?,
                 Monto_deudas       = ?,
                 Monto_imprevistos  = ?,
                 Monto_ahorros      = ?,
                 Monto_emergencia   = ?
             WHERE ID_periodo = ?`,
            [
                montos.Ingreso_estimado,
                montos.Monto_gastos, montos.Monto_deudas,
                montos.Monto_imprevistos, montos.Monto_ahorros,
                montos.Monto_emergencia,
                periodo.ID_periodo
            ]
        );
        res.json({ ok: true, mensaje: 'Ingreso ajustado y montos recalculados', data: montos });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al ajustar ingreso', error: err.message });
    }
};

const actualizarIngresoReal = async (ID_usuario, connection) => {
  const conn = connection || pool;

  const [periodo] = await conn.query(
    `SELECT ID_periodo, Fecha_inicio, Fecha_fin
     FROM   PERIODOS_PRESUPUESTO
     WHERE  ID_usuario = ? AND Estado = 'abierto'
     LIMIT  1`,
    [ID_usuario]
  );
  if (!periodo.length) return; // sin período activo, no hace nada

  const { ID_periodo, Fecha_inicio, Fecha_fin } = periodo[0];

  const [[{ total }]] = await conn.query(
    `SELECT COALESCE(SUM(i.Monto), 0) AS total
     FROM   INGRESOS i
     JOIN   ENTRADA e  ON i.ID_entrada    = e.ID_entrada
     JOIN   MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
     WHERE  m.ID_usuario     = ?
       AND  i.Fecha_registro BETWEEN ? AND ?`,
    [ID_usuario, Fecha_inicio, Fecha_fin]
  );

  await conn.query(
    `UPDATE PERIODOS_PRESUPUESTO
     SET    Ingreso_real = ?
     WHERE  ID_periodo   = ?`,
    [total, ID_periodo]
  );
};

// (abonarDeuda y abonarAhorro se manejan en movimientosController)

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
    // Perfiles
    listarPerfiles,
    obtenerPerfil,
    crearPerfil,
    editarPerfil,
    eliminarPerfil,
    activarPerfil,
    // Períodos
    abrirPeriodo,
    cerrarPeriodo,
    listarPeriodos,
    obtenerPeriodoActivo,
    ajustarIngresoPeriodo,

};