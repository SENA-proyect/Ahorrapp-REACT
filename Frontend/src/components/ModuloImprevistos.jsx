import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCategorias, getDependientes } from '../api'
import HeaderModulos from './HeaderModulos'
import { useTheme } from '../hooks/useTheme'

const API = 'http://localhost:3000/api/movimientos'

const navItems = [
  { href: '/Dashboard',           emoji: '📊', label: 'Dashboard' },
  { href: '/ModulosIngresos',     emoji: '💰', label: 'Ingresos' },
  { href: '/ModulosGastos',       emoji: '💸', label: 'Gastos' },
  { href: '/ModuloAhorros',       emoji: '🎯', label: 'Ahorrar' },
  { href: '/ModuloImprevistos',   emoji: '🛡️', label: 'Imprevistos' },
  { href: '/ModuloDeudas',        emoji: '💳', label: 'Deudas' },
  { href: '/ModulosDependientes', emoji: '👩‍👧‍👦', label: 'Dependientes' },
  { href: '/ModulosCategorias',   emoji: '🧩', label: 'Categorias' },
  { href: '/movimientos/nuevo',   emoji: '➕', label: 'Nuevo Movimiento' },
]

const Imprevistos = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode } = useTheme() // ✅ Hook centralizado
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
    getCategorias().then(d => { if (Array.isArray(d)) setCategorias(d) }).catch(() => {}) 
  }, [])
  
  useEffect(() => { 
    getDependientes().then(d => { if (Array.isArray(d)) setDependientes(d) }).catch(() => {}) 
  }, [])
  
  useEffect(() => { cargarImprevistos() }, [])

  const total = imprevistos.reduce((acc, i) => acc + Number(i.monto), 0)

  const abrirEditar = (i) => {
    setErrorModal(null)
    setModalEditar({ 
      id: i.id, 
      monto: String(i.monto), 
      causa: i.causa || '', 
      fecha_registro: i.fecha ? i.fecha.slice(0, 10) : '', 
      id_categoria: i.ID_categoria || '', 
      id_dependientes: i.ID_dependientes || '' 
    })
  }

  const handleEditarChange = (e) => 
    setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const guardarEdicion = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) { 
      setErrorModal('El monto debe ser un número mayor a 0'); return 
    }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/imprevistos/${modalEditar.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ 
          monto: Number(modalEditar.monto), 
          causa: modalEditar.causa || null, 
          fecha_registro: modalEditar.fecha_registro || null, 
          id_categoria: modalEditar.id_categoria || null, 
          id_dependientes: modalEditar.id_dependientes || null 
        }) 
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarImprevistos() } 
      else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try { 
      const res = await fetch(`${API}/imprevistos/${confirmarId}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      }); 
      if (res.ok) { setConfirmarId(null); cargarImprevistos() } 
    } catch { }
    finally { setEliminando(false) }
  }

  const formatFecha = fecha => fecha ? new Date(fecha).toLocaleDateString('es-CO') : '—'

  // 🎨 Fondo principal adaptativo
const mainBg = isDarkMode
? 'bg-[#050a1b]'
    : 'bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50'

  // 🎨 Card de total adaptativa
  const cardTotalBg = isDarkMode
    ? 'border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(251,146,60,0.35),rgba(234,88,12,0.04))] shadow-white/10'
    : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-amber-100'

  // 🎨 Sección principal adaptativa
  const sectionBg = isDarkMode
    ? 'border-white/10 bg-white/[0.04]'
    : 'border-gray-200 bg-white/80'

  // 🎨 Inputs adaptativos
  const inputClass = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 transition-colors ${
    isDarkMode
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
  }`

  // 🎨 Labels adaptativos
  const labelClass = `block text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
  }`

  // 🎨 Botones de acción adaptativos
  const btnEditClass = `rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
    isDarkMode
      ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
      : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
  }`

  const btnDeleteClass = `rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
    isDarkMode
      ? 'border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20'
      : 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
  }`

  const NavBar = () => (
    <nav className="w-full px-4">
      <ul className="flex flex-wrap justify-center gap-4 items-center text-md min-w-max mx-auto pb-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.href
          return (
            <li 
              key={item.href} 
              onClick={() => navigate(item.href)} 
              className={`px-3 py-1 rounded-[10px] cursor-pointer transition-all duration-300 ${
                isActive 
                  ? 'font-bold text-amber-400 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)]' 
                  : isDarkMode 
                    ? 'text-white bg-white/10 hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)]' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 hover:-translate-y-px'
              }`}
            >
              {item.emoji} {item.label}
            </li>
          )
        })}
      </ul>
    </nav>
  )

  return (
    <div 
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      <HeaderModulos section="imprevistos"/>
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-8">
        
        {/* BIENVENIDA */}
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Bienvenido de vuelta</p>
          <h2 className={`text-xl font-extrabold sm:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* CARD TOTAL */}
        <article className={`flex flex-col justify-between gap-4 rounded-2xl border px-6 py-6 shadow-lg sm:flex-row sm:items-center transition-colors duration-300 ${cardTotalBg}`}>
          <div>
            <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              🛡️ Total Imprevistos
            </p>
            <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${total.toLocaleString('es-CO')}
            </p>
          </div>
          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="w-full rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px hover:shadow-lg sm:w-auto"
          >
            ➕ Registrar Imprevisto
          </button>
        </article>

        {/* SECCIÓN DE IMPREVISTOS */}
        <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${sectionBg}`}>
          
          {/* HEADER */}
          <div className={`flex flex-col gap-1 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              📋 Fondo de Imprevistos
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {imprevistos.length} registro{imprevistos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* CONTENIDO */}
          <div className="p-4 sm:p-5">
            {cargando ? (
              <p className={`py-5 text-sm italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>⏳ Cargando...</p>
            ) : imprevistos.length === 0 ? (
              <p className={`py-5 text-sm italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Tu fondo de imprevistos está vacío. Es recomendable ahorrar al menos 3 meses de gastos.
              </p>
            ) : (
              <>
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
                          <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {formatFecha(i.fecha)}
                          </p>
                          <h4 className={`mt-1 break-words text-sm font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
                            {i.causa || 'Sin causa'}
                          </h4>
                          <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                            Categoría: {i.categoria || '—'} • {i.dependiente || 'Sin dependiente'}
                          </p>
                        </div>
                        <p className={`shrink-0 text-right text-base font-black ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                          ${Number(i.monto).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button onClick={() => abrirEditar(i)} className={btnEditClass}>Editar</button>
                        <button onClick={() => setConfirmarId(i.id)} className={btnDeleteClass}>Eliminar</button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* VISTA ESCRITORIO */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        {['Fecha', 'Causa', 'Categoría', 'Dependiente', 'Monto', 'Acciones'].map(col => (
                          <th key={col} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {imprevistos.map(i => (
                        <tr
                          key={i.id}
                          className={`border-b transition-colors ${
                            isDarkMode ? 'border-white/5 hover:bg-white/[0.04]' : 'border-gray-100 hover:bg-gray-50'
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
                          <td className={`px-4 py-3 text-sm font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            ${Number(i.monto).toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => abrirEditar(i)} className={btnEditClass}>Editar</button>
                              <button onClick={() => setConfirmarId(i.id)} className={btnDeleteClass}>Eliminar</button>
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
          <div className={`w-full max-w-[460px] rounded-2xl border p-6 shadow-2xl transition-colors ${
            isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-gray-200 bg-white'
          }`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>✏️ Editar Imprevisto</h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Modifica los campos que necesites y guarda.</p>

            <label className={`${labelClass} mt-4`}>Monto *</label>
            <input className={inputClass} type="number" name="monto" min="0" step="0.01" value={modalEditar.monto} onChange={handleEditarChange} />

            <label className={`${labelClass} mt-4`}>Causa</label>
            <input className={inputClass} type="text" name="causa" placeholder="Ej: Reparación, Emergencia médica..." value={modalEditar.causa} onChange={handleEditarChange} />

            <label className={`${labelClass} mt-4`}>Fecha</label>
            <input className={inputClass} type="date" name="fecha_registro" value={modalEditar.fecha_registro} onChange={handleEditarChange} />

            <label className={`${labelClass} mt-4`}>Categoría</label>
            <select className={inputClass} name="id_categoria" value={modalEditar.id_categoria || ''} onChange={handleEditarChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>

            <label className={`${labelClass} mt-4`}>Dependiente</label>
            <select className={inputClass} name="id_dependientes" value={modalEditar.id_dependientes || ''} onChange={handleEditarChange}>
              <option value="">Sin dependiente</option>
              {dependientes.map(d => (
                <option key={d.ID_dependientes} value={d.ID_dependientes}>{d.Nombre}</option>
              ))}
            </select>

            {errorModal && (
              <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                isDarkMode ? 'border-red-400/40 bg-red-400/10 text-red-400' : 'border-red-300 bg-red-50 text-red-700'
              }`}>
                {errorModal}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setModalEditar(null)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10' : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className={`w-full max-w-[380px] rounded-2xl border p-6 shadow-2xl transition-colors ${
            isDarkMode ? 'border-red-400/30 bg-slate-950/95' : 'border-red-200 bg-white'
          }`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>🗑️ ¿Eliminar imprevisto?</h4>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setConfirmarId(null)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10' : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
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

export default Imprevistos