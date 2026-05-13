import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCategorias, crearCategoria, editarCategoria, deshabilitarCategoria, habilitarCategoria } from '../api'

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

const bgPage = { minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', color: 'white', overflowX: 'hidden', background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }
const modalOverlay = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px' }
const modalBox = { width: '100%', maxWidth: '420px', borderRadius: '20px', padding: '28px', background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }
const inputModal = { width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#f4f4f5', fontSize: '0.88rem', outline: 'none', marginTop: '6px' }
const labelModal = { fontSize: '0.72rem', fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '14px', display: 'block' }

export default function ModuloCategorias() {
  const navigate = useNavigate()
  const location = useLocation()

  const [categorias,    setCategorias]    = useState([])
  const [modalAgregar,  setModalAgregar]  = useState(false)
  const [modalEditar,   setModalEditar]   = useState(false)
  const [categoriaEdit, setCategoriaEdit] = useState(null)
  const [formNombre,    setFormNombre]    = useState('')
  const [formDesc,      setFormDesc]      = useState('')

  useEffect(() => {
    getCategorias().then(data => { if (Array.isArray(data)) setCategorias(data) }).catch(() => {})
  }, [])

  const handleAgregar = async () => {
    if (!formNombre.trim()) return alert('El nombre es obligatorio')
    const resp = await crearCategoria({ nombre: formNombre.trim(), descripcion: formDesc.trim() })
    if (resp.ok) {
      setCategorias(prev => [...prev, { id: resp.id, nombre: formNombre.trim(), descripcion: formDesc.trim(), activa: true, sistema: false, es_global: false }])
      setFormNombre(''); setFormDesc(''); setModalAgregar(false)
    } else alert(resp.mensaje || 'Error al crear la categoría')
  }

  const abrirEditar = cat => { setCategoriaEdit({ ...cat }); setModalEditar(true) }

  const handleGuardarEdicion = async () => {
    if (!categoriaEdit.nombre.trim()) return alert('El nombre es obligatorio')
    const resp = await editarCategoria(categoriaEdit.id, { nombre: categoriaEdit.nombre, descripcion: categoriaEdit.descripcion })
    if (resp.ok) { setCategorias(prev => prev.map(c => c.id === categoriaEdit.id ? { ...c, ...categoriaEdit } : c)); setModalEditar(false) }
    else alert(resp.mensaje || 'Error al editar la categoría')
  }

  const handleDeshabilitar = async id => {
    if (!window.confirm('¿Seguro que deseas deshabilitar esta categoría?')) return
    const resp = await deshabilitarCategoria(id)
    if (resp.ok) setCategorias(prev => prev.map(c => c.id === id ? { ...c, activa: 0 } : c))
    else alert(resp.mensaje || 'Error al deshabilitar')
  }

  const handleHabilitar = async id => {
    const resp = await habilitarCategoria(id)
    if (resp.ok) setCategorias(prev => prev.map(c => c.id === id ? { ...c, activa: 1 } : c))
    else alert(resp.mensaje || 'Error al habilitar')
  }

  // Soporte para activa como boolean (true/false) o entero (1/0)
  const activas   = categorias.filter(c => c.activa == 1 || c.activa === true)
  const inactivas = categorias.filter(c => c.activa == 0 || c.activa === false)
  // Una categoría es de sistema si tiene es_global o sistema en true/1
  const esSistema = (cat) => cat.es_global == 1 || cat.es_global === true || cat.sistema == 1 || cat.sistema === true

  const BtnCancelar = ({ onClick }) => (
    <button onClick={onClick} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancelar</button>
  )

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
            <span style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Categorías</span>
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
        <article style={{ padding: '24px 32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.10)', background: 'radial-gradient(ellipse at left, rgba(16,185,129,0.25), rgba(5,150,105,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', marginBottom: '4px' }}>🧩 Categorías activas</p>
            <p style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>{activas.length}</p>
          </div>
          <button onClick={() => setModalAgregar(true)} className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300" style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#0f172a' }}>
            + Agregar Categoría
          </button>
        </article>

        {/* Tabla activas */}
        <section style={{ width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fbbf24' }}>📋 Módulo de Categorías</h3>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 8px 16px' }}>
            {activas.length === 0 ? <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>No hay categorías activas.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Nombre', 'Descripción', 'Tipo', 'Acciones'].map(col => (
                      <th key={col} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activas.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: '700', color: '#f4f4f5' }}>{cat.nombre}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#a1a1aa' }}>{cat.descripcion || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700', background: cat.es_global ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)', color: cat.es_global ? '#34d399' : '#818cf8', border: `1px solid ${cat.es_global ? 'rgba(52,211,153,0.35)' : 'rgba(129,140,248,0.35)'}` }}>
                          {cat.es_global ? 'Sistema' : 'Personalizada'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {!esSistema(cat) && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => abrirEditar(cat)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(52,211,153,0.5)', background: 'rgba(52,211,153,0.10)', color: '#34d399', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.10)'}>Editar</button>
                            <button onClick={() => handleDeshabilitar(cat.id)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.10)', color: '#fb923c', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,146,60,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,146,60,0.10)'}>Deshabilitar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Inactivas */}
            {inactivas.length > 0 && (
              <div style={{ marginTop: '24px', opacity: 0.6 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', padding: '0 8px' }}>Categorías deshabilitadas ({inactivas.length})</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {inactivas.map(cat => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 16px', fontSize: '0.85rem', color: '#71717a' }}><s>{cat.nombre}</s></td>
                        <td style={{ padding: '10px 16px', fontSize: '0.85rem', color: '#52525b' }}>{cat.descripcion || '—'}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <button onClick={() => handleHabilitar(cat.id)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.08)', color: '#34d399' }}>Habilitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer style={{ width: '100%', padding: '24px', textAlign: 'center', color: '#3f3f46', fontSize: '0.7rem', fontFamily: 'monospace' }}>
        <p>© <strong style={{ color: '#fbbf24' }}>2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL AGREGAR */}
      {modalAgregar && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>🧩 Nueva Categoría</h4>
            <label style={labelModal}>Nombre *</label>
            <input style={inputModal} type="text" placeholder="Ej: Ropa, Mascotas..." value={formNombre} onChange={e => setFormNombre(e.target.value)} />
            <label style={labelModal}>Descripción</label>
            <input style={inputModal} type="text" placeholder="Descripción opcional" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <BtnCancelar onClick={() => { setModalAgregar(false); setFormNombre(''); setFormDesc('') }} />
              <button onClick={handleAgregar} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#0f172a' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditar && categoriaEdit && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>✏️ Editar Categoría</h4>
            <label style={labelModal}>Nombre *</label>
            <input style={inputModal} type="text" value={categoriaEdit.nombre} onChange={e => setCategoriaEdit(prev => ({ ...prev, nombre: e.target.value }))} />
            <label style={labelModal}>Descripción</label>
            <input style={inputModal} type="text" value={categoriaEdit.descripcion || ''} onChange={e => setCategoriaEdit(prev => ({ ...prev, descripcion: e.target.value }))} />
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <BtnCancelar onClick={() => setModalEditar(false)} />
              <button onClick={handleGuardarEdicion} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#0f172a' }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
