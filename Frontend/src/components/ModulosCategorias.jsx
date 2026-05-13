import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  { href: '/Noticias', emoji: '📰', label: 'Noticias' },
]

const usuario = JSON.parse(localStorage.getItem('usuario'))

export default function ModuloCategorias() {
  const navigate = useNavigate()
  const location = useLocation()

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
      setCategorias(prev =>
        prev.map(c => (c.id === id ? { ...c, activa: false } : c))
      )
    } else {
      alert(respuesta.mensaje || 'Error al deshabilitar la categoría')
    }
  }

  const handleHabilitar = async id => {
    const respuesta = await habilitarCategoria(id)

    if (respuesta.ok) {
      setCategorias(prev =>
        prev.map(c => (c.id === id ? { ...c, activa: true } : c))
      )
    } else {
      alert(respuesta.mensaje || 'Error al habilitar la categoría')
    }
  }

  const navButtonClass = isActive =>
    isActive
      ? 'w-full md:w-auto flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-xl md:rounded-[10px] text-left font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)] transition-all'
      : 'w-full md:w-auto flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-xl md:rounded-[10px] text-left font-semibold text-white bg-white/10 border border-white/5 hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)] transition-all'

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20'

  const labelClass =
    'mt-4 block text-xs font-bold uppercase tracking-wider text-zinc-400'

  const closeModal = () => {
    setModalAgregar(false)
    setModalEditar(false)
    setCategoriaEdit(null)
    setFormNombre('')
    setFormDesc('')
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-white [background:radial-gradient(ellipse_at_30%_20%,#1e3a5f_10%,#0f172a_60%,#1a0f2e_100%)]">
      <header className="relative z-10 flex w-full flex-col items-center pt-4 sm:pt-5">
        <section className="mb-4 flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:mb-6 md:px-10">
          <div className="order-1 w-full text-center sm:order-2 sm:w-auto">
            <h1 className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl md:text-4xl">
              Ahorrapp
            </h1>
            <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-zinc-500 sm:text-[0.65rem]">
              Categorías
            </span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="order-2 flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-px hover:bg-green-600 hover:shadow-[0_4px_10px_rgba(31,187,31,0.4)] sm:order-1 sm:text-sm md:rounded-2xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
            Inicio
          </button>

          <button
            onClick={() => navigate('/login')}
            className="order-3 flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-px hover:bg-red-600 hover:shadow-[0_4px_10px_rgba(228,33,33,0.4)] sm:text-sm md:rounded-2xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </section>

        <nav className="w-full px-4 sm:px-6 md:px-10">
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white shadow-[0_2px_8px_rgba(255,255,255,0.1)]"
            >
              <span>Menú</span>
              <span>{menuOpen ? '▲' : '▼'}</span>
            </button>

            {menuOpen && (
              <ul className="mt-3 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-slate-950/85 p-3 backdrop-blur-lg">
                {navItems.map(item => {
                  const isActive = location.pathname === item.href

                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(item.href)
                          setMenuOpen(false)
                        }}
                        className={navButtonClass(isActive)}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <ul className="hidden flex-wrap items-center justify-center gap-3 pb-2 text-sm md:flex lg:gap-4 lg:text-base">
            {navItems.map(item => {
              const isActive = location.pathname === item.href

              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={navButtonClass(isActive)}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">
        <div>
          <p className="text-sm text-zinc-400">Bienvenido de vuelta</p>
          <h2 className="break-words text-xl font-extrabold text-white sm:text-2xl">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        <article className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(16,185,129,0.25),rgba(5,150,105,0.04))] px-5 py-5 sm:flex-row sm:items-center sm:px-8 sm:py-6">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
              🧩 Categorías activas
            </p>
            <p className="text-3xl font-black text-white">{activas.length}</p>
          </div>

          <button
            onClick={() => setModalAgregar(true)}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px sm:w-auto"
          >
            + Agregar Categoría
          </button>
        </article>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-lg">
          <div className="border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
            <h3 className="text-base font-extrabold text-amber-400">
              📋 Módulo de Categorías
            </h3>
          </div>

          <div className="p-4 sm:p-5">
            {activas.length === 0 ? (
              <p className="py-5 text-sm italic text-zinc-500">
                No hay categorías activas.
              </p>
            ) : (
              <>
                <div className="grid gap-3 md:hidden">
                  {activas.map(cat => (
                    <article key={cat.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words text-sm font-bold text-zinc-100">
                            {cat.nombre}
                          </h4>
                          <p className="mt-1 break-words text-sm text-zinc-400">
                            {cat.descripcion || 'Sin descripción'}
                          </p>
                        </div>

                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold ${
                          cat.es_global
                            ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-400'
                            : 'border-indigo-400/40 bg-indigo-400/15 text-indigo-300'
                        }`}>
                          {cat.es_global ? 'Sistema' : 'Personal'}
                        </span>
                      </div>

                      {!esSistema(cat) && (
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button
                            onClick={() => abrirEditar(cat)}
                            className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-400"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeshabilitar(cat.id)}
                            className="rounded-lg border border-orange-400/50 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-400"
                          >
                            Deshabilitar
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Nombre', 'Descripción', 'Tipo', 'Acciones'].map(col => (
                          <th key={col} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activas.map(cat => (
                        <tr key={cat.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.04]">
                          <td className="px-4 py-3 text-sm font-bold text-zinc-100">{cat.nombre}</td>
                          <td className="px-4 py-3 text-sm text-zinc-400">{cat.descripcion || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              cat.es_global
                                ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-400'
                                : 'border-indigo-400/40 bg-indigo-400/15 text-indigo-300'
                            }`}>
                              {cat.es_global ? 'Sistema' : 'Personalizada'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {!esSistema(cat) && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => abrirEditar(cat)}
                                  className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-400/20"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeshabilitar(cat.id)}
                                  className="rounded-lg border border-orange-400/50 bg-orange-400/10 px-4 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-400/20"
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
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Categorías deshabilitadas ({inactivas.length})
                </p>

                <div className="grid gap-3 md:hidden">
                  {inactivas.map(cat => (
                    <article key={cat.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-bold text-zinc-500 line-through">{cat.nombre}</p>
                      <p className="mt-1 text-sm text-zinc-600">{cat.descripcion || 'Sin descripción'}</p>
                      <button
                        onClick={() => handleHabilitar(cat.id)}
                        className="mt-4 w-full rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-400"
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
                        <tr key={cat.id} className="border-b border-white/5">
                          <td className="px-4 py-3 text-sm text-zinc-500 line-through">{cat.nombre}</td>
                          <td className="px-4 py-3 text-sm text-zinc-600">{cat.descripcion || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleHabilitar(cat.id)}
                              className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold text-emerald-400"
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

      <footer className="w-full px-4 py-6 text-center font-mono text-[0.7rem] text-zinc-600">
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {modalAgregar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl sm:p-7">
            <h4 className="text-lg font-extrabold text-amber-400">🧩 Nueva Categoría</h4>

            <label className={labelClass}>Nombre *</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Ej: Ropa, Mascotas..."
              value={formNombre}
              onChange={e => setFormNombre(e.target.value)}
            />

            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Descripción opcional"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregar}
                className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEditar && categoriaEdit && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl sm:p-7">
            <h4 className="text-lg font-extrabold text-amber-400">✏️ Editar Categoría</h4>

            <label className={labelClass}>Nombre *</label>
            <input
              className={inputClass}
              type="text"
              value={categoriaEdit.nombre}
              onChange={e => setCategoriaEdit(prev => ({ ...prev, nombre: e.target.value }))}
            />

            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              type="text"
              value={categoriaEdit.descripcion || ''}
              onChange={e => setCategoriaEdit(prev => ({ ...prev, descripcion: e.target.value }))}
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
