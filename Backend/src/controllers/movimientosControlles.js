const pool = require("../db/connection");

const crearMovimiento = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const ID_usuario = req.usuario.id;
    const { tipo_flujo, subtipo_modulo, datos } = req.body;

    // Validar coherencia entre tipo_flujo y subtipo_modulo
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

module.exports = { crearMovimiento };