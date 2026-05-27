const db = require('../config/db'); 

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

// Dado un ingreso base y los porcentajes del perfil,
// calcula los montos destinados a cada categoría.
function calcularMontos(ingresoBase, saldoAnterior, perfil) {
    const total = Number(ingresoBase) + Number(saldoAnterior);
    return {
        Ingreso_estimado:  Number(ingresoBase),
        Saldo_anterior:    Number(saldoAnterior),
        Monto_gastos:       parseFloat((total * perfil.Porcentaje_gastos       / 100).toFixed(2)),
        Monto_deudas:       parseFloat((total * perfil.Porcentaje_deudas       / 100).toFixed(2)),
        Monto_imprevistos:  parseFloat((total * perfil.Porcentaje_imprevistos  / 100).toFixed(2)),
        Monto_ahorros:      parseFloat((total * perfil.Porcentaje_ahorros      / 100).toFixed(2)),
        Monto_emergencia:   parseFloat((total * perfil.Porcentaje_emergencia   / 100).toFixed(2)),
    };
}

// Calcula la fecha de fin de un período dado su fecha de inicio y el Dia_corte.
function calcularFechaFin(fechaInicio, diaCorte) {
    const inicio = new Date(fechaInicio);
    let anio  = inicio.getFullYear();
    let mes   = inicio.getMonth() + 1;

    if (mes > 12) { mes = 1; anio++; }

    const maxDia = new Date(anio, mes, 0).getDate();
    const dia    = Math.min(diaCorte, maxDia);

    const fin = new Date(anio, mes - 1, dia);
    fin.setDate(fin.getDate() - 1);
    return fin.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────
//  PERFILES DE PRESUPUESTO — CRUD
// ─────────────────────────────────────────────────────────────

// GET /presupuestos
const listarPerfiles = async (req, res) => {
    try {
        const [perfiles] = await db.query(
            `SELECT ID_presupuesto, Nombre, Descripcion, Activo, Dia_corte,
                    Porcentaje_gastos, Porcentaje_deudas, Porcentaje_imprevistos,
                    Porcentaje_ahorros, Porcentaje_emergencia, Fecha_actualizacion
             FROM   PRESUPUESTOS
             WHERE  ID_usuario = ?
             ORDER  BY Activo DESC, Fecha_actualizacion DESC`,
            [req.user.ID_usuario]
        );
        res.json({ ok: true, data: perfiles });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al listar perfiles', error: err.message });
    }
};

// GET /presupuestos/:id
const obtenerPerfil = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`,
            [req.params.id, req.user.ID_usuario]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
        res.json({ ok: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener perfil', error: err.message });
    }
};

// POST /presupuestos
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
        const [result] = await db.query(
            `INSERT INTO PRESUPUESTOS
             (ID_usuario, Nombre, Descripcion, Activo, Dia_corte,
              Porcentaje_gastos, Porcentaje_deudas, Porcentaje_imprevistos,
              Porcentaje_ahorros, Porcentaje_emergencia)
             VALUES (?, ?, ?, FALSE, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.ID_usuario, Nombre, Descripcion, Dia_corte,
                Porcentaje_gastos, Porcentaje_deudas, Porcentaje_imprevistos,
                Porcentaje_ahorros, Porcentaje_emergencia
            ]
        );
        res.status(201).json({ ok: true, mensaje: 'Perfil creado', ID_presupuesto: result.insertId });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al crear perfil', error: err.message });
    }
};

// PUT /presupuestos/:id
const editarPerfil = async (req, res) => {
    const { id } = req.params;
    const ID_usuario = req.user.ID_usuario;

    try {
        // 1. Obtener valores actuales para fusionar y validar correctamente si no se envían todos
        const [rows] = await db.query(
            `SELECT * FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`,
            [id, ID_usuario]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
        const perfilActual = rows[0];

        // 2. Bloquear edición si hay un período abierto asociado
        const [periodos] = await db.query(
            `SELECT ID_periodo FROM PERIODOS_PRESUPUESTO WHERE ID_presupuesto = ? AND Estado = 'abierto'`,
            [id]
        );
        if (periodos.length) {
            return res.status(409).json({
                ok: false,
                mensaje: 'No puedes editar un perfil con un período activo. Cierra el período primero.'
            });
        }

        const {
            Nombre                 = perfilActual.Nombre,
            Descripcion            = perfilActual.Descripcion,
            Dia_corte              = perfilActual.Dia_corte,
            Porcentaje_gastos      = perfilActual.Porcentaje_gastos,
            Porcentaje_deudas      = perfilActual.Porcentaje_deudas,
            Porcentaje_imprevistos = perfilActual.Porcentaje_imprevistos,
            Porcentaje_ahorros     = perfilActual.Porcentaje_ahorros,
            Porcentaje_emergencia  = perfilActual.Porcentaje_emergencia
        } = req.body;

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
                mensaje: `Los porcentajes deben sumar 100. Suma calculada: ${suma.toFixed(2)}`
            });
        }

        if (Number(Dia_corte) < 1 || Number(Dia_corte) > 28) {
            return res.status(400).json({ ok: false, mensaje: 'El día de corte debe estar entre 1 y 28' });
        }

        await db.query(
            `UPDATE PRESUPUESTOS
             SET Nombre = ?, Descripcion = ?, Dia_corte = ?, Porcentaje_gastos = ?, 
                 Porcentaje_deudas = ?, Porcentaje_imprevistos = ?, Porcentaje_ahorros = ?, Porcentaje_emergencia = ?
             WHERE ID_presupuesto = ? AND ID_usuario = ?`,
            [
                Nombre, Descripcion, Dia_corte, Porcentaje_gastos, 
                Porcentaje_deudas, Porcentaje_imprevistos, Porcentaje_ahorros, Porcentaje_emergencia, 
                id, ID_usuario
            ]
        );
        res.json({ ok: true, mensaje: 'Perfil actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar perfil', error: err.message });
    }
};

// DELETE /presupuestos/:id
const eliminarPerfil = async (req, res) => {
    const { id } = req.params;
    const ID_usuario = req.user.ID_usuario;

    try {
        const [rows] = await db.query(
            `SELECT Activo FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`,
            [id, ID_usuario]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
        if (rows[0].Activo) {
            return res.status(409).json({ ok: false, mensaje: 'No puedes eliminar el perfil activo' });
        }

        const [periodos] = await db.query(
            `SELECT COUNT(*) AS total FROM PERIODOS_PRESUPUESTO WHERE ID_presupuesto = ?`,
            [id]
        );
        if (periodos[0].total > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'El perfil tiene períodos registrados y no puede eliminarse'
            });
        }

        await db.query(`DELETE FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`, [id, ID_usuario]);
        res.json({ ok: true, mensaje: 'Perfil eliminado' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar perfil', error: err.message });
    }
};

// PUT /presupuestos/:id/activar
const activarPerfil = async (req, res) => {
    const { id } = req.params;
    const ID_usuario = req.user.ID_usuario;

    try {
        const [rows] = await db.query(
            `SELECT ID_presupuesto FROM PRESUPUESTOS WHERE ID_presupuesto = ? AND ID_usuario = ?`,
            [id, ID_usuario]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });

        const [periodoAbierto] = await db.query(
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

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            // Desactivar todos los perfiles del usuario
            await conn.query(
                `UPDATE PRESUPUESTOS SET Activo = FALSE WHERE ID_usuario = ?`, 
                [ID_usuario]
            );
            
            // Activar el perfil solicitado
            await conn.query(
                `UPDATE PRESUPUESTOS SET Activo = TRUE WHERE ID_presupuesto = ?`, 
                [id]
            );
            
            await conn.commit();
            res.json({ ok: true, mensaje: 'Perfil activado correctamente' });
        } catch (err) {
            await conn.rollback();
            throw err; // Es capturado por el catch externo
        } finally {
            conn.release();
        }
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al activar perfil', error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────
//  PERÍODOS — APERTURA Y CIERRE
// ─────────────────────────────────────────────────────────────

const abrirPeriodo = async (req, res) => {
    const { ingreso_estimado } = req.body;
    const ID_usuario = req.user.ID_usuario;

    if (ingreso_estimado === undefined || Number(ingreso_estimado) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'ingreso_estimado es requerido y debe ser >= 0' });
    }

    try {
        // 1. Obtener perfil activo
        const [perfiles] = await db.query(
            `SELECT * FROM PRESUPUESTOS WHERE ID_usuario = ? AND Activo = TRUE`, 
            [ID_usuario]
        );
        if (!perfiles.length) {
            return res.status(400).json({ ok: false, mensaje: 'No tienes un perfil de presupuesto activo. Activa uno primero.' });
        }
        const perfil = perfiles[0];

        // 2. Verificar que no haya período abierto
        const [abiertos] = await db.query(
            `SELECT ID_periodo FROM PERIODOS_PRESUPUESTO WHERE ID_usuario = ? AND Estado = 'abierto'`, 
            [ID_usuario]
        );
        if (abiertos.length) {
            return res.status(409).json({ ok: false, mensaje: 'Ya tienes un período abierto. Ciérralo antes de abrir uno nuevo.' });
        }

        // 3. Obtener saldo sobrante del último período cerrado
        const [ultimos] = await db.query(
            `SELECT (Ingreso_estimado + Saldo_anterior - Monto_gastos - Monto_deudas - Monto_imprevistos - Monto_ahorros - Monto_emergencia) AS saldo_sobrante 
             FROM PERIODOS_PRESUPUESTO 
             WHERE ID_usuario = ? AND Estado = 'cerrado' 
             ORDER BY Fecha_fin DESC LIMIT 1`, 
            [ID_usuario]
        );
        const saldoAnterior = ultimos.length ? Math.max(0, Number(ultimos[0].saldo_sobrante)) : 0;

        // 4. Calcular fechas y montos distribuidos
        const fechaInicio = new Date().toISOString().split('T')[0];
        const fechaFin    = calcularFechaFin(fechaInicio, perfil.Dia_corte);
        const montos      = calcularMontos(ingreso_estimado, saldoAnterior, perfil);

        // 5. Insertar nuevo período
        const [result] = await db.query(
            `INSERT INTO PERIODOS_PRESUPUESTO 
             (ID_presupuesto, ID_usuario, Fecha_inicio, Fecha_fin, Estado, Ingreso_estimado, Ingreso_real, Saldo_anterior, Monto_gastos, Monto_deudas, Monto_imprevistos, Monto_ahorros, Monto_emergencia) 
             VALUES (?, ?, ?, ?, 'abierto', ?, 0.00, ?, ?, ?, ?, ?, ?)`,
            [
                perfil.ID_presupuesto, ID_usuario, fechaInicio, fechaFin, 
                montos.Ingreso_estimado, montos.Saldo_anterior, 
                montos.Monto_gastos, montos.Monto_deudas, montos.Monto_imprevistos, 
                montos.Monto_ahorros, montos.Monto_emergencia
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: 'Período abierto correctamente',
            data: { 
                ID_periodo: result.insertId, 
                Fecha_inicio: fechaInicio, 
                Fecha_fin: fechaFin, 
                Saldo_anterior: saldoAnterior, 
                ...montos 
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al abrir período', error: err.message });
    }
};

const cerrarPeriodo = async (req, res) => {
    const ID_usuario = req.user.ID_usuario;

    try {
        const [abiertos] = await db.query(
            `SELECT * FROM PERIODOS_PRESUPUESTO WHERE ID_usuario = ? AND Estado = 'abierto'`, 
            [ID_usuario]
        );
        if (!abiertos.length) return res.status(404).json({ ok: false, mensaje: 'No tienes un período abierto.' });
        const periodo = abiertos[0];

        // Calcular ingresos reales sumando los registros vinculados en el periodo de tiempo
        const [ingresos] = await db.query(
            `SELECT COALESCE(SUM(i.Monto), 0) AS total 
             FROM INGRESOS i 
             JOIN MOVIMIENTOS m ON i.ID_entrada = (SELECT e.ID_entrada FROM ENTRADA e WHERE e.ID_movimiento = m.ID_movimiento) 
             WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`,
            [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
        );
        const ingresoReal = Number(ingresos[0].total);

        await db.query(
            `UPDATE PERIODOS_PRESUPUESTO SET Estado = 'cerrado', Ingreso_real = ? WHERE ID_periodo = ?`, 
            [ingresoReal, periodo.ID_periodo]
        );

        res.json({ 
            ok: true, 
            mensaje: 'Período cerrado correctamente', 
            data: { ID_periodo: periodo.ID_periodo, Ingreso_real: ingresoReal, Fecha_inicio: periodo.Fecha_inicio, Fecha_fin: periodo.Fecha_fin } 
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al cerrar período', error: err.message });
    }
};

const listarPeriodos = async (req, res) => {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(50, parseInt(req.query.limite) || 10);
    const offset = (pagina - 1) * limite;

    try {
        const [periodos] = await db.query(
            `SELECT pp.*, p.Nombre AS Perfil_nombre 
             FROM PERIODOS_PRESUPUESTO pp 
             JOIN PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto 
             WHERE pp.ID_usuario = ? 
             ORDER BY pp.Fecha_inicio DESC LIMIT ? OFFSET ?`, 
            [req.user.ID_usuario, limite, offset]
        );
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM PERIODOS_PRESUPUESTO WHERE ID_usuario = ?`, 
            [req.user.ID_usuario]
        );
        res.json({ ok: true, data: periodos, total, pagina, limite });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al listar períodos', error: err.message });
    }
};

const obtenerPeriodoActivo = async (req, res) => {
    const ID_usuario = req.user.ID_usuario;

    try {
        const [rows] = await db.query(
            `SELECT pp.*, p.Nombre AS Perfil_nombre, p.Dia_corte 
             FROM PERIODOS_PRESUPUESTO pp 
             JOIN PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto 
             WHERE pp.ID_usuario = ? AND pp.Estado = 'abierto'`, 
            [ID_usuario]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'No hay período activo' });
        const periodo = rows[0];

        // Obtener ejecuciones reales en tiempo real de cada tabla relacional
        const [gastosReal] = await db.query(
            `SELECT COALESCE(SUM(Monto), 0) AS total FROM GASTOS g JOIN SALIDA s ON g.ID_salida = s.ID_salida JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento WHERE m.ID_usuario = ? AND g.Fecha_registro BETWEEN ? AND ?`, 
            [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
        );
        const [deudasReal] = await db.query(
            `SELECT COALESCE(SUM(Monto), 0) AS total FROM DEUDAS d JOIN SALIDA s ON d.ID_salida = s.ID_salida JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento WHERE m.ID_usuario = ? AND d.Fecha_inicio BETWEEN ? AND ?`, 
            [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
        );
        const [imprevistosReal] = await db.query(
            `SELECT COALESCE(SUM(Monto), 0) AS total FROM IMPREVISTOS i JOIN SALIDA s ON i.ID_salida = s.ID_salida JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`, 
            [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
        );
        const [ahorrosReal] = await db.query(
            `SELECT COALESCE(SUM(Monto), 0) AS total FROM AHORROS a JOIN ENTRADA e ON a.ID_entrada = e.ID_entrada JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento WHERE m.ID_usuario = ? AND a.Fecha_registro BETWEEN ? AND ?`, 
            [ID_usuario, periodo.Fecha_inicio, periodo.Fecha_fin]
        );

        const ejecucion = {
            gastos: { 
                presupuestado: Number(periodo.Monto_gastos), 
                ejecutado: Number(gastosReal[0].total), 
                disponible: Number(periodo.Monto_gastos) - Number(gastosReal[0].total) 
            },
            deudas: { 
                presupuestado: Number(periodo.Monto_deudas), 
                ejecutado: Number(deudasReal[0].total), 
                disponible: Number(periodo.Monto_deudas) - Number(deudasReal[0].total) 
            },
            imprevistos: { 
                presupuestado: Number(periodo.Monto_imprevistos), 
                ejecutado: Number(imprevistosReal[0].total), 
                disponible: Number(periodo.Monto_imprevistos) - Number(imprevistosReal[0].total) 
            },
            ahorros: { 
                presupuestado: Number(periodo.Monto_ahorros), 
                ejecutado: Number(ahorrosReal[0].total), 
                disponible: Number(periodo.Monto_ahorros) - Number(ahorrosReal[0].total) 
            }
        };

        res.json({ ok: true, data: { ...periodo, ejecucion } });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener periodo activo', error: err.message });
    }
};

const ajustarIngresoPeriodo = async (req, res) => {
    const { ingreso_estimado } = req.body;
    const ID_usuario = req.user.ID_usuario;

    if (ingreso_estimado === undefined || Number(ingreso_estimado) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'ingreso_estimado debe ser >= 0' });
    }

    try {
        const [rows] = await db.query(
            `SELECT pp.*, p.Porcentaje_gastos, p.Porcentaje_deudas, p.Porcentaje_imprevistos, p.Porcentaje_ahorros, p.Porcentaje_emergencia 
             FROM PERIODOS_PRESUPUESTO pp 
             JOIN PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto 
             WHERE pp.ID_usuario = ? AND pp.Estado = 'abierto'`, 
            [ID_usuario]
        );
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'No hay período activo' });

        const periodo = rows[0];
        const montos  = calcularMontos(ingreso_estimado, periodo.Saldo_anterior, periodo);

        await db.query(
            `UPDATE PERIODOS_PRESUPUESTO 
             SET Ingreso_estimado = ?, Monto_gastos = ?, Monto_deudas = ?, Monto_imprevistos = ?, Monto_ahorros = ?, Monto_emergencia = ? 
             WHERE ID_periodo = ?`,
            [montos.Ingreso_estimado, montos.Monto_gastos, montos.Monto_deudas, montos.Monto_imprevistos, montos.Monto_ahorros, montos.Monto_emergencia, periodo.ID_periodo]
        );

        res.json({ ok: true, mensaje: 'Ingreso ajustado y montos recalculados', data: montos });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al ajustar ingreso', error: err.message });
    }
};

const actualizarIngresoReal = async (ID_usuario, connection) => {
    const conn = connection || db;

    const [periodo] = await conn.query(
        `SELECT ID_periodo, Fecha_inicio, Fecha_fin FROM PERIODOS_PRESUPUESTO WHERE ID_usuario = ? AND Estado = 'abierto' LIMIT 1`, 
        [ID_usuario]
    );
    if (!periodo.length) return; 

    const { ID_periodo, Fecha_inicio, Fecha_fin } = periodo[0];

    const [[{ total }]] = await conn.query(
        `SELECT COALESCE(SUM(i.Monto), 0) AS total 
         FROM INGRESOS i 
         JOIN ENTRADA e ON i.ID_entrada = e.ID_entrada 
         JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento 
         WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`, 
        [ID_usuario, Fecha_inicio, Fecha_fin]
    );

    await conn.query(
        `UPDATE PERIODOS_PRESUPUESTO SET Ingreso_real = ? WHERE ID_periodo = ?`, 
        [total, ID_periodo]
    );
};

// ─────────────────────────────────────────────────────────────
//  ABONOS A DEUDAS Y AHORROS
// ─────────────────────────────────────────────────────────────

const abonarDeuda = async (req, res) => {
    const ID_usuario = req.user.ID_usuario; 
    const { id }     = req.params;
    const cuotas     = parseInt(req.body.cuotas) || 1;

    if (cuotas < 1) {
        return res.status(400).json({ ok: false, mensaje: "El número de cuotas debe ser >= 1" });
    }

    try {
        const [[deuda]] = await db.query(
            `SELECT d.ID_deudas, d.Cuotas_total, d.Cuotas_pagadas, d.Estado 
             FROM DEUDAS d 
             JOIN SALIDA s ON d.ID_salida = s.ID_salida 
             JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento 
             WHERE d.ID_deudas = ? AND m.ID_usuario = ?`, 
            [id, ID_usuario]
        );

        if (!deuda) return res.status(404).json({ ok: false, mensaje: "Deuda no encontrada" });
        if (deuda.Estado === "pagada") return res.status(409).json({ ok: false, mensaje: "Esta deuda ya está pagada" });

        const nuevasCuotas = deuda.Cuotas_pagadas + cuotas;

        if (deuda.Cuotas_total !== null && nuevasCuotas > deuda.Cuotas_total) {
            return res.status(400).json({
                ok: false,
                mensaje: `No puedes pagar más cuotas de las que tiene la deuda. Quedan ${deuda.Cuotas_total - deuda.Cuotas_pagadas}.`
            });
        }

        const nuevoEstado = (deuda.Cuotas_total !== null && nuevasCuotas >= deuda.Cuotas_total) ? "pagada" : "pendiente";

        await db.query(
            `UPDATE DEUDAS SET Cuotas_pagadas = ?, Estado = ? WHERE ID_deudas = ?`, 
            [nuevasCuotas, nuevoEstado, id]
        );

        res.status(200).json({
            ok: true,
            mensaje: nuevoEstado === "pagada" ? "Deuda pagada completamente" : "Cuota registrada",
            cuotas_pagadas: nuevasCuotas,
            cuotas_total: deuda.Cuotas_total,
            estado: nuevoEstado,
        });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: "Error interno del servidor", error: error.message });
    }
};

const abonarAhorro = async (req, res) => {
    const ID_usuario = req.user.ID_usuario; 
    const { id }     = req.params;
    const monto      = parseFloat(req.body.monto);

    if (!monto || monto <= 0) {
        return res.status(400).json({ ok: false, mensaje: "El monto del abono debe ser mayor a 0" });
    }

    try {
        const [[ahorro]] = await db.query(
            `SELECT a.ID_ahorros, a.Monto AS meta_monto, a.Monto_acumulado 
             FROM AHORROS a 
             JOIN ENTRADA e ON a.ID_entrada = e.ID_entrada 
             JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento 
             WHERE a.ID_ahorros = ? AND m.ID_usuario = ?`, 
            [id, ID_usuario]
        );

        if (!ahorro) return res.status(404).json({ ok: false, mensaje: "Ahorro no encontrado" });

        const nuevoAcumulado = Math.min(parseFloat(ahorro.Monto_acumulado) + monto, parseFloat(ahorro.meta_monto));
        const metaAlcanzada = nuevoAcumulado >= parseFloat(ahorro.meta_monto);

        await db.query(
            `UPDATE AHORROS SET Monto_acumulado = ? WHERE ID_ahorros = ?`, 
            [nuevoAcumulado, id]
        );

        res.status(200).json({
            ok: true,
            mensaje: metaAlcanzada ? "Meta de ahorro alcanzada" : "Abono registrado",
            monto_acumulado: nuevoAcumulado,
            meta_monto: ahorro.meta_monto,
            progreso: parseFloat(((nuevoAcumulado / ahorro.meta_monto) * 100).toFixed(2)),
            meta_alcanzada: metaAlcanzada,
        });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: "Error interno del servidor", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
    listarPerfiles,
    obtenerPerfil,
    crearPerfil,
    editarPerfil,
    eliminarPerfil,
    activarPerfil,
    abrirPeriodo,
    cerrarPeriodo,
    listarPeriodos,
    obtenerPeriodoActivo,
    ajustarIngresoPeriodo,
    actualizarIngresoReal,
    abonarDeuda,
    abonarAhorro,
};