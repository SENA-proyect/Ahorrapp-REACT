
const pool = require("../db/connection");

// Obtener el fondo de emergencia del usuario
const getFondoEmergencia = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows: [fondo] } = await pool.query(
      `
      SELECT
        fe.id_fondo,
        fe.id_usuario,
        fe.meta,
        fe.fecha_creacion,
        fe.fecha_actualizacion,
        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'aporte' THEN mfe.monto
              WHEN mfe.tipo = 'retiro' THEN -mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS saldo_actual
      FROM fondos_emergencia fe
      LEFT JOIN movimientos_fondo_emergencia mfe
        ON fe.id_fondo = mfe.id_fondo
      WHERE fe.id_usuario = $1
      GROUP BY
        fe.id_fondo,
        fe.id_usuario,
        fe.meta,
        fe.fecha_creacion,
        fe.fecha_actualizacion
      `,
      [ID_usuario]
    );

    if (!fondo) {
      return res.status(404).json({
        ok: false,
        mensaje: "El usuario no tiene un fondo de emergencia configurado"
      });
    }

    return res.status(200).json({
      ok: true,
      datos: fondo
    });

  } catch (error) {
    console.error("Error obteniendo fondo de emergencia:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


// Crear el fondo de emergencia
const crearFondoEmergencia = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const meta = Number(req.body.meta) || 0;

  if (meta < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "La meta no puede ser negativa"
    });
  }

  try {
    const { rows: [fondo] } = await pool.query(
      `
      INSERT INTO fondos_emergencia
        (id_usuario, meta)
      VALUES
        ($1, $2)
      RETURNING
        id_fondo,
        id_usuario,
        meta,
        fecha_creacion,
        fecha_actualizacion
      `,
      [ID_usuario, meta]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Fondo de emergencia creado correctamente",
      datos: fondo
    });

  } catch (error) {
    // La restricción UNIQUE de id_usuario evita tener más de un fondo
    // por usuario.
    if (error.code === "23505") {
      return res.status(409).json({
        ok: false,
        mensaje: "El usuario ya tiene un fondo de emergencia"
      });
    }

    console.error("Error creando fondo de emergencia:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


// Actualizar la meta del fondo
const actualizarMetaFondoEmergencia = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const meta = Number(req.body.meta);

  if (Number.isNaN(meta) || meta < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "La meta debe ser un número mayor o igual a 0"
    });
  }

  try {
    const { rows: [fondo] } = await pool.query(
      `
      UPDATE fondos_emergencia
      SET
        meta = $1,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_usuario = $2
      RETURNING
        id_fondo,
        id_usuario,
        meta,
        fecha_creacion,
        fecha_actualizacion
      `,
      [meta, ID_usuario]
    );

    if (!fondo) {
      return res.status(404).json({
        ok: false,
        mensaje: "El usuario no tiene un fondo de emergencia configurado"
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Meta actualizada correctamente",
      datos: fondo
    });

  } catch (error) {
    console.error("Error actualizando meta del fondo:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


// Registrar un aporte al fondo
const registrarAporte = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const monto = Number(req.body.monto);
  const descripcion = req.body.descripcion || null;

  if (Number.isNaN(monto) || monto <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "El monto del aporte debe ser mayor a 0"
    });
  }

  let connection;

  try {
    connection = await pool.connect();

    await connection.query("BEGIN");

    const { rows: [fondo] } = await connection.query(
      `
      SELECT
        id_fondo,
        meta
      FROM fondos_emergencia
      WHERE id_usuario = $1
      FOR UPDATE
      `,
      [ID_usuario]
    );

    if (!fondo) {
      await connection.query("ROLLBACK");

      return res.status(404).json({
        ok: false,
        mensaje: "El usuario no tiene un fondo de emergencia configurado"
      });
    }

    const { rows: [movimiento] } = await connection.query(
      `
      INSERT INTO movimientos_fondo_emergencia
        (id_fondo, tipo, monto, descripcion)
      VALUES
        ($1, 'aporte', $2, $3)
      RETURNING
        id_movimiento_fondo,
        id_fondo,
        tipo,
        monto,
        fecha_registro,
        descripcion
      `,
      [fondo.id_fondo, monto, descripcion]
    );

    await connection.query(
      `
      UPDATE fondos_emergencia
      SET fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_fondo = $1
      `,
      [fondo.id_fondo]
    );

    await connection.query("COMMIT");

    return res.status(201).json({
      ok: true,
      mensaje: "Aporte registrado correctamente",
      datos: movimiento
    });

  } catch (error) {
    if (connection) {
      await connection.query("ROLLBACK");
    }

    console.error("Error registrando aporte:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};


// Registrar un retiro del fondo
const registrarRetiro = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const monto = Number(req.body.monto);
  const descripcion = req.body.descripcion || null;

  if (Number.isNaN(monto) || monto <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "El monto del retiro debe ser mayor a 0"
    });
  }

  let connection;

  try {
    connection = await pool.connect();

    await connection.query("BEGIN");

    const { rows: [fondo] } = await connection.query(
      `
      SELECT
        fe.id_fondo,
        COALESCE(
          SUM(
            CASE
              WHEN mfe.tipo = 'aporte' THEN mfe.monto
              WHEN mfe.tipo = 'retiro' THEN -mfe.monto
              ELSE 0
            END
          ),
          0
        ) AS saldo_actual
      FROM fondos_emergencia fe
      LEFT JOIN movimientos_fondo_emergencia mfe
        ON fe.id_fondo = mfe.id_fondo
      WHERE fe.id_usuario = $1
      GROUP BY fe.id_fondo
      FOR UPDATE
      `,
      [ID_usuario]
    );

    if (!fondo) {
      await connection.query("ROLLBACK");

      return res.status(404).json({
        ok: false,
        mensaje: "El usuario no tiene un fondo de emergencia configurado"
      });
    }

    const saldoActual = Number(fondo.saldo_actual);

    if (monto > saldoActual) {
      await connection.query("ROLLBACK");

      return res.status(400).json({
        ok: false,
        mensaje: "El retiro no puede ser mayor al saldo disponible"
      });
    }

    const { rows: [movimiento] } = await connection.query(
      `
      INSERT INTO movimientos_fondo_emergencia
        (id_fondo, tipo, monto, descripcion)
      VALUES
        ($1, 'retiro', $2, $3)
      RETURNING
        id_movimiento_fondo,
        id_fondo,
        tipo,
        monto,
        fecha_registro,
        descripcion
      `,
      [fondo.id_fondo, monto, descripcion]
    );

    await connection.query(
      `
      UPDATE fondos_emergencia
      SET fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_fondo = $1
      `,
      [fondo.id_fondo]
    );

    await connection.query("COMMIT");

    return res.status(201).json({
      ok: true,
      mensaje: "Retiro registrado correctamente",
      datos: movimiento
    });

  } catch (error) {
    if (connection) {
      await connection.query("ROLLBACK");
    }

    console.error("Error registrando retiro:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};


// Obtener historial de movimientos del fondo
const getMovimientosFondoEmergencia = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        mfe.id_movimiento_fondo,
        mfe.id_fondo,
        mfe.tipo,
        mfe.monto,
        mfe.fecha_registro,
        mfe.descripcion
      FROM movimientos_fondo_emergencia mfe
      INNER JOIN fondos_emergencia fe
        ON mfe.id_fondo = fe.id_fondo
      WHERE fe.id_usuario = $1
      ORDER BY mfe.fecha_registro DESC, mfe.id_movimiento_fondo DESC
      `,
      [ID_usuario]
    );

    return res.status(200).json({
      ok: true,
      datos: rows
    });

  } catch (error) {
    console.error("Error obteniendo movimientos del fondo:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


module.exports = {
  getFondoEmergencia,
  crearFondoEmergencia,
  actualizarMetaFondoEmergencia,
  registrarAporte,
  registrarRetiro,
  getMovimientosFondoEmergencia
};

