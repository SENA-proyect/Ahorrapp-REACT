const pool = require("../db/connection");

const getCategorias = async (req, res) => {
  try {
    const ID_usuario = req.usuario.id;

    const [rows] = await pool.query(
      `SELECT ID_categoria AS id, Nombre AS nombre, Descripcion AS descripcion,
              Color AS color, ES_global AS sistema, Activo AS activa
       FROM CATEGORIAS
       WHERE ES_global = TRUE OR ID_usuario = ?`,
      [ID_usuario]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getCategorias:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const ID_usuario = req.usuario.id;
    const { nombre, descripcion } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "El nombre es obligatorio" });
    }

    const [result] = await pool.query(
      `INSERT INTO CATEGORIAS (ID_usuario, Nombre, Descripcion, ES_global)
       VALUES (?, ?, ?, FALSE)`,
      [ID_usuario, nombre.trim(), descripcion?.trim() || null]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error("Error en crearCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const editarCategoria = async (req, res) => {
  try {
    const ID_usuario = req.usuario.id;
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "El nombre es obligatorio" });
    }

    // Solo puede editar sus propias categorías, no las del sistema
    const [rows] = await pool.query(
      `SELECT ID_categoria FROM CATEGORIAS
       WHERE ID_categoria = ? AND ID_usuario = ? AND ES_global = FALSE`,
      [id, ID_usuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para editar esta categoría" });
    }

    await pool.query(
      `UPDATE CATEGORIAS SET Nombre = ?, Descripcion = ? WHERE ID_categoria = ?`,
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoría actualizada" });
  } catch (error) {
    console.error("Error en editarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const deshabilitarCategoria = async (req, res) => {
  try {
    const ID_usuario = req.usuario.id;
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT ID_categoria FROM CATEGORIAS
       WHERE ID_categoria = ? AND ID_usuario = ? AND ES_global = FALSE`,
      [id, ID_usuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para deshabilitar esta categoría" });
    }

    await pool.query(
      `UPDATE CATEGORIAS SET Activo = FALSE WHERE ID_categoria = ?`,
      [id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoría deshabilitada" });
  } catch (error) {
    console.error("Error en deshabilitarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const habilitarCategoria = async (req, res) => {
  try {
    const ID_usuario = req.usuario.id;
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT ID_categoria FROM CATEGORIAS
       WHERE ID_categoria = ? AND ID_usuario = ? AND ES_global = FALSE`,
      [id, ID_usuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para habilitar esta categoría" });
    }

    await pool.query(
      `UPDATE CATEGORIAS SET Activo = TRUE WHERE ID_categoria = ?`,
      [id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoría habilitada" });
  } catch (error) {
    console.error("Error en habilitarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  getCategorias,
  crearCategoria,
  editarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
};