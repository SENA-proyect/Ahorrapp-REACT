import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderModulos from './HeaderModulos'
import { useTheme } from '../hooks/useTheme'

const API = 'http://localhost:3000/api/movimientos'

export default function ModuloAhorros() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const usuario = JSON.parse(localStorage.getItem('usuario'))

  const [ahorros, setAhorros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)

  const cargarAhorros = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/ahorros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAhorros(data)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargarAhorros()
  }, [])

  const total = ahorros.reduce((acc, a) => acc + Number(a.monto || 0), 0)

  const abrirEditar = a => {
    setErrorModal(null)
    setModalEditar({
      id: a.id,
      monto: String(a.monto),
      meta: a.meta || '',
      descripcion: a.descripcion || '',
      fecha_meta: a.fecha_meta ? a.fecha_meta.slice(0, 10) : '',
      acumulado: String(a.monto_acumulado ?? a.acumulado ?? 0),
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
      const res = await fetch(`${API}/ahorros/${modalEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: Number(modalEditar.monto),
          meta: modalEditar.meta || null,
          descripcion: modalEditar.descripcion || null,
          fecha_meta: modalEditar.fecha_meta || null,
          monto_acumulado: Number(modalEditar.acumulado) || 0,
          acumulado: Number(modalEditar.acumulado) || 0,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setModalEditar(null)
        cargarAhorros()
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
      const res = await fetch(`${API}/ahorros/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setConfirmarId(null)
        cargarAhorros()
      }
    } catch {
      // silencioso
    } finally {
      setEliminando(false)
    }
  }

  const formatFecha = fecha =>
    fecha ? new Date(fecha).toLocaleDateString('es-CO') : '—'

  // ✅ Mismo patrón de mainBg que ModuloIngresos
  // Aplicar inline style para el gradiente
  
  return (
    // ✅ Mismo wrapper que ModuloIngresos
    <div 
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      <HeaderModulos section="Ahorros" />

      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">

        {/* BIENVENIDA */}
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Bienvenido de vuelta</p>
          <h2 className={`break-words text-xl font-extrabold sm:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* CARD TOTAL — tono dorado/amarillo para Ahorros */}
        <article className={`flex flex-col justify-between gap-4 rounded-2xl border px-5 py-5 shadow-lg sm:flex-row sm:items-center sm:px-8 sm:py-6 transition-colors duration-300 ${
          isDarkMode
            ? 'border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(234,179,8,0.35),rgba(202,138,4,0.04))] shadow-white/10'
            : 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-yellow-100'
        }`}>
          <div>
            <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              🎯 Total Ahorros
            </p>
            <p className={`break-words text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${total.toLocaleString('es-CO')}
            </p>
          </div>

          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="w-full rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px hover:shadow-lg sm:w-auto"
          >
            ➕ Nueva Meta
          </button>
        </article>

        {/* SECCIÓN DE AHORROS */}
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
              📋 Módulo de Ahorros
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {ahorros.length} registro{ahorros.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* CONTENIDO */}
          <div className="p-4 sm:p-5">
            {cargando ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
              </div>
            ) : ahorros.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-4xl">🎯</span>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  No hay ahorros registrados aún.
                </p>
                <button
                  onClick={() => navigate('/movimientos/nuevo')}
                  className="mt-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 py-2 text-xs font-bold text-slate-900 transition-all hover:-translate-y-px hover:shadow-lg"
                >
                  ➕ Crear primera meta
                </button>
              </div>
            ) : (
              <>
                {/* TABLA */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-separate border-spacing-0 text-left">
                    <thead>
                      <tr>
                        {['Fecha', 'Meta', 'Descripción', 'Fecha Meta', 'Monto', 'Acumulado', 'Acciones'].map(col => (
                          <th
                            key={col}
                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                              isDarkMode ? 'text-zinc-500' : 'text-gray-400'
                            }`}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ahorros.map(a => (
                        <tr
                          key={a.id}
                          className={`border-b transition-colors ${
                            isDarkMode
                              ? 'border-white/5 hover:bg-white/[0.04]'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {formatFecha(a.fecha)}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {a.meta || '—'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {a.descripcion || '—'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {formatFecha(a.fecha_meta)}
                          </td>
                          <td className={`px-4 py-3 text-sm font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            ${Number(a.monto).toLocaleString('es-CO')}
                          </td>
                          <td className={`px-4 py-3 text-sm font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            ${Number(a.acumulado || 0).toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirEditar(a)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                                    : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmarId(a.id)}
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
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>✏️ Editar Ahorro</h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Modifica los campos que necesites y guarda.</p>

            <label className={labelModal}>Monto *</label>
            <input
              className={inputModal}
              type="number"
              name="monto"
              min="0"
              step="0.01"
              value={modalEditar.monto}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Meta</label>
            <input
              className={inputModal}
              type="text"
              name="meta"
              placeholder="Ej: Vacaciones, Emergencia..."
              value={modalEditar.meta}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Descripción</label>
            <input
              className={inputModal}
              type="text"
              name="descripcion"
              placeholder="Descripción opcional"
              value={modalEditar.descripcion}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Fecha Meta</label>
            <input
              className={inputModal}
              type="date"
              name="fecha_meta"
              value={modalEditar.fecha_meta}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Acumulado</label>
            <input
              className={inputModal}
              type="number"
              name="acumulado"
              min="0"
              step="0.01"
              value={modalEditar.acumulado}
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
                className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
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
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>🗑️ ¿Eliminar ahorro?</h4>
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