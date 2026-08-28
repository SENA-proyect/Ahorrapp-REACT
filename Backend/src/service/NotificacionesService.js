const pool = require("../db/connection");
const { getPeriodoActivo } = require("./periodoHelper");

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

    const { rows: result } = await pool.query(
      `INSERT INTO notificaciones (id_usuario, tipo, entidad_tipo, entidad_id, mensaje)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_notificacion`,
      [ID_usuario, Tipo, Entidad_tipo, Entidad_id, Mensaje.trim()]
    );

    return result[0].id_notificacion;
  } catch (error) {
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
    const { rows } = await pool.query(
      `SELECT id_notificacion FROM notificaciones
       WHERE id_usuario = $1 AND tipo = $2 AND entidad_tipo = $3 AND entidad_id = $4
       LIMIT 1`,
      [ID_usuario, Tipo, Entidad_tipo, Entidad_id]
    );
    return rows.length > 0;
  } catch (error) {
    console.error("Error en existeNotificacionEntidad:", error.message);
    return true;
  }
};

// ─────────────────────────────────────────────────────────────
//  preferenciaActiva
// ─────────────────────────────────────────────────────────────
const preferenciaActiva = async (ID_usuario, Tipo) => {
  try {
    const { rows } = await pool.query(
      `SELECT activa AS "Activa" FROM preferencias_notificacion
       WHERE id_usuario = $1 AND tipo = $2
       LIMIT 1`,
      [ID_usuario, Tipo]
    );
    if (rows.length === 0) return true; // sin preferencia explícita → activa por defecto
    return Boolean(rows[0].Activa);
  } catch (error) {
    console.error("Error en preferenciaActiva:", error.message);
    return true; 
  }
};
// ─────────────────────────────────────────────────────────────
//  getPreferencias
// ─────────────────────────────────────────────────────────────
const TIPOS_NOTIFICACION = ["sistema", "recordatorio", "sugerencia", "alerta_presupuesto"];

// ─────────────────────────────────────────────────────────────
//  UMBRALES de alerta de presupuesto
// ─────────────────────────────────────────────────────────────
const UMBRAL_GASTOS = 85;
const UMBRAL_IMPREVISTOS = 85;

// ─────────────────────────────────────────────────────────────
//  verificarUmbralGastos
// ─────────────────────────────────────────────────────────────
const verificarUmbralGastos = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { Fecha_inicio: fi, Fecha_fin: ff, Monto_gastos } = periodo;
    if (!Monto_gastos || Number(Monto_gastos) <= 0) return;

    const { rows: [gas] } = await pool.query(
      `SELECT COALESCE(SUM(g.monto), 0)::float AS total
       FROM gastos g
       JOIN salida s      ON g.id_salida      = s.id_salida
       JOIN movimientos m ON s.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND g.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(gas.total) / Number(Monto_gastos)) * 100;
    if (porcentaje < UMBRAL_GASTOS) return;

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
// ─────────────────────────────────────────────────────────────
const verificarUmbralImprevistos = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { Fecha_inicio: fi, Fecha_fin: ff, Monto_imprevistos } = periodo;
    if (!Monto_imprevistos || Number(Monto_imprevistos) <= 0) return;

    const { rows: [imp] } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total
       FROM imprevistos i
       JOIN salida s      ON i.id_salida      = s.id_salida
       JOIN movimientos m ON s.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
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
//  Se invoca al CERRAR un período. Si el
//  fondo de imprevistos prácticamente no se usó, sugiere
//  redirigir ese dinero a ahorros
// ─────────────────────────────────────────────────────────────
const UMBRAL_IMPREVISTOS_NO_USADO = 10; 

const verificarImprevistosNoUsados = async (ID_usuario, periodo) => {
  try {
    const { Fecha_inicio: fi, Fecha_fin: ff, Monto_imprevistos, ID_periodo } = periodo;
    if (!Monto_imprevistos || Number(Monto_imprevistos) <= 0) return;

    const { rows: [imp] } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total
       FROM imprevistos i
       JOIN salida s      ON i.id_salida      = s.id_salida
       JOIN movimientos m ON s.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(imp.total) / Number(Monto_imprevistos)) * 100;
    if (porcentaje >= UMBRAL_IMPREVISTOS_NO_USADO) return;

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
// ─────────────────────────────────────────────────────────────
const verificarMetaAhorroAlcanzada = async (ID_usuario, ahorro, montoAcumulado) => {
  try {
    const metaMonto = Number(ahorro.meta_monto);
    if (!metaMonto || metaMonto <= 0) return;
    if (Number(montoAcumulado) < metaMonto) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "ahorro_meta", ahorro.id_ahorros
    );
    if (yaExiste) return;

    const descripcion = ahorro.meta_nombre?.trim() || "tu meta de ahorro";

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `¡Felicidades! Alcanzaste ${descripcion}.`,
      Entidad_tipo: "ahorro_meta",
      Entidad_id: ahorro.id_ahorros,
    });
  } catch (error) {
    console.error("Error en verificarMetaAhorroAlcanzada:", error.message);
  }
};

const getPreferencias = async (ID_usuario) => {
  const { rows } = await pool.query(
    `SELECT tipo AS "Tipo", activa AS "Activa" FROM preferencias_notificacion WHERE id_usuario = $1`,
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
// ─────────────────────────────────────────────────────────────
// CAMBIO ESTRUCTURAL
const setPreferencia = async (ID_usuario, Tipo, Activa) => {
  if (!TIPOS_NOTIFICACION.includes(Tipo)) {
    throw new Error(`Tipo de notificación inválido: ${Tipo}`);
  }

  await pool.query(
    `INSERT INTO preferencias_notificacion (id_usuario, tipo, activa)
     VALUES ($1, $2, $3)
     ON CONFLICT (id_usuario, tipo) DO UPDATE SET activa = EXCLUDED.activa`,
    [ID_usuario, Tipo, Activa]
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