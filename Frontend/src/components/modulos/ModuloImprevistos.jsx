import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias, getDependientes } from '../../api'
import ModalNuevoMovimiento from '../forms/Modalnuevomovimiento'
import HeaderModulos from '../layout/HeaderModulos'
import { useTheme } from '../../hooks/useTheme'
import imprevistosImg from '../../assets/Imprevistos.png' // ✅ Asegúrate de guardar la imagen aquí

const API = '/api/movimientos'

export default function ModuloImprevistos() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const [imprevistos, setImprevistos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [dependientes, setDependientes] = useState([])
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false)

  const cargarImprevistos = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/imprevistos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setImprevistos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getCategorias().then(data => { if (Array.isArray(data)) setCategorias(data) }).catch(() => {})
  }, [])

  useEffect(() => {
    getDependientes().then(data => { if (Array.isArray(data)) setDependientes(data) }).catch(() => {})
  }, [])

  useEffect(() => {
    cargarImprevistos()
  }, [])

  const total = imprevistos.reduce((acc, i) => acc + Number(i.monto || 0), 0)

  const abrirEditar = i => {
    setErrorModal(null)
    setModalEditar({
      id: i.id,
      monto: String(i.monto),
      causa: i.causa || '',
      id_categoria: i.id_categoria || '', // Asegúrate que coincida con el nombre del campo en la API
      id_dependientes: i.id_dependientes || '',
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
      const res = await fetch(`${API}/imprevistos/${modalEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: Number(modalEditar.monto),
          causa: modalEditar.causa || null,
          id_categoria: modalEditar.id_categoria || null,
          id_dependientes: modalEditar.id_dependientes || null,
          fecha_registro: modalEditar.fecha_registro || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setModalEditar(null)
        cargarImprevistos()
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
      const res = await fetch(`${API}/imprevistos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setConfirmarId(null)
        cargarImprevistos()
      }
    } catch {
      // silencioso
    } finally {
      setEliminando(false)
    }
  }

  const formatFecha = fecha =>
    fecha ? new Date(fecha).toLocaleDateString('es-CO') : '—'

  const inputModal = `mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
  }`

  const labelModal = `mt-4 block text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
  }`

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-slate-900'
      }`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 35% 18%, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.92) 55%, rgba(15,23,42,1) 100%)'
          : '#ffffff',
      }}
    >
      <HeaderModulos section="Imprevistos" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">
        {/* BIENVENIDA */}
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
            Bienvenido de vuelta
          </p>
          <h2
            className={`break-words text-xl font-extrabold sm:text-2xl ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* HERO IMPREVISTOS */}
        <article
          className={`grid gap-6 overflow-hidden rounded-[2rem] border px-5 py-6 shadow-2xl transition-colors duration-300 sm:grid-cols-[1.7fr_1.3fr] sm:px-6 sm:py-7 ${
            isDarkMode
              ? 'border-amber-400/20 bg-[#242f40] shadow-amber-300/10'
              : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-amber-200'
          }`}
        >
          <div className="flex flex-col justify-between gap-6">
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  isDarkMode ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-100 text-amber-700'
                }`}
              >
                Imprevistos hoy
              </span>
              <h3
                className={`mt-4 text-3xl font-extrabold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Tu espacio para lo inesperado
              </h3>
              <p className={`mt-3 max-w-xl text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                Gestiona los gastos imprevistos y mantén tu fondo de emergencia en control. Este panel
                te ayuda a visualizar dónde se va el dinero de urgencia.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`rounded-3xl border px-4 py-4 ${
                  isDarkMode ? 'border-amber-300/20 bg-[#1f2b3e]/80' : 'border-gray-200 bg-white'
                }`}
              >
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-amber-200' : 'text-gray-500'}`}>
                  Total imprevisto
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  ${total.toLocaleString('es-CO')}
                </p>
              </div>
              <div
                className={`rounded-3xl border px-4 py-4 ${
                  isDarkMode ? 'border-amber-500/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'
                }`}
              >
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-amber-200' : 'text-amber-600'}`}>
                  Registros activos
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  {imprevistos.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNuevoMovimiento(true)}
              className="inline-flex w-full max-w-[240px] items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-400 to-orange-500 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-px hover:shadow-xl sm:w-auto"
            >
              ➕ Registrar imprevisto nuevo
            </button>
          </div>

          <div
            className={`relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-[2rem] p-4 ${
              isDarkMode ? 'bg-[#242f40]' : 'bg-amber-100/70'
            }`}
          >
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-transparent via-[#a46c10]/10 to-transparent'
                  : 'bg-gradient-to-br from-transparent via-white/50 to-transparent'
              }`}
            />
            <img
              src={imprevistosImg}
              alt="Ilustración de imprevistos"
              className="relative max-h-[320px] w-full object-contain"
            />
          </div>
        </article>

        {/* SECCIÓN DE IMPREVISTOS */}
        <section
          className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
            isDarkMode ? 'border-amber-300/15 bg-[#242f40]/90' : 'border-gray-200 bg-white/80'
          }`}
        >
          {/* HEADER DE LA SECCIÓN */}
          <div
            className={`flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 transition-colors ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
               Módulo de Imprevistos
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {imprevistos.length} registro{imprevistos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* CONTENIDO */}
          <div className="p-4 sm:p-5">
            {cargando ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              </div>
            ) : imprevistos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-4xl">🛡️</span>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  No hay imprevistos registrados aún.
                </p>
                <button
                  onClick={() => setShowNuevoMovimiento(true)}
                  className="mt-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-5 py-2 text-xs font-bold text-white transition-all hover:-translate-y-px hover:shadow-lg"
                >
                  ➕ Registrar primer imprevisto
                </button>
              </div>
            ) : (
              <>
                {/* VISTA ESCRITORIO */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        {['Fecha', 'Causa', 'Categoría', 'Dependiente', 'Monto', 'Acciones'].map(
                          col => (
                            <th
                              key={col}
                              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                                isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                              }`}
                            >
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {imprevistos.map(i => (
                        <tr
                          key={i.id}
                          className={`border-b transition-colors ${
                            isDarkMode
                              ? 'border-white/5 hover:bg-white/[0.04]'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {formatFecha(i.fecha)}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {i.causa || '—'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {i.categoria || '—'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {i.dependiente || '—'}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-extrabold ${
                              isDarkMode ? 'text-amber-400' : 'text-amber-600'
                            }`}
                          >
                            ${Number(i.monto).toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirEditar(i)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                                    : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
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

                {/* VISTA MÓVIL */}
                <div className="grid gap-3 md:hidden">
                  {imprevistos.map(i => (
                    <article
                      key={i.id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        isDarkMode ? 'border-white/10 bg-white/[0.05]' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                            }`}
                          >
                            {formatFecha(i.fecha)}
                          </p>
                          <h4
                            className={`mt-1 break-words text-sm font-bold ${
                              isDarkMode ? 'text-zinc-100' : 'text-gray-900'
                            }`}
                          >
                            {i.causa || 'Sin causa'}
                          </h4>
                          <p
                            className={`mt-1 break-words text-sm ${
                              isDarkMode ? 'text-zinc-400' : 'text-gray-600'
                            }`}
                          >
                            {i.categoria || '—'}
                          </p>
                          {i.dependiente && (
                            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                              Dep: {i.dependiente}
                            </p>
                          )}
                        </div>
                        <p
                          className={`shrink-0 text-right text-base font-black ${
                            isDarkMode ? 'text-amber-400' : 'text-amber-600'
                          }`}
                        >
                          ${Number(i.monto).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => abrirEditar(i)}
                          className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            isDarkMode
                              ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                              : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
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
              </>
            )}
          </div>
        </section>
      </main>

      <footer
        className={`w-full px-4 py-6 text-center font-mono text-[0.7rem] ${
          isDarkMode ? 'text-zinc-600' : 'text-gray-500'
        }`}
      >
        <p>
          © <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.
        </p>
      </footer>

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div
            className={`w-full max-w-[460px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
              isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-gray-200 bg-white'
            }`}
          >
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              ✏️ Editar Imprevisto
            </h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              Modifica los campos que necesites y guarda.
            </p>

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

            <label className={labelModal}>Causa</label>
            <input
              className={inputModal}
              type="text"
              name="causa"
              placeholder="Ej: Reparación, Urgencia médica..."
              value={modalEditar.causa}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Fecha</label>
            <input
              className={inputModal}
              type="date"
              name="fecha_registro"
              value={modalEditar.fecha_registro}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Categoría</label>
            <select
              className={inputModal}
              name="id_categoria"
              value={modalEditar.id_categoria || ''}
              onChange={handleEditarChange}
            >
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            <label className={labelModal}>Dependiente</label>
            <select
              className={inputModal}
              name="id_dependientes"
              value={modalEditar.id_dependientes || ''}
              onChange={handleEditarChange}
            >
              <option value="">Sin dependiente</option>
              {dependientes.map(d => (
                <option key={d.ID_dependientes} value={d.ID_dependientes}>
                  {d.Nombre}
                </option>
              ))}
            </select>

            {errorModal && (
              <p
                className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  isDarkMode
                    ? 'border-red-400/40 bg-red-400/10 text-red-400'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}
              >
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
                className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNuevoMovimiento && (
        <ModalNuevoMovimiento subtipo="Imprevisto" onCerrar={() => setShowNuevoMovimiento(false)} onGuardado={() => cargarImprevistos()} />
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div
            className={`w-full max-w-[380px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
              isDarkMode ? 'border-red-400/30 bg-slate-950/95' : 'border-red-200 bg-white'
            }`}
          >
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              🗑️ ¿Eliminar imprevisto?
            </h4>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              Esta acción no se puede deshacer.
            </p>

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