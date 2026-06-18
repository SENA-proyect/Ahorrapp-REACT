const pool = require("../db/connection");

const getCategorias = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [rows] = await pool.query(
      `SELECT 
        ID_categoria  AS id,
        ID_usuario    AS id_usuario,
        Nombre        AS nombre,
        Descripcion   AS descripcion,
        Color         AS color,
        Icono         AS icono,
        Activa        AS activa,
        Sistema       AS sistema,
        ES_global     AS es_global
       FROM CATEGORIAS
       WHERE ES_global = TRUE OR ID_usuario = ?
       ORDER BY ES_global DESC, Nombre ASC`,
      [id_usuario]
    );

    return res.status(200).json({ ok: true, categorias: rows });

  } catch (error) {
    console.error("Error en getCategorias:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const getGastosPorCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [categorias] = await pool.query(
      `SELECT
        ID_categoria AS id,
        ID_usuario AS id_usuario,
        Nombre AS nombre,
        Descripcion AS descripcion,
        Color AS color,
        Icono AS icono,
        Activa AS activa,
        Sistema AS sistema,
        ES_global AS es_global
       FROM CATEGORIAS
       WHERE ES_global = TRUE OR ID_usuario = ?
       ORDER BY ES_global DESC, Nombre ASC`,
      [id_usuario]
    );

    const [gastos] = await pool.query(
      `SELECT
        g.ID_gastos AS id,
        g.ID_categoria AS id_categoria,
        g.Monto AS monto,
        g.Descripcion AS descripcion,
        g.Fecha_registro AS fecha
       FROM GASTOS g
       INNER JOIN SALIDA s ON g.ID_salida = s.ID_salida
       INNER JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ?
       ORDER BY g.Fecha_registro DESC, g.ID_gastos DESC`,
      [id_usuario]
    );

    const categoriasConGastos = categorias.map((categoria) => {
      const gastosCategoria = gastos.filter(
        (gasto) => Number(gasto.id_categoria) === Number(categoria.id)
      );

      return {
        ...categoria,
        cantidad_gastos: gastosCategoria.length,
        total_gastos: gastosCategoria.reduce(
          (total, gasto) => total + Number(gasto.monto || 0),
          0
        ),
        gastos: gastosCategoria,
      };
    });

    return res.status(200).json({ ok: true, categorias: categoriasConGastos });
  } catch (error) {
    console.error("Error en getGastosPorCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};
const getIngresosPorCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [categorias] = await pool.query(
      `SELECT
        ID_categoria AS id,
        ID_usuario AS id_usuario,
        Nombre AS nombre,
        Descripcion AS descripcion,
        Color AS color,
        Icono AS icono,
        Activa AS activa,
        Sistema AS sistema,
        ES_global AS es_global
       FROM CATEGORIAS
       WHERE ES_global = TRUE OR ID_usuario = ?
       ORDER BY ES_global DESC, Nombre ASC`,
      [id_usuario]
    );

    const [ingresos] = await pool.query(
      `SELECT
        i.ID_ingresos AS id,
        i.ID_categoria AS id_categoria,
        i.Monto AS monto,
        i.Descripcion AS descripcion,
        i.Fecha_registro AS fecha
       FROM INGRESOS i
       INNER JOIN ENTRADA e ON i.ID_entrada = e.ID_entrada
       INNER JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ?
       ORDER BY i.Fecha_registro DESC, i.ID_ingresos DESC`,
      [id_usuario]
    );

    const categoriasConIngresos = categorias.map((categoria) => {
      const ingresosCategoria = ingresos.filter(
        (ingreso) => Number(ingreso.id_categoria) === Number(categoria.id)
      );

      return {
        ...categoria,
        cantidad_ingresos: ingresosCategoria.length,
        total_ingresos: ingresosCategoria.reduce(
          (total, ingreso) => total + Number(ingreso.monto || 0),
          0
        ),
        ingresos: ingresosCategoria,
      };
    });

    return res.status(200).json({ ok: true, categorias: categoriasConIngresos });
  } catch (error) {
    console.error("Error en getIngresosPorCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};
const getImprevistosPorCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [categorias] = await pool.query(
      `SELECT
        ID_categoria AS id,
        ID_usuario AS id_usuario,
        Nombre AS nombre,
        Descripcion AS descripcion,
        Color AS color,
        Icono AS icono,
        Activa AS activa,
        Sistema AS sistema,
        ES_global AS es_global
       FROM CATEGORIAS
       WHERE ES_global = TRUE OR ID_usuario = ?
       ORDER BY ES_global DESC, Nombre ASC`,
      [id_usuario]
    );

    const [imprevistos] = await pool.query(
      `SELECT
        imp.ID_imprevistos AS id,
        imp.ID_categoria AS id_categoria,
        imp.Monto AS monto,
        imp.Causa AS descripcion,
        imp.Fecha_registro AS fecha
       FROM IMPREVISTOS imp
       INNER JOIN SALIDA s ON imp.ID_salida = s.ID_salida
       INNER JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ?
       ORDER BY imp.Fecha_registro DESC, imp.ID_imprevistos DESC`,
      [id_usuario]
    );

    const categoriasConImprevistos = categorias.map((categoria) => {
      const imprevistosCategoria = imprevistos.filter(
        (imprevisto) => Number(imprevisto.id_categoria) === Number(categoria.id)
      );

      return {
        ...categoria,
        cantidad_imprevistos: imprevistosCategoria.length,
        total_imprevistos: imprevistosCategoria.reduce(
          (total, imprevisto) => total + Number(imprevisto.monto || 0),
          0
        ),
        imprevistos: imprevistosCategoria,
      };
    });

    return res.status(200).json({ ok: true, categorias: categoriasConImprevistos });
  } catch (error) {
    console.error("Error en getImprevistosPorCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};
const getDeudasPorCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [categorias] = await pool.query(
      `SELECT
        ID_categoria AS id,
        ID_usuario AS id_usuario,
        Nombre AS nombre,
        Descripcion AS descripcion,
        Color AS color,
        Icono AS icono,
        Activa AS activa,
        Sistema AS sistema,
        ES_global AS es_global
       FROM CATEGORIAS
       WHERE ES_global = TRUE OR ID_usuario = ?
       ORDER BY ES_global DESC, Nombre ASC`,
      [id_usuario]
    );

    const [deudas] = await pool.query(
      `SELECT
        d.ID_deudas AS id,
        d.ID_categoria AS id_categoria,
        d.Monto AS monto,
        d.Descripcion AS descripcion,
        d.Fecha_inicio AS fecha
       FROM DEUDAS d
       INNER JOIN SALIDA s ON d.ID_salida = s.ID_salida
       INNER JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ?
       ORDER BY d.Fecha_inicio DESC, d.ID_deudas DESC`,
      [id_usuario]
    );

    const categoriasConDeudas = categorias.map((categoria) => {
      const deudasCategoria = deudas.filter(
        (deuda) => Number(deuda.id_categoria) === Number(categoria.id)
      );

      return {
        ...categoria,
        cantidad_deudas: deudasCategoria.length,
        total_deudas: deudasCategoria.reduce(
          (total, deuda) => total + Number(deuda.monto || 0),
          0
        ),
        deudas: deudasCategoria,
      };
    });

    return res.status(200).json({ ok: true, categorias: categoriasConDeudas });
  } catch (error) {
    console.error("Error en getDeudasPorCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};
const getAhorrosPorCategoria = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [categorias] = await pool.query(
      `SELECT
        ID_categoria AS id,
        ID_usuario AS id_usuario,
        Nombre AS nombre,
        Descripcion AS descripcion,
        Color AS color,
        Icono AS icono,
        Activa AS activa,
        Sistema AS sistema,
        ES_global AS es_global
       FROM CATEGORIAS
       WHERE ES_global = TRUE OR ID_usuario = ?
       ORDER BY ES_global DESC, Nombre ASC`,
      [id_usuario]
    );

    const [ahorros] = await pool.query(
      `SELECT
        a.ID_ahorros AS id,
        a.ID_categoria AS id_categoria,
        a.Monto AS monto,
        a.Descripcion AS descripcion,
        a.Fecha_registro AS fecha
       FROM AHORROS a
       INNER JOIN ENTRADA e ON a.ID_entrada = e.ID_entrada
       INNER JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
       WHERE m.ID_usuario = ?
       ORDER BY a.Fecha_registro DESC, a.ID_ahorros DESC`,
      [id_usuario]
    );

    const categoriasConAhorros = categorias.map((categoria) => {
      const ahorrosCategoria = ahorros.filter(
        (ahorro) => Number(ahorro.id_categoria) === Number(categoria.id)
      );

      return {
        ...categoria,
        cantidad_ahorros: ahorrosCategoria.length,
        total_ahorros: ahorrosCategoria.reduce(
          (total, ahorro) => total + Number(ahorro.monto || 0),
          0
        ),
        ahorros: ahorrosCategoria,
      };
    });

    return res.status(200).json({ ok: true, categorias: categoriasConAhorros });
  } catch (error) {
    console.error("Error en getAhorrosPorCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};
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
      "UPDATE CATEGORIAS SET Nombre = ?, Descripcion = ? WHERE ID_categoria = ?",
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    return res.status(200).json({ ok: true, mensaje: "Categoria actualizada exitosamente" });
  } catch (error) {
    console.error("Error en actualizarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

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

    await pool.query("UPDATE CATEGORIAS SET Activa = FALSE WHERE ID_categoria = ?", [id]);

    return res.status(200).json({ ok: true, mensaje: "Categoria deshabilitada" });
  } catch (error) {
    console.error("Error en deshabilitarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

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

    await pool.query("UPDATE CATEGORIAS SET Activa = TRUE WHERE ID_categoria = ?", [id]);

    return res.status(200).json({ ok: true, mensaje: "Categoria habilitada" });
  } catch (error) {
    console.error("Error en habilitarCategoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  getCategorias,
  getGastosPorCategoria,
  getIngresosPorCategoria,
  getAhorrosPorCategoria,
  getImprevistosPorCategoria,
  getDeudasPorCategoria,
  crearCategoria,
  actualizarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
};
