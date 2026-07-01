// ============================================================
//  AhorrApp — historialService.js
//  Módulo desacoplado: cualquier controller puede invocar
//  registrarActividad(...) o registrarAuditoria(...) sin
//  acoplarse a la lógica de negocio del historial.
//
//  RF-11: actividad del propio usuario (tabla HISTORIAL)
//  RF-12: auditoría administrativa (tabla HISTORIAL_AUDITORIA)
// ============================================================

const pool = require("../db/connection");

const ACCIONES_VALIDAS = ["crear", "editar", "eliminar", "abonar", "cambiar_estado"];

// ─────────────────────────────────────────────────────────────
//  registrarActividad (RF-11)
//  Punto de entrada único para registrar una acción del usuario
//  sobre sus propios datos financieros o de gestión.
//
//  @param {Object} datos
//    ID_usuario    {number} requerido
//    Accion        {string} 'crear' | 'editar' | 'eliminar' | 'abonar'
//    Entidad_tipo  {string} requerido, ej. 'gasto', 'categoria'
//    Entidad_id    {number} opcional
//    Descripcion   {string} requerido, ya formada con detalle legible
//
//  @returns {number|null} ID_historial insertado, o null si falló
//           (un fallo aquí NUNCA debe tumbar la operación principal)
// ─────────────────────────────────────────────────────────────
const registrarActividad = async ({
  ID_usuario,
  Accion,
  Entidad_tipo,
  Entidad_id = null,
  Descripcion,
}) => {
  if (!ID_usuario || !ACCIONES_VALIDAS.includes(Accion) || !Entidad_tipo || !Descripcion?.trim()) {
    console.error("registrarActividad: faltan campos requeridos o Accion inválida", {
      ID_usuario, Accion, Entidad_tipo, Descripcion,
    });
    return null;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO HISTORIAL (ID_usuario, Accion, Entidad_tipo, Entidad_id, Descripcion)
       VALUES (?, ?, ?, ?, ?)`,
      [ID_usuario, Accion, Entidad_tipo, Entidad_id, Descripcion.trim()]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error en registrarActividad:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
//  getHistorialUsuario (RF-11)
//  Listado paginado del historial de un usuario, con filtro
//  opcional de archivados.
// ─────────────────────────────────────────────────────────────
const getHistorialUsuario = async (ID_usuario, { archivada, page = 1, limit = 20 } = {}) => {
  const condiciones = ["ID_usuario = ?"];
  const params = [ID_usuario];

  if (archivada === true || archivada === false) {
    condiciones.push("Archivada = ?");
    params.push(archivada);
  } else {
    condiciones.push("Archivada = FALSE");
  }

  const where = condiciones.join(" AND ");
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT
       ID_historial AS id,
       Accion       AS accion,
       Entidad_tipo AS entidad_tipo,
       Entidad_id   AS entidad_id,
       Descripcion  AS descripcion,
       Fecha        AS fecha,
       Archivada    AS archivada
     FROM HISTORIAL
     WHERE ${where}
     ORDER BY Fecha DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM HISTORIAL WHERE ${where}`,
    params
  );

  return { registros: rows, total };
};

// ─────────────────────────────────────────────────────────────
//  archivarActividad (RF-11)
//  El usuario puede archivar (ocultar de su vista), nunca eliminar.
// ─────────────────────────────────────────────────────────────
const archivarActividad = async (ID_usuario, ID_historial) => {
  const [result] = await pool.query(
    `UPDATE HISTORIAL SET Archivada = TRUE
     WHERE ID_historial = ? AND ID_usuario = ?`,
    [ID_historial, ID_usuario]
  );
  return result.affectedRows > 0;
};

// ─────────────────────────────────────────────────────────────
//  registrarAuditoria (RF-12)
//  Punto de entrada único para registrar una acción administrativa
//  sobre cuentas, roles, permisos o configuraciones del sistema.
//
//  @param {Object} datos
//    ID_usuario_admin    {number} requerido — quién ejecutó la acción
//    Accion              {string} requerido, ej. 'cambiar_rol'
//    Entidad_tipo        {string} requerido, ej. 'usuario'
//    Entidad_id          {number} opcional — recurso/usuario afectado
//    Entidad_descripcion {string} opcional — nombre/email congelado
//    Descripcion         {string} requerido, detalle legible
//
//  @returns {number|null} ID_auditoria insertado, o null si falló
// ─────────────────────────────────────────────────────────────
const registrarAuditoria = async ({
  ID_usuario_admin,
  Accion,
  Entidad_tipo,
  Entidad_id = null,
  Entidad_descripcion = null,
  Descripcion,
}) => {
  if (!ID_usuario_admin || !Accion?.trim() || !Entidad_tipo || !Descripcion?.trim()) {
    console.error("registrarAuditoria: faltan campos requeridos", {
      ID_usuario_admin, Accion, Entidad_tipo, Descripcion,
    });
    return null;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO HISTORIAL_AUDITORIA
         (ID_usuario_admin, Accion, Entidad_tipo, Entidad_id, Entidad_descripcion, Descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ID_usuario_admin,
        Accion.trim(),
        Entidad_tipo,
        Entidad_id,
        Entidad_descripcion?.trim() || null,
        Descripcion.trim(),
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error en registrarAuditoria:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
//  getHistorialAuditoria (RF-12)
//  Listado paginado, visible para admin y superusuario por igual.
//  No tiene filtro de archivado — la auditoría no se archiva,
//  solo se elimina (y eso, solo el superusuario, a nivel de
//  permiso verificado en el controller).
// ─────────────────────────────────────────────────────────────
const getHistorialAuditoria = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT
       a.ID_auditoria        AS id,
       a.ID_usuario_admin    AS id_usuario_admin,
       u.Nombre               AS admin_nombre,
       a.Accion               AS accion,
       a.Entidad_tipo         AS entidad_tipo,
       a.Entidad_id           AS entidad_id,
       a.Entidad_descripcion  AS entidad_descripcion,
       a.Descripcion          AS descripcion,
       a.Fecha                AS fecha
     FROM HISTORIAL_AUDITORIA a
     LEFT JOIN USUARIOS u ON a.ID_usuario_admin = u.ID_usuario
     ORDER BY a.Fecha DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM HISTORIAL_AUDITORIA`
  );

  return { registros: rows, total };
};

// ─────────────────────────────────────────────────────────────
//  eliminarAuditoria (RF-12)
//  Eliminación definitiva. El controller debe verificar que
//  quien llama es superusuario ANTES de invocar esta función —
//  el servicio no conoce roles, solo ejecuta.
// ─────────────────────────────────────────────────────────────
const eliminarAuditoria = async (ID_auditoria) => {
  const [result] = await pool.query(
    `DELETE FROM HISTORIAL_AUDITORIA WHERE ID_auditoria = ?`,
    [ID_auditoria]
  );
  return result.affectedRows > 0;
};

module.exports = {
  registrarActividad,
  getHistorialUsuario,
  archivarActividad,
  registrarAuditoria,
  getHistorialAuditoria,
  eliminarAuditoria,
  ACCIONES_VALIDAS,
};