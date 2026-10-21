

export const MONTO_MAXIMO = 1_000_000_000_000
export const MONTO_MINIMO_GASTO = 50 // RF-03: restricción de formulario (web y móvil)

export const LIMITES = {
  descripcion: 255,
  causa: 255,
  fuente: 150,
  meta: 100,
  nombrePresupuesto: 80,
  descripcionPresupuesto: 255,
}

const pad = (n) => String(n).padStart(2, '0')

// Fecha de hoy (hora local) como AAAA-MM-DD, para atributos `max`/`min` y comparaciones.
export const hoyISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const fmtMonto = (n) => n.toLocaleString('es-CO')

// Devuelve un mensaje de error o null.
//   minimo       → monto mínimo permitido (ej. 50 para gastos)
//   permitirCero → true para metas/ingresos estimados que admiten 0
export const validarMonto = (valor, { nombre = 'El monto', minimo = null, permitirCero = false } = {}) => {
  if (valor === '' || valor === null || valor === undefined) return `${nombre} es obligatorio`
  const n = Number(valor)
  if (!Number.isFinite(n)) return `${nombre} debe ser un número válido`
  if (permitirCero ? n < 0 : n <= 0) {
    return permitirCero ? `${nombre} no puede ser negativo` : `${nombre} debe ser mayor a 0`
  }
  if (minimo !== null && n < minimo) return `${nombre} debe ser de al menos ${fmtMonto(minimo)}`
  if (n > MONTO_MAXIMO) return `${nombre} no puede superar ${fmtMonto(MONTO_MAXIMO)}`
  return null
}

export const validarLongitud = (valor, max, nombre) =>
  typeof valor === 'string' && valor.trim().length > max
    ? `${nombre} no puede superar ${max} caracteres`
    : null

// Cuotas: entero >= 1. Vacío es válido solo si `opcional` (pago único).
export const validarCuotas = (valor, { opcional = true, nombre = 'El número de cuotas' } = {}) => {
  if (valor === '' || valor === null || valor === undefined) {
    return opcional ? null : `${nombre} es obligatorio`
  }
  const n = Number(valor)
  return Number.isInteger(n) && n >= 1 ? null : `${nombre} debe ser un entero mayor a 0`
}

// `fin` no puede ser anterior a `inicio` (misma regla que la BD: fin >= inicio).
export const validarOrdenFechas = (inicio, fin, mensaje) =>
  inicio && fin && fin < inicio ? mensaje : null

// Una fecha no puede ser futura (ingresos, gastos e imprevistos).
export const validarNoFutura = (fecha, nombre = 'La fecha') =>
  fecha && fecha > hoyISO() ? `${nombre} no puede ser futura` : null

export const primerError = (...errores) => errores.find(Boolean) ?? null
