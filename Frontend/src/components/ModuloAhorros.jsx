import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias, abonarAhorro } from '../api'
import ModalNuevoMovimiento from './ModalNuevoMovimiento'
import HeaderModulos from './HeaderModulos'

const API = 'http://localhost:3000/api/movimientos'

const fmt      = (n) => `$${Number(n).toLocaleString('es-CO')}`
const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO') : '—'

const inputCls = 'mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20'
const labelCls = 'mt-3.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400'

// Barra de progreso hacia la meta
const BarraProgreso = ({ acumulado, meta }) => {
  if (!meta || Number(meta) <= 0) return null
  const pct = Math.min(100, (Number(acumulado) / Number(meta)) * 100)
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[0.7rem] text-zinc-500 mb-1">
        <span>{fmt(acumulado)} acumulado</span>
        <span>Meta: {fmt(meta)}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#fbbf24,#f59e0b)' }} />
      </div>
      <p className="text-right text-[0.7rem] text-zinc-500 mt-0.5">{pct.toFixed(1)}%</p>
    </div>
  )
}

export default function ModuloAhorros() {
  const navigate = useNavigate()
  const usuario  = useMemo(() => { try { return JSON.parse(localStorage.getItem('usuario')) } catch { return null } }, [])

  const [ahorros,     setAhorros]     = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalNuevo,  setModalNuevo]  = useState(false)
  const [categorias,  setCategorias]  = useState([])
  const [modalEditar, setModalEditar] = useState(null)
  const [modalAbonar, setModalAbonar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [abonando,    setAbonando]    = useState(false)
  const [errorModal,  setErrorModal]  = useState(null)
  const [montoAbono,  setMontoAbono]  = useState('')

  const cargar = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/ahorros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAhorros(d) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
    getCategorias().then(d => { if (Array.isArray(d)) setCategorias(d) }).catch(() => {})
  }, [])

  const total = useMemo(() => ahorros.reduce((a, i) => a + Number(i.monto || 0), 0), [ahorros])

  const abrirEditar = (a) => {
    setErrorModal(null)
    setModalEditar({
      id: a.id, monto: String(a.monto),
      monto_acumulado: String(a.monto_acumulado ?? 0),
      meta: a.meta || '', descripcion: a.descripcion || '',
      fecha_registro: a.fecha ? a.fecha.slice(0, 10) : '',
      fecha_meta: a.fecha_meta ? a.fecha_meta.slice(0, 10) : '',
      id_categoria: a.id_categoria || '',
    })
  }

  const abrirAbonar = (a) => {
    setErrorModal(null)
    setMontoAbono('')
    setModalAbonar(a)
  }

  const handleChange = (e) => setModalEditar(p => ({ ...p, [e.target.name]: e.target.value }))

  const guardar = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0)
      return setErrorModal('El monto debe ser mayor a 0')
    if (modalEditar.fecha_meta && modalEditar.fecha_registro && modalEditar.fecha_meta < modalEditar.fecha_registro)
      return setErrorModal('La fecha meta no puede ser anterior a la de registro')
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res  = await fetch(`${API}/ahorros/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto: Number(modalEditar.monto),
          monto_acumulado: Number(modalEditar.monto_acumulado) || 0,
          meta: modalEditar.meta || null,
          descripcion: modalEditar.descripcion || null,
          fecha_registro: modalEditar.fecha_registro || null,
          fecha_meta: modalEditar.fecha_meta || null,
          id_categoria: modalEditar.id_categoria || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargar() }
      else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const hacerAbono = async () => {
    setErrorModal(null)
    const monto = parseFloat(montoAbono)
    if (!monto || monto <= 0) return setErrorModal('El monto del abono debe ser mayor a 0')
    setAbonando(true)
    try {
      const data = await abonarAhorro(modalAbonar.id, monto)
      if (data.ok) { setModalAbonar(null); cargar() }
      else setErrorModal(data.mensaje || 'Error al abonar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setAbonando(false) }
  }

  const eliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ahorros/${confirmarId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { setConfirmarId(null); cargar() }
    } catch {}
    finally { setEliminando(false) }
  }

  return (
    <div className="min-h-screen w-full flex flex-col text-white overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }}>

      <HeaderModulos section="Ahorros" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-6 md:p-8 gap-6">

        <div>
          <p className="text-sm text-zinc-400">Bienvenido de vuelta</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
        </div>

        {/* Stat card */}
        <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6 rounded-2xl border border-white/10"
          style={{ background: 'radial-gradient(ellipse at left, rgba(245,158,11,0.35), rgba(249,115,22,0.04))' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">🎯 Total Ahorros</p>
            <p className="text-3xl sm:text-4xl font-black text-white">{fmt(total)}</p>
            <p className="text-xs text-zinc-500 mt-1">{ahorros.length} plan{ahorros.length !== 1 ? 'es' : ''} de ahorro</p>
          </div>
          <button onClick={() => setModalNuevo(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm text-[#0f172a] transition-all duration-300 hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
            ➕ Nuevo Ahorro
          </button>
        </article>

        {/* Tabla */}
        <section className="w-full rounded-2xl border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>

          <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-white/[0.08]">
            <h3 className="text-base font-extrabold text-amber-400">📋 Módulo de Ahorros</h3>
            <span className="text-xs text-zinc-600">{ahorros.length} registro{ahorros.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="p-4 sm:p-5">
            {cargando ? (
              <p className="py-8 text-center text-sm italic text-zinc-500 animate-pulse">⏳ Cargando ahorros...</p>
            ) : ahorros.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl opacity-30">🎯</span>
                <p className="text-zinc-400 text-sm">No hay ahorros registrados aún.</p>
                <button onClick={() => setModalNuevo(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0f172a]"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                  Registrar primer ahorro
                </button>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="flex flex-col gap-3 md:hidden">
                  {ahorros.map(a => (
                    <article key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{a.meta || 'Sin meta'}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{fmtFecha(a.fecha)}</p>
                          {a.descripcion && <p className="text-xs text-zinc-400 mt-1 truncate">{a.descripcion}</p>}
                          {a.categoria && <p className="text-xs text-zinc-500 mt-1">📂 {a.categoria}</p>}
                          <BarraProgreso acumulado={a.monto_acumulado} meta={a.monto} />
                        </div>
                        <p className="shrink-0 text-base font-black text-amber-400">{fmt(a.monto)}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button onClick={() => abrirAbonar(a)} className="rounded-lg border border-amber-400/50 bg-amber-400/10 py-2 text-xs font-bold text-amber-400 hover:bg-amber-400/20 transition-colors">Abonar</button>
                        <button onClick={() => abrirEditar(a)} className="rounded-lg border border-blue-400/50 bg-blue-400/10 py-2 text-xs font-bold text-blue-400 hover:bg-blue-400/20 transition-colors">Editar</button>
                        <button onClick={() => setConfirmarId(a.id)} className="rounded-lg border border-red-400/50 bg-red-400/10 py-2 text-xs font-bold text-red-400 hover:bg-red-400/20 transition-colors">Eliminar</button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Fecha', 'Meta / Objetivo', 'Categoría', 'Progreso', 'Meta fecha', 'Monto', 'Acciones'].map(col => (
                          <th key={col} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ahorros.map(a => (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                          <td className="px-4 py-3 text-sm text-zinc-300">{fmtFecha(a.fecha)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">
                            <p className="font-semibold text-white">{a.meta || '—'}</p>
                            {a.descripcion && <p className="text-xs text-zinc-500 truncate max-w-[160px]">{a.descripcion}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{a.categoria || '—'}</td>
                          <td className="px-4 py-3 min-w-[160px]">
                            <BarraProgreso acumulado={a.monto_acumulado} meta={a.monto} />
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{fmtFecha(a.fecha_meta)}</td>
                          <td className="px-4 py-3 text-sm font-extrabold text-amber-400">{fmt(a.monto)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => abrirAbonar(a)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors">Abonar</button>
                              <button onClick={() => abrirEditar(a)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-400/50 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors">Editar</button>
                              <button onClick={() => setConfirmarId(a.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full px-4 py-6 text-center font-mono text-[0.7rem] text-zinc-600">
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* Modal Abonar */}
      {modalAbonar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="w-full max-w-[400px] rounded-[20px] p-7 border border-amber-400/20 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            style={{ background: 'rgba(15,23,42,0.95)' }}>
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">💰 Abonar al ahorro</h4>
            <p className="text-xs text-zinc-500 mb-1">{modalAbonar.meta || 'Sin meta definida'}</p>
            <BarraProgreso acumulado={modalAbonar.monto_acumulado} meta={modalAbonar.monto} />

            <label className={labelCls}>Monto del abono *</label>
            <input className={inputCls} type="number" min="0.01" step="0.01" placeholder="0.00"
              value={montoAbono} onChange={e => setMontoAbono(e.target.value)} />

            {errorModal && <p className="mt-3 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">{errorModal}</p>}

            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setModalAbonar(null)} className="px-5 py-2.5 rounded-[10px] text-sm font-bold bg-transparent text-zinc-400 border border-white/[0.15] hover:bg-white/[0.07] transition-colors">Cancelar</button>
              <button onClick={hacerAbono} disabled={abonando} className="px-5 py-2.5 rounded-[10px] text-sm font-bold text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ background: abonando ? 'rgba(251,191,36,0.4)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                {abonando ? 'Abonando...' : 'Confirmar abono'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="w-full max-w-[460px] rounded-[20px] p-7 border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.95)' }}>
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">✏️ Editar Ahorro</h4>
            <p className="text-xs text-zinc-500 mb-2">Modifica los campos que necesites y guarda.</p>

            <label className={labelCls}>Monto (meta) *</label>
            <input className={inputCls} type="number" name="monto" min="0" step="0.01" value={modalEditar.monto} onChange={handleChange} />

            <label className={labelCls}>Monto acumulado</label>
            <input className={inputCls} type="number" name="monto_acumulado" min="0" step="0.01" value={modalEditar.monto_acumulado} onChange={handleChange} />

            <label className={labelCls}>Meta u objetivo</label>
            <input className={inputCls} type="text" name="meta" placeholder="Ej: Vacaciones, Fondo de emergencia..." value={modalEditar.meta} onChange={handleChange} />

            <label className={labelCls}>Categoría</label>
            <select className={inputCls} name="id_categoria" value={modalEditar.id_categoria} onChange={handleChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>

            <label className={labelCls}>Descripción</label>
            <input className={inputCls} type="text" name="descripcion" placeholder="Descripción opcional" value={modalEditar.descripcion} onChange={handleChange} />

            <label className={labelCls}>Fecha de registro</label>
            <input className={inputCls} type="date" name="fecha_registro" value={modalEditar.fecha_registro} onChange={handleChange} />

            <label className={labelCls}>Fecha meta</label>
            <input className={inputCls} type="date" name="fecha_meta" value={modalEditar.fecha_meta} onChange={handleChange} />

            {errorModal && <p className="mt-3 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">{errorModal}</p>}

            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setModalEditar(null)} className="px-5 py-2.5 rounded-[10px] text-sm font-bold bg-transparent text-zinc-400 border border-white/[0.15] hover:bg-white/[0.07] transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="px-5 py-2.5 rounded-[10px] text-sm font-bold text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ background: guardando ? 'rgba(251,191,36,0.4)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="w-full max-w-[380px] rounded-[20px] p-7 border border-red-400/25 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            style={{ background: 'rgba(15,23,42,0.95)' }}>
            <h4 className="text-lg font-extrabold text-red-400 mb-2">🗑️ ¿Eliminar ahorro?</h4>
            <p className="text-sm text-zinc-400">Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setConfirmarId(null)} className="px-5 py-2.5 rounded-[10px] text-sm font-bold bg-transparent text-zinc-400 border border-white/[0.15] hover:bg-white/[0.07] transition-colors">Cancelar</button>
              <button onClick={eliminar} disabled={eliminando} className="px-5 py-2.5 rounded-[10px] text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ background: eliminando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)' }}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalNuevo && (
        <ModalNuevoMovimiento
          subtipo="Ahorro"
          onCerrar={() => setModalNuevo(false)}
          onGuardado={() => cargar()}
        />
      )}
    </div>
  )
}