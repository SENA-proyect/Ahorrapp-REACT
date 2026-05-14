import { useState, useEffect } from 'react'

const ACCIONES_DEFAULT = [
  { symbol: 'EC', nombre: 'Ecopetrol', pais: 'Colombia' },
  { symbol: 'CIB', nombre: 'Bancolombia', pais: 'Colombia' },
  { symbol: 'NU', nombre: 'Nubank', pais: 'Brasil / Colombia' },
  { symbol: 'BBVA', nombre: 'BBVA', pais: 'Espana / Colombia' },
  { symbol: 'GEB', nombre: 'Grupo Energia Bogota', pais: 'Colombia' },
]

const TRM = 4200

const metricasDetalle = (accion, formatCOP) => [
  { label: 'Precio actual', valor: `$${accion.precio.toFixed(2)} USD`, apoyo: formatCOP(accion.precio) },
  { label: 'Maximo del dia', valor: `$${accion.maximo.toFixed(2)} USD`, apoyo: formatCOP(accion.maximo) },
  { label: 'Minimo del dia', valor: `$${accion.minimo.toFixed(2)} USD`, apoyo: formatCOP(accion.minimo) },
  { label: 'Apertura', valor: `$${accion.apertura.toFixed(2)} USD`, apoyo: formatCOP(accion.apertura) },
  { label: 'Cierre anterior', valor: `$${accion.cierreAnt.toFixed(2)} USD`, apoyo: formatCOP(accion.cierreAnt) },
  {
    label: 'Variacion',
    valor: `${accion.subio ? '+' : ''}${accion.cambio.toFixed(2)} USD`,
    apoyo: `${accion.porcentaje.toFixed(2)}%`,
  },
]

export default function BolsaWidget() {
  const [acciones, setAcciones] = useState(ACCIONES_DEFAULT)
  const [datos, setDatos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [trm, setTrm] = useState(TRM)

  useEffect(() => {
    fetch('http://localhost:3000/api/bolsa/trm/usd-cop')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
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
          const res = await fetch(`http://localhost:3000/api/bolsa/${accion.symbol}`)
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

      setDatos(prev => ({ ...prev, ...nuevos }))
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

    if (acciones.find(a => a.symbol === sym)) {
      setError('Ese simbolo ya esta en seguimiento')
      return
    }

    const nueva = { symbol: sym, nombre: sym, pais: 'Internacional' }
    setAcciones(prev => [...prev, nueva])
    setBusqueda('')

    try {
      const res = await fetch(`http://localhost:3000/api/bolsa/${sym}`)
      const data = await res.json()

      if (!res.ok || data.ok === false) {
        setError(data.mensaje || 'No se pudo consultar ese simbolo')
        return
      }

      setDatos(prev => ({
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
      setError('No se pudo conectar con la API de bolsa')
    }
  }

  const eliminarAccion = (symbol) => {
    setAcciones(prev => prev.filter(a => a.symbol !== symbol))
    setDatos(prev => {
      const copia = { ...prev }
      delete copia[symbol]
      return copia
    })
    if (seleccionada?.symbol === symbol) setSeleccionada(null)
  }

  const seleccionarAccion = (accion) => {
    setSeleccionada(
      seleccionada?.symbol === accion.symbol
        ? null
        : { ...accion, ...datos[accion.symbol] }
    )
  }

  const formatCOP = (usd) => {
    return (usd * trm).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    })
  }

  const accionesConDatos = acciones.filter(accion => datos[accion.symbol])

  return (
    <section className="w-full rounded-lg border border-white/10 bg-slate-950/35 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-sm font-black text-cyan-100">
              BV
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">Bolsa de Valores</h3>
              <p className="text-xs font-medium text-slate-400">Seguimiento rapido de acciones y TRM referencial</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 font-semibold text-emerald-100">
            TRM {trm.toLocaleString('es-CO')} COP
          </span>
          <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 font-semibold text-amber-100">
            Finnhub API
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregarAccion()}
          placeholder="Agregar simbolo, ej: AAPL, TSLA"
          className="min-h-11 flex-1 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/12 focus:ring-2 focus:ring-cyan-300/15"
        />
        <button
          type="button"
          onClick={agregarAccion}
          className="min-h-11 rounded-lg bg-cyan-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          disabled={!busqueda.trim()}
        >
          Agregar
        </button>
      </div>

      <div className="mt-4 min-h-6">
        {cargando && <p className="text-sm font-medium text-slate-400">Consultando precios...</p>}
        {error && (
          <p className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-medium text-amber-100">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {accionesConDatos.map((accion) => {
          const d = datos[accion.symbol]
          const estaSeleccionada = seleccionada?.symbol === accion.symbol

          return (
            <article
              key={accion.symbol}
              onClick={() => seleccionarAccion(accion)}
              className={`group relative min-h-[168px] cursor-pointer rounded-lg border p-4 transition hover:-translate-y-0.5 hover:bg-white/10 ${
                estaSeleccionada
                  ? 'border-cyan-300/70 bg-cyan-300/12 shadow-lg shadow-cyan-950/30'
                  : 'border-white/10 bg-white/6'
              }`}
            >
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  eliminarAccion(accion.symbol)
                }}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-white/10 text-xs font-bold text-slate-400 opacity-70 transition hover:border-rose-300/40 hover:bg-rose-400/10 hover:text-rose-100 group-hover:opacity-100"
                aria-label={`Eliminar ${accion.nombre}`}
              >
                X
              </button>

              <div className="flex items-start gap-3 pr-7">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-black text-white">
                  {accion.symbol.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-white">{accion.nombre}</h4>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">{accion.symbol} - {accion.pais}</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-2xl font-black text-white">
                  ${d.precio.toFixed(2)}
                  <span className="ml-1 text-[0.65rem] font-bold text-slate-400">USD</span>
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">{formatCOP(d.precio)}</p>
              </div>

              <div className={`mt-4 inline-flex rounded-md px-2.5 py-1 text-xs font-black ${
                d.subio ? 'bg-emerald-400/12 text-emerald-200' : 'bg-rose-400/12 text-rose-200'
              }`}>
                {d.subio ? 'Sube' : 'Baja'} {d.subio ? '+' : ''}{d.cambio.toFixed(2)} ({d.porcentaje.toFixed(2)}%)
              </div>
            </article>
          )
        })}
      </div>

      {seleccionada && (
        <section className="mt-5 rounded-lg border border-white/10 bg-white/6 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Detalle de accion</p>
              <h4 className="mt-1 text-xl font-black text-white">{seleccionada.nombre}</h4>
              <p className="text-sm font-medium text-slate-400">{seleccionada.symbol} - {seleccionada.pais}</p>
            </div>

            <div className={`rounded-lg px-4 py-2 text-right ${
              seleccionada.subio ? 'bg-emerald-400/12 text-emerald-100' : 'bg-rose-400/12 text-rose-100'
            }`}>
              <p className="text-xs font-bold uppercase tracking-wide">Variacion</p>
              <p className="text-lg font-black">
                {seleccionada.subio ? '+' : ''}{seleccionada.porcentaje.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metricasDetalle(seleccionada, formatCOP).map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-black text-white">{item.valor}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">{item.apoyo}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex flex-col gap-1 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Se actualiza cada 5 minutos.</span>
        <span>Haz clic en una accion para ver detalles.</span>
      </div>
    </section>
  )
}
