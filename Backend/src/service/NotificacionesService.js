const pool = require("../db/connection");
const { getPeriodoActivo } = require("./periodoHelper");
const admin = require("../config/firebase");

const enviarPush = async (ID_usuario, titulo, mensaje) => {
  try {
    const { rows } = await pool.query(
      `SELECT fcm_token FROM push_tokens WHERE id_usuario = $1`,
      [ID_usuario]
    );

    if (rows.length === 0) return;

    const tokens = rows.map((r) => r.fcm_token);

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: titulo, body: mensaje },
    });
  } catch (error) {
    console.error("Error en enviarPush:", error.message);
  }
};

const crearNotificacion = async ({
  ID_usuario,
  Tipo,
  Mensaje,
  Entidad_tipo = null,
  Entidad_id = null,
}) => {
  if (!ID_usuario || !Tipo || !Mensaje?.trim()) {
    console.error("crearNotificacion: faltan campos requeridos", {
      ID_usuario,
      Tipo,
      Mensaje,
    });
    return null;
  }

  try {
    const activa = await preferenciaActiva(ID_usuario, Tipo);
    if (!activa) return null;

    // Solo aplica ON CONFLICT cuando hay entidad (índice parcial)
    const usarConflicto = Entidad_tipo !== null && Entidad_id !== null;

    const sql = usarConflicto
      ? `INSERT INTO notificaciones (id_usuario, tipo, entidad_tipo, entidad_id, mensaje)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_usuario, tipo, entidad_tipo, entidad_id)
         DO NOTHING
         RETURNING id_notificacion`
      : `INSERT INTO notificaciones (id_usuario, tipo, entidad_tipo, entidad_id, mensaje)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_notificacion`;

    const { rows } = await pool.query(sql, [
      ID_usuario,
      Tipo,
      Entidad_tipo,
      Entidad_id,
      Mensaje.trim(),
    ]);

    // Si hubo conflicto, rows viene vacío → no re-enviamos push
    if (rows.length === 0) return null;

    await enviarPush(ID_usuario, "Ahorrapp", Mensaje.trim());

    return rows[0].id_notificacion;
  } catch (error) {
    console.error("Error en crearNotificacion:", error.message);
    return null;
  }
};

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

const preferenciaActiva = async (ID_usuario, Tipo) => {
  try {
    const { rows } = await pool.query(
      `SELECT activa AS "Activa" FROM preferencias_notificacion
       WHERE id_usuario = $1 AND tipo = $2
       LIMIT 1`,
      [ID_usuario, Tipo]
    );
    if (rows.length === 0) return true;
    return Boolean(rows[0].Activa);
  } catch (error) {
    console.error("Error en preferenciaActiva:", error.message);
    return true;
  }
};

const TIPOS_NOTIFICACION = ["sistema", "recordatorio", "sugerencia", "alerta_presupuesto"];

const UMBRAL_GASTOS = 85;
const UMBRAL_IMPREVISTOS = 85;
const UMBRAL_DEUDAS = 85;
const UMBRAL_AHORROS = 85; 
const UMBRAL_EMERGENCIA = 85;

// --- GASTOS ---
const verificarUmbralGastos = async (ID_usuario) => {
  try {
    console.log(`\n--- [DEBUG UMBRAL GASTOS] Iniciando para usuario: ${ID_usuario} ---`);
    
    const periodo = await getPeriodoActivo(ID_usuario);

    console.log("DEBUG PERIODO REAL:", periodo);

    if (!periodo) {
      console.log("❌ [DEBUG UMBRAL GASTOS]: No hay período activo.");
      return;
    }

    const { fecha_inicio: fi, fecha_fin: ff, monto_gastos, id_presupuesto } = periodo;
    
    console.log(`ℹ️ [DEBUG UMBRAL GASTOS]: Período ${fi} a ${ff} | Límite: ${monto_gastos} | ID Presupuesto: ${id_presupuesto}`);

    if (!monto_gastos || Number(monto_gastos) <= 0) {
      console.log("❌ [DEBUG UMBRAL GASTOS]: El monto del presupuesto de gastos es 0 o nulo.");
      return;
    }

    const { rows: [gas] } = await pool.query(
      `SELECT COALESCE(SUM(g.monto), 0)::float AS total
       FROM gastos g
       JOIN salida s      ON g.id_salida      = s.id_salida
       JOIN movimientos m ON s.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND g.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(gas.total) / Number(monto_gastos)) * 100;
    
    console.log(`📊 [DEBUG UMBRAL GASTOS]: Total gastado en el período: ${gas.total} | Porcentaje: ${porcentaje.toFixed(2)}%`);

    if (porcentaje < UMBRAL_GASTOS) {
      console.log(`⚠️ [DEBUG UMBRAL GASTOS]: No supera el umbral del ${UMBRAL_GASTOS}%. No se notifica.`);
      return;
    }

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "periodo_gastos", id_presupuesto
    );
    
    if (yaExiste) {
      console.log("⚠️ [DEBUG UMBRAL GASTOS]: Ya existe una notificación para este período. No se duplica.");
      return;
    }

    console.log("✅ [DEBUG UMBRAL GASTOS]: Creando notificación...");
    
    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `Has usado el ${porcentaje.toFixed(0)}% de tu presupuesto de Gastos en este período.`,
      Entidad_tipo: "periodo_gastos",
      Entidad_id: id_presupuesto,
    });

    console.log("✅ [DEBUG UMBRAL GASTOS]: Proceso terminado con éxito.");
  } catch (error) {
    console.error("❌ [DEBUG UMBRAL GASTOS] ERROR FATAL:", error.message);
  }
};

// --- IMPREVISTOS ---
const verificarUmbralImprevistos = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { fecha_inicio: fi, fecha_fin: ff, monto_imprevistos, id_presupuesto } = periodo;
    if (!monto_imprevistos || Number(monto_imprevistos) <= 0) return;

    const { rows: [imp] } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total
       FROM imprevistos i
       JOIN salida s      ON i.id_salida      = s.id_salida
       JOIN movimientos m ON s.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(imp.total) / Number(monto_imprevistos)) * 100;
    if (porcentaje < UMBRAL_IMPREVISTOS) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "periodo_imprevistos", id_presupuesto
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `Has usado el ${porcentaje.toFixed(0)}% de tu porción de imprevistos en este período.`,
      Entidad_tipo: "periodo_imprevistos",
      Entidad_id: id_presupuesto,
    });
  } catch (error) {
    console.error("Error en verificarUmbralImprevistos:", error.message);
  }
};

// --- DEUDAS ---
const verificarUmbralDeudas = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { fecha_inicio: fi, fecha_fin: ff, monto_deudas, id_presupuesto } = periodo;
    if (!monto_deudas || Number(monto_deudas) <= 0) return;

    const { rows: [deu] } = await pool.query(
      `SELECT COALESCE(SUM(d.monto), 0)::float AS total
       FROM deudas d
       JOIN salida s      ON d.id_salida      = s.id_salida
       JOIN movimientos m ON s.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND d.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(deu.total) / Number(monto_deudas)) * 100;
    if (porcentaje < UMBRAL_DEUDAS) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "periodo_deudas", id_presupuesto
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `Has usado el ${porcentaje.toFixed(0)}% de tu presupuesto destinado a Deudas.`,
      Entidad_tipo: "periodo_deudas",
      Entidad_id: id_presupuesto,
    });
  } catch (error) {
    console.error("Error en verificarUmbralDeudas:", error.message);
  }
};

// --- AHORROS ---
const verificarUmbralAhorros = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { fecha_inicio: fi, fecha_fin: ff, monto_ahorros, id_presupuesto } = periodo;
    if (!monto_ahorros || Number(monto_ahorros) <= 0) return;

    const { rows: [aho] } = await pool.query(
      `SELECT COALESCE(SUM(a.monto), 0)::float AS total
       FROM ahorros a
       JOIN entrada e      ON a.id_entrada     = e.id_entrada
       JOIN movimientos m  ON e.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND a.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(aho.total) / Number(monto_ahorros)) * 100;
    if (porcentaje < UMBRAL_AHORROS) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "periodo_ahorros", id_presupuesto
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `Has usado el ${porcentaje.toFixed(0)}% de tu presupuesto destinado a Ahorros.`,
      Entidad_tipo: "periodo_ahorros",
      Entidad_id: id_presupuesto,
    });
  } catch (error) {
    console.error("Error en verificarUmbralAhorros:", error.message);
  }
};

// --- EMERGENCIA ---
// --- EMERGENCIA ---
const verificarUmbralEmergencia = async (ID_usuario) => {
  try {
    const periodo = await getPeriodoActivo(ID_usuario);
    if (!periodo) return;

    const { fecha_inicio: fi, fecha_fin: ff, monto_emergencia, id_presupuesto } = periodo;
    if (!monto_emergencia || Number(monto_emergencia) <= 0) return;

    const { rows: [eme] } = await pool.query(
      `SELECT COALESCE(
         SUM(CASE WHEN mfe.tipo = 'aporte' THEN mfe.monto
                  WHEN mfe.tipo = 'retiro' THEN -mfe.monto
                  ELSE 0 END
         ), 0)::float AS total
       FROM movimientos_fondo_emergencia mfe
       JOIN fondos_emergencia fe ON mfe.id_fondo = fe.id_fondo
       WHERE fe.id_usuario = $1
         AND mfe.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(eme.total) / Number(monto_emergencia)) * 100;
    if (porcentaje < UMBRAL_EMERGENCIA) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "alerta_presupuesto", "periodo_emergencia", id_presupuesto
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "alerta_presupuesto",
      Mensaje: `Has usado el ${porcentaje.toFixed(0)}% de tu fondo de Emergencia.`,
      Entidad_tipo: "periodo_emergencia",
      Entidad_id: id_presupuesto,
    });
  } catch (error) {
    console.error("Error en verificarUmbralEmergencia:", error.message);
  }
};

// --- SUGERENCIA IMPREVISTOS NO USADOS ---
const UMBRAL_IMPREVISTOS_NO_USADO = 10;

const verificarImprevistosNoUsados = async (ID_usuario, periodo) => {
  try {
    const { fecha_inicio: fi, fecha_fin: ff, monto_imprevistos, id_presupuesto } = periodo;
    if (!monto_imprevistos || Number(monto_imprevistos) <= 0) return;

    const { rows: [imp] } = await pool.query(
      `SELECT COALESCE(SUM(i.monto), 0)::float AS total
       FROM imprevistos i
       JOIN salida s      ON i.id_salida      = s.id_salida
       JOIN movimientos m ON s.id_movimiento  = m.id_movimiento
       WHERE m.id_usuario = $1 AND i.fecha_registro BETWEEN $2 AND $3`,
      [ID_usuario, fi, ff]
    );

    const porcentaje = (Number(imp.total) / Number(monto_imprevistos)) * 100;
    if (porcentaje >= UMBRAL_IMPREVISTOS_NO_USADO) return;

    const yaExiste = await existeNotificacionEntidad(
      ID_usuario, "sugerencia", "periodo_imprevistos_no_usado", id_presupuesto
    );
    if (yaExiste) return;

    await crearNotificacion({
      ID_usuario,
      Tipo: "sugerencia",
      Mensaje: "No usaste casi nada de tu porción de imprevistos este período. Considera destinar parte de ese dinero a tus ahorros.",
      Entidad_tipo: "periodo_imprevistos_no_usado",
      Entidad_id: id_presupuesto,
    });
  } catch (error) {
    console.error("Error en verificarImprevistosNoUsados:", error.message);
  }
};

// --- META AHORRO ALCANZADA ---
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
  verificarUmbralDeudas,
  verificarUmbralAhorros,
  verificarUmbralEmergencia,
  verificarImprevistosNoUsados,
  verificarMetaAhorroAlcanzada,
  TIPOS_NOTIFICACION,
};