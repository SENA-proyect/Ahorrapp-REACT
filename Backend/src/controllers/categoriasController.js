const pool = require("../db/connection");

// ── GET todas las categorías (sistema + las del usuario) ────────────────────
const getCategorias = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM categorias 
       WHERE sistema = true OR id_usuario = ?
       ORDER BY sistema DESC, nombre ASC`,
      [id_usuario]
    );

    return res.status(200).json({ ok: true, categorias: rows });

  } catch (error) {
    console.error("Error en getCategorias:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── POST crear categoría nueva ───────────────────────────────────────────────
const crearCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res.status(400).json({ ok: false, mensaje: "El nombre es obligatorio" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO categorias (nombre, descripcion, activa, sistema, id_usuario) 
       VALUES (?, ?, true, false, ?)`,
      [nombre, descripcion || null, id_usuario]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Categoría creada exitosamente",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Error en crearCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── PUT actualizar nombre y descripción ─────────────────────────────────────
const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res.status(400).json({ ok: false, mensaje: "El nombre es obligatorio" });
  }

  try {
    await pool.query(
      `UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?`,
      [nombre, descripcion || null, id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoría actualizada exitosamente" });

  } catch (error) {
    console.error("Error en actualizarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── PATCH deshabilitar categoría ────────────────────────────────────────────
const deshabilitarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE categorias SET activa = false WHERE id = ?`,
      [id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoría deshabilitada" });

  } catch (error) {
    console.error("Error en deshabilitarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── PATCH habilitar categoría ───────────────────────────────────────────────
const habilitarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE categorias SET activa = true WHERE id = ?`,
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
  actualizarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
};
