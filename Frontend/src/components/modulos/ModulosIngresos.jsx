import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'
import HeaderModulos from '../layout/HeaderModulos'
import { useTheme } from '../../hooks/useTheme'

const API = 'http://localhost:3000/api/movimientos'

export default function ModuloIngresos() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  
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

  const formatFecha = fecha =>
    fecha ? new Date(fecha).toLocaleDateString('es-CO') : '—'

  // Estilos condicionales
  return (
    <div 
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      <HeaderModulos section="Ingresos" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">
        {/* BIENVENIDA */}
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Bienvenido de vuelta</p>
          <h2 className={`break-words text-xl font-extrabold sm:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* CARD TOTAL */}
        <article className={`flex flex-col justify-between gap-4 rounded-2xl border px-5 py-5 shadow-lg sm:flex-row sm:items-center sm:px-8 sm:py-6 transition-colors duration-300 ${
          isDarkMode
            ? 'border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(34,197,94,0.35),rgba(16,185,129,0.04))] shadow-white/10'
            : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-emerald-100'
        }`}>
          <div>
            <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              💰 Total Ingresos
            </p>
            <p className={`break-words text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${total.toLocaleString('es-CO')}
            </p>
          </div>

          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px hover:shadow-lg sm:w-auto"
          >
            ➕ Agregar ingreso
          </button>
        </article>

        {/* SECCIÓN DE INGRESOS */}
        <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
          isDarkMode
            ? 'border-white/10 bg-white/[0.04]'
            : 'border-gray-200 bg-white/80'
        }`}>
          {/* HEADER DE LA SECCIÓN */}
          <div className={`flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 transition-colors ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              📋 Módulo de Ingresos
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {ingresos.length} registro{ingresos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* CONTENIDO */}
          <div className="p-4 sm:p-5">
            {cargando ? (
              <p className={`py-5 text-sm italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>⏳ Cargando...</p>
            ) : ingresos.length === 0 ? (
              <p className={`py-5 text-sm italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                No hay ingresos registrados. Agrega tu primer ingreso para comenzar.
              </p>
            ) : (
              <>
                {/* VISTA MÓVIL */}
                <div className="grid gap-3 md:hidden">
                  {ingresos.map(i => (
                    <article
                      key={i.id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        isDarkMode
                          ? 'border-white/10 bg-white/[0.05]'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {formatFecha(i.fecha)}
                          </p>
                          <h4 className={`mt-1 break-words text-sm font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
                            {i.fuente || 'Sin fuente'}
                          </h4>
                          <p className={`mt-1 break-words text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                            {i.descripcion || 'Sin descripción'}
                          </p>
                          <p className={`mt-2 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                            Categoría: {i.categoria || '—'}
                          </p>
                        </div>

                        <p className={`shrink-0 text-right text-base font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ${Number(i.monto).toLocaleString('es-CO')}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => abrirEditar(i)}
                          className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            isDarkMode
                              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                              : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmarId(i.id)}
                          className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            isDarkMode
                              ? 'border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20'
                              : 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* VISTA ESCRITORIO */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        {['Fecha', 'Fuente', 'Categoría', 'Descripción', 'Monto', 'Acciones'].map(col => (
                          <th
                            key={col}
                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                              isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                            }`}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ingresos.map(i => (
                        <tr
                          key={i.id}
                          className={`border-b transition-colors ${
                            isDarkMode
                              ? 'border-white/5 hover:bg-white/[0.04]'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{formatFecha(i.fecha)}</td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{i.fuente || '—'}</td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{i.categoria || '—'}</td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{i.descripcion || '—'}</td>
                          <td className={`px-4 py-3 text-sm font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            ${Number(i.monto).toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirEditar(i)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmarId(i.id)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20'
                                    : 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
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

      <footer className={`w-full px-4 py-6 text-center font-mono text-[0.7rem] ${isDarkMode ? 'text-zinc-600' : 'text-gray-500'}`}>
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[460px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
            isDarkMode
              ? 'border-white/10 bg-slate-950/95'
              : 'border-gray-200 bg-white'
          }`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>✏️ Editar Ingreso</h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Modifica los campos que necesites y guarda.</p>

            <label className={`mt-4 block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Monto *</label>
            <input
              className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
                isDarkMode
                  ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
              }`}
              type="number"
              name="monto"
              min="0"
              step="0.01"
              value={modalEditar.monto}
              onChange={handleEditarChange}
            />

            <label className={`mt-4 block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Categoría</label>
            <select
              className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
                isDarkMode
                  ? 'border-white/15 bg-white/10 text-zinc-100 focus:border-amber-400/60 focus:ring-amber-400/20'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-amber-400 focus:ring-amber-200'
              }`}
              name="id_categoria"
              value={modalEditar.id_categoria || ''}
              onChange={handleEditarChange}
            >
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1 || c.activa === true).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>

            <label className={`mt-4 block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Fuente</label>
            <input
              className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
                isDarkMode
                  ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
              }`}
              type="text"
              name="fuente"
              placeholder="Ej: Salario, Freelance..."
              value={modalEditar.fuente}
              onChange={handleEditarChange}
            />

            <label className={`mt-4 block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Descripción</label>
            <input
              className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
                isDarkMode
                  ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
              }`}
              type="text"
              name="descripcion"
              placeholder="Descripción opcional"
              value={modalEditar.descripcion}
              onChange={handleEditarChange}
            />

            <label className={`mt-4 block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Fecha</label>
            <input
              className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
                isDarkMode
                  ? 'border-white/15 bg-white/10 text-zinc-100 focus:border-amber-400/60 focus:ring-amber-400/20'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-amber-400 focus:ring-amber-200'
              }`}
              type="date"
              name="fecha_registro"
              value={modalEditar.fecha_registro}
              onChange={handleEditarChange}
            />

            {errorModal && (
              <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                isDarkMode
                  ? 'border-red-400/40 bg-red-400/10 text-red-400'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}>
                {errorModal}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setModalEditar(null)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10'
                    : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
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

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[380px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
            isDarkMode
              ? 'border-red-400/30 bg-slate-950/95'
              : 'border-red-200 bg-white'
          }`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>🗑️ ¿Eliminar ingreso?</h4>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Esta acción no se puede deshacer.</p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setConfirmarId(null)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10'
                    : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
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