import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderModulos from '../layout/HeaderModulos'
import { useTheme } from '../../hooks/useTheme'
import dependientesImg from '../../assets/Dependientes.png' // ✅ Asegúrate de guardar la imagen aquí

const PESO_LABELS = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' }

export default function ModulosDependientes() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const token = localStorage.getItem('token')
  const [dependientes, setDependientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [formDatos, setFormDatos] = useState({
    Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3'
  })

  const cargarDependientes = () => {
    setCargando(true)
    fetch('/api/dependientes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDependientes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando dependientes:', err))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargarDependientes()
  }, [])

  const handleChange = e =>
    setFormDatos(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const abrirModal = () => {
    // Si no se abre el modal al hacer click, suele ser por que está fallando
    // algún estado/logic previo o porque modalEditar no cambia.
    console.log('Abrir modal dependientes. Token:', token)
    setFormDatos({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' })
    setModalEditar(false)
    setErrorModal(null)
  }

  const handleEditar = d => {
    setFormDatos({
      Nombre: d.Nombre, Relacion: d.Relacion, Ocupacion: d.Ocupacion || '',
      Fecha_nacimiento: d.Fecha_nacimiento ? d.Fecha_nacimiento.split('T')[0] : '',
      Peso_economico: String(d.Peso_economico ?? '3')
    })
    setModalEditar(d.ID_dependientes)
    setErrorModal(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = {
      ...formDatos,
      Peso_economico: parseInt(formDatos.Peso_economico),
      Fecha_nacimiento: formDatos.Fecha_nacimiento || null
    }
    setGuardando(true)
    
    try {
      if (modalEditar) {
        const res = await fetch(`/api/dependientes/${modalEditar}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
          body: JSON.stringify(payload) 
        })
        if (res.ok) {
          cargarDependientes()
          setModalEditar(null)
        } else { 
          const data = await res.json()
          setErrorModal(data.error || 'Error al actualizar') 
        }
      } else {
        const res = await fetch('/api/dependientes', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
          body: JSON.stringify(payload) 
        })
        const data = await res.json()
        if (res.ok) {
          cargarDependientes()
          setModalEditar(null)
        } else {
          setErrorModal(data.error || 'Error al guardar') 
        }
      }
    } catch {
      setErrorModal('Error al conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async id => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este dependiente?')) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/dependientes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setConfirmarId(null)
        cargarDependientes()
      } else {
        alert('Error al eliminar el dependiente')
      }
    } catch {
      // silencioso
    } finally {
      setEliminando(false)
    }
  }

  const getPesoBadgeClass = (peso) => {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors '
    if (peso <= 1) return isDarkMode ? base + 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30' : base + 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (peso <= 2) return isDarkMode ? base + 'bg-blue-400/15 text-blue-400 border-blue-400/30' : base + 'bg-blue-50 text-blue-700 border-blue-200'
    if (peso <= 3) return isDarkMode ? base + 'bg-indigo-400/15 text-indigo-400 border-indigo-400/30' : base + 'bg-indigo-50 text-indigo-700 border-indigo-200'
    if (peso <= 4) return isDarkMode ? base + 'bg-orange-400/15 text-orange-400 border-orange-400/30' : base + 'bg-orange-50 text-orange-700 border-orange-200'
    return isDarkMode ? base + 'bg-red-400/15 text-red-400 border-red-400/30' : base + 'bg-red-50 text-red-700 border-red-200'
  }

  const inputModal = `mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-400/60 focus:ring-indigo-400/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-200'
  }`

  const labelModal = `mt-4 block text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
  }`

  const optionStyle = isDarkMode
    ? { backgroundColor: '#1e293b', color: '#f1f5f9' }
    : { backgroundColor: '#ffffff', color: '#111827' }

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
      <HeaderModulos section="Dependientes" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

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

        {/* HERO DEPENDIENTES */}
        <article
          className={`grid gap-6 overflow-hidden rounded-[2rem] border px-5 py-6 shadow-2xl transition-colors duration-300 sm:grid-cols-[1.7fr_1.3fr] sm:px-6 sm:py-7 ${
            isDarkMode
              ? 'border-indigo-400/20 bg-[#242f40] shadow-indigo-300/10'
              : 'border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-100 shadow-indigo-200'
          }`}
        >
          <div className="flex flex-col justify-between gap-6">
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  isDarkMode ? 'bg-indigo-400/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                Familia hoy
              </span>
              <h3
                className={`mt-4 text-3xl font-extrabold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Tu espacio para cuidar de quienes amas
              </h3>
              <p className={`mt-3 max-w-xl text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                Gestiona la información de tus dependientes y su impacto económico. Este panel te ayuda
                a planificar mejor las necesidades de tu familia.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`rounded-3xl border px-4 py-4 ${
                  isDarkMode ? 'border-indigo-300/20 bg-[#1f2b3e]/80' : 'border-gray-200 bg-white'
                }`}
              >
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-indigo-200' : 'text-gray-500'}`}>
                  Total dependientes
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  {dependientes.length}
                </p>
              </div>
              <div
                className={`rounded-3xl border px-4 py-4 ${
                  isDarkMode ? 'border-indigo-500/20 bg-indigo-400/10' : 'border-indigo-200 bg-indigo-50'
                }`}
              >
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-indigo-200' : 'text-indigo-600'}`}>
                  Registros activos
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  {dependientes.filter(d => d.Peso_economico >= 3).length} con alto impacto
                </p>
              </div>
            </div>

            <button
              onClick={abrirModal}
              className="inline-flex w-full max-w-[240px] items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-400 to-violet-500 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-px hover:shadow-xl sm:w-auto"
            >
              ➕ Agregar dependiente
            </button>
          </div>

          <div
            className={`relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-[2rem] p-4 ${
              isDarkMode ? 'bg-[#242f40]' : 'bg-indigo-100/70'
            }`}
          >
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-transparent via-[#6366f1]/10 to-transparent'
                  : 'bg-gradient-to-br from-transparent via-white/50 to-transparent'
              }`}
            />
            <img
              src={dependientesImg}
              alt="Ilustración de familia"
              className="relative max-h-[320px] w-full object-contain"
            />
          </div>
        </article>

        {/* SECCIÓN DE DEPENDIENTES */}
        <section
          className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
            isDarkMode ? 'border-indigo-300/15 bg-[#242f40]/90' : 'border-gray-200 bg-white/80'
          }`}
        >
          {/* HEADER DE LA SECCIÓN */}
          <div
            className={`flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 transition-colors ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
               Módulo de Dependientes
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {dependientes.length} registro{dependientes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* CONTENIDO */}
          <div className="p-4 sm:p-5">
            {cargando ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              </div>
            ) : dependientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-4xl">👨‍👩‍‍👦</span>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  No hay dependientes registrados aún.
                </p>
                <button
                  onClick={abrirModal}
                  className="mt-2 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 px-5 py-2 text-xs font-bold text-white transition-all hover:-translate-y-px hover:shadow-lg"
                >
                  ➕ Agregar primer dependiente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dependientes.map(dep => (
                  <article
                    key={dep.ID_dependientes}
                    className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      isDarkMode ? 'border-white/10 bg-white/[0.05]' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col gap-2 mb-4">
                      <p className={`text-lg font-extrabold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
                        {dep.Nombre}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                        {dep.Relacion} {dep.Ocupacion ? `· ${dep.Ocupacion}` : ''}
                      </p>
                      {dep.Fecha_nacimiento && (
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                          Nac: {dep.Fecha_nacimiento.split('T')[0]}
                        </p>
                      )}
                      <span className={getPesoBadgeClass(dep.Peso_economico)}>
                        Peso: {PESO_LABELS[dep.Peso_economico] ?? 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditar(dep)}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                          isDarkMode
                            ? 'border-indigo-400/50 bg-indigo-400/10 text-indigo-400 hover:bg-indigo-400/20'
                            : 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmarId(dep.ID_dependientes)}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
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
          © <strong className="text-indigo-400">2026 Ahorrapp</strong>. Todos los derechos reservados.
        </p>
      </footer>

      {/* MODAL AGREGAR/EDITAR */}
      {modalEditar !== null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div
            className={`w-full max-w-[460px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
              isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-gray-200 bg-white'
            }`}
          >
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {modalEditar ? '✏️ Editar Dependiente' : '➕ Agregar Dependiente'}
            </h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              Completa la información del dependiente.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className={labelModal}>Nombre *</label>
              <input
                className={inputModal}
                type="text"
                name="Nombre"
                value={formDatos.Nombre}
                onChange={handleChange}
                required
                placeholder="Nombre del dependiente"
              />

              <label className={labelModal}>Relación *</label>
              <select
                className={inputModal}
                name="Relacion"
                value={formDatos.Relacion}
                onChange={handleChange}
                required
              >
                <option value="" style={optionStyle}>Selecciona una relación</option>
                {['Hijo','Hija','Hermano','Hermana','Padre','Madre','Abuelo','Abuela','Otro'].map(r => (
                  <option key={r} value={r} style={optionStyle}>{r}</option>
                ))}
              </select>

              <label className={labelModal}>Ocupación</label>
              <input
                className={inputModal}
                type="text"
                name="Ocupacion"
                value={formDatos.Ocupacion}
                onChange={handleChange}
                placeholder="Ocupación del dependiente"
              />

              <label className={labelModal}>Fecha de Nacimiento *</label>
              <input
                className={inputModal}
                type="date"
                name="Fecha_nacimiento"
                value={formDatos.Fecha_nacimiento}
                onChange={handleChange}
                required
              />

              <label className={labelModal}>Peso Económico</label>
              <select
                className={inputModal}
                name="Peso_economico"
                value={formDatos.Peso_economico}
                onChange={handleChange}
              >
                <option value="1" style={optionStyle}>1 - Muy bajo</option>
                <option value="2" style={optionStyle}>2 - Bajo</option>
                <option value="3" style={optionStyle}>3 - Medio</option>
                <option value="4" style={optionStyle}>4 - Alto</option>
                <option value="5" style={optionStyle}>5 - Muy alto</option>
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
                  type="button"
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
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
              🗑️ ¿Eliminar dependiente?
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
                onClick={() => handleEliminar(confirmarId)}
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