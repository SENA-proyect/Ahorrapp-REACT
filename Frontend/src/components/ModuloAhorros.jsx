import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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

const Ahorros = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [ahorros,     setAhorros]     = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [errorModal,  setErrorModal]  = useState(null)

  const cargarAhorros = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/ahorros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAhorros(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarAhorros() }, [])

  const total = ahorros.reduce((acc, a) => acc + Number(a.monto), 0)

  const abrirEditar = (a) => {
    setErrorModal(null)
    setModalEditar({ id: a.id, monto: String(a.monto), monto_acumulado: String(a.monto_acumulado ?? 0), meta: a.meta || '', descripcion: a.descripcion || '', fecha_registro: a.fecha ? a.fecha.slice(0, 10) : '', fecha_meta: a.fecha_meta ? a.fecha_meta.slice(0, 10) : '' })
  }

  const handleEditarChange = (e) => setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const guardarEdicion = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) { setErrorModal('El monto debe ser un número mayor a 0'); return }
    if (modalEditar.fecha_meta && modalEditar.fecha_registro && modalEditar.fecha_meta < modalEditar.fecha_registro) { setErrorModal('La fecha meta no puede ser anterior a la fecha de registro'); return }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ahorros/${modalEditar.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ monto: Number(modalEditar.monto), monto_acumulado: Number(modalEditar.monto_acumulado) || 0, meta: modalEditar.meta || null, descripcion: modalEditar.descripcion || null, fecha_registro: modalEditar.fecha_registro || null, fecha_meta: modalEditar.fecha_meta || null }) })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarAhorros() } else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try { const res = await fetch(`${API}/ahorros/${confirmarId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { setConfirmarId(null); cargarAhorros() } } catch { }
    finally { setEliminando(false) }
  }

  return (
    <div style={bgPage}>
      {/* HEADER */}
      <HeaderModulos section="Ahorros" />

      <hr style={{ margin: '4px 0', border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '32px', gap: '24px' }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Bienvenido de vuelta</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
        </div>

        {/* Stat card */}
        <article style={{ padding: '24px 32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.10)', background: 'radial-gradient(ellipse at left, rgba(245,158,11,0.35), rgba(249,115,22,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', marginBottom: '4px' }}>🎯 Total Ahorros</p>
            <p style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>${total.toLocaleString('es-CO')}</p>
          </div>
          <button onClick={() => navigate('/movimientos/nuevo')} className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a' }}>
            ➕ Nueva Meta
          </button>
        </article>

        {/* Tabla */}
        <section style={{ width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fbbf24' }}>📋 Módulo de Ahorros</h3>
            <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{ahorros.length} registro{ahorros.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 8px 16px' }}>
            {cargando ? <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>⏳ Cargando...</p>
              : ahorros.length === 0 ? <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>No hay metas de ahorro creadas. Crea tu primera meta para comenzar a ahorrar.</p>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Fecha', 'Meta', 'Descripción', 'Fecha meta', 'Monto', 'Acumulado', 'Acciones'].map(col => (
                        <th key={col} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ahorros.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO') : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{a.meta || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{a.descripcion || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{a.fecha_meta ? new Date(a.fecha_meta).toLocaleDateString('es-CO') : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: '800', color: '#fbbf24' }}>${Number(a.monto).toLocaleString('es-CO')}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: '800', color: '#a78bfa' }}>${Number(a.monto_acumulado).toLocaleString('es-CO')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => abrirEditar(a)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.10)', color: '#fbbf24', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,191,36,0.10)'}>Editar</button>
                            <button onClick={() => setConfirmarId(a.id)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.10)', color: '#f87171', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.10)'}>Eliminar</button>
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

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>✏️ Editar Ahorro</h4>
            <p style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '8px' }}>Modifica los campos que necesites y guarda.</p>
            <label style={labelModal}>Monto *</label>
            <input style={inputModal} type="number" name="monto" min="0" step="0.01" value={modalEditar.monto} onChange={handleEditarChange} />
            <label style={labelModal}>Monto acumulado</label>
            <input style={inputModal} type="number" name="monto_acumulado" min="0" step="0.01" value={modalEditar.monto_acumulado} onChange={handleEditarChange} />
            <label style={labelModal}>Meta u objetivo</label>
            <input style={inputModal} type="text" name="meta" placeholder="Ej: Vacaciones, Fondo de emergencia..." value={modalEditar.meta} onChange={handleEditarChange} />
            <label style={labelModal}>Descripción</label>
            <input style={inputModal} type="text" name="descripcion" placeholder="Descripción opcional" value={modalEditar.descripcion} onChange={handleEditarChange} />
            <label style={labelModal}>Fecha de registro</label>
            <input style={inputModal} type="date" name="fecha_registro" value={modalEditar.fecha_registro} onChange={handleEditarChange} />
            <label style={labelModal}>Fecha meta</label>
            <input style={inputModal} type="date" name="fecha_meta" value={modalEditar.fecha_meta} onChange={handleEditarChange} />
            {errorModal && <p style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontSize: '0.8rem', fontWeight: '600' }}>{errorModal}</p>}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalEditar(null)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardando} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: guardando ? 'not-allowed' : 'pointer', border: 'none', background: guardando ? 'rgba(251,191,36,0.4)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a' }}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {confirmarId && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '380px', border: '1px solid rgba(248,113,113,0.25)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171', marginBottom: '8px' }}>🗑️ ¿Eliminar ahorro?</h4>
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

export default Ahorros