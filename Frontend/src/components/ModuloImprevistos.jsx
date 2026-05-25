import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCategorias, getDependientes } from '../api'
import HeaderModulos from './HeaderModulos'

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

const usuario = JSON.parse(localStorage.getItem('usuario'))

const inputModal = { width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#f4f4f5', fontSize: '0.88rem', outline: 'none', marginTop: '6px' }
const labelModal = { fontSize: '0.72rem', fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '14px', display: 'block' }
const bgPage = { minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', color: 'white', overflowX: 'hidden', background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }
const modalOverlay = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px' }
const modalBox = { width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '28px', background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }

const Imprevistos = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [imprevistos,  setImprevistos]  = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [modalEditar,  setModalEditar]  = useState(null)
  const [confirmarId,  setConfirmarId]  = useState(null)
  const [guardando,    setGuardando]    = useState(false)
  const [eliminando,   setEliminando]   = useState(false)
  const [errorModal,   setErrorModal]   = useState(null)
  const [categorias,   setCategorias]   = useState([])
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

  useEffect(() => { getCategorias().then(d => { if (Array.isArray(d)) setCategorias(d) }).catch(() => {}) }, [])
  useEffect(() => { getDependientes().then(d => { if (Array.isArray(d)) setDependientes(d) }).catch(() => {}) }, [])
  useEffect(() => { cargarImprevistos() }, [])

  const total = imprevistos.reduce((acc, i) => acc + Number(i.monto), 0)

  const abrirEditar = (i) => {
    setErrorModal(null)
    setModalEditar({ id: i.id, monto: String(i.monto), causa: i.causa || '', fecha_registro: i.fecha ? i.fecha.slice(0, 10) : '', id_categoria: i.ID_categoria || '', id_dependientes: i.ID_dependientes || '' })
  }

  const handleEditarChange = (e) => setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const guardarEdicion = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) { setErrorModal('El monto debe ser un número mayor a 0'); return }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/imprevistos/${modalEditar.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ monto: Number(modalEditar.monto), causa: modalEditar.causa || null, fecha_registro: modalEditar.fecha_registro || null, id_categoria: modalEditar.id_categoria || null, id_dependientes: modalEditar.id_dependientes || null }) })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarImprevistos() } else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try { const res = await fetch(`${API}/imprevistos/${confirmarId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { setConfirmarId(null); cargarImprevistos() } } catch { }
    finally { setEliminando(false) }
  }

  const NavBar = () => (
    <nav style={{ width: '100%', padding: '0 16px' }}>
      <ul className="flex flex-wrap justify-center gap-4 items-center text-md min-w-max mx-auto pb-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.href
          return (<li key={item.href} onClick={() => navigate(item.href)} className={isActive ? 'px-3 py-1 rounded-[10px] cursor-pointer transition-all duration-300 font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'px-3 py-1 rounded-[10px] text-white cursor-pointer transition-all duration-300 bg-white/10 hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)]'}>{item.emoji} {item.label}</li>)
        })}
      </ul>
    </nav>
  )

  return (
    <div style={bgPage}>
      <HeaderModulos section='imprevistos'/>

      <hr style={{ margin: '4px 0', border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '32px', gap: '24px' }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Bienvenido de vuelta</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
        </div>

        <article style={{ padding: '24px 32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.10)', background: 'radial-gradient(ellipse at left, rgba(251,146,60,0.35), rgba(234,88,12,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fb923c', marginBottom: '4px' }}>🛡️ Total Imprevistos</p>
            <p style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>${total.toLocaleString('es-CO')}</p>
          </div>
          <button onClick={() => navigate('/movimientos/nuevo')} className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300" style={{ background: 'linear-gradient(135deg, #fb923c, #ea580c)', color: 'white' }}>
            ➕ Registrar Imprevisto
          </button>
        </article>

        <section style={{ width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fbbf24' }}>📋 Fondo de Imprevistos</h3>
            <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{imprevistos.length} registro{imprevistos.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 8px 16px' }}>
            {cargando ? <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>⏳ Cargando...</p>
              : imprevistos.length === 0 ? <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>Tu fondo de imprevistos está vacío. Es recomendable ahorrar al menos 3 meses de gastos.</p>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Fecha', 'Causa', 'Categoría', 'Dependiente', 'Monto', 'Acciones'].map(col => (
                        <th key={col} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imprevistos.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{i.fecha ? new Date(i.fecha).toLocaleDateString('es-CO') : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{i.causa || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{i.categoria || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{i.dependiente || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: '800', color: '#fb923c' }}>${Number(i.monto).toLocaleString('es-CO')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => abrirEditar(i)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.10)', color: '#fb923c', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,146,60,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,146,60,0.10)'}>Editar</button>
                            <button onClick={() => setConfirmarId(i.id)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.10)', color: '#f87171', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.10)'}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </section>
      </main>

      <footer style={{ width: '100%', padding: '24px', textAlign: 'center', color: '#3f3f46', fontSize: '0.7rem', fontFamily: 'monospace' }}>
        <p>© <strong style={{ color: '#fbbf24' }}>2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {modalEditar && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>✏️ Editar Imprevisto</h4>
            <p style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '8px' }}>Modifica los campos que necesites y guarda.</p>
            <label style={labelModal}>Monto *</label>
            <input style={inputModal} type="number" name="monto" min="0" step="0.01" value={modalEditar.monto} onChange={handleEditarChange} />
            <label style={labelModal}>Causa</label>
            <input style={inputModal} type="text" name="causa" placeholder="Ej: Reparación, Emergencia médica..." value={modalEditar.causa} onChange={handleEditarChange} />
            <label style={labelModal}>Fecha</label>
            <input style={inputModal} type="date" name="fecha_registro" value={modalEditar.fecha_registro} onChange={handleEditarChange} />
            <label style={labelModal}>Categoría</label>
            <select style={inputModal} name="id_categoria" value={modalEditar.id_categoria || ''} onChange={handleEditarChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>
            <label style={labelModal}>Dependiente</label>
            <select style={inputModal} name="id_dependientes" value={modalEditar.id_dependientes || ''} onChange={handleEditarChange}>
              <option value="">Sin dependiente</option>
              {dependientes.map(d => <option key={d.ID_dependientes} value={d.ID_dependientes}>{d.Nombre}</option>)}
            </select>
            {errorModal && <p style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontSize: '0.8rem', fontWeight: '600' }}>{errorModal}</p>}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalEditar(null)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardando} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: guardando ? 'not-allowed' : 'pointer', border: 'none', background: guardando ? 'rgba(251,146,60,0.4)' : 'linear-gradient(135deg, #fb923c, #ea580c)', color: 'white' }}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmarId && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '380px', border: '1px solid rgba(248,113,113,0.25)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171', marginBottom: '8px' }}>🗑️ ¿Eliminar imprevisto?</h4>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Esta acción no se puede deshacer.</p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setConfirmarId(null)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancelar</button>
              <button onClick={confirmarEliminar} disabled={eliminando} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: eliminando ? 'not-allowed' : 'pointer', border: 'none', background: eliminando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)', color: 'white' }}>{eliminando ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Imprevistos