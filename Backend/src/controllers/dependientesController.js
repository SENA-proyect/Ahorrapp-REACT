//? NOTA
// arreglo de diversos alias
// arreglo de estructura corrompida
// agregacion de los rows para funcionalidad con postgresql
//! Preguntar que carajos hizo el responsable de esta vista

const pool = require('../db/connection');

// ── GET: Obtener dependientes del usuario autenticado ──────
const getDependientes = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const { rows: results } = await pool.query(
      `SELECT 
        id_dependientes,
        nombre AS "Nombre",
        relacion AS "Relacion",
        ocupacion AS "Ocupacion",
        fecha_nacimiento AS "Fecha_nacimiento",
        peso_economico AS "Peso_economico"
      FROM dependientes
      WHERE id_usuario = $1`,
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
    const { rows: result } = await pool.query(
      `INSERT INTO dependientes (id_usuario, nombre, relacion, ocupacion, fecha_nacimiento, peso_economico)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_dependientes`,
      [ID_usuario, Nombre, Relacion, Ocupacion || null, Fecha_nacimiento, Peso_economico || null]
    );
    res.status(201).json({ message: 'Dependiente agregado', id_dependientes: result[0].id_dependientes });
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
    const result = await pool.query(
      `UPDATE dependientes
        SET nombre = $1, relacion = $2, ocupacion = $3, fecha_nacimiento = $4, peso_economico = $5
       WHERE id_dependientes = $6 AND id_usuario = $7`,
      [Nombre, Relacion, Ocupacion || null, Fecha_nacimiento, Peso_economico || null, id, ID_usuario]
    );

    if (result.rowCount === 0) {
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
    const result = await pool.query(
      'DELETE FROM dependientes WHERE id_dependientes = $1 AND id_usuario = $2',
      [id, ID_usuario]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Dependiente no encontrado' });
    }
    res.json({ message: 'Dependiente eliminado' });
  } catch (err) {
    console.error('Error al eliminar dependiente:', err);
    res.status(500).json({ error: 'Error al eliminar dependiente' });
  }
};

module.exports = { getDependientes, addDependiente, updateDependiente, deleteDependiente };