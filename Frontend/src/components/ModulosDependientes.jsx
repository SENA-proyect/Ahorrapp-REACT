import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

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
  { href: '/Noticias',            emoji: '📰', label: 'Noticias' },
]

const usuario = JSON.parse(localStorage.getItem('usuario'))

const PESO_LABELS = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' }

const bgPage = { minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', color: 'white', overflowX: 'hidden', background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }
const modalOverlay = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px' }
const modalBox = { width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '28px', background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }
const inputModal = { width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#f4f4f5', fontSize: '0.88rem', outline: 'none', marginTop: '6px' }
const labelModal = { fontSize: '0.72rem', fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '14px', display: 'block' }

const Dependientes = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const token     = localStorage.getItem('token')

  const [dependientes,  setDependientes]  = useState([])
  const [mostrarModal,  setMostrarModal]  = useState(false)
  const [editandoId,    setEditandoId]    = useState(null)
  const [formDatos,     setFormDatos]     = useState({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' })

  useEffect(() => {
    fetch('/api/dependientes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDependientes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando dependientes:', err))
  }, [])

  const handleChange = e => setFormDatos(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = { ...formDatos, Peso_economico: parseInt(formDatos.Peso_economico), Fecha_nacimiento: formDatos.Fecha_nacimiento || null }
    if (editandoId) {
      const res = await fetch(`/api/dependientes/${editandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      if (res.ok) setDependientes(dependientes.map(d => d.ID_dependientes === editandoId ? { ...payload, ID_dependientes: editandoId } : d))
      else { const data = await res.json(); alert(data.error || 'Error al actualizar') }
    } else {
      const res = await fetch('/api/dependientes', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) setDependientes([...dependientes, { ...payload, ID_dependientes: data.id }])
      else alert(data.error || 'Error al guardar')
    }
    cerrarModal()
  }

  const handleEditar = d => {
    setFormDatos({ Nombre: d.Nombre, Relacion: d.Relacion, Ocupacion: d.Ocupacion || '', Fecha_nacimiento: d.Fecha_nacimiento ? d.Fecha_nacimiento.split('T')[0] : '', Peso_economico: String(d.Peso_economico ?? '3') })
    setEditandoId(d.ID_dependientes)
    setMostrarModal(true)
  }

  const handleEliminar = async id => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este dependiente?')) return
    const res = await fetch(`/api/dependientes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setDependientes(dependientes.filter(d => d.ID_dependientes !== id))
    else alert('Error al eliminar el dependiente')
  }

  const abrirModal = () => { setFormDatos({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' }); setEditandoId(null); setMostrarModal(true) }
  const cerrarModal = () => { setMostrarModal(false); setEditandoId(null); setFormDatos({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' }) }

  const pesoColor = p => { if (p <= 1) return '#34d399'; if (p <= 2) return '#60a5fa'; if (p <= 3) return '#fbbf24'; if (p <= 4) return '#fb923c'; return '#f87171' }

  return (
    <div style={bgPage}>
      {/* HEADER */}
      <header style={{ zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
        <section style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-green-600 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(31,187,31,0.4)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" /></svg>
            Inicio
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">Ahorrapp</h1>
            <span style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Dependientes</span>
          </div>
          <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(228,33,33,0.4)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </section>
        <nav style={{ width: '100%', padding: '0 16px' }}>
          <ul className="flex flex-wrap justify-center gap-4 items-center text-md min-w-max mx-auto pb-2">
            {navItems.map(item => {
              const isActive = location.pathname === item.href
              return (<li key={item.href} onClick={() => navigate(item.href)} className={isActive ? 'px-3 py-1 rounded-[10px] cursor-pointer transition-all duration-300 font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'px-3 py-1 rounded-[10px] text-white cursor-pointer transition-all duration-300 bg-white/10 hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)]'}>{item.emoji} {item.label}</li>)
            })}
          </ul>
        </nav>
      </header>

      <hr style={{ margin: '4px 0', border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '32px', gap: '24px' }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Bienvenido de vuelta</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
        </div>

        {/* Stat + botón */}
        <article style={{ padding: '24px 32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.10)', background: 'radial-gradient(ellipse at left, rgba(99,102,241,0.35), rgba(79,70,229,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', marginBottom: '4px' }}>👩‍👧‍👦 Total Dependientes</p>
            <p style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>{dependientes.length}</p>
          </div>
          <button onClick={abrirModal} className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: 'white' }}>
            ➕ Agregar Dependiente
          </button>
        </article>

        {/* Cards */}
        <section style={{ width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fbbf24' }}>📋 Módulo de Dependientes</h3>
          </div>
          {dependientes.length === 0 ? (
            <p style={{ color: '#71717a', fontStyle: 'italic', fontSize: '0.88rem' }}>No hay dependientes registrados. Agrega tu primer dependiente para comenzar.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {dependientes.map(dep => (
                <div key={dep.ID_dependientes} style={{ borderRadius: '14px', padding: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', transition: 'transform 0.18s, box-shadow 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '800', color: '#f4f4f5' }}>{dep.Nombre}</p>
                    <p style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>{dep.Relacion} {dep.Ocupacion ? `· ${dep.Ocupacion}` : ''}</p>
                    {dep.Fecha_nacimiento && <p style={{ fontSize: '0.72rem', color: '#71717a' }}>Nac: {dep.Fecha_nacimiento.split('T')[0]}</p>}
                    <span style={{ display: 'inline-block', marginTop: '4px', padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700', background: `${pesoColor(dep.Peso_economico)}22`, color: pesoColor(dep.Peso_economico), border: `1px solid ${pesoColor(dep.Peso_economico)}44` }}>
                      Peso económico: {PESO_LABELS[dep.Peso_economico] ?? 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditar(dep)} style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(129,140,248,0.5)', background: 'rgba(129,140,248,0.10)', color: '#818cf8', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.10)'}>Editar</button>
                    <button onClick={() => handleEliminar(dep.ID_dependientes)} style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.10)', color: '#f87171', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.10)'}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer style={{ width: '100%', padding: '24px', textAlign: 'center', color: '#3f3f46', fontSize: '0.7rem', fontFamily: 'monospace' }}>
        <p>© <strong style={{ color: '#fbbf24' }}>2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL */}
      {mostrarModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '16px' }}>{editandoId ? '✏️ Editar Dependiente' : '➕ Agregar Dependiente'}</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelModal}>Nombre *</label>
              <input style={inputModal} type="text" name="Nombre" value={formDatos.Nombre} onChange={handleChange} required placeholder="Nombre del dependiente" />
              <label style={labelModal}>Relación *</label>
              <select style={inputModal} name="Relacion" value={formDatos.Relacion} onChange={handleChange} required>
                <option value="">Selecciona una relación</option>
                {['Hijo','Hija','Hermano','Hermana','Padre','Madre','Abuelo','Abuela','Otro'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <label style={labelModal}>Ocupación</label>
              <input style={inputModal} type="text" name="Ocupacion" value={formDatos.Ocupacion} onChange={handleChange} placeholder="Ocupación del dependiente" />
              <label style={labelModal}>Fecha de Nacimiento *</label>
              <input style={inputModal} type="date" name="Fecha_nacimiento" value={formDatos.Fecha_nacimiento} onChange={handleChange} required />
              <label style={labelModal}>Peso Económico</label>
              <select style={inputModal} name="Peso_economico" value={formDatos.Peso_economico} onChange={handleChange}>
                <option value="1">1 - Muy bajo</option>
                <option value="2">2 - Bajo</option>
                <option value="3">3 - Medio</option>
                <option value="4">4 - Alto</option>
                <option value="5">5 - Muy alto</option>
              </select>
              <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: 'white' }}>Guardar</button>
                <button type="button" onClick={cerrarModal} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dependientes
