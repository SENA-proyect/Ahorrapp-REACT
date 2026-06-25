// ============================================================
//  AhorrApp — notificacionesService.js
//  Módulo desacoplado: cualquier controller o job puede invocar
//  crearNotificacion(...) sin acoplarse a la lógica de negocio
//  de notificaciones. Centraliza también lectura/escritura del
//  estado (leída, archivada) y de las preferencias del usuario.
// ============================================================

const pool = require("../db/connection");
const { getPeriodoActivo } = require("./periodoHelper");

// ─────────────────────────────────────────────────────────────
//  crearNotificacion
//  Punto de entrada único para generar una notificación.
//  Respeta las preferencias del usuario: si el usuario desactivó
//  ese Tipo, la notificación NO se inserta (no se "manda en vano").
//
//  @param {Object} datos
//    ID_usuario   {number}  requerido
//    Tipo         {string}  'sistema' | 'recordatorio' | 'sugerencia' | 'alerta_presupuesto'
//    Mensaje      {string}  requerido
//    Entidad_tipo {string}  opcional, ej. 'deuda', 'ahorro', 'gasto'
//    Entidad_id   {number}  opcional, ID del registro relacionado
//
//  @returns {number|null} ID_notificacion insertado, o null si no
//           se generó (preferencia desactivada o error controlado)
// ─────────────────────────────────────────────────────────────
const crearNotificacion = async ({
  ID_usuario,
  Tipo,
  Mensaje,
  Entidad_tipo = null,
  Entidad_id = null,
}) => {
  if (!ID_usuario || !Tipo || !Mensaje?.trim()) {
    console.error("crearNotificacion: faltan campos requeridos", { ID_usuario, Tipo, Mensaje });
    return null;
  }

  try {
    const activa = await preferenciaActiva(ID_usuario, Tipo);
    if (!activa) return null;

    const [result] = await pool.query(
      `INSERT INTO NOTIFICACIONES (ID_usuario, Tipo, Entidad_tipo, Entidad_id, Mensaje)
       VALUES (?, ?, ?, ?, ?)`,
      [ID_usuario, Tipo, Entidad_tipo, Entidad_id, Mensaje.trim()]
    );

    return result.insertId;
  } catch (error) {
    // Una notificación fallida NUNCA debe tumbar la operación principal
    // (ej. crear un gasto no debe fallar porque la notificación falló).
    console.error("Error en crearNotificacion:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
//  existeNotificacionEntidad
//  Evita duplicados para eventos recurrentes (ej. el cron de
//  vencimientos corre todos los días: sin este chequeo, generaría
//  una notificación nueva de la MISMA deuda cada día durante toda
//  la ventana de aviso).
// ─────────────────────────────────────────────────────────────
const existeNotificacionEntidad = async (ID_usuario, Tipo, Entidad_tipo, Entidad_id) => {
  try {
    const [rows] = await pool.query(
      `SELECT ID_notificacion FROM NOTIFICACIONES
       WHERE ID_usuario = ? AND Tipo = ? AND Entidad_tipo = ? AND Entidad_id = ?
       LIMIT 1`,
      [ID_usuario, Tipo, Entidad_tipo, Entidad_id]
    );
    return rows.length > 0;
  } catch (error) {
    console.error("Error en existeNotificacionEntidad:", error.message);
    // Ante error de verificación, asumimos que SÍ existe para evitar
    // duplicados accidentales (más seguro fallar en silencio que espamear).
    return true;
  }
};

// ─────────────────────────────────────────────────────────────
//  preferenciaActiva
//  Filosofía opt-out: si no hay fila en PREFERENCIAS_NOTIFICACION
//  para (usuario, tipo), se asume TRUE.
// ─────────────────────────────────────────────────────────────
const preferenciaActiva = async (ID_usuario, Tipo) => {
  try {
    const [rows] = await pool.query(
      `SELECT Activa FROM PREFERENCIAS_NOTIFICACION
       WHERE ID_usuario = ? AND Tipo = ?
       LIMIT 1`,
      [ID_usuario, Tipo]
    );
    if (rows.length === 0) return true; // sin preferencia explícita → activa por defecto
    return Boolean(rows[0].Activa);
  } catch (error) {
    console.error("Error en preferenciaActiva:", error.message);
    return true; // ante error, no bloquear notificaciones legítimas
  }
};

// ─────────────────────────────────────────────────────────────
//  getPreferencias
//  Devuelve las 4 categorías con su estado actual (TRUE si no
//  hay fila explícita), para alimentar la vista de Configuración.
// ─────────────────────────────────────────────────────────────
const TIPOS_NOTIFICACION = ["sistema", "recordatorio", "sugerencia", "alerta_presupuesto"];

// ─────────────────────────────────────────────────────────────
//  UMBRALES de alerta de presupuesto (% del monto destinado
//  en el período activo). Ajustables aquí sin tocar los
//  controllers que invocan esta lógica.
// ─────────────────────────────────────────────────────────────
const UMBRAL_GASTOS = 85;
const UMBRAL_IMPREVISTOS = 85;

// ─────────────────────────────────────────────────────────────
//  verificarUmbralGastos
//  Se invoca DESPUÉS de confirmar (commit) el registro de un
//  gasto. Compara el total ejecutado de Gastos del período activo
//  contra Monto_gastos. Si supera el umbral y no se había avisado
//  ya para este período, genera la alerta.
//
//  Nota: NUNCA debe lanzar — un fallo aquí no debe afectar al
//  caller (crearMovimiento ya respondió 201 al usuario).
// ─────────────────────────────────────────────────────────────
const verificarUmbralGastos = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { Fecha_inicio: fi, Fecha_fin: ff, Monto_gastos } = periodo;
    if (!Monto_gastos || Number(Monto_gastos) <= 0) return;

    const [[gas]] = await pool.query(
      `SELECT COALESCE(SUM(g.Monto), 0) AS total
       FROM GASTOS g
       JOIN SALIDA s      ON g.ID_salida      = s.ID_salida
       JOIN MOVIMIENTOS m ON s.ID_movimiento  = m.ID_movimiento
       WHERE m.ID_usuario = ? AND g.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(gas.total) / Number(Monto_gastos)) * 100;
    if (porcentaje < UMBRAL_GASTOS) return;

    // Una sola alerta por período (no una por cada gasto adicional
    // una vez ya se cruzó el umbral).
    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "periodo_gastos", periodo.ID_periodo
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `Has usado el ${porcentaje.toFixed(0)}% de tu presupuesto de Gastos en este período.`,
      Entidad_tipo: "periodo_gastos",
      Entidad_id: periodo.ID_periodo,
    });
  } catch (error) {
    console.error("Error en verificarUmbralGastos:", error.message);
  }
};

// ─────────────────────────────────────────────────────────────
//  verificarUmbralImprevistos
//  Misma lógica que verificarUmbralGastos, pero sobre el fondo
//  de imprevistos (RF-05).
// ─────────────────────────────────────────────────────────────
const verificarUmbralImprevistos = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { Fecha_inicio: fi, Fecha_fin: ff, Monto_imprevistos } = periodo;
    if (!Monto_imprevistos || Number(Monto_imprevistos) <= 0) return;

    const [[imp]] = await pool.query(
      `SELECT COALESCE(SUM(i.Monto), 0) AS total
       FROM IMPREVISTOS i
       JOIN SALIDA s      ON i.ID_salida      = s.ID_salida
       JOIN MOVIMIENTOS m ON s.ID_movimiento  = m.ID_movimiento
       WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(imp.total) / Number(Monto_imprevistos)) * 100;
    if (porcentaje < UMBRAL_IMPREVISTOS) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "periodo_imprevistos", periodo.ID_periodo
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `Has usado el ${porcentaje.toFixed(0)}% de tu fondo de imprevistos en este período.`,
      Entidad_tipo: "periodo_imprevistos",
      Entidad_id: periodo.ID_periodo,
    });
  } catch (error) {
    console.error("Error en verificarUmbralImprevistos:", error.message);
  }
};

// ─────────────────────────────────────────────────────────────
//  verificarImprevistosNoUsados
//  Se invoca al CERRAR un período (no en cada gasto). Si el
//  fondo de imprevistos prácticamente no se usó, sugiere
//  redirigir ese dinero a ahorros (RF-14).
//
//  @param {number} ID_usuario
//  @param {Object} periodo  Fila de PERIODOS_PRESUPUESTO ya cerrada
//                           (debe incluir ID_periodo, Fecha_inicio,
//                           Fecha_fin, Monto_imprevistos)
// ─────────────────────────────────────────────────────────────
const UMBRAL_IMPREVISTOS_NO_USADO = 10; // % por debajo del cual se considera "no usado"

const verificarImprevistosNoUsados = async (ID_usuario, periodo) => {
  try {
    const { Fecha_inicio: fi, Fecha_fin: ff, Monto_imprevistos, ID_periodo } = periodo;
    if (!Monto_imprevistos || Number(Monto_imprevistos) <= 0) return;

    const [[imp]] = await pool.query(
      `SELECT COALESCE(SUM(i.Monto), 0) AS total
       FROM IMPREVISTOS i
       JOIN SALIDA s      ON i.ID_salida      = s.ID_salida
       JOIN MOVIMIENTOS m ON s.ID_movimiento  = m.ID_movimiento
       WHERE m.ID_usuario = ? AND i.Fecha_registro BETWEEN ? AND ?`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(imp.total) / Number(Monto_imprevistos)) * 100;
    if (porcentaje >= UMBRAL_IMPREVISTOS_NO_USADO) return; // sí se usó razonablemente

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "sugerencia", "periodo_imprevistos_no_usado", ID_periodo
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "sugerencia",
      Mensaje: "No usaste casi nada de tu fondo de imprevistos este período. Considera destinar parte de ese dinero a tus ahorros.",
      Entidad_tipo: "periodo_imprevistos_no_usado",
      Entidad_id: ID_periodo,
    });
  } catch (error) {
    console.error("Error en verificarImprevistosNoUsados:", error.message);
  }
};

// ─────────────────────────────────────────────────────────────
//  verificarMetaAhorroAlcanzada
//  Se invoca tras registrar un abono de ahorro. Si el monto
//  acumulado alcanzó la meta, genera la alerta de logro (RF-04).
//
//  @param {number} ID_usuario
//  @param {Object} ahorro  Debe incluir ID_ahorros, meta_monto, descripcion
//  @param {number} montoAcumulado
// ─────────────────────────────────────────────────────────────
const verificarMetaAhorroAlcanzada = async (ID_usuario, ahorro, montoAcumulado) => {
  try {
    const metaMonto = Number(ahorro.meta_monto);
    if (!metaMonto || metaMonto <= 0) return;
    if (Number(montoAcumulado) < metaMonto) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "ahorro_meta", ahorro.ID_ahorros
    );
    if (yaExiste) return;

    const descripcion = ahorro.descripcion?.trim() || "tu meta de ahorro";

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `¡Felicidades! Alcanzaste ${descripcion}.`,
      Entidad_tipo: "ahorro_meta",
      Entidad_id: ahorro.ID_ahorros,
    });
  } catch (error) {
    console.error("Error en verificarMetaAhorroAlcanzada:", error.message);
  }
};

const getPreferencias = async (ID_usuario) => {
  const [rows] = await pool.query(
    `SELECT Tipo, Activa FROM PREFERENCIAS_NOTIFICACION WHERE ID_usuario = ?`,
    [ID_usuario]
  );

  const guardadas = new Map(rows.map((r) => [r.Tipo, Boolean(r.Activa)]));

  return TIPOS_NOTIFICACION.map((tipo) => ({
    tipo,
    activa: guardadas.has(tipo) ? guardadas.get(tipo) : true,
  }));
};

// ─────────────────────────────────────────────────────────────
//  setPreferencia
//  Upsert: crea o actualiza la preferencia de un tipo puntual.
// ─────────────────────────────────────────────────────────────
const setPreferencia = async (ID_usuario, Tipo, Activa) => {
  if (!TIPOS_NOTIFICACION.includes(Tipo)) {
    throw new Error(`Tipo de notificación inválido: ${Tipo}`);
  }

  await pool.query(
    `INSERT INTO PREFERENCIAS_NOTIFICACION (ID_usuario, Tipo, Activa)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE Activa = ?`,
    [ID_usuario, Tipo, Activa, Activa]
  );
};

module.exports = {
  crearNotificacion,
  existeNotificacionEntidad,
  preferenciaActiva,
  getPreferencias,
  setPreferencia,
  verificarUmbralGastos,
  verificarUmbralImprevistos,
  verificarImprevistosNoUsados,
  verificarMetaAhorroAlcanzada,
  TIPOS_NOTIFICACION,
};