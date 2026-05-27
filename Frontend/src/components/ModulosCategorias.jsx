import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import HeaderModulos from './HeaderModulos'
import {
  getCategorias,
  crearCategoria,
  editarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
} from '../api'

const navItems = [
  { href: '/Dashboard', emoji: '📊', label: 'Dashboard' },
  { href: '/ModulosIngresos', emoji: '💰', label: 'Ingresos' },
  { href: '/ModulosGastos', emoji: '💸', label: 'Gastos' },
  { href: '/ModuloAhorros', emoji: '🎯', label: 'Ahorrar' },
  { href: '/ModuloImprevistos', emoji: '🛡️', label: 'Imprevistos' },
  { href: '/ModuloDeudas', emoji: '💳', label: 'Deudas' },
  { href: '/ModulosDependientes', emoji: '👩‍👧‍👦', label: 'Dependientes' },
  { href: '/ModulosCategorias', emoji: '🧩', label: 'Categorias' },
  { href: '/movimientos/nuevo', emoji: '➕', label: 'Nuevo Movimiento' },
]

export default function ModuloCategorias() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const location = useLocation()

  // Fondo principal idéntico al de Ingresos
  const mainBg = isDarkMode
    ? '[background:radial-gradient(ellipse_at_30%_20%,#1e3a5f_10%,#0f172a_60%,#1a0f2e_100%)]'
    : 'bg-gradient-to-br from-gray-50 via-emerald-50 to-amber-50'

  const [categorias, setCategorias] = useState([])
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [categoriaEdit, setCategoriaEdit] = useState(null)
  const [formNombre, setFormNombre] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    getCategorias()
      .then(data => {
        if (Array.isArray(data)) setCategorias(data)
      })
      .catch(() => {})
  }, [])

  const activas = categorias.filter(c => c.activa == 1 || c.activa === true)
  const inactivas = categorias.filter(c => c.activa == 0 || c.activa === false)
  const esSistema = cat =>
    cat.es_global == 1 || cat.es_global === true ||
    cat.sistema == 1 || cat.sistema === true

  const handleAgregar = async () => {
    if (!formNombre.trim()) return alert('El nombre es obligatorio')
    const respuesta = await crearCategoria({
      nombre: formNombre.trim(),
      descripcion: formDesc.trim(),
    })

    if (respuesta.ok) {
      setCategorias(prev => [
        ...prev,
        {
          id: respuesta.id,
          nombre: formNombre.trim(),
          descripcion: formDesc.trim(),
          activa: true,
          sistema: false,
          es_global: false,
        },
      ])
      setFormNombre('')
      setFormDesc('')
      setModalAgregar(false)
    } else {
      alert(respuesta.mensaje || 'Error al crear la categoría')
    }
  }

  const abrirEditar = cat => {
    setCategoriaEdit({ ...cat })
    setModalEditar(true)
  }

  const handleGuardarEdicion = async () => {
    if (!categoriaEdit.nombre.trim()) return alert('El nombre es obligatorio')
    const respuesta = await editarCategoria(categoriaEdit.id, {
      nombre: categoriaEdit.nombre,
      descripcion: categoriaEdit.descripcion,
    })

    if (respuesta.ok) {
      setCategorias(prev =>
        prev.map(c => (c.id === categoriaEdit.id ? { ...c, ...categoriaEdit } : c))
      )
      setModalEditar(false)
    } else {
      alert(respuesta.mensaje || 'Error al editar la categoría')
    }
  }

  const handleDeshabilitar = async id => {
    if (!window.confirm('¿Seguro que deseas deshabilitar esta categoría?')) return
    const respuesta = await deshabilitarCategoria(id)
    if (respuesta.ok) {
      setCategorias(prev => prev.map(c => (c.id === id ? { ...c, activa: false } : c)))
    } else {
      alert(respuesta.mensaje || 'Error al deshabilitar la categoría')
    }
  }

  const handleHabilitar = async id => {
    const respuesta = await habilitarCategoria(id)
    if (respuesta.ok) {
      setCategorias(prev => prev.map(c => (c.id === id ? { ...c, activa: true } : c)))
    } else {
      alert(respuesta.mensaje || 'Error al habilitar la categoría')
    }
  }

  const navButtonClass = isActive => {
    const base = 'w-full md:w-auto flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-xl md:rounded-[10px] text-left font-bold transition-all duration-300'
    if (isActive) {
      return isDarkMode
        ? `${base} text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)]`
        : `${base} text-blue-700 bg-blue-100 border border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]`
    }
    return isDarkMode
      ? `${base} text-white bg-white/5 border border-white/10 hover:-translate-y-px hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(255,187,0,0.2)]`
      : `${base} text-gray-700 bg-gray-100 border border-gray-300 hover:-translate-y-px hover:bg-gray-200 hover:shadow-[0_4px_12px_rgba(59,130,246,0.1)]`
  }

  const inputClass = `mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
  }`

  const labelClass = `mt-4 block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`

  const closeModal = () => {
    setModalAgregar(false)
    setModalEditar(false)
    setCategoriaEdit(null)
    setFormNombre('')
    setFormDesc('')
  }

  return (
    <div 
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      {/* Usamos el componente estandarizado para el header */}
      <HeaderModulos section="Categorías" />

      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Bienvenido de vuelta</p>
          <h2 className={`break-words text-xl font-extrabold sm:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {usuario?.nombre || 'Usuario'} <span></span>
          </h2>
        </div>

        {/* CARD TOTAL / CATEGORÍAS ACTIVAS */}
        <article className={`flex flex-col justify-between gap-4 rounded-2xl border px-5 py-5 shadow-lg sm:flex-row sm:items-center sm:px-8 sm:py-6 transition-colors duration-300 ${
          isDarkMode
            ? 'border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(16,185,129,0.35),rgba(5,150,105,0.04))] shadow-white/10'
            : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-emerald-100'
        }`}>
          <div>
            <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              🧩 Categorías activas
            </p>
            <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activas.length}</p>
          </div>

          <button
            onClick={() => setModalAgregar(true)}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px hover:shadow-lg sm:w-auto"
          >
            + Agregar Categoría
          </button>
        </article>

        {/* SECCIÓN DE TABLA */}
        <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
          isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/80'
        }`}>
          <div className={`border-b px-5 py-4 sm:px-7 sm:py-5 transition-colors ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              📋 Módulo de Categorías
            </h3>
          </div>

          <div className="p-4 sm:p-5">
            {activas.length === 0 ? (
              <p className={`py-5 text-sm italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                No hay categorías activas.
              </p>
            ) : (
              <>
                {/* VISTA MÓVIL */}
                <div className="grid gap-3 md:hidden">
                  {activas.map(cat => (
                    <article key={cat.id} className={`rounded-2xl border p-4 transition-colors ${isDarkMode ? 'border-white/10 bg-white/[0.05]' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className={`break-words text-sm font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{cat.nombre}</h4>
                          <p className={`mt-1 break-words text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{cat.descripcion || 'Sin descripción'}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold ${
                          cat.es_global
                            ? isDarkMode ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-400' : 'border-emerald-500 bg-emerald-100 text-emerald-700'
                            : isDarkMode ? 'border-indigo-400/40 bg-indigo-400/15 text-indigo-300' : 'border-indigo-500 bg-indigo-100 text-indigo-700'
                        }`}>
                          {cat.es_global ? 'Sistema' : 'Personal'}
                        </span>
                      </div>

                      {!esSistema(cat) && (
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button
                            onClick={() => abrirEditar(cat)}
                            className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                              isDarkMode
                                ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                                : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeshabilitar(cat.id)}
                            className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                              isDarkMode
                                ? 'border-orange-400/50 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20'
                                : 'border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100'
                            }`}
                          >
                            Deshabilitar
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                {/* VISTA ESCRITORIO */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        {['Nombre', 'Descripción', 'Tipo', 'Acciones'].map(col => (
                          <th key={col} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activas.map(cat => (
                        <tr key={cat.id} className={`border-b transition-colors ${isDarkMode ? 'border-white/5 hover:bg-white/[0.04]' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className={`px-4 py-3 text-sm font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{cat.nombre}</td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{cat.descripcion || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              cat.es_global
                                ? isDarkMode ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-400' : 'border-emerald-500 bg-emerald-100 text-emerald-700'
                                : isDarkMode ? 'border-indigo-400/40 bg-indigo-400/15 text-indigo-300' : 'border-indigo-500 bg-indigo-100 text-indigo-700'
                            }`}>
                              {cat.es_global ? 'Sistema' : 'Personalizada'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {!esSistema(cat) && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => abrirEditar(cat)}
                                  className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                    isDarkMode
                                      ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                                      : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeshabilitar(cat.id)}
                                  className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                    isDarkMode
                                      ? 'border-orange-400/50 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20'
                                      : 'border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100'
                                  }`}
                                >
                                  Deshabilitar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {inactivas.length > 0 && (
              <div className="mt-8 opacity-70">
                <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                  Categorías deshabilitadas ({inactivas.length})
                </p>

                <div className="grid gap-3 md:hidden">
                  {inactivas.map(cat => (
                    <article key={cat.id} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'} line-through`}>{cat.nombre}</p>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>{cat.descripcion || 'Sin descripción'}</p>
                      <button
                        onClick={() => handleHabilitar(cat.id)}
                        className={`mt-4 w-full rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                          isDarkMode
                            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        Habilitar
                      </button>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <tbody>
                      {inactivas.map(cat => (
                        <tr key={cat.id} className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`px-4 py-3 text-sm line-through ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{cat.nombre}</td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>{cat.descripcion || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleHabilitar(cat.id)}
                              className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                isDarkMode
                                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                                  : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              Habilitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className={`w-full px-4 py-6 text-center font-mono text-[0.7rem] ${isDarkMode ? 'text-zinc-600' : 'text-gray-500'}`}>
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODALES */}
      {modalAgregar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[420px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-gray-200 bg-white'}`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>🧩 Nueva Categoría</h4>

            <label className={labelClass}>Nombre *</label>
            <input className={inputClass} type="text" placeholder="Ej: Ropa, Mascotas..." value={formNombre} onChange={e => setFormNombre(e.target.value)} />

            <label className={labelClass}>Descripción</label>
            <input className={inputClass} type="text" placeholder="Descripción opcional" value={formDesc} onChange={e => setFormDesc(e.target.value)} />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={closeModal} className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${isDarkMode ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10' : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button onClick={handleAgregar} className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEditar && categoriaEdit && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[420px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-gray-200 bg-white'}`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>️ Editar Categoría</h4>

            <label className={labelClass}>Nombre *</label>
            <input className={inputClass} type="text" value={categoriaEdit.nombre} onChange={e => setCategoriaEdit(prev => ({ ...prev, nombre: e.target.value }))} />

            <label className={labelClass}>Descripción</label>
            <input className={inputClass} type="text" value={categoriaEdit.descripcion || ''} onChange={e => setCategoriaEdit(prev => ({ ...prev, descripcion: e.target.value }))} />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={closeModal} className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${isDarkMode ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10' : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button onClick={handleGuardarEdicion} className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}