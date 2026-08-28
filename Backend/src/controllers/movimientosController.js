const { actualizarIngresoReal } = require("../controllers/PresupuestosController"); //! linea agregada para prueba local

const pool = require("../db/connection");
const {
  verificarUmbralGastos,
  verificarUmbralImprevistos,
  verificarMetaAhorroAlcanzada,
} = require ("../service/NotificacionesService");

const getMovimientos = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    // 1. Consultar Ingresos
    const { rows: ingresos } = await pool.query(
      "SELECT 'ingreso' as tipo, monto as monto, descripcion as descripcion, fecha_registro as fecha FROM ingresos i JOIN entrada s ON i.id_entrada = s.id_entrada JOIN movimientos m ON s.id_movimiento = m.id_movimiento WHERE m.id_usuario = $1",
      [ID_usuario]
    );
    
    // 2. Consultar Gastos
    const { rows: gastos } = await pool.query(
      "SELECT 'gasto' as tipo, monto as monto, descripcion as descripcion, fecha_registro as fecha FROM gastos g JOIN salida s ON g.id_salida = s.id_salida JOIN movimientos m ON s.id_movimiento = m.id_movimiento WHERE m.id_usuario = $1",
      [ID_usuario]
    );
    
    // 3. Consultar Deudas
    const { rows: deudas } = await pool.query(
      "SELECT 'deuda' as tipo, monto as monto, descripcion as descripcion, estado as estado, fecha_fin as fecha FROM deudas d JOIN salida s ON d.id_salida = s.id_salida JOIN movimientos m ON s.id_movimiento = m.id_movimiento WHERE m.id_usuario = $1",
      [ID_usuario]
    );
    
    // 4. Consultar Ahorros
    const { rows: ahorros } = await pool.query(
      "SELECT 'ahorro' as tipo, monto_acumulado as monto, descripcion as descripcion, fecha_registro as fecha, fecha_meta as fecha_meta FROM ahorros a JOIN entrada s ON a.id_entrada = s.id_entrada JOIN movimientos m ON s.id_movimiento = m.id_movimiento WHERE m.id_usuario = $1",
      [ID_usuario]
    );

    // 5. Consultar Imprevistos
    const { rows: imprevistos } = await pool.query(
      "SELECT 'imprevisto' as tipo, monto as monto, causa as descripcion, fecha_registro as fecha FROM imprevistos i JOIN salida s ON i.id_salida = s.id_salida JOIN movimientos m ON s.id_movimiento = m.id_movimiento WHERE m.id_usuario = $1",
      [ID_usuario]
    );

    // Unificar todo para la IA
    const todosLosMovimientos = [...ingresos, ...gastos, ...deudas, ...ahorros, ...imprevistos];

    res.status(200).json(todosLosMovimientos);
  } catch (error) {
    console.error("Error en getMovimientos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al recopilar movimientos" });
  }
};


const crearMovimiento = async (req, res) => {
  // 1. Validaciones tempranas antes de abrir la conexión a la BD
  const { tipo_flujo, subtipo_modulo, datos } = req.body;

  if (!datos?.monto) {
    return res.status(400).json({ ok: false, mensaje: "El campo monto es requerido" });
  }

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

  // 2. Apertura de conexión e inicio de la transacción
  let connection;

  try {
    connection = await pool.connect();
    const ID_usuario = req.usuario.id;
    await connection.query("BEGIN");

    // 1. Insertar en MOVIMIENTOS
    const { rows: [movimiento] } = await connection.query(
      `INSERT INTO movimientos (id_usuario, tipo_flujo, subtipo_modulo)
       VALUES ($1, $2, $3)
       RETURNING id_movimiento`,
      [ID_usuario, tipo_flujo, subtipo_modulo]
    );
    const ID_movimiento = movimiento.id_movimiento;

    let ID_detalle = null;

    if (tipo_flujo === "Entrada") {
      // 2a. Insertar en ENTRADA
      const { rows: [entrada] } = await connection.query(
        `INSERT INTO entrada (id_movimiento) VALUES ($1) RETURNING id_entrada`,
        [ID_movimiento]
      );
      const ID_entrada = entrada.id_entrada;

      if (subtipo_modulo === "Ingreso") {
        const { monto, descripcion, fuente, fecha_registro, id_categoria } = datos;
        const { rows: [result] } = await connection.query(
          `INSERT INTO ingresos (id_entrada, id_categoria, monto, descripcion, fuente, fecha_registro)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id_ingresos`,
          [ID_entrada, id_categoria || null, monto, descripcion || null, fuente || null, fecha_registro || null]
        );
        ID_detalle = result.id_ingresos;

      } else if (subtipo_modulo === "Ahorro") {
        const { monto, descripcion, meta, fecha_registro, fecha_meta, id_categoria } = datos;
        const { rows: [result] } = await connection.query(
          `INSERT INTO ahorros (id_entrada, id_categoria, monto, descripcion, meta, fecha_registro, fecha_meta)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id_ahorros`,
          [ID_entrada, id_categoria || null, monto, descripcion || null, meta || null, fecha_registro || null, fecha_meta || null]
        );
        ID_detalle = result.id_ahorros;
      }

    } else {
      // 2b. Insertar en SALIDA
      const { rows: [salida] } = await connection.query(
        `INSERT INTO salida (id_movimiento) VALUES ($1) RETURNING id_salida`,
        [ID_movimiento]
      );
      const ID_salida = salida.id_salida;

      if (subtipo_modulo === "Gasto") {
        const { monto, descripcion, fecha_registro, id_categoria, id_dependientes } = datos;
        const { rows: [result] } = await connection.query(
          `INSERT INTO gastos (id_salida, id_categoria, monto, descripcion, fecha_registro, id_dependientes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id_gastos`,
          [ID_salida, id_categoria || null, monto, descripcion || null, fecha_registro || null, id_dependientes || null]
        );
        ID_detalle = result.id_gastos;

      } else if (subtipo_modulo === "Imprevisto") {
        const { monto, causa, fecha_registro, id_categoria, id_dependientes } = datos;
        const { rows: [result] } = await connection.query(
          `INSERT INTO imprevistos (id_salida, id_categoria, monto, causa, fecha_registro, id_dependientes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id_imprevistos`,
          [ID_salida, id_categoria || null, monto, causa || null, fecha_registro || null, id_dependientes || null]
        );
        ID_detalle = result.id_imprevistos;

      } else if (subtipo_modulo === "Deuda") {
        const { monto, fuente, descripcion, cuotas_total, fecha_inicio, fecha_fin, id_categoria } = datos;
        const { rows: [result] } = await connection.query(
          `INSERT INTO deudas (id_salida, id_categoria, monto, fuente, descripcion, cuotas_total, fecha_inicio, fecha_fin)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id_deudas`,
          [ID_salida, id_categoria || null, monto, fuente || null, descripcion || null, cuotas_total || null, fecha_inicio || null, fecha_fin || null]
        );
        ID_detalle = result.id_deudas;
      }
    }

    // 3. Confirmar la transacción
    await connection.query("COMMIT");

    if (subtipo_modulo === "Ingreso") {
      await actualizarIngresoReal(ID_usuario);   // versión importada desde presupuestosController, sin connection → usa pool internamente
    } else if (subtipo_modulo === "Gasto") {
      await verificarUmbralGastos(ID_usuario);
    } else if (subtipo_modulo === "Imprevisto") {
      await verificarUmbralImprevistos(ID_usuario);
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Movimiento registrado exitosamente",
      ID_movimiento,
      ID_detalle,
    });

  } catch (error) {
    // Evita llamar a rollback si la conexión falló antes de iniciar la transacción
    if (connection) await connection.query("ROLLBACK");
    console.error("Error en crearMovimiento:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// <==&&==·········· INGRESOS ··········==&&==>

// ── GET Ingresos ───────────────────────────────────────────
const getIngresos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const { rows } = await pool.query(
      `SELECT i.id_ingresos AS id, i.monto AS monto, i.descripcion AS descripcion,
              i.fuente AS fuente, i.fecha_registro AS fecha, i.id_categoria,
              c.nombre AS categoria
       FROM ingresos i
       INNER JOIN entrada e     ON i.id_entrada    = e.id_entrada
       INNER JOIN movimientos m ON e.id_movimiento = m.id_movimiento
       LEFT  JOIN categorias c  ON i.id_categoria  = c.id_categoria
       WHERE m.id_usuario = $1
       ORDER BY i.fecha_registro DESC`,
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
    const result = await pool.query(
      `UPDATE ingresos    
          SET monto = $1, descripcion = $2, fuente = $3, fecha_registro = $4, id_categoria = $5
          WHERE id_ingresos = $6 AND id_entrada IN (SELECT id_entrada FROM entrada WHERE id_movimiento IN (SELECT id_movimiento FROM movimientos WHERE id_usuario = $7))`,
      [monto, descripcion, fuente, fecha_registro, id_categoria, id, ID_usuario]
    );
    if (result.rowCount === 0) {
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
  let connection;
  try {
    connection = await pool.connect();
    await connection.query("BEGIN");

    // 1. Buscar el id_entrada y id_movimiento antes de borrar
    const { rows: [ingreso] } = await connection.query(
      `SELECT e.id_entrada, e.id_movimiento
       FROM ingresos i
       INNER JOIN entrada e     ON i.id_entrada    = e.id_entrada
       INNER JOIN movimientos m ON e.id_movimiento = m.id_movimiento
       WHERE i.id_ingresos = $1 AND m.id_usuario = $2`,
      [id, ID_usuario]
    );

    if (!ingreso) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ ok: false, mensaje: "Ingreso no encontrado" });
    }

    // 2. Borrar en cascada
    await connection.query(`DELETE FROM ingresos    WHERE id_ingresos = $1`,  [id]);
    await connection.query(`DELETE FROM entrada     WHERE id_entrada = $1`,   [ingreso.id_entrada]);
    await connection.query(`DELETE FROM movimientos WHERE id_movimiento = $1`, [ingreso.id_movimiento]);

    await connection.query("COMMIT");
    res.status(200).json({ ok: true, mensaje: "Ingreso eliminado exitosamente" });
  } catch (error) {
    if (connection) await connection.query("ROLLBACK");
    console.error("Error en deleteIngresos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// <==&&==·········· AHORROS ··········==&&==>

// ── GET Ahorros ────────────────────────────────────────────
async function getAhorros(req, res) {
  const ID_usuario = req.usuario.id;
  try {
    const { rows } = await pool.query(
      `SELECT a.id_ahorros AS id, a.monto AS monto, a.monto_acumulado AS monto_acumulado,
              a.descripcion AS descripcion, a.meta AS meta,
              a.fecha_registro AS fecha, a.fecha_meta AS fecha_meta,
              a.id_categoria,
              c.nombre AS categoria
       FROM ahorros a
       INNER JOIN entrada e     ON a.id_entrada    = e.id_entrada
       INNER JOIN movimientos m ON e.id_movimiento = m.id_movimiento
       LEFT  JOIN categorias c  ON a.id_categoria  = c.id_categoria
       WHERE m.id_usuario = $1
       ORDER BY a.fecha_registro DESC`,
      [ID_usuario]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getAhorros:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
}

// ── UPDATE Ahorros ────────────────────────────────────────────
const updateAhorros = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;
  const { monto, monto_acumulado, descripcion, meta, fecha_registro, fecha_meta, id_categoria } = req.body;

  try {
    const result = await pool.query(
      `UPDATE ahorros
       SET monto = $1, monto_acumulado = $2, descripcion = $3, meta = $4, fecha_registro = $5, fecha_meta = $6, id_categoria = $7
       WHERE id_ahorros = $8 AND id_entrada IN (SELECT id_entrada FROM entrada WHERE id_movimiento IN (SELECT id_movimiento FROM movimientos WHERE id_usuario = $9))`,
      [monto, monto_acumulado, descripcion, meta, fecha_registro || null, fecha_meta || null, id_categoria || null, id, ID_usuario]
    );

    if (result.rowCount === 0) {
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
  let connection;
  try {
    connection = await pool.connect();
    await connection.query("BEGIN");

    // 1. Buscar el id_entrada y id_movimiento antes de borrar
    const { rows: [ahorro] } = await connection.query(
      `SELECT e.id_entrada, e.id_movimiento
       FROM ahorros a
       INNER JOIN entrada e     ON a.id_entrada    = e.id_entrada
       INNER JOIN movimientos m ON e.id_movimiento = m.id_movimiento
       WHERE a.id_ahorros = $1 AND m.id_usuario = $2`,
      [id, ID_usuario]
    );

    if (!ahorro) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ ok: false, mensaje: "Ahorro no encontrado" });
    }

    // 2. Borrar en cascada
    await connection.query(`DELETE FROM ahorros WHERE id_ahorros = $1`, [id]);
    await connection.query(`DELETE FROM entrada     WHERE id_entrada = $1`, [ahorro.id_entrada]);
    await connection.query(`DELETE FROM movimientos WHERE id_movimiento = $1`, [ahorro.id_movimiento]);

    await connection.query("COMMIT");
    res.status(200).json({ ok: true, mensaje: "Ahorro eliminado exitosamente" });
  } catch (error) {
    if (connection) await connection.query("ROLLBACK");
    console.error("Error en deleteAhorros:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// <==&&==·········· GASTOS ··········==&&==>

// ── GET Gastos ─────────────────────────────────────────────
const getGastos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const { rows } = await pool.query(
      `SELECT g.id_gastos AS id, 
        g.monto AS monto, 
        g.descripcion AS descripcion,
        g.fecha_registro AS fecha,
        g.id_categoria,    
        g.id_dependientes,  
        c.nombre AS categoria,
        d.nombre AS dependiente

       FROM gastos g
       INNER JOIN salida s       ON g.id_salida      = s.id_salida
       INNER JOIN movimientos m  ON s.id_movimiento  = m.id_movimiento
       LEFT  JOIN categorias c   ON g.id_categoria   = c.id_categoria
       LEFT  JOIN dependientes d ON g.id_dependientes = d.id_dependientes
       WHERE m.id_usuario = $1
       ORDER BY g.fecha_registro DESC`,
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
  const { monto, descripcion, fecha_registro, id_categoria, id_dependientes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE gastos    
          SET monto = $1, descripcion = $2, fecha_registro = $3, id_categoria = $4, id_dependientes = $5
          WHERE id_gastos = $6 AND id_salida IN (SELECT id_salida FROM salida WHERE id_movimiento IN (SELECT id_movimiento FROM movimientos WHERE id_usuario = $7))`,
      [monto, descripcion, fecha_registro, id_categoria, id_dependientes, id, ID_usuario]
    );
    if (result.rowCount === 0) {
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
  let connection;
  try {
    connection = await pool.connect();
    await connection.query("BEGIN");
    // 1. Buscar el id_salida y id_movimiento antes de borrar
    const { rows: [gasto] } = await connection.query(
      `SELECT s.id_salida, s.id_movimiento
         FROM gastos g
            INNER JOIN salida s       ON g.id_salida      = s.id_salida
            INNER JOIN movimientos m  ON s.id_movimiento  = m.id_movimiento
         WHERE g.id_gastos = $1 AND m.id_usuario = $2`,
      [id, ID_usuario]
    );
    if (!gasto) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ ok: false, mensaje: "Gasto no encontrado" });
    }
    // 2. Borrar en cascada
    await connection.query(`DELETE FROM gastos WHERE id_gastos = $1`, [id]);
    await connection.query(`DELETE FROM salida     WHERE id_salida = $1`, [gasto.id_salida]);
    await connection.query(`DELETE FROM movimientos WHERE id_movimiento = $1`, [gasto.id_movimiento]);
    await connection.query("COMMIT");
    res.status(200).json({ ok: true, mensaje: "Gasto eliminado exitosamente" });
  } catch (error) {
    if (connection) await connection.query("ROLLBACK");
    console.error("Error en deleteGastos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// <==&&==·········· IMPREVISTOS ··········==&&==>

// ── GET Imprevistos ────────────────────────────────────────
const getImprevistos = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const { rows } = await pool.query(
      `SELECT i.id_imprevistos AS id, i.monto AS monto, i.causa AS causa,
              i.fecha_registro AS fecha,
              i.id_categoria,    
              i.id_dependientes, 
              c.nombre AS categoria,
              d.nombre AS dependiente
       FROM imprevistos i
       INNER JOIN salida s       ON i.id_salida      = s.id_salida
       INNER JOIN movimientos m  ON s.id_movimiento  = m.id_movimiento
       LEFT  JOIN categorias c   ON i.id_categoria   = c.id_categoria
       LEFT  JOIN dependientes d ON i.id_dependientes = d.id_dependientes
       WHERE m.id_usuario = $1
       ORDER BY i.fecha_registro DESC`,
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
  const { monto, causa, fecha_registro, id_categoria, id_dependientes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE imprevistos i
       SET monto = $1, 
           causa = $2, 
           fecha_registro = $3, 
           id_categoria = $4, 
           id_dependientes = $5
       FROM salida s, movimientos m
       WHERE i.id_salida = s.id_salida
         AND s.id_movimiento = m.id_movimiento
         AND i.id_imprevistos = $6
         AND m.id_usuario = $7`,
      [
        monto, 
        causa || null, 
        fecha_registro || null, 
        id_categoria || null, 
        id_dependientes || null, 
        id, 
        ID_usuario
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, mensaje: "Imprevisto no encontrado o sin permisos" });
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
  let connection;
  try {
    connection = await pool.connect();
    await connection.query("BEGIN");
    // 1. Buscar el id_salida y id_movimiento antes de borrar
    const { rows: [imprevisto] } = await connection.query(
        `SELECT s.id_salida, s.id_movimiento
            FROM imprevistos i
            INNER JOIN salida s       ON i.id_salida      = s.id_salida
            INNER JOIN movimientos m  ON s.id_movimiento  = m.id_movimiento
            WHERE i.id_imprevistos = $1 AND m.id_usuario = $2`,
        [id, ID_usuario]
    );
    if (!imprevisto) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ ok: false, mensaje: "Imprevisto no encontrado" });
    }
    // 2. Borrar en cascada
    await connection.query(`DELETE FROM imprevistos WHERE id_imprevistos = $1`, [id]);
    await connection.query(`DELETE FROM salida     WHERE id_salida = $1`, [imprevisto.id_salida]);
    await connection.query(`DELETE FROM movimientos WHERE id_movimiento = $1`, [imprevisto.id_movimiento]);
    await connection.query("COMMIT");
    res.status(200).json({ ok: true, mensaje: "Imprevisto eliminado exitosamente" });
  } catch (error) {
    if (connection) await connection.query("ROLLBACK");
    console.error("Error en deleteImprevistos:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// <==&&==·········· DEUDAS ··········==&&==>
// ── GET Deudas ─────────────────────────────────────────────
const getDeudas = async (req, res) => {
  const ID_usuario = req.usuario.id;
  try {
    const { rows } = await pool.query(
      `SELECT 
              d.id_deudas AS id, 
              d.monto AS monto, 
              d.fuente AS fuente,
              d.descripcion AS descripcion, 
              d.cuotas_total AS cuotas_total,
              d.cuotas_pagadas AS cuotas_pagadas, 
              d.fecha_inicio AS fecha_inicio,
              d.fecha_fin AS fecha_fin, 
              d.estado AS estado,
              d.id_categoria,
              c.nombre AS categoria
       FROM deudas d
       INNER JOIN salida s      ON d.id_salida     = s.id_salida
       INNER JOIN movimientos m ON s.id_movimiento = m.id_movimiento
       LEFT  JOIN categorias c  ON d.id_categoria  = c.id_categoria
       WHERE m.id_usuario = $1
       ORDER BY d.fecha_inicio DESC`,
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
  try {
    const result = await pool.query(
      `UPDATE deudas    
          SET monto = $1, fuente = $2, descripcion = $3, cuotas_total = $4, cuotas_pagadas = $5, fecha_inicio = $6, fecha_fin = $7, estado = $8, id_categoria = $9
          WHERE id_deudas = $10 AND id_salida IN (SELECT id_salida FROM salida WHERE id_movimiento IN (SELECT id_movimiento FROM movimientos WHERE id_usuario = $11))`,
      [monto, fuente, descripcion, cuotas_total, cuotas_pagadas, fecha_inicio, fecha_fin, estado, id_categoria, id, ID_usuario]
    );
    if (result.rowCount === 0) {
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
  let connection;
  try {
    connection = await pool.connect();
    await connection.query("BEGIN");
    // 1. Buscar el id_salida y id_movimiento antes de borrar
    const { rows: [deuda] } = await connection.query(
        `SELECT s.id_salida, s.id_movimiento
            FROM deudas d
            INNER JOIN salida s      ON d.id_salida     = s.id_salida
            INNER JOIN movimientos m ON s.id_movimiento = m.id_movimiento
            WHERE d.id_deudas = $1 AND m.id_usuario = $2`,
        [id, ID_usuario]
    );
    if (!deuda) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ ok: false, mensaje: "Deuda no encontrada" });
    }
    // 2. Borrar en cascada
    await connection.query(`DELETE FROM deudas WHERE id_deudas = $1`, [id]);
    await connection.query(`DELETE FROM salida     WHERE id_salida = $1`, [deuda.id_salida]);
    await connection.query(`DELETE FROM movimientos WHERE id_movimiento = $1`, [deuda.id_movimiento]);
    await connection.query("COMMIT");
    res.status(200).json({ ok: true, mensaje: "Deuda eliminada exitosamente" });
  } catch (error) {
    if (connection) await connection.query("ROLLBACK");
    console.error("Error en deleteDeudas:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// ─────────────────────────────────────────────────────────────
//  HELPER: actualiza Ingreso_real del período activo
//  Se llama internamente tras registrar un ingreso nuevo
// ─────────────────────────────────────────────────────────────
// const actualizarIngresoReal = async (ID_usuario) => {
//   const { rows: periodo } = await pool.query(
//     `SELECT id_periodo, fecha_inicio, fecha_fin
//      FROM   periodos_presupuesto
//      WHERE  id_usuario = $1 AND estado = 'abierto'
//      LIMIT  1`,
//     [ID_usuario]
//   );
//   if (!periodo.length) return;

//   const { id_periodo: ID_periodo, fecha_inicio: Fecha_inicio, fecha_fin: Fecha_fin } = periodo[0];

//   const { rows: [{ total }] } = await pool.query(
//     `SELECT COALESCE(SUM(i.monto), 0)::float AS total
//      FROM   ingresos i
//      JOIN   entrada e     ON i.id_entrada    = e.id_entrada
//      JOIN   movimientos m ON e.id_movimiento = m.id_movimiento
//      WHERE  m.id_usuario     = $1
//        AND  i.fecha_registro BETWEEN $2 AND $3`,
//     [ID_usuario, Fecha_inicio, Fecha_fin]
//   );

//   await pool.query(
//     `UPDATE periodos_presupuesto SET ingreso_real = $1 WHERE id_periodo = $2`,
//     [total, ID_periodo]
//   );
// };

// ─────────────────────────────────────────────────────────────
//  PATCH /movimientos/deudas/:id/abonar
// ─────────────────────────────────────────────────────────────
const abonarDeuda = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id }     = req.params;
  const cuotas     = parseInt(req.body.cuotas) || 1;

  if (cuotas < 1)
    return res.status(400).json({ ok: false, mensaje: "El número de cuotas debe ser >= 1" });

  try {
    const { rows: [deuda] } = await pool.query(
      `SELECT d.id_deudas, d.cuotas_total, d.cuotas_pagadas, d.estado
       FROM   deudas d
       JOIN   salida s      ON d.id_salida     = s.id_salida
       JOIN   movimientos m ON s.id_movimiento = m.id_movimiento
       WHERE  d.id_deudas = $1 AND m.id_usuario = $2`,
      [id, ID_usuario]
    );

    if (!deuda)
      return res.status(404).json({ ok: false, mensaje: "Deuda no encontrada" });
    if (deuda.estado === "pagada")
      return res.status(409).json({ ok: false, mensaje: "Esta deuda ya está pagada" });

    const nuevasCuotas = deuda.cuotas_pagadas + cuotas;

    if (deuda.cuotas_total !== null && nuevasCuotas > deuda.cuotas_total)
      return res.status(400).json({
        ok: false,
        mensaje: `Quedan ${deuda.cuotas_total - deuda.cuotas_pagadas} cuota(s) por pagar.`
      });

    const nuevoEstado = deuda.cuotas_total !== null && nuevasCuotas >= deuda.cuotas_total
      ? "pagada" : "pendiente";

    await pool.query(
      `UPDATE deudas SET cuotas_pagadas = $1, estado = $2 WHERE id_deudas = $3`,
      [nuevasCuotas, nuevoEstado, id]
    );

    res.status(200).json({
      ok: true,
      mensaje: nuevoEstado === "pagada" ? "Deuda pagada completamente" : "Cuota registrada",
      cuotas_pagadas: nuevasCuotas,
      cuotas_total:   deuda.cuotas_total,
      estado:         nuevoEstado,
    });
  } catch (error) {
    console.error("Error en abonarDeuda:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};
// ─────────────────────────────────────────────────────────────
//  PATCH /movimientos/ahorros/:id/abonar
// ─────────────────────────────────────────────────────────────
const abonarAhorro = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id }     = req.params;
  const monto      = parseFloat(req.body.monto);

  if (!monto || monto <= 0)
    return res.status(400).json({ ok: false, mensaje: "El monto del abono debe ser mayor a 0" });

  let connection;
  try {
    connection = await pool.connect();
    await connection.query("BEGIN");

    const { rows: [ahorro] } = await connection.query(
      `SELECT a.id_ahorros, a.monto AS meta_monto, a.meta AS meta_nombre
       FROM   ahorros a
       JOIN   entrada e     ON a.id_entrada    = e.id_entrada
       JOIN   movimientos m ON e.id_movimiento = m.id_movimiento
       WHERE  a.id_ahorros = $1 AND m.id_usuario = $2`,
      [id, ID_usuario]
    );

    if (!ahorro) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ ok: false, mensaje: "Ahorro no encontrado" });
    }

    await connection.query(
      `INSERT INTO abonos_ahorro (id_ahorros, id_usuario, monto, fecha_registro)
       VALUES ($1, $2, $3, CURRENT_DATE)`,
      [id, ID_usuario, monto]
    );

    const { rows: [{ total }] } = await connection.query(
      `SELECT COALESCE(SUM(monto), 0)::float AS total
       FROM abonos_ahorro
       WHERE id_ahorros = $1`,
      [id]
    );

    const nuevoAcumulado = Math.min(Number(total), Number(ahorro.meta_monto));
    const metaAlcanzada  = nuevoAcumulado >= Number(ahorro.meta_monto);

    await connection.query(
      `UPDATE ahorros SET monto_acumulado = $1 WHERE id_ahorros = $2`,
      [nuevoAcumulado, id]
    );

    await connection.query("COMMIT");

    await verificarMetaAhorroAlcanzada(ID_usuario, ahorro, nuevoAcumulado);

    res.status(200).json({
      ok:              true,
      mensaje:         metaAlcanzada ? "Meta de ahorro alcanzada" : "Abono registrado",
      monto_acumulado: nuevoAcumulado,
      meta_monto:      ahorro.meta_monto,
      progreso:        parseFloat(((nuevoAcumulado / ahorro.meta_monto) * 100).toFixed(2)),
      meta_alcanzada:  metaAlcanzada,
    });
  } catch (error) {
    if (connection) await connection.query("ROLLBACK");
    console.error("Error en abonarAhorro:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};
module.exports = { crearMovimiento, getIngresos, getAhorros, getGastos, getImprevistos, getDeudas, updateAhorros, updateDeudas, updateGastos, updateImprevistos, updateIngresos, deleteIngresos, deleteAhorros, deleteGastos, deleteImprevistos, deleteDeudas, getMovimientos, abonarDeuda, abonarAhorro };