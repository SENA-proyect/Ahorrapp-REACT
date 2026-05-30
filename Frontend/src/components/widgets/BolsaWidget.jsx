import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'

const ACCIONES_DEFAULT = [
  { symbol: 'EC', nombre: 'Ecopetrol', icono: '🛢️', pais: 'Colombia' },
  { symbol: 'CIB', nombre: 'Bancolombia', icono: '🏦', pais: 'Colombia' },
  { symbol: 'NU', nombre: 'Nubank', icono: '💜', pais: 'Brasil / Colombia' },
  { symbol: 'BBVA', nombre: 'BBVA', icono: '🔵', pais: 'España / Colombia' },
  { symbol: 'GEB', nombre: 'Grupo Energía Bogotá', icono: '⚡', pais: 'Colombia' },
]
const TRM_DEFAULT = 4200

const metricasDetalle = (accion, formatCOP) => [
  { label: 'Precio actual', valor: `$${accion.precio.toFixed(2)} USD`, apoyo: formatCOP(accion.precio) },
  { label: 'Máximo del día', valor: `$${accion.maximo.toFixed(2)} USD`, apoyo: formatCOP(accion.maximo) },
  { label: 'Mínimo del día', valor: `$${accion.minimo.toFixed(2)} USD`, apoyo: formatCOP(accion.minimo) },
  { label: 'Apertura', valor: `$${accion.apertura.toFixed(2)} USD`, apoyo: formatCOP(accion.apertura) },
  { label: 'Cierre anterior', valor: `$${accion.cierreAnt.toFixed(2)} USD`, apoyo: formatCOP(accion.cierreAnt) },
  { label: 'Variación', valor: `${accion.subio ? '+' : ''}${accion.cambio.toFixed(2)} USD`, apoyo: `${accion.porcentaje.toFixed(2)}%` },
]

export default function BolsaWidget() {
  const { isDarkMode } = useTheme()
  const [acciones, setAcciones] = useState(ACCIONES_DEFAULT)
  const [datos, setDatos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [trm, setTrm] = useState(TRM_DEFAULT)

  useEffect(() => {
    fetch('/api/bolsa/trm/usd-cop')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.trm) setTrm(data.trm)
      })
      .catch(() => {})
  }, [])

  const fetchAcciones = async (lista) => {
    try {
      setError(null)
      const nuevos = {}
      await Promise.all(
        lista.map(async (accion) => {
          const res = await fetch(`/api/bolsa/${accion.symbol}`)
          const data = await res.json()
          if (!res.ok || data.ok === false) return
          nuevos[accion.symbol] = {
            precio: data.c ?? 0,
            cambio: data.d ?? 0,
            porcentaje: data.dp ?? 0,
            maximo: data.h ?? 0,
            minimo: data.l ?? 0,
            apertura: data.o ?? 0,
            cierreAnt: data.pc ?? 0,
            subio: (data.d ?? 0) >= 0,
          }
        })
      )
      setDatos((prev) => ({ ...prev, ...nuevos }))
    } catch (_) {
      setError('No se pudo conectar con la API de bolsa')
    }
  }

  useEffect(() => {
    setCargando(true)
    fetchAcciones(acciones).finally(() => setCargando(false))
    const intervalo = setInterval(() => fetchAcciones(acciones), 5 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [acciones])

  const agregarAccion = async () => {
    const sym = busqueda.trim().toUpperCase()
    if (!sym) return
    if (acciones.find((a) => a.symbol === sym)) {
      setError('Ese símbolo ya está agregado')
      return
    }

    const nueva = { symbol: sym, nombre: sym, icono: '📈', pais: 'Internacional' }
    setAcciones((prev) => [...prev, nueva])
    setBusqueda('')

    try {
      const res = await fetch(`/api/bolsa/${sym}`)
      const data = await res.json()
      if (!res.ok || data.ok === false) {
        setError(data.mensaje || 'No se pudo consultar el símbolo')
        return
      }
      setDatos((prev) => ({
        ...prev,
        [sym]: {
          precio: data.c ?? 0,
          cambio: data.d ?? 0,
          porcentaje: data.dp ?? 0,
          maximo: data.h ?? 0,
          minimo: data.l ?? 0,
          apertura: data.o ?? 0,
          cierreAnt: data.pc ?? 0,
          subio: (data.d ?? 0) >= 0,
        },
      }))
    } catch (_) {
      setError('No se pudo conectar con la API')
    }
  }

  const eliminarAccion = (symbol) => {
    setAcciones((prev) => prev.filter((a) => a.symbol !== symbol))
    setDatos((prev) => {
      const copia = { ...prev }
      delete copia[symbol]
      return copia
    })
    if (seleccionada?.symbol === symbol) setSeleccionada(null)
  }

  const seleccionarAccion = (accion) => {
    setSeleccionada(seleccionada?.symbol === accion.symbol ? null : { ...accion, ...datos[accion.symbol] })
  }

  const formatCOP = (usd) =>
    (usd * trm).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    })

  const accionesConDatos = acciones.filter((accion) => datos[accion.symbol])

  // Variantes de animación MÁS RÁPIDAS
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 5 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { delay: i * 0.02, duration: 0.2, type: 'spring', stiffness: 400, damping: 25 }
    }),
    hover: {
      y: -4,
      scale: 1.01,
      transition: { type: 'spring', stiffness: 600, damping: 20, duration: 0.15 }
    },
    tap: { scale: 0.99, duration: 0.05 }
  }

  const detailVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      marginTop: '1.5rem',
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  }

  const metricVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.02, duration: 0.15 }
    })
  }

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`w-full rounded-2xl border p-6 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-colors duration-300 ${
        isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/70'
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -5, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, duration: 0.2 }}
            className={`grid h-12 w-12 place-items-center rounded-xl border font-black ${
              isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100' : 'border-blue-300 bg-blue-100 text-blue-700'
            }`}
          >
            BV
          </motion.div>
          <div>
            <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bolsa de Valores</h2>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Seguimiento financiero en tiempo real</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <motion.span
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.1 }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              isDarkMode ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-green-300 bg-green-50 text-green-700'
            }`}
          >
            TRM {trm.toLocaleString('es-CO')} COP
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.1 }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              isDarkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-yellow-300 bg-yellow-50 text-yellow-700'
            }`}
          >
            Finnhub API
          </motion.span>
        </div>
      </div>

      {/* BUSCADOR */}
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.15 }}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') agregarAccion()
          }}
          placeholder="Agregar símbolo (AAPL, TSLA, NVDA...)"
          className={`min-h-11 flex-1 rounded-xl border px-4 text-sm outline-none transition focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-slate-500 ${
            isDarkMode
              ? 'border-white/10 bg-white/5 text-white focus:border-cyan-300/50 focus:ring-cyan-300/10'
              : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
          }`}
        />
        <motion.button
          type="button"
          onClick={agregarAccion}
          disabled={!busqueda.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
          className={`min-h-11 rounded-xl px-5 text-sm font-black transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ${
            isDarkMode
              ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400'
              : 'bg-blue-500 text-white'
          }`}
        >
          Agregar
        </motion.button>
      </motion.div>

      {/* MENSAJES */}
      <div className="mt-4 min-h-6">
        {cargando && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
          >
            Consultando precios...
          </motion.p>
        )}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className={`rounded-lg border px-3 py-2 text-sm ${
                isDarkMode ? 'border-rose-300/20 bg-rose-300/10 text-rose-100' : 'border-red-300 bg-red-50 text-red-700'
              }`}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* GRID DE ACCIONES */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {accionesConDatos.map((accion, idx) => {
          const d = datos[accion.symbol]
          const activa = seleccionada?.symbol === accion.symbol

          return (
            <motion.article
              key={accion.symbol}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              onClick={() => seleccionarAccion(accion)}
              className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                activa
                  ? isDarkMode
                    ? 'border-cyan-300/60 bg-cyan-300/10'
                    : 'border-blue-400 bg-blue-100'
                  : isDarkMode
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  eliminarAccion(accion.symbol)
                }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
                className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border text-gray-500 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:text-red-600 ${
                  isDarkMode
                    ? 'border-white/10 bg-transparent text-slate-400 dark:hover:border-rose-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-400'
                    : 'border-gray-200 bg-white hover:border-red-500 hover:bg-red-50'
                }`}
                aria-label={`Eliminar ${accion.nombre}`}
              >
                ✕
              </motion.button>

              <div className="flex items-start gap-3 pr-8">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20, duration: 0.2 }}
                  className="text-3xl"
                >
                  {accion.icono}
                </motion.div>
                <div className="min-w-0">
                  <h3 className={`truncate text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{accion.nombre}</h3>
                  <p className={`mt-0.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    {accion.symbol} · {accion.pais}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${d.precio.toFixed(2)}
                  <span className={`ml-1 text-[0.65rem] ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>USD</span>
                </p>
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{formatCOP(d.precio)}</p>
              </div>

              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.1 }}
                className={`mt-4 inline-flex rounded-lg px-2.5 py-1 text-xs font-black ${
                  d.subio
                    ? isDarkMode
                      ? 'bg-emerald-400/10 text-emerald-200'
                      : 'bg-green-100 text-green-700'
                    : isDarkMode
                    ? 'bg-rose-400/10 text-rose-200'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {d.subio ? '▲' : '▼'} {d.subio ? '+' : ''}
                {d.cambio.toFixed(2)} ({d.porcentaje.toFixed(2)}%)
              </motion.div>
            </motion.article>
          )
        })}
      </div>

      {/* DETALLE DE ACCIÓN SELECCIONADA */}
      <AnimatePresence>
        {seleccionada && (
          <motion.section
            variants={detailVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`overflow-hidden rounded-2xl border p-5 ${
              isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>
                  Detalle de acción
                </p>
                <h3 className={`mt-1 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {seleccionada.icono} {seleccionada.nombre}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {seleccionada.symbol} · {seleccionada.pais}
                </p>
              </div>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, duration: 0.2 }}
                className={`rounded-xl px-4 py-2 ${
                  seleccionada.subio
                    ? isDarkMode
                      ? 'bg-emerald-400/10 text-emerald-100'
                      : 'bg-green-100 text-green-700'
                    : isDarkMode
                    ? 'bg-rose-400/10 text-rose-100'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <p className="text-xs font-bold uppercase">Variación</p>
                <p className="text-lg font-black">
                  {seleccionada.subio ? '+' : ''}
                  {seleccionada.porcentaje.toFixed(2)}%
                </p>
              </motion.div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metricasDetalle(seleccionada, formatCOP).map((item, idx) => (
                <motion.div
                  key={item.label}
                  custom={idx}
                  variants={metricVariants}
                  initial="hidden"
                  animate="visible"
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-white/10 bg-slate-950/35' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-gray-600'}`}>
                    {item.label}
                  </p>
                  <p className={`mt-2 text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.valor}</p>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{item.apoyo}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.15 }}
        className={`mt-5 flex flex-col gap-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-600'} sm:flex-row sm:items-center sm:justify-between`}
      >
        <span>Actualización automática cada 5 minutos</span>
        <span>Haz clic en una acción para ver detalles</span>
      </motion.div>
    </motion.section>
  )
}