import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderModulos from '../layout/HeaderModulos'
import { useTheme } from '../../hooks/useTheme'

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

const PESO_LABELS = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' }

const Dependientes = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme() // ✅ Hook centralizado
  const token = localStorage.getItem('token')
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  
  const [dependientes, setDependientes] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formDatos, setFormDatos] = useState({ 
    Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' 
  })

  useEffect(() => {
    fetch('/api/dependientes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDependientes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando dependientes:', err))
  }, [])

  const handleChange = e => 
    setFormDatos(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = { 
      ...formDatos, 
      Peso_economico: parseInt(formDatos.Peso_economico), 
      Fecha_nacimiento: formDatos.Fecha_nacimiento || null 
    }

    if (editandoId) {
      const res = await fetch(`/api/dependientes/${editandoId}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify(payload) 
      })
      if (res.ok) setDependientes(dependientes.map(d => d.ID_dependientes === editandoId ? { ...payload, ID_dependientes: editandoId } : d))
      else { const data = await res.json(); alert(data.error || 'Error al actualizar') }
    } else {
      const res = await fetch('/api/dependientes', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify(payload) 
      })
      const data = await res.json()
      if (res.ok) setDependientes([...dependientes, { ...payload, ID_dependientes: data.id }])
      else alert(data.error || 'Error al guardar')
    }
    cerrarModal()
  }

  const handleEditar = d => {
    setFormDatos({ 
      Nombre: d.Nombre, Relacion: d.Relacion, Ocupacion: d.Ocupacion || '', 
      Fecha_nacimiento: d.Fecha_nacimiento ? d.Fecha_nacimiento.split('T')[0] : '', 
      Peso_economico: String(d.Peso_economico ?? '3') 
    })
    setEditandoId(d.ID_dependientes)
    setMostrarModal(true)
  }

  const handleEliminar = async id => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este dependiente?')) return
    const res = await fetch(`/api/dependientes/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    })
    if (res.ok) setDependientes(dependientes.filter(d => d.ID_dependientes !== id))
    else alert('Error al eliminar el dependiente')
  }

  const abrirModal = () => { 
    setFormDatos({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' })
    setEditandoId(null)
    setMostrarModal(true) 
  }
  
  const cerrarModal = () => { 
    setMostrarModal(false)
    setEditandoId(null)
    setFormDatos({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' }) 
  }

  // 🎨 Helper para badge de peso económico adaptativo
  const getPesoBadgeClass = (peso) => {
    const base = 'inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-bold border transition-colors '
    if (peso <= 1) return isDarkMode ? base + 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30' : base + 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (peso <= 2) return isDarkMode ? base + 'bg-blue-400/15 text-blue-400 border-blue-400/30' : base + 'bg-blue-50 text-blue-700 border-blue-200'
    if (peso <= 3) return isDarkMode ? base + 'bg-amber-400/15 text-amber-400 border-amber-400/30' : base + 'bg-amber-50 text-amber-700 border-amber-200'
    if (peso <= 4) return isDarkMode ? base + 'bg-orange-400/15 text-orange-400 border-orange-400/30' : base + 'bg-orange-50 text-orange-700 border-orange-200'
    return isDarkMode ? base + 'bg-red-400/15 text-red-400 border-red-400/30' : base + 'bg-red-50 text-red-700 border-red-200'
  }

  // 🎨 Clases condicionales reutilizables
  const inputClass = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 transition-colors ${
    isDarkMode 
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-400/60 focus:ring-indigo-400/20' 
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-200'
  }`

  const labelClass = `block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`

  const optionStyle = isDarkMode
    ? { backgroundColor: '#1e293b', color: '#f1f5f9' }
    : { backgroundColor: '#ffffff', color: '#111827' }

  return (
    <div 
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      <HeaderModulos section="dependientes" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-8">
        {/* BIENVENIDA */}
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Bienvenido de vuelta</p>
          <h2 className={`text-xl font-extrabold sm:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {usuario?.nombre || localStorage.getItem('nombre') || localStorage.getItem('usuario_nombre') || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* CARD TOTAL */}
        <article className={`flex flex-col justify-between gap-4 rounded-2xl border px-6 py-6 shadow-lg sm:flex-row sm:items-center transition-colors duration-300 ${
          isDarkMode ? 'border-white/10 bg-[radial-gradient(ellipse_at_left,rgba(99,102,241,0.35),rgba(79,70,229,0.04))] shadow-white/10' 
                     : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-indigo-100'
        }`}>
          <div>
            <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              👩‍👧‍👦 Total Dependientes
            </p>
            <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {dependientes.length}
            </p>
          </div>
          <button 
            onClick={abrirModal} 
            className="w-full rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 px-5 py-3 text-sm font-bold text-slate-900 transition-all duration-300 hover:-translate-y-px hover:shadow-lg sm:w-auto"
          >
            ➕ Agregar Dependiente
          </button>
        </article>

        {/* CARDS GRID */}
        <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg p-5 transition-colors duration-300 ${
          isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/80'
        }`}>
          <div className={`flex items-center justify-between border-b pb-4 mb-5 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              📋 Módulo de Dependientes
            </h3>
          </div>

          {dependientes.length === 0 ? (
            <p className={`py-5 text-sm italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              No hay dependientes registrados. Agrega tu primer dependiente para comenzar.
            </p>
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
                      Peso económico: {PESO_LABELS[dep.Peso_economico] ?? 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleEditar(dep)} 
                      className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                        isDarkMode ? 'border-indigo-400/50 bg-indigo-400/10 text-indigo-400 hover:bg-indigo-400/20' 
                                   : 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleEliminar(dep.ID_dependientes)} 
                      className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                        isDarkMode ? 'border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20' 
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
        </section>
      </main>

      <footer className={`w-full px-4 py-6 text-center font-mono text-[0.7rem] ${isDarkMode ? 'text-zinc-600' : 'text-gray-500'}`}>
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[460px] rounded-2xl border p-6 shadow-2xl transition-colors ${
            isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-gray-200 bg-white'
          }`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              {editandoId ? '✏️ Editar Dependiente' : '➕ Agregar Dependiente'}
            </h4>
            
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className={labelClass}>Nombre *</label>
              <input className={inputClass} type="text" name="Nombre" value={formDatos.Nombre} onChange={handleChange} required placeholder="Nombre del dependiente" />

              <label className={labelClass}>Relación *</label>
              <select className={inputClass} name="Relacion" value={formDatos.Relacion} onChange={handleChange} required>
                <option value="" style={optionStyle}>Selecciona una relación</option>
                {['Hijo','Hija','Hermano','Hermana','Padre','Madre','Abuelo','Abuela','Otro'].map(r => 
                  <option key={r} value={r} style={optionStyle}>{r}</option>
                )}
              </select>

              <label className={labelClass}>Ocupación</label>
              <input className={inputClass} type="text" name="Ocupacion" value={formDatos.Ocupacion} onChange={handleChange} placeholder="Ocupación del dependiente" />

              <label className={labelClass}>Fecha de Nacimiento *</label>
              <input className={inputClass} type="date" name="Fecha_nacimiento" value={formDatos.Fecha_nacimiento} onChange={handleChange} required />

              <label className={labelClass}>Peso Económico</label>
              <select className={inputClass} name="Peso_economico" value={formDatos.Peso_economico} onChange={handleChange}>
                <option value="1" style={optionStyle}>1 - Muy bajo</option>
                <option value="2" style={optionStyle}>2 - Bajo</option>
                <option value="3" style={optionStyle}>3 - Medio</option>
                <option value="4" style={optionStyle}>4 - Alto</option>
                <option value="5" style={optionStyle}>5 - Muy alto</option>
              </select>

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button 
                  type="button" 
                  onClick={cerrarModal} 
                  className={`w-full rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors sm:w-auto ${
                    isDarkMode ? 'border-white/15 text-zinc-400 hover:bg-white/10' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-full rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 px-5 py-2.5 text-sm font-bold text-slate-900 sm:w-auto"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dependientes