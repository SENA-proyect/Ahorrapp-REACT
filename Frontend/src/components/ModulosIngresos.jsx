import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../api'
import HeaderModulos from './HeaderModulos'

const API = 'http://localhost:3000/api/movimientos'


const usuario = JSON.parse(localStorage.getItem('usuario'))

export default function ModuloIngresos() {
  const navigate = useNavigate()

  const [ingresos, setIngresos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [categorias, setCategorias] = useState([])
  const cargarIngresos = () => {
    setCargando(true)
    const token = localStorage.getItem('token')

    fetch(`${API}/ingresos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setIngresos(data)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getCategorias()
      .then(data => {
        if (Array.isArray(data)) setCategorias(data)
      })
      .catch(err => console.error('Error cargando categorías:', err))
  }, [])

  useEffect(() => {
    cargarIngresos()
  }, [])

  const total = ingresos.reduce((acc, i) => acc + Number(i.monto || 0), 0)

  const abrirEditar = i => {
    setErrorModal(null)
    setModalEditar({
      id: i.id,
      monto: String(i.monto),
      id_categoria: i.id_categoria || '',
      fuente: i.fuente || '',
      descripcion: i.descripcion || '',
      fecha_registro: i.fecha ? i.fecha.slice(0, 10) : '',
    })
  }

  const handleEditarChange = e =>
    setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const guardarEdicion = async () => {
    setErrorModal(null)

    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) {
      setErrorModal('El monto debe ser un número mayor a 0')
      return
    }

    setGuardando(true)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API}/ingresos/${modalEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: Number(modalEditar.monto),
          id_categoria: modalEditar.id_categoria || null,
          fuente: modalEditar.fuente || null,
          descripcion: modalEditar.descripcion || null,
          fecha_registro: modalEditar.fecha_registro || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setModalEditar(null)
        cargarIngresos()
      } else {
        setErrorModal(data.mensaje || 'Error al guardar')
      }
    } catch {
      setErrorModal('Error al conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API}/ingresos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setConfirmarId(null)
        cargarIngresos()
      }
    } catch {
      // silencioso
    } finally {
      setEliminando(false)
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

  const formatFecha = fecha =>
    fecha ? new Date(fecha).toLocaleDateString('es-CO') : '—'

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-white [background:radial-gradient(ellipse_at_30%_20%,#1e3a5f_10%,#0f172a_60%,#1a0f2e_100%)]">

      <HeaderModulos section="Ingresos" />

      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">
        <div>
          <p className="text-sm text-zinc-400">Bienvenido de vuelta</p>
          <h2 className="break-words text-xl font-extrabold text-white sm:text-2xl">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        <article className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(34,197,94,0.35),rgba(16,185,129,0.04))] px-5 py-5 shadow-[0_2px_8px_rgba(255,255,255,0.1)] sm:flex-row sm:items-center sm:px-8 sm:py-6">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
              💰 Total Ingresos
            </p>
            <p className="break-words text-3xl font-black text-white">
              ${total.toLocaleString('es-CO')}
            </p>
          </div>

          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px sm:w-auto"
          >
            ➕ Agregar ingreso
          </button>
        </article>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-lg">
          <div className="flex flex-col gap-1 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
            <h3 className="text-base font-extrabold text-amber-400">
              📋 Módulo de Ingresos
            </h3>
            <span className="text-xs text-zinc-500">
              {ingresos.length} registro{ingresos.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            {cargando ? (
              <p className="py-5 text-sm italic text-zinc-500">⏳ Cargando...</p>
            ) : ingresos.length === 0 ? (
              <p className="py-5 text-sm italic text-zinc-500">
                No hay ingresos registrados. Agrega tu primer ingreso para comenzar.
              </p>
            ) : (
              <>
                <div className="grid gap-3 md:hidden">
                  {ingresos.map(i => (
                    <article key={i.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            {formatFecha(i.fecha)}
                          </p>
                          <h4 className="mt-1 break-words text-sm font-bold text-zinc-100">
                            {i.fuente || 'Sin fuente'}
                          </h4>
                          <p className="mt-1 break-words text-sm text-zinc-400">
                            {i.descripcion || 'Sin descripción'}
                          </p>
                          <p className="mt-2 text-xs text-zinc-500">
                            Categoría: {i.categoria || '—'}
                          </p>
                        </div>

                        <p className="shrink-0 text-right text-base font-black text-emerald-400">
                          ${Number(i.monto).toLocaleString('es-CO')}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => abrirEditar(i)}
                          className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-400"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmarId(i.id)}
                          className="rounded-lg border border-red-400/50 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-400"
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Fecha', 'Fuente', 'Categoría', 'Descripción', 'Monto', 'Acciones'].map(col => (
                          <th key={col} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ingresos.map(i => (
                        <tr key={i.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.04]">
                          <td className="px-4 py-3 text-sm text-zinc-300">{formatFecha(i.fecha)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{i.fuente || '—'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{i.categoria || '—'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{i.descripcion || '—'}</td>
                          <td className="px-4 py-3 text-sm font-extrabold text-emerald-400">
                            ${Number(i.monto).toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirEditar(i)}
                                className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-400/20"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmarId(i.id)}
                                className="rounded-lg border border-red-400/50 bg-red-400/10 px-4 py-1.5 text-xs font-bold text-red-400 hover:bg-red-400/20"
                              >
                                Eliminar
                              </button>
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

      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-[460px] rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl sm:p-7">
            <h4 className="text-lg font-extrabold text-amber-400">✏️ Editar Ingreso</h4>
            <p className="mt-1 text-xs text-zinc-500">Modifica los campos que necesites y guarda.</p>

            <label className={labelClass}>Monto *</label>
            <input
              className={inputClass}
              type="number"
              name="monto"
              min="0"
              step="0.01"
              value={modalEditar.monto}
              onChange={handleEditarChange}
            />

            <label className={labelClass}>Categoría</label>
            <select
              className={inputClass}
              name="id_categoria"
              value={modalEditar.id_categoria || ''}
              onChange={handleEditarChange}
            >
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1 || c.activa === true).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>

            <label className={labelClass}>Fuente</label>
            <input
              className={inputClass}
              type="text"
              name="fuente"
              placeholder="Ej: Salario, Freelance..."
              value={modalEditar.fuente}
              onChange={handleEditarChange}
            />

            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              type="text"
              name="descripcion"
              placeholder="Descripción opcional"
              value={modalEditar.descripcion}
              onChange={handleEditarChange}
            />

            <label className={labelClass}>Fecha</label>
            <input
              className={inputClass}
              type="date"
              name="fecha_registro"
              value={modalEditar.fecha_registro}
              onChange={handleEditarChange}
            />

            {errorModal && (
              <p className="mt-4 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-400">
                {errorModal}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setModalEditar(null)}
                className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-[380px] rounded-2xl border border-red-400/30 bg-slate-950/95 p-6 shadow-2xl sm:p-7">
            <h4 className="text-lg font-extrabold text-red-400">🗑️ ¿Eliminar ingreso?</h4>
            <p className="mt-2 text-sm text-zinc-400">Esta acción no se puede deshacer.</p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setConfirmarId(null)}
                className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="rounded-xl bg-gradient-to-br from-red-400 to-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
