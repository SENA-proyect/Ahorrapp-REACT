const pool = require("../db/connection");

const getConfiguracion = async (req, res) => {
  const { id } = req.usuario; // ID del usuario autenticado
  
  try {
    // 1. Obtener datos básicos del usuario
    const [userRows] = await pool.query(
      "SELECT Nombre, Apellido, Email, foto_perfil FROM USUARIOS WHERE ID_usuario = ?",
      [id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }
    const usuario = userRows[0];

    // 2. Obtener la configuración
    const [configRows] = await pool.query(
      "SELECT * FROM CONFIGURACIONES WHERE ID_usuario = ?",
      [id]
    );

    let configuracion;
    if (configRows.length === 0) {
      // Si no existe, crear una configuración por defecto
      await pool.query(
        "INSERT INTO CONFIGURACIONES (ID_usuario) VALUES (?)",
        [id]
      );
      const [newConfig] = await pool.query(
        "SELECT * FROM CONFIGURACIONES WHERE ID_usuario = ?",
        [id]
      );
      configuracion = newConfig[0];
    } else {
      configuracion = configRows[0];
    }

    // Convertir booleanos de MySQL (1/0) a true/false
    const parseBool = (val) => val === 1;

    return res.status(200).json({
      ok: true,
      datos: {
        nombre: usuario.Nombre,
        apellido: usuario.Apellido || '',
        email: usuario.Email,
        fotoUrl: usuario.foto_perfil || null,
        idioma: configuracion.idioma,
        formatoFecha: configuracion.formatoFecha,
        alertasActivas: parseBool(configuracion.alertasActivas),
        moneda: configuracion.moneda,
        presupuestoMensual: configuracion.presupuestoMensual,
        alertaGastos: parseBool(configuracion.alertaGastos),
        recordatorioPresupuesto: parseBool(configuracion.recordatorioPresupuesto),
        notificacionMetas: parseBool(configuracion.notificacionMetas),
        correoResumen: parseBool(configuracion.correoResumen),
      }
    });

  } catch (error) {
    console.error("Error al obtener configuracion:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const updateConfiguracion = async (req, res) => {
  const { id } = req.usuario;
  const {
    nombre, apellido, email,
    idioma, formatoFecha, alertasActivas,
    moneda, presupuestoMensual,
    alertaGastos, recordatorioPresupuesto, notificacionMetas, correoResumen
  } = req.body;

  try {
    // 1. Iniciar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 2. Actualizar datos en la tabla USUARIOS
      if (nombre || apellido || email) {
        // Opcional: Validar que el email no exista en otro usuario
        if (email) {
            const [emailCheck] = await connection.query(
                "SELECT ID_usuario FROM USUARIOS WHERE Email = ? AND ID_usuario != ?",
                [email, id]
            );
            if (emailCheck.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ ok: false, mensaje: "El correo ya está en uso por otra cuenta." });
            }
        }

        await connection.query(
          "UPDATE USUARIOS SET Nombre = COALESCE(?, Nombre), Apellido = COALESCE(?, Apellido), Email = COALESCE(?, Email) WHERE ID_usuario = ?",
          [nombre, apellido, email, id]
        );
      }

      // 3. Asegurarse de que exista la configuración
      const [configCheck] = await connection.query("SELECT ID_configuracion FROM CONFIGURACIONES WHERE ID_usuario = ?", [id]);
      if (configCheck.length === 0) {
          await connection.query("INSERT INTO CONFIGURACIONES (ID_usuario) VALUES (?)", [id]);
      }

      // 4. Actualizar tabla CONFIGURACIONES
      await connection.query(
        `UPDATE CONFIGURACIONES SET 
          idioma = COALESCE(?, idioma),
          formatoFecha = COALESCE(?, formatoFecha),
          alertasActivas = COALESCE(?, alertasActivas),
          moneda = COALESCE(?, moneda),
          presupuestoMensual = COALESCE(?, presupuestoMensual),
          alertaGastos = COALESCE(?, alertaGastos),
          recordatorioPresupuesto = COALESCE(?, recordatorioPresupuesto),
          notificacionMetas = COALESCE(?, notificacionMetas),
          correoResumen = COALESCE(?, correoResumen)
         WHERE ID_usuario = ?`,
        [
          idioma, formatoFecha, alertasActivas, 
          moneda, presupuestoMensual, 
          alertaGastos, recordatorioPresupuesto, notificacionMetas, correoResumen,
          id
        ]
      );

      await connection.commit();
      connection.release();

      return res.status(200).json({ ok: true, mensaje: "Configuración actualizada correctamente" });

    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }

  } catch (error) {
    console.error("Error al actualizar configuracion:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const uploadPhoto = async (req, res) => {
  const { id } = req.usuario;
  
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: "No se seleccionó ningún archivo" });
    }

    // Validar tipo de archivo
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ ok: false, mensaje: "Tipo de archivo no permitido. Solo se aceptan imágenes." });
    }

    // Guardar información de la foto en la base de datos
    // Asumiendo que existe una tabla para guardar fotos de usuario
    const fotoUrl = `/uploads/${req.file.filename}`;
    
    // Actualizar la foto del usuario en la tabla USUARIOS
    await pool.query(
      "UPDATE USUARIOS SET foto_perfil = ? WHERE ID_usuario = ?",
      [fotoUrl, id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Foto de perfil actualizada correctamente",
      fotoUrl: fotoUrl
    });

  } catch (error) {
    console.error("Error al subir foto:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error al subir la foto" });
  }
};

module.exports = {
  getConfiguracion,
  updateConfiguracion,
  uploadPhoto
};
