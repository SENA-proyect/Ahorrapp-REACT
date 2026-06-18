import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderModulos from '../layout/HeaderModulos'
import { useTheme } from '../../hooks/useTheme'
import ahorrosImg from '../../assets/Ahorros.png'
import { abonarAhorro, getCategorias } from '../../api'
import ModalNuevoMovimiento from '../forms/Modalnuevomovimiento'

const API = '/api/movimientos'

const BarraProgreso = ({ acumulado, meta }) => {
  const { isDarkMode } = useTheme()
  const pct = meta && Number(meta) > 0 ? Math.min(100, (Number(acumulado || 0) / Number(meta)) * 100) : 0

  return (
    <div className="mt-1">
      <div className={`h-2 w-full overflow-hidden rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

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
  const [modalAbonar, setModalAbonar] = useState(null)
  const [abonando, setAbonando] = useState(false)
  const [montoAbono, setMontoAbono] = useState('')
  const [categorias, setCategorias] = useState([])
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false)

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

  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  const total = ahorros.reduce((acc, a) => acc + Number(a.monto || 0), 0)

  const abrirAbonar = a => {
    setErrorModal(null)
    setMontoAbono('')
    setModalAbonar(a)
  }

  const hacerAbono = async () => {
    const monto = parseFloat(montoAbono)
    if (!monto || monto <= 0) return setErrorModal('El monto del abono debe ser mayor a 0')
    setAbonando(true)
    try {
      const data = await abonarAhorro(modalAbonar.id, monto)
      if (data.ok) { setModalAbonar(null); cargarAhorros() }
      else setErrorModal(data.mensaje || 'Error al abonar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setAbonando(false) }
  }

  const abrirEditar = a => {
    setErrorModal(null)
    setModalEditar({
      id: a.id,
      monto: String(a.monto),
      meta: a.meta || '',
      categoria: a.categoria || '',
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
          categoria: modalEditar.categoria || null,
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

  const inputModal = `mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
  }`

  const labelModal = `mt-4 block text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
  }`

  // ✅ Mismo patrón de mainBg que ModuloIngresos
  // Aplicar inline style para el gradiente
  
  return (
    // ✅ Mismo wrapper que ModuloIngresos
    <div 
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 35% 18%, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.92) 55%, rgba(15,23,42,1) 100%)'
          : '#ffffff',
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

        {/* HERO AHORROS */}
        <article className={`grid gap-6 overflow-hidden rounded-[2rem] border px-5 py-6 shadow-2xl transition-colors duration-300 sm:grid-cols-[1.7fr_1.3fr] sm:px-6 sm:py-7 ${
          isDarkMode
            ? 'border-amber-400/20 bg-[#242f40] shadow-amber-300/10'
            : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100 shadow-amber-200'
        }`}>
          <div className="flex flex-col justify-between gap-6">
            <div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isDarkMode ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                Ahorrar hoy
              </span>
              <h3 className={`mt-4 text-3xl font-extrabold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Tu espacio para metas seguras
              </h3>
              <p className={`mt-3 max-w-xl text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                Planifica, ajusta y sigue el progreso de tus ahorros con claridad. Este panel te ayuda a mantener el enfoque en cada meta.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`rounded-3xl border px-4 py-4 ${isDarkMode ? 'border-amber-300/20 bg-[#1f2b3e]/80' : 'border-gray-200 bg-white'}`}>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-amber-200' : 'text-gray-500'}`}>
                  Total ahorrado
                </p>
                <p className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  ${total.toLocaleString('es-CO')}
                </p>
              </div>
              <div className={`rounded-3xl border px-4 py-4 ${isDarkMode ? 'border-amber-500/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-amber-200' : 'text-amber-600'}`}>
                  Metas activas
                </p>
                <p className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {ahorros.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNuevoMovimiento(true)}
              className="inline-flex w-full max-w-[240px] items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px hover:shadow-xl sm:w-auto"
            >
              ➕ Crear una meta nueva
            </button>
          </div>

          <div className={`relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-[2rem] p-4 ${isDarkMode ? 'bg-[#242f40]' : 'bg-amber-100/70'}`}>
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-transparent via-[#a46c10]/10 to-transparent' : 'bg-gradient-to-br from-transparent via-white/50 to-transparent'}`} />
            <img
              src={ahorrosImg}
              alt="Ilustración de ahorros"
              className="relative max-h-[320px] w-full object-contain"
            />
          </div>
        </article>

        {/* SECCIÓN DE AHORROS */}
        <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
          isDarkMode
            ? 'border-amber-300/15 bg-[#242f40]/90'
            : 'border-gray-200 bg-white/80'
        }`}>
          {/* HEADER DE LA SECCIÓN */}
          <div className={`flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 transition-colors ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
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
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              </div>
            ) : ahorros.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-4xl">🎯</span>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  No hay ahorros registrados aún.
                </p>
                <button
                  onClick={() => setShowNuevoMovimiento(true)}
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
                            <BarraProgreso acumulado={a.acumulado} meta={a.monto} />
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
                                onClick={() => abrirAbonar(a)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                Abonar
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

            <label className={labelModal}>Categoría</label>
            <select
              className={inputModal}
              name="categoria"
              value={modalEditar.categoria}
              onChange={handleEditarChange}
            >
              <option value="">Sin categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

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

      {/* MODAL ABONAR */}
      {modalAbonar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[420px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
            isDarkMode
              ? 'border-white/10 bg-slate-950/95'
              : 'border-gray-200 bg-white'
          }`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              💰 Abonar al ahorro
            </h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              Añade un abono a &quot;{modalAbonar.meta || 'tu meta'}&quot;
            </p>

            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs">
                <span className={isDarkMode ? 'text-zinc-400' : 'text-gray-500'}>
                  ${Number(modalAbonar.acumulado || 0).toLocaleString('es-CO')}
                </span>
                <span className={isDarkMode ? 'text-zinc-400' : 'text-gray-500'}>
                  ${Number(modalAbonar.monto || 0).toLocaleString('es-CO')}
                </span>
              </div>
              <BarraProgreso acumulado={modalAbonar.acumulado} meta={modalAbonar.monto} />
            </div>

            <label className={labelModal}>Monto del abono</label>
            <input
              className={inputModal}
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 50000"
              value={montoAbono}
              onChange={e => setMontoAbono(e.target.value)}
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
                onClick={() => { setModalAbonar(null); setErrorModal(null) }}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10'
                    : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={hacerAbono}
                disabled={abonando}
                className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {abonando ? 'Abonando...' : 'Abonar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNuevoMovimiento && (
        <ModalNuevoMovimiento subtipo="Ahorro" onCerrar={() => setShowNuevoMovimiento(false)} onGuardado={() => cargarAhorros()} />
      )}
    </div>
  )
}
