import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getCategorias, getDependientes } from '../../api'
import { useTheme } from '../../hooks/useTheme'

const API = 'http://localhost:3000/api/movimientos'

const CONFIG = {
  Ingreso:    { tipo_flujo: 'Entrada', label: 'Ingreso',    emoji: '💰', color: 'emerald' },
  Ahorro:     { tipo_flujo: 'Entrada', label: 'Ahorro',     emoji: '🎯', color: 'amber'   },
  Gasto:      { tipo_flujo: 'Salida',  label: 'Gasto',      emoji: '💸', color: 'red'     },
  Deuda:      { tipo_flujo: 'Salida',  label: 'Deuda',      emoji: '💳', color: 'purple'  },
  Imprevisto: { tipo_flujo: 'Salida',  label: 'Imprevisto', emoji: '⚡', color: 'orange'  },
}

const COLORES = {
  emerald: { ring: 'focus:border-emerald-400/60 focus:ring-emerald-400/20', btn: 'linear-gradient(135deg,#34d399,#10b981)', title: 'text-emerald-400' },
  amber:   { ring: 'focus:border-amber-400/60 focus:ring-amber-400/20',     btn: 'linear-gradient(135deg,#fbbf24,#f59e0b)', title: 'text-amber-400',   btnText: 'text-[#0f172a]' },
  red:     { ring: 'focus:border-red-400/60 focus:ring-red-400/20',         btn: 'linear-gradient(135deg,#f87171,#ef4444)', title: 'text-red-400'     },
  purple:  { ring: 'focus:border-purple-400/60 focus:ring-purple-400/20',   btn: 'linear-gradient(135deg,#c084fc,#a855f7)', title: 'text-purple-400'  },
  orange:  { ring: 'focus:border-orange-400/60 focus:ring-orange-400/20',   btn: 'linear-gradient(135deg,#fb923c,#f97316)', title: 'text-orange-400'  },
}

const labelCls  = (dark) => `mt-3.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] ${dark ? 'text-zinc-400' : 'text-gray-600'}`
const mkInput  = (ring, dark) => `mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 ${ring} ${
  dark
    ? 'border-white/15 bg-white/[0.07] text-zinc-100'
    : 'border-gray-300 bg-white text-gray-900'
}`

const INICIAL = {
  Ingreso:    { monto: '', fuente: '', descripcion: '', fecha_registro: '', id_categoria: '' },
  Ahorro:     { monto: '', meta: '', descripcion: '', fecha_registro: '', fecha_meta: '', id_categoria: '' },
  Gasto:      { monto: '', descripcion: '', fecha_registro: '', id_categoria: '', id_dependientes: '' },
  Deuda:      { monto: '', fuente: '', descripcion: '', cuotas_total: '', fecha_inicio: '', fecha_fin: '', id_categoria: '' },
  Imprevisto: { monto: '', causa: '', fecha_registro: '', id_categoria: '', id_dependientes: '' },
}

const buildDatos = (subtipo, form) => {
  const base = { monto: Number(form.monto) }
  switch (subtipo) {
    case 'Ingreso':
      return { ...base, fuente: form.fuente || null, descripcion: form.descripcion || null, fecha_registro: form.fecha_registro || null, id_categoria: form.id_categoria || null }
    case 'Ahorro':
      return { ...base, meta: form.meta || null, descripcion: form.descripcion || null, fecha_registro: form.fecha_registro || null, fecha_meta: form.fecha_meta || null, id_categoria: form.id_categoria || null }
    case 'Gasto':
      return { ...base, descripcion: form.descripcion || null, fecha_registro: form.fecha_registro || null, id_categoria: form.id_categoria || null, id_dependientes: form.id_dependientes || null }
    case 'Deuda':
      return { ...base, fuente: form.fuente || null, descripcion: form.descripcion || null, cuotas_total: form.cuotas_total ? Number(form.cuotas_total) : null, fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null, id_categoria: form.id_categoria || null }
    case 'Imprevisto':
      return { ...base, causa: form.causa || null, fecha_registro: form.fecha_registro || null, id_categoria: form.id_categoria || null, id_dependientes: form.id_dependientes || null }
    default:
      return base
  }
}

const validar = (subtipo, form) => {
  if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0)
    return 'El monto debe ser un número mayor a 0'
  if (subtipo === 'Deuda' && !form.fuente?.trim())
    return 'La fuente de la deuda es obligatoria'
  if (subtipo === 'Deuda' && form.fecha_fin && form.fecha_inicio && form.fecha_fin < form.fecha_inicio)
    return 'La fecha de fin no puede ser anterior a la de inicio'
  if (subtipo === 'Ahorro' && form.fecha_meta && form.fecha_registro && form.fecha_meta < form.fecha_registro)
    return 'La fecha meta no puede ser anterior a la de registro'
  if (subtipo === 'Deuda' && form.cuotas_total && (isNaN(form.cuotas_total) || Number(form.cuotas_total) <= 0))
    return 'El número de cuotas debe ser mayor a 0'
  return null
}

export default function ModalNuevoMovimiento({ subtipo: propSubtipo, onCerrar: propCerrar, onGuardado: propGuardado }) {
  const { isDarkMode } = useTheme()
  const asOverlay = propSubtipo !== undefined
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const subtipo = asOverlay ? propSubtipo : searchParams.get('subtipo')
  const onCerrar = asOverlay ? propCerrar : () => navigate(-1)
  const onGuardado = asOverlay ? propGuardado : () => {}
  const [form,        setForm]        = useState(INICIAL[subtipo] ?? {})
  const [categorias,  setCategorias]  = useState([])
  const [dependientes,setDependientes]= useState([])
  const [cargando,    setCargando]    = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    if (!subtipo) return
    setForm(INICIAL[subtipo])
    getCategorias().then(d => { if (Array.isArray(d)) setCategorias(d) }).catch(() => {})
    if (['Gasto', 'Imprevisto'].includes(subtipo)) {
      getDependientes().then(d => { if (Array.isArray(d)) setDependientes(d) }).catch(() => {})
    }
  }, [subtipo])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  // ── Subtipo selector (solo en modo standalone) ──
  if (!asOverlay && !subtipo) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
        <div className="w-full max-w-lg">
          <h2 className={`text-2xl font-extrabold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nuevo Movimiento</h2>
          <p className={`text-sm text-center mb-8 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Seleccioná el tipo de movimiento que querés registrar</p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => navigate(`/movimientos/nuevo?subtipo=${key}`)}
                className={`group relative flex flex-col items-center gap-3 rounded-2xl border px-5 py-7 transition-all hover:scale-[1.03] active:scale-[0.98] ${
                  isDarkMode
                    ? 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.15]'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}>
                <span className="text-3xl">{cfg.emoji}</span>
                <span className={`text-sm font-bold group-hover:text-inherit ${isDarkMode ? 'text-zinc-200' : 'text-gray-700'}`}>{cfg.label}</span>
                <span className={`text-[0.6rem] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                  {cfg.tipo_flujo === 'Entrada' ? 'Entrada' : 'Salida'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const cfg = CONFIG[subtipo]
  if (!cfg) {
    const containerCls = asOverlay
      ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
      : `min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`
    return (
      <div className={containerCls}>
        <div className={`rounded-2xl p-6 max-w-md mx-4 text-center ${isDarkMode ? 'bg-white/10' : 'bg-white border border-gray-200'}`}>
          <p className="text-red-400 font-bold mb-4">Tipo de movimiento no válido: {subtipo}</p>
          <button onClick={onCerrar} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Volver</button>
        </div>
      </div>
    )
  }
  const color = COLORES[cfg.color]
  const inputCls = mkInput(color.ring, isDarkMode)

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setError(null)
    const err = validar(subtipo, form)
    if (err) return setError(err)

    setCargando(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipo_flujo:     cfg.tipo_flujo,
          subtipo_modulo: subtipo,
          datos:          buildDatos(subtipo, form),
        }),
      })
      const data = await res.json()
      if (data.ok) { onGuardado(); onCerrar() }
      else setError(data.mensaje || 'Error al registrar')
    } catch { setError('Error al conectar con el servidor') }
    finally { setCargando(false) }
  }

  const wrapperCls = asOverlay
    ? 'fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-md'
    : 'min-h-screen flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-md'

  return (
    <div className={wrapperCls}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}>

      <div className={`w-full sm:max-w-[460px] rounded-t-[24px] sm:rounded-[20px] border shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[92vh] flex flex-col ${
        isDarkMode ? 'border-white/[0.12]' : 'border-gray-200'
      }`}
        style={{ background: isDarkMode ? 'rgba(15,23,42,0.97)' : '#ffffff' }}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b shrink-0 ${
          isDarkMode ? 'border-white/[0.08]' : 'border-gray-200'
        }`}>
          <div>
            <h4 className={`text-lg font-extrabold ${color.title}`}>
              {cfg.emoji} Registrar {cfg.label}
            </h4>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {cfg.tipo_flujo === 'Entrada' ? 'Movimiento de entrada' : 'Movimiento de salida'} — todos los campos marcados con * son obligatorios
            </p>
          </div>
          <button onClick={onCerrar}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg leading-none transition-colors ${
              isDarkMode
                ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08]'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}>
            ✕
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="overflow-y-auto px-6 py-4 flex-1">

          {/* Monto */}
          <label className={`block text-[0.72rem] font-bold uppercase tracking-[0.06em] ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
            Monto *
          </label>
          <div className="relative mt-1.5">
            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>$</span>
            <input
              className={`${inputCls} pl-7 text-base font-bold`}
              type="number" name="monto" min="0" step="0.01"
              placeholder="0" autoFocus
              value={form.monto} onChange={handleChange}
            />
          </div>

          {subtipo === 'Ingreso' && <>
            <label className={labelCls(isDarkMode)}>Fuente</label>
            <input className={inputCls} type="text" name="fuente" placeholder="Ej: Salario, Freelance..." value={form.fuente} onChange={handleChange} />
            <label className={labelCls(isDarkMode)}>Categoría</label>
            <select className={inputCls} name="id_categoria" value={form.id_categoria} onChange={handleChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label className={labelCls(isDarkMode)}>Descripción</label>
            <input className={inputCls} type="text" name="descripcion" placeholder="Descripción opcional" value={form.descripcion} onChange={handleChange} />
            <label className={labelCls(isDarkMode)}>Fecha</label>
            <input className={inputCls} type="date" name="fecha_registro" value={form.fecha_registro} onChange={handleChange} />
          </>}

          {subtipo === 'Ahorro' && <>
            <label className={labelCls(isDarkMode)}>Meta u objetivo</label>
            <input className={inputCls} type="text" name="meta" placeholder="Ej: Vacaciones, Fondo de emergencia..." value={form.meta} onChange={handleChange} />
            <label className={labelCls(isDarkMode)}>Categoría</label>
            <select className={inputCls} name="id_categoria" value={form.id_categoria} onChange={handleChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label className={labelCls(isDarkMode)}>Descripción</label>
            <input className={inputCls} type="text" name="descripcion" placeholder="Descripción opcional" value={form.descripcion} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls(isDarkMode)}>Fecha de registro</label>
                <input className={inputCls} type="date" name="fecha_registro" value={form.fecha_registro} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls(isDarkMode)}>Fecha meta</label>
                <input className={inputCls} type="date" name="fecha_meta" value={form.fecha_meta} onChange={handleChange} />
              </div>
            </div>
          </>}

          {subtipo === 'Gasto' && <>
            <label className={labelCls(isDarkMode)}>Categoría</label>
            <select className={inputCls} name="id_categoria" value={form.id_categoria} onChange={handleChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label className={labelCls(isDarkMode)}>Dependiente</label>
            <select className={inputCls} name="id_dependientes" value={form.id_dependientes} onChange={handleChange}>
              <option value="">Ninguno (gasto propio)</option>
              {dependientes.map(d => <option key={d.ID_dependientes} value={d.ID_dependientes}>{d.Nombre}</option>)}
            </select>
            <label className={labelCls(isDarkMode)}>Descripción</label>
            <input className={inputCls} type="text" name="descripcion" placeholder="Descripción opcional" value={form.descripcion} onChange={handleChange} />
            <label className={labelCls(isDarkMode)}>Fecha</label>
            <input className={inputCls} type="date" name="fecha_registro" value={form.fecha_registro} onChange={handleChange} />
          </>}

          {subtipo === 'Deuda' && <>
            <label className={labelCls(isDarkMode)}>Fuente *</label>
            <input className={inputCls} type="text" name="fuente" placeholder="Ej: Banco, Tarjeta de crédito..." value={form.fuente} onChange={handleChange} />
            <label className={labelCls(isDarkMode)}>Categoría</label>
            <select className={inputCls} name="id_categoria" value={form.id_categoria} onChange={handleChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label className={labelCls(isDarkMode)}>Número de cuotas</label>
            <input className={inputCls} type="number" name="cuotas_total" min="1" step="1" placeholder="Vacío si es pago único" value={form.cuotas_total} onChange={handleChange} />
            <label className={labelCls(isDarkMode)}>Descripción</label>
            <input className={inputCls} type="text" name="descripcion" placeholder="Descripción opcional" value={form.descripcion} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls(isDarkMode)}>Fecha inicio</label>
                <input className={inputCls} type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls(isDarkMode)}>Fecha fin</label>
                <input className={inputCls} type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} />
              </div>
            </div>
          </>}

          {subtipo === 'Imprevisto' && <>
            <label className={labelCls(isDarkMode)}>Causa</label>
            <input className={inputCls} type="text" name="causa" placeholder="Ej: Reparación, Emergencia médica..." value={form.causa} onChange={handleChange} />
            <label className={labelCls(isDarkMode)}>Categoría</label>
            <select className={inputCls} name="id_categoria" value={form.id_categoria} onChange={handleChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label className={labelCls(isDarkMode)}>Dependiente</label>
            <select className={inputCls} name="id_dependientes" value={form.id_dependientes} onChange={handleChange}>
              <option value="">Ninguno (imprevisto propio)</option>
              {dependientes.map(d => <option key={d.ID_dependientes} value={d.ID_dependientes}>{d.Nombre}</option>)}
            </select>
            <label className={labelCls(isDarkMode)}>Fecha</label>
            <input className={inputCls} type="date" name="fecha_registro" value={form.fecha_registro} onChange={handleChange} />
          </>}

          {error && (
            <p className="mt-4 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">
              {error}
            </p>
          )}
        </div>

        {/* Footer fijo */}
        <div className={`px-6 py-4 border-t shrink-0 flex justify-end gap-2.5 ${isDarkMode ? 'border-white/[0.08]' : 'border-gray-200'}`}>
          <button onClick={onCerrar}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
              isDarkMode
                ? 'bg-transparent text-zinc-400 border-white/[0.15] hover:bg-white/[0.07]'
                : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={cargando}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${color.btnText ?? 'text-white'}`}
            style={{ background: cargando ? 'rgba(100,100,100,0.3)' : color.btn }}>
            {cargando ? 'Guardando...' : `Registrar ${cfg.label}`}
          </button>
        </div>
      </div>
    </div>
  )
}
