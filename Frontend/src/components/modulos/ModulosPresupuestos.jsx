import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPerfilesPrespuesto, activarPerfil, eliminarPerfil,
  getPeriodoActivo, abrirPeriodo, cerrarPeriodo, ajustarIngresoPeriodo,
  crearPerfil, editarPerfil,
} from '../../api'
import HeaderModulos from '../layout/HeaderModulos'
import { useTheme } from '../../hooks/useTheme'

const fmt      = (n) => `$${Number(n).toLocaleString('es-CO')}`
const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO') : '—'

const inputCls  = (dark) => `mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 ${
  dark
    ? 'border-white/15 bg-white/[0.07] text-zinc-100'
    : 'border-gray-300 bg-white text-gray-900'
}`
const labelCls  = (dark) => `mt-3.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] ${dark ? 'text-zinc-400' : 'text-gray-600'}`

// Barra visual de ejecución por categoría
const BarraEjecucion = ({ label, presupuestado, ejecutado, color, isDarkMode }) => {
  if (!presupuestado) return null
  const pct = Math.min(100, (ejecutado / presupuestado) * 100)
  const excede = ejecutado > presupuestado
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[0.72rem] mb-1">
        <span className={`font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{label}</span>
        <span className={excede ? 'text-red-400 font-bold' : isDarkMode ? 'text-zinc-400' : 'text-gray-600'}>
          {fmt(ejecutado)} / {fmt(presupuestado)}
        </span>
      </div>
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: excede ? 'linear-gradient(90deg,#f87171,#ef4444)' : color }} />
      </div>
    </div>
  )
}

// Formulario de perfil (crear / editar)
const DEFAULTS = { nombre: '', descripcion: '', dia_corte: '28', gastos: '40', deudas: '20', imprevistos: '15', ahorros: '15', emergencia: '10' }

function FormPerfil({ inicial, onGuardar, onCancelar, cargando, error, isDarkMode }) {
  const [form, setForm] = useState(inicial || DEFAULTS)

  const suma = ['gastos', 'deudas', 'imprevistos', 'ahorros', 'emergencia']
    .reduce((a, k) => a + (parseFloat(form[k]) || 0), 0)

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  return (
    <div className="flex flex-col gap-1">
      <label className={labelCls(isDarkMode)}>Nombre del perfil *</label>
      <input className={inputCls(isDarkMode)} type="text" name="nombre" placeholder="Ej: Perfil austero, Normal..." value={form.nombre} onChange={handleChange} />

      <label className={labelCls(isDarkMode)}>Descripción</label>
      <input className={inputCls(isDarkMode)} type="text" name="descripcion" placeholder="Descripción opcional" value={form.descripcion} onChange={handleChange} />

      <label className={labelCls(isDarkMode)}>Día de corte (1–28)</label>
      <input className={inputCls(isDarkMode)} type="number" name="dia_corte" min="1" max="28" value={form.dia_corte} onChange={handleChange} />

      <p className={`${labelCls(isDarkMode)} mb-2`}>Distribución del presupuesto (%)</p>

      {[
        { key: 'gastos',      label: 'Gastos',      color: 'text-red-400'    },
        { key: 'deudas',      label: 'Deudas',      color: 'text-purple-400' },
        { key: 'imprevistos', label: 'Imprevistos', color: 'text-orange-400' },
        { key: 'ahorros',     label: 'Ahorros',     color: 'text-amber-400'  },
        { key: 'emergencia',  label: 'Emergencia',  color: 'text-blue-400'   },
      ].map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-3 mt-2">
          <span className={`text-xs font-bold w-24 shrink-0 ${color}`}>{label}</span>
          <input
            className="flex-1 accent-amber-400 cursor-pointer"
            type="range" name={key} min="0" max="100" step="1"
            value={form[key]} onChange={handleChange}
          />
          <input
            className={`w-16 rounded-lg border px-2 py-1.5 text-sm text-center outline-none focus:border-amber-400/60 ${
              isDarkMode
                ? 'border-white/15 bg-white/[0.07] text-zinc-100'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
            type="number" name={key} min="0" max="100" step="1"
            value={form[key]} onChange={handleChange}
          />
          <span className="text-xs text-zinc-500 w-3">%</span>
        </div>
      ))}

      {/* Indicador de suma */}
      <div className={`mt-3 flex items-center justify-between rounded-xl px-4 py-2.5 border ${Math.abs(suma - 100) < 0.01 ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-red-400/30 bg-red-400/10'}`}>
        <span className="text-xs font-bold text-zinc-400">Total asignado</span>
        <span className={`text-sm font-black ${Math.abs(suma - 100) < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
          {suma.toFixed(1)}% {Math.abs(suma - 100) < 0.01 ? '✓' : '— debe ser 100%'}
        </span>
      </div>

      {error && <p className="mt-3 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">{error}</p>}

      <div className="mt-6 flex justify-end gap-2.5">
        <button onClick={onCancelar} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
          isDarkMode
            ? 'bg-transparent text-zinc-400 border-white/[0.15] hover:bg-white/[0.07]'
            : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100'
        }`}>Cancelar</button>
        <button onClick={() => onGuardar(form)} disabled={cargando || Math.abs(suma - 100) > 0.01}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
          {cargando ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  )
}

export default function ModuloPresupuestos() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const usuario  = useMemo(() => { try { return JSON.parse(localStorage.getItem('usuario')) } catch { return null } }, [])

  const [perfiles,      setPerfiles]      = useState([])
  const [periodo,       setPeriodo]       = useState(null)
  const [cargando,      setCargando]      = useState(true)
  const [modalCrear,    setModalCrear]    = useState(false)
  const [modalEditar,   setModalEditar]   = useState(null)
  const [modalAbrirPer, setModalAbrirPer] = useState(false)
  const [modalAjustar,  setModalAjustar]  = useState(false)
  const [confirmarId,   setConfirmarId]   = useState(null)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const [ingresoInput,  setIngresoInput]  = useState('')
  const [guardando,     setGuardando]     = useState(false)
  const [eliminando,    setEliminando]    = useState(false)
  const [errorModal,    setErrorModal]    = useState(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const [p, per] = await Promise.allSettled([getPerfilesPrespuesto(), getPeriodoActivo()])
      if (p.status === 'fulfilled') setPerfiles(p.value?.data ?? [])
      if (per.status === 'fulfilled') setPeriodo(per.value?.data ?? null)
    } catch {}
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const perfilActivo = useMemo(() => perfiles.find(p => p.Activo), [perfiles])

  // ── Activar perfil ──
  const handleActivar = async (id) => {
    try {
      await activarPerfil(id)
      cargar()
    } catch (e) { alert(e.message) }
  }

  // ── Eliminar perfil ──
  const handleEliminar = async () => {
    setEliminando(true)
    try {
      await eliminarPerfil(confirmarId)
      setConfirmarId(null)
      cargar()
    } catch (e) { alert(e.message) }
    finally { setEliminando(false) }
  }

  // ── Crear perfil ──
  const handleCrear = async (form) => {
    setErrorModal(null)
    setGuardando(true)
    try {
      const data = await crearPerfil({
        Nombre: form.nombre, Descripcion: form.descripcion || null,
        Dia_corte: Number(form.dia_corte),
        Porcentaje_gastos: Number(form.gastos),
        Porcentaje_deudas: Number(form.deudas),
        Porcentaje_imprevistos: Number(form.imprevistos),
        Porcentaje_ahorros: Number(form.ahorros),
        Porcentaje_emergencia: Number(form.emergencia),
      })
      if (data.ok) { setModalCrear(false); cargar() }
      else setErrorModal(data.mensaje || 'Error al crear')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  // ── Editar perfil ──
  const handleEditar = async (form) => {
    setErrorModal(null)
    setGuardando(true)
    try {
      const data = await editarPerfil(modalEditar.ID_presupuesto, {
        Nombre: form.nombre, Descripcion: form.descripcion || null,
        Dia_corte: Number(form.dia_corte),
        Porcentaje_gastos: Number(form.gastos),
        Porcentaje_deudas: Number(form.deudas),
        Porcentaje_imprevistos: Number(form.imprevistos),
        Porcentaje_ahorros: Number(form.ahorros),
        Porcentaje_emergencia: Number(form.emergencia),
      })
      if (data.ok) { setModalEditar(null); cargar() }
      else setErrorModal(data.mensaje || 'Error al editar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  // ── Abrir período ──
  const handleAbrirPeriodo = async () => {
    setErrorModal(null)
    const ingreso = parseFloat(ingresoInput)
    if (!ingreso || ingreso < 0) return setErrorModal('Ingresa un ingreso estimado válido')
    setGuardando(true)
    try {
      const data = await abrirPeriodo(ingreso)
      if (data.ok) { setModalAbrirPer(false); setIngresoInput(''); cargar() }
      else setErrorModal(data.mensaje || 'Error al abrir período')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  // ── Ajustar ingreso ──
  const handleAjustarIngreso = async () => {
    setErrorModal(null)
    const ingreso = parseFloat(ingresoInput)
    if (!ingreso || ingreso < 0) return setErrorModal('Ingresa un monto válido')
    setGuardando(true)
    try {
      const data = await ajustarIngresoPeriodo(ingreso)
      if (data.ok) { setModalAjustar(false); setIngresoInput(''); cargar() }
      else setErrorModal(data.mensaje || 'Error al ajustar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  // ── Cerrar período ──
  const handleCerrarPeriodo = async () => {
    setGuardando(true)
    try {
      const data = await cerrarPeriodo()
      if (data.ok) { setConfirmarCierre(false); cargar() }
    } catch {}
    finally { setGuardando(false) }
  }

  const initialEditar = (p) => ({
    nombre: p.Nombre, descripcion: p.Descripcion || '',
    dia_corte: String(p.Dia_corte),
    gastos: String(p.Porcentaje_gastos), deudas: String(p.Porcentaje_deudas),
    imprevistos: String(p.Porcentaje_imprevistos), ahorros: String(p.Porcentaje_ahorros),
    emergencia: String(p.Porcentaje_emergencia),
  })

  return (
    <div className={`min-h-screen w-full flex flex-col overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : '#f8f9fb'
      }}>

      <HeaderModulos section="Presupuestos" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-6 md:p-8 gap-6">

        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Bienvenido de vuelta</p>
          <h2 className={`text-xl sm:text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
        </div>

        {/* ── Período activo ── */}
        {periodo ? (
          <section className={`rounded-2xl border p-5 sm:p-7 flex flex-col gap-4 ${isDarkMode ? 'border-amber-400/30' : 'border-amber-300'}`}
            style={{
              background: isDarkMode
                ? 'radial-gradient(ellipse at top left, rgba(245,158,11,0.18), rgba(15,23,42,0.6))'
                : 'radial-gradient(ellipse at top left, rgba(251,191,36,0.1), rgba(255,255,255,0.5))'
            }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">📅 Período activo</span>
                  <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">Abierto</span>
                </div>
                <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{periodo.perfil_nombre}</p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{fmtFecha(periodo.Fecha_inicio)} → {fmtFecha(periodo.Fecha_fin)}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setIngresoInput(String(periodo.Ingreso_estimado)); setErrorModal(null); setModalAjustar(true) }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors">
                  Ajustar ingreso
                </button>
                <button onClick={() => setConfirmarCierre(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">
                  Cerrar período
                </button>
              </div>
            </div>

            {/* Montos por categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'Monto_gastos',      label: 'Gastos',      color: '#f87171' },
                { key: 'Monto_deudas',      label: 'Deudas',      color: '#c084fc' },
                { key: 'Monto_imprevistos', label: 'Imprevistos', color: '#fb923c' },
                { key: 'Monto_ahorros',     label: 'Ahorros',     color: '#fbbf24' },
                { key: 'Monto_emergencia',  label: 'Emergencia',  color: '#60a5fa' },
              ].map(({ key, label, color }) => (
                <div key={key} className={`rounded-xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white'}`}>
                  <p className="text-[0.72rem] font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
                  <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{fmt(periodo[key] ?? 0)}</p>
                </div>
              ))}
              <div className={`rounded-xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white'}`}>
                <p className={`text-[0.72rem] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Saldo anterior</p>
                <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{fmt(periodo.Saldo_anterior ?? 0)}</p>
              </div>
            </div>

            {/* Ingreso estimado vs real */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white'}`}>
                <p className={`text-[0.72rem] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Ingreso estimado</p>
                <p className="text-xl font-black text-amber-400">{fmt(periodo.Ingreso_estimado ?? 0)}</p>
              </div>
              <div className={`rounded-xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white'}`}>
                <p className={`text-[0.72rem] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Ingreso real</p>
                <p className="text-xl font-black text-emerald-400">{fmt(periodo.Ingreso_real ?? 0)}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
            style={{ background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff' }}>
            <div>
              <p className="text-amber-400 font-bold">Sin período activo</p>
              <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Activa un perfil y abre un período para empezar a registrar movimientos contra tu presupuesto.</p>
            </div>
            {perfilActivo && (
              <button onClick={() => { setIngresoInput(''); setErrorModal(null); setModalAbrirPer(true) }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm text-[#0f172a] shrink-0"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                Abrir período
              </button>
            )}
          </section>
        )}

        {/* ── Lista de perfiles ── */}
        <section className={`w-full rounded-2xl border overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)] ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
            backdropFilter: 'blur(16px)'
          }}>

          <div className={`flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-gray-200'}`}>
            <h3 className="text-base font-extrabold text-amber-400">📋 Perfiles de presupuesto</h3>
            <button onClick={() => { setErrorModal(null); setModalCrear(true) }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#0f172a] transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
              ➕ Nuevo perfil
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {cargando ? (
              <p className={`py-8 text-center text-sm italic animate-pulse ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>⏳ Cargando perfiles...</p>
            ) : perfiles.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl opacity-30">📊</span>
                <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>No tienes perfiles de presupuesto.</p>
                <p className={`text-xs max-w-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Crea un perfil con tu distribución ideal y úsalo para gestionar tus períodos.</p>
                <button onClick={() => { setErrorModal(null); setModalCrear(true) }}
                  className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0f172a]"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                  Crear primer perfil
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {perfiles.map(p => (
                  <article key={p.ID_presupuesto}
                    className={`rounded-xl border p-4 sm:p-5 transition-colors ${
                      p.Activo
                        ? 'border-amber-400/40 bg-amber-400/[0.06]'
                        : isDarkMode
                          ? 'border-white/10 bg-white/[0.03]'
                          : 'border-gray-200 bg-white'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{p.Nombre}</p>
                          {p.Activo && <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/40">Activo</span>}
                        </div>
                        {p.Descripcion && <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{p.Descripcion}</p>}
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Corte día {p.Dia_corte} — G:{p.Porcentaje_gastos}% D:{p.Porcentaje_deudas}% I:{p.Porcentaje_imprevistos}% A:{p.Porcentaje_ahorros}% E:{p.Porcentaje_emergencia}%</p>
                      </div>
                      <div className="flex gap-2 flex-wrap shrink-0">
                        {!p.Activo && (
                          <button onClick={() => handleActivar(p.ID_presupuesto)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors">
                            Activar
                          </button>
                        )}
                        {p.Activo && !periodo && (
                          <button onClick={() => { setIngresoInput(''); setErrorModal(null); setModalAbrirPer(true) }}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors">
                            Abrir período
                          </button>
                        )}
                        <button onClick={() => { setErrorModal(null); setModalEditar(p) }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-blue-400/50 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors">
                          Editar
                        </button>
                        {!p.Activo && (
                          <button onClick={() => setConfirmarId(p.ID_presupuesto)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className={`w-full px-4 py-6 text-center font-mono text-[0.7rem] ${isDarkMode ? 'text-zinc-600' : 'text-gray-500'}`}>
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className={`w-full max-w-[500px] rounded-[20px] p-7 border shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'border-white/[0.12]' : 'border-gray-200'
          }`}
            style={{ background: isDarkMode ? 'rgba(15,23,42,0.97)' : '#ffffff' }}>
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">✨ Nuevo perfil de presupuesto</h4>
            <p className={`text-xs mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Define cómo quieres distribuir tu ingreso mensual.</p>
            <FormPerfil onGuardar={handleCrear} onCancelar={() => setModalCrear(false)} cargando={guardando} error={errorModal} isDarkMode={isDarkMode} />
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className={`w-full max-w-[500px] rounded-[20px] p-7 border shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'border-white/[0.12]' : 'border-gray-200'
          }`}
            style={{ background: isDarkMode ? 'rgba(15,23,42,0.97)' : '#ffffff' }}>
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">✏️ Editar perfil</h4>
            <p className={`text-xs mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{modalEditar.Nombre}</p>
            <FormPerfil inicial={initialEditar(modalEditar)} onGuardar={handleEditar} onCancelar={() => setModalEditar(null)} cargando={guardando} error={errorModal} isDarkMode={isDarkMode} />
          </div>
        </div>
      )}

      {/* Modal Abrir período */}
      {modalAbrirPer && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className={`w-full max-w-[400px] rounded-[20px] p-7 border shadow-[0_24px_60px_rgba(0,0,0,0.6)] ${isDarkMode ? 'border-amber-400/20' : 'border-amber-300'}`}
            style={{ background: isDarkMode ? 'rgba(15,23,42,0.97)' : '#ffffff' }}>
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">📅 Abrir nuevo período</h4>
            <p className={`text-xs mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-600'}`}>Perfil activo: <span className={`font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-gray-900'}`}>{perfilActivo?.Nombre}</span></p>
            <p className={`text-xs mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-600'}`}>El ingreso estimado se usará para distribuir el presupuesto. Puedes ajustarlo después.</p>
            <label className={labelCls(isDarkMode)}>Ingreso estimado *</label>
            <input className={inputCls(isDarkMode)} type="number" min="0" step="1000" placeholder="Ej: 3000000"
              value={ingresoInput} onChange={e => setIngresoInput(e.target.value)} />
            {errorModal && <p className="mt-3 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">{errorModal}</p>}
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setModalAbrirPer(false)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                isDarkMode
                  ? 'bg-transparent text-zinc-400 border-white/[0.15] hover:bg-white/[0.07]'
                  : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}>Cancelar</button>
              <button onClick={handleAbrirPeriodo} disabled={guardando} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                {guardando ? 'Abriendo...' : 'Abrir período'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustar ingreso */}
      {modalAjustar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className={`w-full max-w-[400px] rounded-[20px] p-7 border shadow-[0_24px_60px_rgba(0,0,0,0.6)] ${isDarkMode ? 'border-amber-400/20' : 'border-amber-300'}`}
            style={{ background: isDarkMode ? 'rgba(15,23,42,0.97)' : '#ffffff' }}>
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">🔧 Ajustar ingreso estimado</h4>
            <p className={`text-xs mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-600'}`}>Esto recalculará los montos de cada categoría automáticamente.</p>
            <label className={labelCls(isDarkMode)}>Nuevo ingreso estimado *</label>
            <input className={inputCls(isDarkMode)} type="number" min="0" step="1000" placeholder="Ej: 3500000"
              value={ingresoInput} onChange={e => setIngresoInput(e.target.value)} />
            {errorModal && <p className="mt-3 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">{errorModal}</p>}
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setModalAjustar(false)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                isDarkMode
                  ? 'bg-transparent text-zinc-400 border-white/[0.15] hover:bg-white/[0.07]'
                  : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}>Cancelar</button>
              <button onClick={handleAjustarIngreso} disabled={guardando} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                {guardando ? 'Ajustando...' : 'Confirmar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar período */}
      {confirmarCierre && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className={`w-full max-w-[400px] rounded-[20px] p-7 border shadow-[0_24px_60px_rgba(0,0,0,0.6)] ${isDarkMode ? 'border-red-400/25' : 'border-red-300'}`}
            style={{ background: isDarkMode ? 'rgba(15,23,42,0.97)' : '#ffffff' }}>
            <h4 className="text-lg font-extrabold text-red-400 mb-2">🔒 ¿Cerrar el período?</h4>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>El sistema calculará el ingreso real y el saldo sobrante se acumulará al siguiente período.</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setConfirmarCierre(false)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                isDarkMode
                  ? 'bg-transparent text-zinc-400 border-white/[0.15] hover:bg-white/[0.07]'
                  : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}>Cancelar</button>
              <button onClick={handleCerrarPeriodo} disabled={guardando} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: guardando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)' }}>
                {guardando ? 'Cerrando...' : 'Cerrar período'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar perfil */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className={`w-full max-w-[380px] rounded-[20px] p-7 border shadow-[0_24px_60px_rgba(0,0,0,0.6)] ${isDarkMode ? 'border-red-400/25' : 'border-red-300'}`}
            style={{ background: isDarkMode ? 'rgba(15,23,42,0.97)' : '#ffffff' }}>
            <h4 className="text-lg font-extrabold text-red-400 mb-2">🗑️ ¿Eliminar perfil?</h4>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Esta acción no se puede deshacer. Solo se puede eliminar si no tiene períodos asociados.</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setConfirmarId(null)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                isDarkMode
                  ? 'bg-transparent text-zinc-400 border-white/[0.15] hover:bg-white/[0.07]'
                  : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}>Cancelar</button>
              <button onClick={handleEliminar} disabled={eliminando} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: eliminando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)' }}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}