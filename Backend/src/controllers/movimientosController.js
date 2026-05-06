const pool = require("../db/connection");

const crearMovimiento = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const ID_usuario = req.usuario.id;

    const { tipo_flujo, subtipo_modulo, datos } = req.body;

    if (!datos?.monto) {
    return res.status(400).json({ ok: false, mensaje: "El campo monto es requerido" });
    }

    // Validar coherencia entre tipo_flujo y subtipo_modulo
    if (!["Entrada", "Salida"].includes(tipo_flujo)) {
    return res.status(400).json({ ok: false, mensaje: "tipo_flujo inválido" });
    }

    const entradas = ["Ahorro", "Ingreso"];
    const salidas  = ["Gasto", "Deuda", "Imprevisto"];

    if (tipo_flujo === "Entrada" && !entradas.includes(subtipo_modulo)) {
      return res.status(400).json({ ok: false, mensaje: "Subtipo inválido para Entrada" });
    }

    if (tipo_flujo === "Salida" && !salidas.includes(subtipo_modulo)) {
      return res.status(400).json({ ok: false, mensaje: "Subtipo inválido para Salida" });
    }

    await connection.beginTransaction();

    // 1. Insertar en MOVIMIENTOS
    const [movimiento] = await connection.query(
      `INSERT INTO MOVIMIENTOS (ID_usuario, Tipo_Flujo, Subtipo_Modulo)
       VALUES (?, ?, ?)`,
      [ID_usuario, tipo_flujo, subtipo_modulo]
    );
    const ID_movimiento = movimiento.insertId;

    let ID_detalle = null;

    if (tipo_flujo === "Entrada") {
      // 2a. Insertar en ENTRADA
      const [entrada] = await connection.query(
        `INSERT INTO ENTRADA (ID_movimiento) VALUES (?)`,
        [ID_movimiento]
      );
      const ID_entrada = entrada.insertId;

      if (subtipo_modulo === "Ingreso") {
        const { monto, descripcion, fuente, fecha_registro, id_categoria } = datos;
        const [result] = await connection.query(
          `INSERT INTO INGRESOS (ID_entrada, ID_categoria, Monto, Descripcion, Fuente, Fecha_registro)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ID_entrada, id_categoria || null, monto, descripcion || null, fuente || null, fecha_registro || null]
        );
        ID_detalle = result.insertId;

      } else if (subtipo_modulo === "Ahorro") {
        const { monto, descripcion, meta, fecha_registro, fecha_meta, id_categoria } = datos;
        const [result] = await connection.query(
          `INSERT INTO AHORROS (ID_entrada, ID_categoria, Monto, Descripcion, Meta, Fecha_registro, Fecha_meta)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ID_entrada, id_categoria || null, monto, descripcion || null, meta || null, fecha_registro || null, fecha_meta || null]
        );
        ID_detalle = result.insertId;
      }

    } else {
      // 2b. Insertar en SALIDA
      const [salida] = await connection.query(
        `INSERT INTO SALIDA (ID_movimiento) VALUES (?)`,
        [ID_movimiento]
      );
      const ID_salida = salida.insertId;

      if (subtipo_modulo === "Gasto") {
        const { monto, descripcion, fecha_registro, id_categoria, id_dependiente } = datos;
        const [result] = await connection.query(
          `INSERT INTO GASTOS (ID_salida, ID_categoria, Monto, Descripcion, Fecha_registro, ID_dependiente)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ID_salida, id_categoria || null, monto, descripcion || null, fecha_registro || null, id_dependiente || null]
        );
        ID_detalle = result.insertId;

      } else if (subtipo_modulo === "Imprevisto") {
        const { monto, causa, fecha_registro, id_categoria, id_dependiente } = datos;
        const [result] = await connection.query(
          `INSERT INTO IMPREVISTOS (ID_salida, ID_categoria, Monto, Causa, Fecha_registro, ID_dependiente)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ID_salida, id_categoria || null, monto, causa || null, fecha_registro || null, id_dependiente || null]
        );
        ID_detalle = result.insertId;

      } else if (subtipo_modulo === "Deuda") {
        const { monto, fuente, descripcion, cuotas_total, fecha_inicio, fecha_fin, id_categoria } = datos;
        const [result] = await connection.query(
          `INSERT INTO DEUDAS (ID_salida, ID_categoria, Monto, Fuente, Descripcion, Cuotas_total, Fecha_inicio, Fecha_fin)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ID_salida, id_categoria || null, monto, fuente, descripcion || null, cuotas_total || null, fecha_inicio || null, fecha_fin || null]
        );
        ID_detalle = result.insertId;
      }
    }

    await connection.commit();

    return res.status(201).json({
      ok: true,
      mensaje: "Movimiento registrado exitosamente",
      ID_movimiento,
      ID_detalle,
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error en crearMovimiento:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    connection.release();
  }
};

// <==&&==·········· INGRESOS ··········==&&==>

// ── GET Ingresos ───────────────────────────────────────────
const getIngresos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const [rows] = await pool.query(
      `SELECT i.ID_ingresos AS id, i.Monto AS monto, i.Descripcion AS descripcion,
              i.Fuente AS fuente, i.Fecha_registro AS fecha,
              c.Nombre AS categoria
       FROM INGRESOS i
       INNER JOIN ENTRADA e     ON i.ID_entrada    = e.ID_entrada
       INNER JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       LEFT  JOIN CATEGORIAS c  ON i.ID_categoria  = c.ID_categoria
       WHERE m.ID_usuario = ?
       ORDER BY i.Fecha_registro DESC`,
      [ID_usuario]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getIngresos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── UPDATE Ingresos ───────────────────────────────────────────
const updateIngresos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const { monto, descripcion, fuente, fecha_registro, id_categoria } = req.body;
    try {
    const [rows] = await pool.query(
        `UPDATE INGRESOS    
            SET Monto = ?, Descripcion = ?, Fuente = ?, Fecha_registro = ?, ID_categoria = ?
            WHERE ID_ingresos = ? AND ID_entrada IN (SELECT ID_entrada FROM ENTRADA WHERE ID_movimiento IN (SELECT ID_movimiento FROM MOVIMIENTOS WHERE ID_usuario = ?))`,
        [monto, descripcion, fuente, fecha_registro, id_categoria, id, ID_usuario]
    );
    if (rows.affectedRows === 0) {
        return res.status(404).json({ ok: false, mensaje: "Ingreso no encontrado" });
    }
    res.status(200).json({ ok: true, mensaje: "Ingreso actualizado exitosamente" });
    } catch (error) {
    console.error("Error en updateIngresos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── DELETE Ingresos ────────────────────────────────────────────
const deleteIngresos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Buscar el ID_entrada y ID_movimiento antes de borrar
    const [[ingreso]] = await connection.query(
      `SELECT e.ID_entrada, e.ID_movimiento
       FROM INGRESOS i
       INNER JOIN ENTRADA e     ON i.ID_entrada    = e.ID_entrada
       INNER JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       WHERE i.ID_ingresos = ? AND m.ID_usuario = ?`,
      [id, ID_usuario]
    );

    if (!ingreso) {
      await connection.rollback();
      return res.status(404).json({ ok: false, mensaje: "Ingreso no encontrado" });
    }

    // 2. Borrar en cascada
    await connection.query(`DELETE FROM INGRESOS    WHERE ID_ingresos = ?`,       [id]);
    await connection.query(`DELETE FROM ENTRADA     WHERE ID_entrada = ?`,         [ingreso.ID_entrada]);
    await connection.query(`DELETE FROM MOVIMIENTOS WHERE ID_movimiento = ?`,      [ingreso.ID_movimiento]);

    await connection.commit();
    res.status(200).json({ ok: true, mensaje: "Ingreso eliminado exitosamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error en deleteIngresos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    connection.release();
  }
};

// <==&&==·········· AHORROS ··········==&&==>

// ── GET Ahorros ────────────────────────────────────────────
const getAhorros = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const [rows] = await pool.query(
      `SELECT a.ID_ahorros AS id, a.Monto AS monto, a.Monto_acumulado AS monto_acumulado,
              a.Descripcion AS descripcion, a.Meta AS meta,
              a.Fecha_registro AS fecha, a.Fecha_meta AS fecha_meta,
              c.Nombre AS categoria
       FROM AHORROS a
       INNER JOIN ENTRADA e     ON a.ID_entrada    = e.ID_entrada
       INNER JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       LEFT  JOIN CATEGORIAS c  ON a.ID_categoria  = c.ID_categoria
       WHERE m.ID_usuario = ?
       ORDER BY a.Fecha_registro DESC`,
      [ID_usuario]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getAhorros:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── UPDATE Ahorros ────────────────────────────────────────────
const updateAhorros = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const { monto, monto_acumulado, descripcion, meta, fecha_meta } = req.body;

  try {
    const [rows] = await pool.query(
      `UPDATE AHORROS
       SET Monto = ?, Monto_acumulado = ?, Descripcion = ?, Meta = ?, Fecha_meta = ?
       WHERE ID_ahorros = ? AND ID_entrada IN (SELECT ID_entrada FROM ENTRADA WHERE ID_movimiento IN (SELECT ID_movimiento FROM MOVIMIENTOS WHERE ID_usuario = ?))`,
      [monto, monto_acumulado, descripcion, meta, fecha_meta, id, ID_usuario]
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: "Ahorro no encontrado" });
    }

    res.status(200).json({ ok: true, mensaje: "Ahorro actualizado exitosamente" });
  } catch (error) {
    console.error("Error en updateAhorros:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── DELETE Ahorros ─────────────────────────────────────────────
const deleteAhorros = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Buscar el ID_entrada y ID_movimiento antes de borrar
    const [[ahorro]] = await connection.query(
      `SELECT e.ID_entrada, e.ID_movimiento
       FROM AHORROS a
       INNER JOIN ENTRADA e     ON a.ID_entrada    = e.ID_entrada
       INNER JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       WHERE a.ID_ahorros = ? AND m.ID_usuario = ?`,
      [id, ID_usuario]
    );

    if (!ahorro) {
      await connection.rollback();
      return res.status(404).json({ ok: false, mensaje: "Ahorro no encontrado" });
    }

    // 2. Borrar en cascada
    await connection.query(`DELETE FROM AHORROS    
        WHERE ID_ahorros = ?`, [id]);
    await connection.query(`DELETE FROM ENTRADA     WHERE ID_entrada = ?`, [ahorro.ID_entrada]);
    await connection.query(`DELETE FROM MOVIMIENTOS WHERE ID_movimiento = ?`, [ahorro.ID_movimiento]);

    await connection.commit();
    res.status(200).json({ ok: true, mensaje: "Ahorro eliminado exitosamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error en deleteAhorros:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    connection.release();
  }
};


// <==&&==·········· GASTOS ··········==&&==>

// ── GET Gastos ─────────────────────────────────────────────
const getGastos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const [rows] = await pool.query(
      `SELECT g.ID_gastos AS id, g.Monto AS monto, g.Descripcion AS descripcion,
              g.Fecha_registro AS fecha,
              c.Nombre AS categoria,
              d.Nombre AS dependiente
       FROM GASTOS g
       INNER JOIN SALIDA s       ON g.ID_salida      = s.ID_salida
       INNER JOIN MOVIMIENTOS m  ON s.ID_movimiento  = m.ID_movimiento
       LEFT  JOIN CATEGORIAS c   ON g.ID_categoria   = c.ID_categoria
       LEFT  JOIN DEPENDIENTES d ON g.ID_dependiente = d.ID_dependientes
       WHERE m.ID_usuario = ?
       ORDER BY g.Fecha_registro DESC`,
      [ID_usuario]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getGastos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── UPDATE Gastos ─────────────────────────────────────────────
const updateGastos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const { monto, descripcion, fecha_registro, id_categoria, id_dependiente } = req.body;
    try {
    const [rows] = await pool.query(
        `UPDATE GASTOS    
            SET Monto = ?, Descripcion = ?, Fecha_registro = ?, ID_categoria = ?, ID_dependiente = ?
            WHERE ID_gastos = ? AND ID_salida IN (SELECT ID_salida FROM SALIDA WHERE ID_movimiento IN (SELECT ID_movimiento FROM MOVIMIENTOS WHERE ID_usuario = ?))`,
        [monto, descripcion, fecha_registro, id_categoria, id_dependiente, id, ID_usuario]
    );
    if (rows.affectedRows === 0) {
        return res.status(404).json({ ok: false, mensaje: "Gasto no encontrado" });
    }
    res.status(200).json({ ok: true, mensaje: "Gasto actualizado exitosamente" });
    } catch (error) {
    console.error("Error en updateGastos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── DELETE Gastos ────────────────────────────────────────
const deleteGastos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const connection = await pool.getConnection();
    try {    await connection.beginTransaction();
    // 1. Buscar el ID_salida y ID_movimiento antes de borrar
    const [[gasto]] = await connection.query(
      `SELECT s.ID_salida, s.ID_movimiento
         FROM GASTOS g
            INNER JOIN SALIDA s       ON g.ID_salida      = s.ID_salida
            INNER JOIN MOVIMIENTOS m  ON s.ID_movimiento  = m.ID_movimiento
         WHERE g.ID_gastos = ? AND m.ID_usuario = ?`,
      [id, ID_usuario]
    );  
    if (!gasto) {
      await connection.rollback();
      return res.status(404).json({ ok: false, mensaje: "Gasto no encontrado" });
    }
    // 2. Borrar en cascada
    await connection.query(`DELETE FROM GASTOS    
        WHERE ID_gastos = ?`, [id]);
    await connection.query(`DELETE FROM SALIDA     WHERE ID_salida = ?`, [gasto.ID_salida]);
    await connection.query(`DELETE FROM MOVIMIENTOS WHERE ID_movimiento = ?`, [gasto.ID_movimiento]);
    await connection.commit();
    res.status(200).json({ ok: true, mensaje: "Gasto eliminado exitosamente" });
    } catch (error) {
    await connection.rollback();
    console.error("Error en deleteGastos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {    connection.release();
  }
};

// <==&&==·········· IMPREVISTOS ··········==&&==>

// ── GET Imprevistos ────────────────────────────────────────
const getImprevistos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const [rows] = await pool.query(
      `SELECT i.ID_imprevistos AS id, i.Monto AS monto, i.Causa AS causa,
              i.Fecha_registro AS fecha,
              c.Nombre AS categoria,
              d.Nombre AS dependiente
       FROM IMPREVISTOS i
       INNER JOIN SALIDA s       ON i.ID_salida      = s.ID_salida
       INNER JOIN MOVIMIENTOS m  ON s.ID_movimiento  = m.ID_movimiento
       LEFT  JOIN CATEGORIAS c   ON i.ID_categoria   = c.ID_categoria
       LEFT  JOIN DEPENDIENTES d ON i.ID_dependiente = d.ID_dependientes
       WHERE m.ID_usuario = ?
       ORDER BY i.Fecha_registro DESC`,
      [ID_usuario]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getImprevistos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── UPDATE Imprevistos ────────────────────────────────────────
const updateImprevistos = async (req, res) => {
  const ID_usuario = req.usuario.id;
    const { id } = req.params;
    const { monto, causa, fecha_registro, id_categoria, id_dependiente } = req.body;
    try {    const [rows] = await pool.query(
        `UPDATE IMPREVISTOS    
            SET Monto = ?, Causa = ?, Fecha_registro = ?, ID_categoria = ?, ID_dependiente = ?
            WHERE ID_imprevistos = ? AND ID_salida IN (SELECT ID_salida FROM SALIDA WHERE ID_movimiento IN (SELECT ID_movimiento FROM MOVIMIENTOS WHERE ID_usuario = ?))`,
        [monto, causa, fecha_registro, id_categoria, id_dependiente, id, ID_usuario]
    );
    if (rows.affectedRows === 0) {
        return res.status(404).json({ ok: false, mensaje: "Imprevisto no encontrado" });
    }
    res.status(200).json({ ok: true, mensaje: "Imprevisto actualizado exitosamente" });
    } catch (error) {
    console.error("Error en updateImprevistos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── DELETE Imprevistos ────────────────────────────────────────
const deleteImprevistos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const connection = await pool.getConnection();
    try {    await connection.beginTransaction();
    // 1. Buscar el ID_salida y ID_movimiento antes de borrar
    const [[imprevisto]] = await connection.query(
        `SELECT s.ID_salida, s.ID_movimiento
            FROM IMPREVISTOS i
            INNER JOIN SALIDA s       ON i.ID_salida      = s.ID_salida
            INNER JOIN MOVIMIENTOS m  ON s.ID_movimiento  = m.ID_movimiento
            WHERE i.ID_imprevistos = ? AND m.ID_usuario = ?`,
        [id, ID_usuario]
    );
    if (!imprevisto) {
      await connection.rollback();
      return res.status(404).json({ ok: false, mensaje: "Imprevisto no encontrado" });
    }
    // 2. Borrar en cascada
    await connection.query(`DELETE FROM IMPREVISTOS    
        WHERE ID_imprevistos = ?`, [id]);
    await connection.query(`DELETE FROM SALIDA     WHERE ID_salida = ?`, [imprevisto.ID_salida]);
    await connection.query(`DELETE FROM MOVIMIENTOS WHERE ID_movimiento = ?`, [imprevisto.ID_movimiento]);
    await connection.commit();
    res.status(200).json({ ok: true, mensaje: "Imprevisto eliminado exitosamente" });
    } catch (error) {
    await connection.rollback();
    console.error("Error en deleteImprevistos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {    connection.release();
  }
};


// <==&&==·········· DEUDAS ··········==&&==>
// ── GET Deudas ─────────────────────────────────────────────
const getDeudas = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const [rows] = await pool.query(
      `SELECT d.ID_deudas AS id, d.Monto AS monto, d.Fuente AS fuente,
              d.Descripcion AS descripcion, d.Cuotas_total AS cuotas_total,
              d.Cuotas_pagadas AS cuotas_pagadas, d.Fecha_inicio AS fecha_inicio,
              d.Fecha_fin AS fecha_fin, d.Estado AS estado,
              c.Nombre AS categoria
       FROM DEUDAS d
       INNER JOIN SALIDA s      ON d.ID_salida     = s.ID_salida
       INNER JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       LEFT  JOIN CATEGORIAS c  ON d.ID_categoria  = c.ID_categoria
       WHERE m.ID_usuario = ?
       ORDER BY d.Fecha_inicio DESC`,
      [ID_usuario]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getDeudas:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── UPDATE Deudas ─────────────────────────────────────────────
const updateDeudas = async (req, res) => {
  const ID_usuario = req.usuario.id;
    const { id } = req.params;
    const { monto, fuente, descripcion, cuotas_total, cuotas_pagadas, fecha_inicio, fecha_fin, estado, id_categoria } = req.body;
    try {    const [rows] = await pool.query(
        `UPDATE DEUDAS    
            SET Monto = ?, Fuente = ?, Descripcion = ?, Cuotas_total = ?, Cuotas_pagadas = ?, Fecha_inicio = ?, Fecha_fin = ?, Estado = ?, ID_categoria = ?
            WHERE ID_deudas = ? AND ID_salida IN (SELECT ID_salida FROM SALIDA WHERE ID_movimiento IN (SELECT ID_movimiento FROM MOVIMIENTOS WHERE ID_usuario = ?))`,
        [monto, fuente, descripcion, cuotas_total, cuotas_pagadas, fecha_inicio, fecha_fin, estado, id_categoria, id, ID_usuario]
    );
    if (rows.affectedRows === 0) {
        return res.status(404).json({ ok: false, mensaje: "Deuda no encontrada" });
    }
    res.status(200).json({ ok: true, mensaje: "Deuda actualizada exitosamente" });
    } catch (error) {
    console.error("Error en updateDeudas:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── DELETE Deudas ─────────────────────────────────────────────
const deleteDeudas = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const connection = await pool.getConnection();
    try {    await connection.beginTransaction();
    // 1. Buscar el ID_salida y ID_movimiento antes de borrar
    const [[deuda]] = await connection.query(
        `SELECT s.ID_salida, s.ID_movimiento
            FROM DEUDAS d
            INNER JOIN SALIDA s      ON d.ID_salida     = s.ID_salida
            INNER JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
            WHERE d.ID_deudas = ? AND m.ID_usuario = ?`,
        [id, ID_usuario]
    );
    if (!deuda) {
      await connection.rollback();
      return res.status(404).json({ ok: false, mensaje: "Deuda no encontrada" });
    }
    // 2. Borrar en cascada
    await connection.query(`DELETE FROM DEUDAS    
        WHERE ID_deudas = ?`, [id]);
    await connection.query(`DELETE FROM SALIDA     WHERE ID_salida = ?`, [deuda.ID_salida]);
    await connection.query(`DELETE FROM MOVIMIENTOS WHERE ID_movimiento = ?`, [deuda.ID_movimiento]);
    await connection.commit();
    res.status(200).json({ ok: true, mensaje: "Deuda eliminada exitosamente" });
    } catch (error) {
    await connection.rollback();
    console.error("Error en deleteDeudas:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {    connection.release();
  }
};


module.exports = { crearMovimiento, getIngresos, getAhorros, getGastos, getImprevistos, getDeudas, updateAhorros, updateDeudas, updateGastos, updateImprevistos, updateIngresos, deleteIngresos, deleteAhorros, deleteGastos, deleteImprevistos, deleteDeudas };