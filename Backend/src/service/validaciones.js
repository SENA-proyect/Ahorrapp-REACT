

const MONTO_MAXIMO = 1_000_000_000_000; // DECIMAL(15,2) admite hasta ~1e13

const LIMITES = {
  descripcion: 255, // ingresos/ahorros/gastos/deudas/abonos/fondo
  causa: 255,       // imprevistos
  fuente: 150,      // ingresos y deudas
  meta: 100,        // nombre de la meta de ahorro
  nombre_presupuesto: 80,
  descripcion_presupuesto: 255,
};

// Convierte a número; vacío/undefined/null → NaN (nunca 0 silencioso).
const aNumero = (v) => {
  if (v === null || v === undefined || v === "") return NaN;
  if (typeof v === "boolean") return NaN;
  return Number(v);
};

// Valida un monto. Devuelve mensaje de error o null.
const validarMonto = (valor, { nombre = "El monto", permitirCero = false } = {}) => {
  const n = aNumero(valor);
  if (!Number.isFinite(n)) return `${nombre} debe ser un número válido`;
  if (permitirCero ? n < 0 : n <= 0) {
    return permitirCero
      ? `${nombre} no puede ser negativo`
      : `${nombre} debe ser mayor que cero`;
  }
  if (n > MONTO_MAXIMO) {
    return `${nombre} no puede superar ${MONTO_MAXIMO.toLocaleString("es-CO")}`;
  }
  return null;
};

// Valida longitud de un texto opcional. Devuelve mensaje o null.
const validarTexto = (valor, max, nombre) => {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== "string") return `${nombre} debe ser texto`;
  if (valor.trim().length > max) {
    return `${nombre} no puede superar ${max} caracteres`;
  }
  return null;
};

// Normaliza una fecha a 'YYYY-MM-DD'. Acepta 'YYYY-MM-DD' o ISO completo
// ('2026-10-08T00:00:00.000Z'), que es lo que devuelve JSON.stringify(Date).
// Devuelve null si está vacía; undefined si es inválida.
const normalizarFecha = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor !== "string") return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!m) return undefined;
  const [, y, mo, d] = m;
  const dt = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  const valida =
    dt.getUTCFullYear() === Number(y) &&
    dt.getUTCMonth() === Number(mo) - 1 &&
    dt.getUTCDate() === Number(d);
  return valida ? `${y}-${mo}-${d}` : undefined;
};

const fechaInvalida = (valor) => normalizarFecha(valor) === undefined;

// Entero positivo estricto (cuotas).
const esEnteroPositivo = (valor) => {
  const n = aNumero(valor);
  return Number.isInteger(n) && n >= 1;
};

// Primer error de una lista (ignora los null).
const primerError = (...errores) => errores.find((e) => e) || null;

// Mapea errores de PostgreSQL a respuestas 4xx en vez de 500.
// Devuelve true si ya respondió.
const responderErrorBD = (res, error, contexto = "") => {
  const mapa = {
    "23514": "Los datos enviados no cumplen las restricciones de la base de datos",
    "23503": "La categoría o el dependiente indicado no existe",
    "22001": "Alguno de los textos supera la longitud permitida",
    "22003": "Alguno de los valores numéricos está fuera de rango",
    "22P02": "Alguno de los valores enviados tiene un formato inválido",
    "22007": "Alguna de las fechas enviadas es inválida",
    "22008": "Alguna de las fechas enviadas es inválida",
  };
  if (error && mapa[error.code]) {
    res.status(400).json({ ok: false, mensaje: mapa[error.code] });
    return true;
  }
  if (contexto) console.error(`Error en ${contexto}:`, error?.message);
  return false;
};

module.exports = {
  MONTO_MAXIMO,
  LIMITES,
  aNumero,
  validarMonto,
  validarTexto,
  normalizarFecha,
  fechaInvalida,
  esEnteroPositivo,
  primerError,
  responderErrorBD,
};
