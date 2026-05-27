import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias, getDependientes } from '../api'
import HeaderModulos from './HeaderModulos'
import { useTheme } from '../hooks/useTheme'

const API = 'http://localhost:3000/api/movimientos'

export default function ModuloGastos() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme() // ✅ Hook para saber el tema
  const usuario = JSON.parse(localStorage.getItem('usuario'))

  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [dependientes, setDependientes] = useState([])

  const cargarGastos = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/gastos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGastos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getCategorias().then(data => { if (Array.isArray(data)) setCategorias(data) }).catch(() => {})
  }, [])

  useEffect(() => {
    getDependientes().then(data => { if (Array.isArray(data)) setDependientes(data) }).catch(() => {})
  }, [])

  useEffect(() => { cargarGastos() }, [])

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0)

  const abrirEditar = (g) => {
    setErrorModal(null)
    setModalEditar({
      id: g.id,
      monto: String(g.monto),
      id_categoria: g.ID_categoria || '',
      id_dependientes: g.ID_dependientes || '',
      descripcion: g.descripcion || '',
      fecha: g.fecha ? g.fecha.slice(0, 10) : '',
    })
  }

  const handleEditarChange = (e) =>
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
      const res = await fetch(`${API}/gastos/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto: Number(modalEditar.monto),
          descripcion: modalEditar.descripcion || null,
          fecha_registro: modalEditar.fecha || null,
          id_categoria: modalEditar.id_categoria || null,
          id_dependientes: modalEditar.id_dependientes || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarGastos() }
      else setErrorModal(data.mensaje || 'Error al guardar')
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
      const res = await fetch(`${API}/gastos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarGastos() }
    } catch {}
    finally {
      setEliminando(false)
    }
  }

  const formatFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString('es-CO') : '—')

  // ✅ Estilos para el modal
  const inputModal = `mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
  }`

  const labelModal = `mt-4 block text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
  }`

  const optionStyle = isDarkMode
    ? { backgroundColor: '#1e293b', color: '#f1f5f9' }
    : { backgroundColor: '#ffffff', color: '#111827' }

  // ✅ Fondo dinámico: Oscuro vs Claro
  return (
    <div 
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      <HeaderModulos section="Gastos" />
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
            ? 'border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(239,68,68,0.35),rgba(220,38,38,0.04))] shadow-white/10'
            : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-red-100'
        }`}>
          <div>
            <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
               Total Gastos
            </p>
            <p className={`break-words text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${total.toLocaleString('es-CO')}
            </p>
          </div>

          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="w-full rounded-xl bg-gradient-to-br from-red-400 to-red-500 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-px hover:shadow-lg sm:w-auto"
          >
             Registrar Gasto
          </button>
        </article>

        {/* ✅ SECCIÓN DE GASTOS CORREGIDA */}
        <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
          isDarkMode
            ? 'border-white/10 bg-white/[0.04]' // ✅ Fondo vidrio en oscuro
            : 'border-gray-200 bg-white/80'    // ✅ Fondo blanco semi en claro
        }`}>
          {/* HEADER */}
          <div className={`flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 transition-colors ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              📋 Módulo de Gastos
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {gastos.length} registro{gastos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* CONTENIDO */}
          <div className="p-4 sm:p-5">
            {cargando ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-400 border-t-transparent" />
              </div>
            ) : (
              // ✅ Eliminé la condición de "empty state", solo renderizo la tabla
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      {['Fecha', 'Categoría', 'Descripción', 'Dependiente', 'Monto', 'Acciones'].map((col) => (
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
                    {gastos.map((g) => (
                      <tr
                        key={g.id}
                        className={`border-b transition-colors ${
                          isDarkMode
                            ? 'border-white/5 hover:bg-white/[0.04]'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{formatFecha(g.fecha)}</td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{g.categoria || '—'}</td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{g.descripcion || '—'}</td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{g.dependiente || '—'}</td>
                        <td className={`px-4 py-3 text-sm font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                          ${Number(g.monto).toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => abrirEditar(g)}
                              className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                isDarkMode
                                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                                  : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setConfirmarId(g.id)}
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
                {gastos.length === 0 && (
                  <p className="py-10 text-center text-sm italic text-gray-500">
                    No hay registros para mostrar.
                  </p>
                )}
              </div>
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
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>✏️ Editar Gasto</h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Modifica los campos que necesites y guarda.</p>

            <label className={labelModal}>Monto *</label>
            <input className={inputModal} type="number" name="monto" min="0" step="0.01" value={modalEditar.monto} onChange={handleEditarChange} />

            <label className={labelModal}>Descripción</label>
            <input className={inputModal} type="text" name="descripcion" placeholder="Descripción opcional" value={modalEditar.descripcion} onChange={handleEditarChange} />

            <label className={labelModal}>Fecha</label>
            <input className={inputModal} type="date" name="fecha" value={modalEditar.fecha} onChange={handleEditarChange} />

            <label className={labelModal}>Categoría</label>
            <select className={inputModal} name="id_categoria" value={modalEditar.id_categoria || ''} onChange={handleEditarChange}>
              <option value="" style={optionStyle}>Sin categoría</option>
              {categorias.filter((c) => c.activa == 1).map((cat) => (
                <option key={cat.id} value={cat.id} style={optionStyle}>{cat.nombre}</option>
              ))}
            </select>

            <label className={labelModal}>Dependiente</label>
            <select className={inputModal} name="id_dependientes" value={modalEditar.id_dependientes || ''} onChange={handleEditarChange}>
              <option value="" style={optionStyle}>Sin dependiente</option>
              {dependientes.map((d) => (
                <option key={d.ID_dependientes} value={d.ID_dependientes} style={optionStyle}>{d.Nombre}</option>
              ))}
            </select>

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
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>🗑️ ¿Eliminar gasto?</h4>
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