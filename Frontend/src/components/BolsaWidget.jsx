import { useState, useEffect } from 'react'

const ACCIONES_DEFAULT = [
  { symbol: 'EC',   nombre: 'Ecopetrol',            icono: '🛢️', pais: 'Colombia' },
  { symbol: 'CIB',  nombre: 'Bancolombia',           icono: '🏦', pais: 'Colombia' },
  { symbol: 'NU',   nombre: 'Nubank',                icono: '💜', pais: 'Brasil/Col' },
  { symbol: 'BBVA', nombre: 'BBVA',                  icono: '🔵', pais: 'España/Col' },
  { symbol: 'GEB',  nombre: 'Grupo Energía Bogotá',  icono: '⚡', pais: 'Colombia' },
]

const API_KEY = 'd7v307pr01qp7l70r6i0d7v307pr01qp7l70r6ig'
const TRM = 4200 // Tasa de cambio COP/USD aproximada

export default function BolsaWidget() {
  const [acciones, setAcciones]       = useState(ACCIONES_DEFAULT)
  const [datos, setDatos]             = useState({})
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)
  const [busqueda, setBusqueda]       = useState('')
  const [trm, setTrm]                 = useState(TRM)

  // Traer TRM real
  useEffect(() => {
    fetch('https://finnhub.io/api/v1/forex/rates?base=USD&token=' + API_KEY)
      .then(r => r.json())
      .then(data => {
        if (data.quote?.COP) setTrm(data.quote.COP)
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
        nuevos[accion.symbol] = {
          precio:     data.c ?? 0,
          cambio:     data.d ?? 0,
          porcentaje: data.dp ?? 0,
          maximo:     data.h ?? 0,
          minimo:     data.l ?? 0,
          apertura:   data.o ?? 0,
          cierreAnt:  data.pc ?? 0,
          subio:      (data.d ?? 0) >= 0,
        }
      })
    )
    setDatos(prev => ({ ...prev, ...nuevos }))
  } catch (err) {
    setError('No se pudo conectar con la API')
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
  if (acciones.find(a => a.symbol === sym)) return alert('Ya está en la lista')
  const nueva = { symbol: sym, nombre: sym, icono: '📊', pais: 'Internacional' }
  setAcciones(prev => [...prev, nueva])
  setBusqueda('')
  
  // Traer datos inmediatamente
  try {
    const res = await fetch(`http://localhost:3000/api/bolsa/${sym}`)
    const data = await res.json()
    setDatos(prev => ({
      ...prev,
      [sym]: {
        precio:     data.c ?? 0,
        cambio:     data.d ?? 0,
        porcentaje: data.dp ?? 0,
        maximo:     data.h ?? 0,
        minimo:     data.l ?? 0,
        apertura:   data.o ?? 0,
        cierreAnt:  data.pc ?? 0,
        subio:      (data.d ?? 0) >= 0,
      }
    }))
  } catch (_) {}
}

  const eliminarAccion = (symbol) => {
    setAcciones(prev => prev.filter(a => a.symbol !== symbol))
    setDatos(prev => { const d = { ...prev }; delete d[symbol]; return d })
    if (seleccionada?.symbol === symbol) setSeleccionada(null)
  }

  const formatCOP = (usd) => {
    return (usd * trm).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
  }

  return (
    <section className="box2" style={{ marginTop: '20px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: 'var(--deudas-base)', fontWeight: 'var(--font-bold)', fontSize: '1rem' }}>
          📈 Bolsa de Valores — Enfoque Colombiano
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            TRM: ${trm.toLocaleString('es-CO')} COP
          </span>
          <span style={{
            fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px',
            background: 'var(--color-primary-soft)', color: 'var(--color-primary-dark)',
            border: '1px solid var(--color-primary-low)',
          }}>
            Finnhub API
          </span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregarAccion()}
          placeholder="Agregar símbolo (ej: AAPL, TSLA...)"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '8px',
            border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
            color: 'var(--color-text-main)', fontSize: '0.85rem', outline: 'none'
          }}
        />
        <button
          onClick={agregarAccion}
          className="btn-secundario"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          + Agregar
        </button>
      </div>

      {cargando && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Consultando precios...</p>}
      {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}

      {/* TARJETAS */}
      {!error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', width: '100%' }}>
          {acciones.map((accion) => {
            const d = datos[accion.symbol]
            if (!d) return null
            return (
              <div
                key={accion.symbol}
                onClick={() => setSeleccionada(
  seleccionada?.symbol === accion.symbol 
    ? null 
    : { ...accion, ...datos[accion.symbol] }
)}
               style={{
  padding: '14px', borderRadius: '12px', cursor: 'pointer',
  background: d.subio ? 'var(--ingresos-bg)' : 'var(--imprevistos-bg)',
  border: `1px solid ${seleccionada?.symbol === accion.symbol ? 'var(--color-primary)' : 'transparent'}`,
  transition: 'all 0.2s', position: 'relative'
}}
              >
                {/* Botón eliminar */}
                <button
                  onClick={e => { e.stopPropagation(); eliminarAccion(accion.symbol) }}
                  style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', fontSize: '0.75rem'
                  }}
                >✕</button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{accion.icono}</span>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{accion.nombre}</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{accion.symbol} · {accion.pais}</p>
                  </div>
                </div>

                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                  ${d.precio.toFixed(2)} <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>USD</span>
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                  ≈ {formatCOP(d.precio)}
                </p>
                <p style={{
                  fontSize: '0.78rem', fontWeight: 'bold',
                  color: d.subio ? 'var(--ingresos-dark)' : 'var(--imprevistos-dark)'
                }}>
                  {d.subio ? '▲' : '▼'} {d.subio ? '+' : ''}{d.cambio.toFixed(2)} ({d.porcentaje.toFixed(2)}%)
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* DETALLE AL HACER CLIC */}
      {seleccionada && (
        <div style={{
          marginTop: '16px', padding: '16px', borderRadius: '12px',
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)'
        }}>
          <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '12px' }}>
            {seleccionada.icono} {seleccionada.nombre} — Detalle
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Precio actual', valor: `$${seleccionada.precio.toFixed(2)} USD`, cop: formatCOP(seleccionada.precio) },
              { label: 'Máximo del día', valor: `$${seleccionada.maximo.toFixed(2)} USD`, cop: formatCOP(seleccionada.maximo) },
              { label: 'Mínimo del día', valor: `$${seleccionada.minimo.toFixed(2)} USD`, cop: formatCOP(seleccionada.minimo) },
              { label: 'Apertura', valor: `$${seleccionada.apertura.toFixed(2)} USD`, cop: formatCOP(seleccionada.apertura) },
              { label: 'Cierre anterior', valor: `$${seleccionada.cierreAnt.toFixed(2)} USD`, cop: formatCOP(seleccionada.cierreAnt) },
              { label: 'Variación', valor: `${seleccionada.subio ? '+' : ''}${seleccionada.cambio.toFixed(2)} USD`, cop: `${seleccionada.porcentaje.toFixed(2)}%` },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px', borderRadius: '8px', background: 'var(--color-bg-soft)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{item.valor}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{item.cop}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '12px', textAlign: 'right' }}>
        Datos: Finnhub API · TRM referencial · Se actualiza cada 5 min · Haz clic en una acción para ver detalles
      </p>

    </section>
  )
}
