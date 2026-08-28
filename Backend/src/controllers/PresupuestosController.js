const pool = require("../db/connection");
const { verificarImprevistosNoUsados } = require ("../service/NotificacionesService");

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────


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

function ultimoDiaDelMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

//  Calcula la fecha de fin de un período dado su fecha de inicio
//  y el Dia_corte del perfil.
//  Ej: inicio = 2025-03-15, dia_corte = 15 → fin = 2025-04-14
//
//  Si diaCorte no existe en el mes de destino (ej. 31 en un mes de
//  30 días, o 29/30/31 en febrero), se recorta automáticamente al
//  último día disponible de ese mes — nunca se desborda al mes siguiente.

function calcularFechaFin(fechaInicio, diaCorte) {
  const inicio = new Date(fechaInicio);

  let anio = inicio.getFullYear();
  let mes  = inicio.getMonth() + 2; // mes siguiente

  if (mes > 12) { mes = 1; anio++; }

  // Ajustar el día de corte al último día disponible de ese mes,
  // en vez de dejar que Date desborde al mes siguiente.
  const diaMaximo = ultimoDiaDelMes(anio, mes);
  const diaAjustado = Math.min(diaCorte, diaMaximo);

  // Fecha fin = día anterior al corte en el mes siguiente
  // Si corte es 1, fin es el último día del mes actual
  // Si corte es 15, fin es el 14 del mes siguiente
  const fin = new Date(anio, mes - 1, diaAjustado);
  fin.setDate(fin.getDate() - 1);


  if (fin <= inicio) {
 
    let anio2 = fin.getFullYear();
    let mes2  = fin.getMonth() + 2;
    if (mes2 > 12) { mes2 = 1; anio2++; }

    const diaMaximo2 = ultimoDiaDelMes(anio2, mes2);
    const diaAjustado2 = Math.min(diaCorte, diaMaximo2);

    const finRecalculado = new Date(anio2, mes2 - 1, diaAjustado2);
    finRecalculado.setDate(finRecalculado.getDate() - 1);
    return toLocalDate(finRecalculado);
  }

  return toLocalDate(fin);
};

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
        res.status(500).json({ ok: false, mensaje: 'Error al listar perfiles', error: err.message });
    }
};

//  GET /presupuestos/:id (perfil especifico)
const obtenerPerfil = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
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
                fecha_actualizacion AS "Fecha_actualizacion"
             FROM presupuestos
             WHERE id_presupuesto = $1 AND id_usuario = $2`,
            [req.params.id, req.usuario.id]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
        res.json({ ok: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener perfil', error: err.message });
    }
};

//   POST /presupuestos (los porcentajes siempre deben dar 100%)

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

    if (Dia_corte < 1 || Dia_corte > 31) {
        return res.status(400).json({ ok: false, mensaje: 'El día de corte debe estar entre 1 y 31' });
    }

    try {
        const { rows: result } = await pool.query(
            `INSERT INTO presupuestos
             (id_usuario, nombre, descripcion, activo, dia_corte,
              porcentaje_gastos, porcentaje_deudas, porcentaje_imprevistos,
              porcentaje_ahorros, porcentaje_emergencia)
             VALUES ($1, $2, $3, FALSE, $4, $5, $6, $7, $8, $9)
             RETURNING id_presupuesto`,
            [
                req.usuario.id, Nombre, Descripcion, Dia_corte,
                Porcentaje_gastos, Porcentaje_deudas, Porcentaje_imprevistos,
                Porcentaje_ahorros, Porcentaje_emergencia
            ]
        );
        res.status(201).json({ ok: true, mensaje: 'Perfil creado', ID_presupuesto: result[0].id_presupuesto });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al crear perfil', error: err.message });
    }
};

//   PUT /presupuestos/:id
//   No se puede editar un perfil con un período abierto.

const editarPerfil = async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query(
        `SELECT id_presupuesto FROM presupuestos WHERE id_presupuesto = $1 AND id_usuario = $2`,
        [id, req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });

    // Bloquear edición si hay un período abierto asociado a este perfil
    const { rows: periodos } = await pool.query(
        `SELECT id_periodo FROM periodos_presupuesto
         WHERE id_presupuesto = $1 AND estado = 'abierto'`,
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

    if (Dia_corte !== undefined && (Dia_corte < 1 || Dia_corte > 31)) {
        return res.status(400).json({ ok: false, mensaje: 'El día de corte debe estar entre 1 y 31' });
    }

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
            `UPDATE presupuestos
             SET nombre                = COALESCE($1, nombre),
                 descripcion           = COALESCE($2, descripcion),
                 dia_corte             = COALESCE($3, dia_corte),
                 porcentaje_gastos     = COALESCE($4, porcentaje_gastos),
                 porcentaje_deudas     = COALESCE($5, porcentaje_deudas),
                 porcentaje_imprevistos= COALESCE($6, porcentaje_imprevistos),
                 porcentaje_ahorros    = COALESCE($7, porcentaje_ahorros),
                 porcentaje_emergencia = COALESCE($8, porcentaje_emergencia)
             WHERE id_presupuesto = $9`,
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
//   Elimina un perfil. No se puede eliminar si tiene períodos asociados o si es el perfil activo.

const eliminarPerfil = async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query(
        `SELECT activo AS "Activo" FROM presupuestos WHERE id_presupuesto = $1 AND id_usuario = $2`,
        [id, req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
    if (rows[0].Activo) {
        return res.status(409).json({ ok: false, mensaje: 'No puedes eliminar el perfil activo' });
    }

    const { rows: periodos } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM periodos_presupuesto WHERE id_presupuesto = $1`,
        [id]
    );
    if (periodos[0].total > 0) {
        return res.status(409).json({
            ok: false,
            mensaje: 'El perfil tiene períodos registrados y no puede eliminarse'
        });
    }

    try {
        await pool.query(`DELETE FROM presupuestos WHERE id_presupuesto = $1`, [id]);
        res.json({ ok: true, mensaje: 'Perfil eliminado' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar perfil', error: err.message });
    }
};


//   PUT /presupuestos/:id/activar
// Solo se puede activar un perfil si no hay un período abierto en el perfil que estaba activo anteriormente.

const activarPerfil = async (req, res) => {
    const { id } = req.params;
    const ID_usuario = req.usuario.id;

    const { rows } = await pool.query(
        `SELECT id_presupuesto FROM presupuestos WHERE id_presupuesto = $1 AND id_usuario = $2`,
        [id, ID_usuario]
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });

    const { rows: periodoAbierto } = await pool.query(
        `SELECT pp.id_periodo FROM periodos_presupuesto pp
         JOIN   presupuestos p ON pp.id_presupuesto = p.id_presupuesto
         WHERE  p.id_usuario = $1 AND pp.estado = 'abierto'`,
        [ID_usuario]
    );
    if (periodoAbierto.length) {
        return res.status(409).json({
            ok: false,
            mensaje: 'Tienes un período activo. Ciérralo antes de cambiar de perfil.'
        });
    }

    const conn = await pool.connect();
    try {
        await conn.query("BEGIN");
        await conn.query(
            `UPDATE presupuestos SET activo = FALSE WHERE id_usuario = $1`,
            [ID_usuario]
        );
        await conn.query(
            `UPDATE presupuestos SET activo = TRUE WHERE id_presupuesto = $1`,
            [id]
        );
        await conn.query("COMMIT");
        res.json({ ok: true, mensaje: 'Perfil activado correctamente' });
    } catch (err) {
        await conn.query("ROLLBACK");
        res.status(500).json({ ok: false, mensaje: 'Error al activar perfil', error: err.message });
    } finally {
        conn.release();
    }
};

// ─────────────────────────────────────────────────────────────
//  PERÍODOS — apertura y cierre
// ─────────────────────────────────────────────────────────────


//   POST /presupuestos/periodos/abrir

const abrirPeriodo = async (req, res) => {
    const { ingreso_estimado } = req.body;
    const ID_usuario = req.usuario.id;

    if (ingreso_estimado === undefined || Number(ingreso_estimado) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'ingreso_estimado es requerido y debe ser >= 0' });
    }

    // 1. Perfil activo
    const { rows: perfiles } = await pool.query(
        `SELECT
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
            fecha_actualizacion AS "Fecha_actualizacion"
         FROM presupuestos WHERE id_usuario = $1 AND activo = TRUE`,
        [ID_usuario]
    );
    if (!perfiles.length) {
        return res.status(400).json({ ok: false, mensaje: 'No tienes un perfil de presupuesto activo. Activa uno primero.' });
    }
    const perfil = perfiles[0];

    const { rows: abiertos } = await pool.query(
        `SELECT id_periodo FROM periodos_presupuesto
         WHERE id_usuario = $1 AND estado = 'abierto'`,
        [ID_usuario]
    );
    if (abiertos.length) {
        return res.status(409).json({ ok: false, mensaje: 'Ya tienes un período abierto. Ciérralo antes de abrir uno nuevo.' });
    }

    const { rows: ultimos } = await pool.query(
        `SELECT (ingreso_estimado + saldo_anterior
                 - monto_gastos - monto_deudas
                 - monto_imprevistos - monto_ahorros - monto_emergencia) AS saldo_sobrante
         FROM   periodos_presupuesto
         WHERE  id_usuario = $1 AND estado = 'cerrado'
         ORDER  BY fecha_fin DESC
         LIMIT  1`,
        [ID_usuario]
    );
    const saldoAnterior = ultimos.length
        ? Math.max(0, Number(ultimos[0].saldo_sobrante))
        : 0;

    const fechaInicio = toLocalDate(new Date());
    const fechaFin    = calcularFechaFin(fechaInicio, perfil.Dia_corte);
    const montos      = calcularMontos(ingreso_estimado, saldoAnterior, perfil);

    console.log('Fecha inicio:', fechaInicio);
    console.log('Fecha fin:', fechaFin);
    console.log('Montos:', montos);

    try {
        const { rows: result } = await pool.query(
            `INSERT INTO periodos_presupuesto
             (id_presupuesto, id_usuario, fecha_inicio, fecha_fin, estado,
              ingreso_estimado, ingreso_real, saldo_anterior,
              monto_gastos, monto_deudas, monto_imprevistos,
              monto_ahorros, monto_emergencia)
             VALUES ($1, $2, $3, $4, 'abierto', $5, 0.00, $6, $7, $8, $9, $10, $11)
             RETURNING id_periodo`,
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
                ID_periodo:       result[0].id_periodo,
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

//   PUT /presupuestos/periodos/cerrar

const cerrarPeriodo = async (req, res) => {
    const ID_usuario = req.usuario.id;

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
        return res.status(404).json({ ok: false, mensaje: 'No tienes un período abierto.' });
    }
    const periodo = abiertos[0];

    const { rows: ingresos } = await pool.query(
        `SELECT COALESCE(SUM(i.monto), 0)::float AS total
         FROM   ingresos i
         JOIN   movimientos m ON i.id_entrada = (
                    SELECT e.id_entrada FROM entrada e
                    WHERE  e.id_movimiento = m.id_movimiento
                )
         WHERE  m.id_usuario = $1
           AND  i.fecha_registro BETWEEN $2 AND $3`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const ingresoReal = Number(ingresos[0].total);

    try {
        await pool.query(
            `UPDATE periodos_presupuesto
             SET estado = 'cerrado', ingreso_real = $1
             WHERE id_periodo = $2`,
            [ingresoReal, periodo.ID_periodo]
        );

        // Post-cierre: si el fondo de imprevistos casi no se usó,
        // sugerir redirigir ese dinero a ahorros
        await verificarImprevistosNoUsados(ID_usuario, periodo);

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

//  GET /presupuestos/periodos

const listarPeriodos = async (req, res) => {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(50, parseInt(req.query.limite) || 10);
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
        res.status(500).json({ ok: false, mensaje: 'Error al listar períodos', error: err.message });
    }
};

//  GET /presupuestos/periodos/activo

const obtenerPeriodoActivo = async (req, res) => {
    const ID_usuario = req.usuario.id;

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

    const { rows: gastosReal } = await pool.query(
        `SELECT COALESCE(SUM(monto), 0)::float AS total FROM gastos g
         JOIN salida s ON g.id_salida = s.id_salida
         JOIN movimientos m ON s.id_movimiento = m.id_movimiento
         WHERE m.id_usuario = $1 AND g.fecha_registro BETWEEN $2 AND $3`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const { rows: deudasReal } = await pool.query(
        `SELECT COALESCE(SUM(monto), 0)::float AS total FROM deudas d
         JOIN salida s ON d.id_salida = s.id_salida
         JOIN movimientos m ON s.id_movimiento = m.id_movimiento
         WHERE m.id_usuario = $1 AND d.fecha_inicio BETWEEN $2 AND $3`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const { rows: imprevistosReal } = await pool.query(
        `SELECT COALESCE(SUM(monto), 0)::float AS total FROM imprevistos i
         JOIN salida s ON i.id_salida = s.id_salida
         JOIN movimientos m ON s.id_movimiento = m.id_movimiento
         WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
        [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
    );
    const { rows: ahorrosReal } = await pool.query(
        `SELECT COALESCE(SUM(monto), 0)::float AS total FROM ahorros a
         JOIN entrada e ON a.id_entrada = e.id_entrada
         JOIN movimientos m ON e.id_movimiento = m.id_movimiento
         WHERE m.id_usuario = $1 AND a.fecha_registro BETWEEN $2 AND $3`,
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

//  PATCH /presupuestos/periodos/ajustar-ingreso

const ajustarIngresoPeriodo = async (req, res) => {
    const { ingreso_estimado } = req.body;
    const ID_usuario = req.usuario.id;

    if (ingreso_estimado === undefined || Number(ingreso_estimado) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'ingreso_estimado debe ser >= 0' });
    }

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
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'No hay período activo' });

    const periodo = rows[0];
    const montos  = calcularMontos(ingreso_estimado, periodo.Saldo_anterior, periodo);

    try {
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

  const { rows: periodo } = await conn.query(
    `SELECT id_periodo, fecha_inicio, fecha_fin
     FROM   periodos_presupuesto
     WHERE  id_usuario = $1 AND estado = 'abierto'
     LIMIT  1`,
    [ID_usuario]
  );
  if (!periodo.length) return; // sin período activo, no hace nada

  const { id_periodo: ID_periodo, fecha_inicio: Fecha_inicio, fecha_fin: Fecha_fin } = periodo[0];

  const { rows: [{ total }] } = await conn.query(
    `SELECT COALESCE(SUM(i.monto), 0)::float AS total
     FROM   ingresos i
     JOIN   entrada e  ON i.id_entrada    = e.id_entrada
     JOIN   movimientos m ON e.id_movimiento = m.id_movimiento
     WHERE  m.id_usuario     = $1
       AND  i.fecha_registro BETWEEN $2 AND $3`,
    [ID_usuario, Fecha_inicio, Fecha_fin]
  );

  await conn.query(
    `UPDATE periodos_presupuesto
     SET    ingreso_real = $1
     WHERE  id_periodo   = $2`,
    [total, ID_periodo]
  );
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
    actualizarIngresoReal
};