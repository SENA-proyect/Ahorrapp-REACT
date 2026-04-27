const pool = require('../db/connection');

// ── GET: Obtener dependientes del usuario autenticado ──────
const getDependientes = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const [results] = await pool.query(
      `SELECT 
        ID_dependientes,
        Nombre,
        Relacion,
        Ocupacion,
        Fecha_nacimiento,
        Peso_economico
      FROM DEPENDIENTES
      WHERE ID_usuario = ?`,
      [ID_usuario]
    );
    res.json(results);
  } catch (err) {
    console.error('Error al obtener dependientes:', err);
    res.status(500).json({ error: 'Error al obtener dependientes' });
  }
};

// ── POST: Agregar un dependiente ───────────────────────────
const addDependiente = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { Nombre, Relacion, Ocupacion, Fecha_nacimiento, Peso_economico } = req.body;

  if (!Nombre || !Relacion) {
    return res.status(400).json({ error: 'Nombre y Relación son requeridos' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO dependientes (ID_usuario, Nombre, Relacion, Ocupacion, Fecha_nacimiento, Peso_economico)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ID_usuario, Nombre, Relacion, Ocupacion || null, Fecha_nacimiento, Peso_economico || null]
    );
    res.status(201).json({ message: 'Dependiente agregado', id: result.insertId });
  } catch (err) {
    console.error('Error al agregar dependiente:', err);
    res.status(500).json({ error: 'Error al agregar dependiente' });
  }
};

// ── PUT: Editar un dependiente ─────────────────────────────
const updateDependiente = async (req, res) => {
  const { id } = req.params;
  const ID_usuario = req.usuario.id;
  const { Nombre, Relacion, Ocupacion, Fecha_nacimiento, Peso_economico } = req.body;

  if (!Nombre || !Relacion) {
    return res.status(400).json({ error: 'Nombre y Relación son requeridos' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE dependientes 
       SET Nombre = ?, Relacion = ?, Ocupacion = ?, Fecha_nacimiento = ?, Peso_economico = ?
       WHERE ID_dependientes = ? AND ID_usuario = ?`,
      [Nombre, Relacion, Ocupacion || null, Fecha_nacimiento, Peso_economico || null, id, ID_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dependiente no encontrado' });
    }
    res.json({ message: 'Dependiente actualizado' });
  } catch (err) {
    console.error('Error al actualizar dependiente:', err);
    res.status(500).json({ error: 'Error al actualizar dependiente' });
  }
};

// ── DELETE: Eliminar un dependiente ───────────────────────
const deleteDependiente = async (req, res) => {
  const { id } = req.params;
  const ID_usuario = req.usuario.id;

  try {
    const [result] = await pool.query(
      'DELETE FROM dependientes WHERE ID_dependientes = ? AND ID_usuario = ?',
      [id, ID_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dependiente no encontrado' });
    }
    res.json({ message: 'Dependiente eliminado' });
  } catch (err) {
    console.error('Error al eliminar dependiente:', err);
    res.status(500).json({ error: 'Error al eliminar dependiente' });
  }
};

module.exports = { getDependientes, addDependiente, updateDependiente, deleteDependiente };