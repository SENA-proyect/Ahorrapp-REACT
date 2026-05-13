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

  // ── Tokens de diseño (coinciden con el tema del Dashboard) ──────────────────
  const S = {
    section: {
      width: '100%',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    },
    header: {
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '8px',
    },
    titulo: {
      fontSize: '1rem', fontWeight: '800',
      background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.01em',
    },
    badgeTrm: {
      fontSize: '0.7rem', color: '#a1a1aa',
    },
    badgeApi: {
      fontSize: '0.68rem', padding: '3px 10px', borderRadius: '999px',
      background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
      border: '1px solid rgba(251,191,36,0.30)', fontWeight: '600',
    },
    inputRow: {
      display: 'flex', gap: '8px', marginBottom: '1.1rem',
    },
    input: {
      flex: 1, padding: '9px 14px', borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.06)',
      color: '#f4f4f5', fontSize: '0.85rem', outline: 'none',
      transition: 'border-color 0.2s',
    },
    btnAgregar: {
      padding: '9px 18px', borderRadius: '10px', fontWeight: '700',
      fontSize: '0.85rem', cursor: 'pointer', border: 'none',
      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      color: '#0f172a', transition: 'opacity 0.2s, transform 0.15s',
    },
    cargando: {
      color: '#a1a1aa', fontSize: '0.82rem', marginBottom: '8px',
    },
    errorTxt: {
      color: '#f87171', fontSize: '0.82rem', marginBottom: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
      gap: '12px', width: '100%',
    },
    cardBase: (subio, activa) => ({
      padding: '14px', borderRadius: '14px', cursor: 'pointer',
      position: 'relative', transition: 'transform 0.18s, box-shadow 0.18s',
      background: subio
        ? 'radial-gradient(ellipse at left, rgba(34,197,94,0.18), rgba(16,185,129,0.05))'
        : 'radial-gradient(ellipse at left, rgba(239,68,68,0.18), rgba(220,38,38,0.05))',
      border: `1px solid ${activa
        ? subio ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)'
        : 'rgba(255,255,255,0.08)'}`,
      boxShadow: activa ? '0 0 16px rgba(251,191,36,0.18)' : 'none',
    }),
    btnEliminar: {
      position: 'absolute', top: '7px', right: '7px',
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '50%', width: '18px', height: '18px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: '#a1a1aa', fontSize: '0.6rem',
      transition: 'background 0.15s',
    },
    cardLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#f4f4f5' },
    cardSub:   { fontSize: '0.65rem', color: '#71717a' },
    cardPrecio: { fontSize: '1.05rem', fontWeight: '900', color: '#ffffff', marginTop: '8px' },
    cardUsd:    { fontSize: '0.6rem', color: '#71717a', marginLeft: '3px' },
    cardCop:    { fontSize: '0.68rem', color: '#a1a1aa', marginTop: '1px' },
    cardVar: (subio) => ({
      fontSize: '0.76rem', fontWeight: '700', marginTop: '5px',
      color: subio ? '#34d399' : '#f87171',
    }),
    detalle: {
      marginTop: '16px', padding: '18px', borderRadius: '14px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
    },
    detalleTitle: {
      fontWeight: '800', fontSize: '0.95rem', color: '#fbbf24', marginBottom: '14px',
    },
    detalleGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px',
    },
    detalleCell: {
      padding: '10px 12px', borderRadius: '10px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
    },
    detalleCellLabel: { fontSize: '0.65rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' },
    detalleCellValor: { fontSize: '0.88rem', fontWeight: '800', color: '#f4f4f5' },
    detalleCellCop:   { fontSize: '0.65rem', color: '#a1a1aa', marginTop: '2px' },
    footer: {
      fontSize: '0.67rem', color: '#52525b',
      marginTop: '14px', textAlign: 'right', letterSpacing: '0.01em',
    },
  }

  return (
    <section style={S.section}>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <p style={S.titulo}>📈 Bolsa de Valores — Enfoque Colombiano</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={S.badgeTrm}>TRM: ${trm.toLocaleString('es-CO')} COP</span>
          <span style={S.badgeApi}>Finnhub API</span>
        </div>
      </div>

      {/* ── BUSCADOR ── */}
      <div style={S.inputRow}>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregarAccion()}
          placeholder="Agregar símbolo (ej: AAPL, TSLA…)"
          style={S.input}
        />
        <button
          onClick={agregarAccion}
          style={S.btnAgregar}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
        >
          + Agregar
        </button>
      </div>

      {cargando && <p style={S.cargando}>⏳ Consultando precios…</p>}
      {error    && <p style={S.errorTxt}>⚠ {error}</p>}

      {/* ── TARJETAS ── */}
      {!error && (
        <div style={S.grid}>
          {acciones.map((accion) => {
            const d = datos[accion.symbol]
            if (!d) return null
            const activa = seleccionada?.symbol === accion.symbol
            return (
              <div
                key={accion.symbol}
                style={S.cardBase(d.subio, activa)}
                onClick={() => setSeleccionada(activa ? null : { ...accion, ...datos[accion.symbol] })}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = activa ? '0 0 16px rgba(251,191,36,0.18)' : 'none' }}
              >
                {/* Botón eliminar */}
                <button
                  onClick={e => { e.stopPropagation(); eliminarAccion(accion.symbol) }}
                  style={S.btnEliminar}
                  title="Eliminar"
                >✕</button>

                {/* Nombre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px', paddingRight: '18px' }}>
                  <span style={{ fontSize: '1.3rem' }}>{accion.icono}</span>
                  <div>
                    <p style={S.cardLabel}>{accion.nombre}</p>
                    <p style={S.cardSub}>{accion.symbol} · {accion.pais}</p>
                  </div>
                </div>

                {/* Precio */}
                <p style={S.cardPrecio}>
                  ${d.precio.toFixed(2)}<span style={S.cardUsd}>USD</span>
                </p>
                <p style={S.cardCop}>≈ {formatCOP(d.precio)}</p>

                {/* Variación */}
                <p style={S.cardVar(d.subio)}>
                  {d.subio ? '▲' : '▼'} {d.subio ? '+' : ''}{d.cambio.toFixed(2)} ({d.porcentaje.toFixed(2)}%)
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── DETALLE ── */}
      {seleccionada && (
        <div style={S.detalle}>
          <p style={S.detalleTitle}>{seleccionada.icono} {seleccionada.nombre} — Detalle</p>
          <div style={S.detalleGrid}>
            {[
              { label: 'Precio actual',   valor: `$${seleccionada.precio.toFixed(2)} USD`,    cop: formatCOP(seleccionada.precio) },
              { label: 'Máximo del día',  valor: `$${seleccionada.maximo.toFixed(2)} USD`,    cop: formatCOP(seleccionada.maximo) },
              { label: 'Mínimo del día',  valor: `$${seleccionada.minimo.toFixed(2)} USD`,    cop: formatCOP(seleccionada.minimo) },
              { label: 'Apertura',        valor: `$${seleccionada.apertura.toFixed(2)} USD`,  cop: formatCOP(seleccionada.apertura) },
              { label: 'Cierre anterior', valor: `$${seleccionada.cierreAnt.toFixed(2)} USD`, cop: formatCOP(seleccionada.cierreAnt) },
              { label: 'Variación',       valor: `${seleccionada.subio ? '+' : ''}${seleccionada.cambio.toFixed(2)} USD`, cop: `${seleccionada.porcentaje.toFixed(2)}%` },
            ].map((item, i) => (
              <div key={i} style={S.detalleCell}>
                <p style={S.detalleCellLabel}>{item.label}</p>
                <p style={S.detalleCellValor}>{item.valor}</p>
                <p style={S.detalleCellCop}>{item.cop}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={S.footer}>
        Datos: Finnhub API · TRM referencial · Se actualiza cada 5 min · Haz clic en una acción para ver detalles
      </p>

    </section>
  )
}