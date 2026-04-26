const pool = require("../db/connection");

// ── GET todas las categorias (sistema + las del usuario) ────────────────────
const getCategorias = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [rows] = await pool.query(
      "SELECT ID_categoria AS id, ID_usuario AS id_usuario, Nombre AS nombre, Descripcion AS descripcion, Color AS color, Icono AS icono, Activa AS activa, Sistema AS sistema, ES_global AS es_global FROM CATEGORIAS WHERE ES_global = TRUE OR ID_usuario = ? ORDER BY ES_global DESC, Nombre ASC",
      [id_usuario]
    );

    return res.status(200).json({ ok: true, categorias: rows });

  } catch (error) {
    console.error("Error en getCategorias:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── POST crear categoria nueva ───────────────────────────────────────────────
const crearCategoria = async (req, res) => {

  const id_usuario = req.usuario.id;

  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) {
    return res.status(400).json({ ok: false, mensaje: "El nombre es obligatorio" });
  }

  try {

    const [result] = await pool.query(
      `INSERT INTO CATEGORIAS (ID_usuario, Nombre, Descripcion, Activa, Sistema, ES_global)
       VALUES (?, ?, ?, TRUE, FALSE, FALSE)`,
      [id_usuario, nombre.trim(), descripcion?.trim() || null]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Categoria creada exitosamente",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Error en crearCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── PUT actualizar nombre y descripcion ─────────────────────────────────────
const actualizarCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ ok: false, mensaje: "El nombre es obligatorio" });
  }

  try {

    const [rows] = await pool.query(
      `SELECT ID_categoria FROM CATEGORIAS
       WHERE ID_categoria = ? AND ID_usuario = ? AND ES_global = FALSE`,
      [id, id_usuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para editar esta categoria" });
    }

    await pool.query(
      `UPDATE CATEGORIAS SET Nombre = ?, Descripcion = ? WHERE ID_categoria = ?`,
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoria actualizada exitosamente" });

  } catch (error) {
    console.error("Error en actualizarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── PATCH deshabilitar categoria ────────────────────────────────────────────
const deshabilitarCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;
  const { id } = req.params;

  try {

    const [rows] = await pool.query(
      `SELECT ID_categoria FROM CATEGORIAS
       WHERE ID_categoria = ? AND ID_usuario = ? AND ES_global = FALSE`,
      [id, id_usuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para deshabilitar esta categoria" });
    }

    await pool.query(
      `UPDATE CATEGORIAS SET Activa = FALSE WHERE ID_categoria = ?`,
      [id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoria deshabilitada" });

  } catch (error) {
    console.error("Error en deshabilitarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── PATCH habilitar categoria ───────────────────────────────────────────────
const habilitarCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;
  const { id } = req.params;

  try {

    const [rows] = await pool.query(
      `SELECT ID_categoria FROM CATEGORIAS
       WHERE ID_categoria = ? AND ID_usuario = ? AND ES_global = FALSE`,
      [id, id_usuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para habilitar esta categoria" });
    }


    await pool.query(
      `UPDATE CATEGORIAS SET Activa = TRUE WHERE ID_categoria = ?`,
      [id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoria habilitada" });

  } catch (error) {
    console.error("Error en habilitarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};


module.exports = {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
};