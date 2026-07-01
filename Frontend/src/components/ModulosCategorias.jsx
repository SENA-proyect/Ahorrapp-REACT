import { useState, useEffect } from 'react'
import HeaderModulos from './HeaderModulos'
import { useToast } from './ToastContext'
import { useNotificaciones } from './NotificacionesContext'
// activar SOLO si se utilizan mas adelante
// import { useNavigate, useLocation } from 'react-router-dom'

import {
  getCategorias,
  crearCategoria,
  editarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
  getGastosPorCategoria,
  getIngresosPorCategoria,
  getAhorrosPorCategoria,
  getImprevistosPorCategoria,
  getDeudasPorCategoria,
} from '../api'


const usuario = JSON.parse(localStorage.getItem('usuario'))

export default function ModuloCategorias() {

  // activas SOLO si se usan mas adelante
  // const navigate = useNavigate()
  // const location = useLocation()
  const { mostrarToast } = useToast()
  const { revisarAhora } = useNotificaciones()

  const [categorias, setCategorias] = useState([])
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [categoriaEdit, setCategoriaEdit] = useState(null)
  const [formNombre, setFormNombre] = useState('')
  const [formDesc, setFormDesc] = useState('')
  // evita doble envío del formulario (doble clic / doble submit)
  const [guardando, setGuardando] = useState(false)
// agregado pero no revizado, verificar funcionalidad
  const [menuOpen, setMenuOpen] = useState(false)

  // desactivado con el fin de realizar pruebas
  // useEffect(() => {
  //   getCategorias()
  //     .then(data => {
  //       if (Array.isArray(data)) setCategorias(data)
  //     })
  //     .catch(() => {})
  // }, [])

  // remplaza la funcion anteriormente comentada, en caso de error realizar pruebas
  useEffect(() => {
  Promise.all([
    getGastosPorCategoria(),
    getIngresosPorCategoria(),
    getAhorrosPorCategoria(),
    getImprevistosPorCategoria(),
    getDeudasPorCategoria(),
  ])
    .then(([gastos, ingresos, ahorros, imprevistos, deudas]) => {
      if (!Array.isArray(gastos)) return

      const combinadas = gastos.map(cat => {
        const ing = ingresos.find(c => c.id === cat.id)
        const aho = ahorros.find(c => c.id === cat.id)
        const imp = imprevistos.find(c => c.id === cat.id)
        const deu = deudas.find(c => c.id === cat.id)

        return {
          ...cat,
          total_movimientos:
            Number(cat.total_gastos || 0) +
            Number(ing?.total_ingresos || 0) +
            Number(aho?.total_ahorros || 0) +
            Number(imp?.total_imprevistos || 0) +
            Number(deu?.total_deudas || 0),
        }
      })

      setCategorias(combinadas)
    })
    .catch(error => {
      console.error('Error al cargar categorías combinadas:', error)
    })
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
          total_movimientos: 0,
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

    try {
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
    try {
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

  const formatMoney = value =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))

  const closeModal = () => {
    setModalAgregar(false)
    setModalEditar(false)
    setCategoriaEdit(null)
    setFormNombre('')
    setFormDesc('')
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-white [background:radial-gradient(ellipse_at_30%_20%,#1e3a5f_10%,#0f172a_60%,#1a0f2e_100%)]">
      {/* HEADER */}
      <HeaderModulos section="Categorías" />

      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">
        <div>
          <p className="text-sm text-zinc-400">Bienvenido de vuelta</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
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

                          {/* funcion nueva agregada, realizar pruebasy solo es valida si anteriormente se definio el useEffect "total_movimientos" */}
                          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs">
                            <p className="text-zinc-500">Total movimientos</p>
                            <p className="font-bold text-amber-300">
                              {formatMoney(cat.total_movimientos)}
                            </p>
                          </div>

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

                {/* TABLA DESKTOP */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Nombre', 'Descripción', 'Tipo', 'Total movimientos', 'Acciones'].map(col => (
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
                          <td className="px-4 py-3 text-sm font-bold text-amber-300">
                            {formatMoney(cat.total_movimientos)}
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
              required
              minLength={NOMBRE_MIN_LENGTH}
              maxLength={NOMBRE_MAX_LENGTH}
              disabled={guardando}
            />

            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Descripción opcional"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              maxLength={DESCRIPCION_MAX_LENGTH}
              disabled={guardando}
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                disabled={guardando}
                className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-white/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregar}
                disabled={guardando}
                className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
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
              required
              minLength={NOMBRE_MIN_LENGTH}
              maxLength={NOMBRE_MAX_LENGTH}
              disabled={guardando}
            />

            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              type="text"
              value={categoriaEdit.descripcion || ''}
              onChange={e => setCategoriaEdit(prev => ({ ...prev, descripcion: e.target.value }))}
              maxLength={DESCRIPCION_MAX_LENGTH}
              disabled={guardando}
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                disabled={guardando}
                className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-white/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                disabled={guardando}
                className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}