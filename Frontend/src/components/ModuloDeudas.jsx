import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCategorias } from '../api'
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

const inputModal = {
  width: '100%', padding: '9px 14px', borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
  color: '#f4f4f5', fontSize: '0.88rem', outline: 'none', marginTop: '6px',
}
const labelModal = {
  fontSize: '0.72rem', fontWeight: '700', color: '#a1a1aa',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '14px', display: 'block',
}

const Deudas = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [deudas,      setDeudas]      = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [errorModal,  setErrorModal]  = useState(null)
  const [categorias,  setCategorias]  = useState([])

  const cargarDeudas = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/deudas`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDeudas(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getCategorias().then(data => { if (Array.isArray(data)) setCategorias(data) }).catch(() => {})
  }, [])

  useEffect(() => { cargarDeudas() }, [])

  const total      = deudas.reduce((acc, d) => acc + Number(d.monto), 0)
  const pendientes = deudas.filter(d => d.estado === 'pendiente')

  const abrirEditar = (d) => {
    setErrorModal(null)
    setModalEditar({
      id: d.id, monto: String(d.monto), fuente: d.fuente || '',
      id_categoria: d.ID_categoria || '', descripcion: d.descripcion || '',
      estado: d.estado || 'pendiente',
      cuotas_pagadas: String(d.cuotas_pagadas ?? 0),
      cuotas_total: d.cuotas_total ? String(d.cuotas_total) : '',
      fecha_inicio: d.fecha_inicio ? d.fecha_inicio.slice(0, 10) : '',
      fecha_fin:    d.fecha_fin    ? d.fecha_fin.slice(0, 10)    : '',
    })
  }

  const handleEditarChange = (e) =>
    setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const guardarEdicion = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) {
      setErrorModal('El monto debe ser un número mayor a 0'); return
    }
    if (!modalEditar.fuente.trim()) { setErrorModal('La fuente de la deuda es obligatoria'); return }
    if (modalEditar.fecha_fin && modalEditar.fecha_inicio && modalEditar.fecha_fin < modalEditar.fecha_inicio) {
      setErrorModal('La fecha de fin no puede ser anterior a la de inicio'); return
    }
    const cuotasPagadas = Number(modalEditar.cuotas_pagadas)
    const cuotasTotal   = modalEditar.cuotas_total ? Number(modalEditar.cuotas_total) : null
    if (cuotasTotal !== null && cuotasPagadas > cuotasTotal) {
      setErrorModal('Las cuotas pagadas no pueden superar el total'); return
    }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/deudas/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto: Number(modalEditar.monto), fuente: modalEditar.fuente.trim(),
          id_categoria: modalEditar.id_categoria || null, descripcion: modalEditar.descripcion || null,
          estado: modalEditar.estado, cuotas_pagadas: cuotasPagadas, cuotas_total: cuotasTotal,
          fecha_inicio: modalEditar.fecha_inicio || null, fecha_fin: modalEditar.fecha_fin || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarDeudas() }
      else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/deudas/${confirmarId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarDeudas() }
    } catch { }
    finally { setEliminando(false) }
  }

  const bgPage = { minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', color: 'white', overflowX: 'hidden', background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }
  const modalOverlay = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px' }
  const modalBox = { width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px', background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }

  return (
    <div style={bgPage}>

      {/* HEADER */}
      <HeaderModulos section="Deudas" />

      <hr style={{ margin: '4px 0', border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '32px', gap: '24px' }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Bienvenido de vuelta</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
        </div>

        {/* Stat card */}
        <article style={{ padding: '24px 32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.10)', background: 'radial-gradient(ellipse at left, rgba(168,85,247,0.35), rgba(147,51,234,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c084fc', marginBottom: '4px' }}>💳 Total Deuda Acumulada</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>${total.toLocaleString('es-CO')}</p>
              {pendientes.length > 0 && (
                <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '999px', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', fontWeight: '700' }}>
                  {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/movimientos/nuevo')} className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300" style={{ background: 'linear-gradient(135deg, #c084fc, #a855f7)', color: 'white' }}>
            ➕ Nueva Deuda
          </button>
        </article>

        {/* Tabla */}
        <section style={{ width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fbbf24' }}>📋 Módulo de Deudas</h3>
            <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{deudas.length} registro{deudas.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 8px 16px' }}>
            {cargando ? (
              <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>⏳ Cargando...</p>
            ) : deudas.length === 0 ? (
              <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>¡Felicidades! No tienes deudas pendientes registradas.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Fuente', 'Categoría', 'Descripción', 'Cuotas', 'Fecha fin', 'Estado', 'Monto', 'Acciones'].map(col => (
                      <th key={col} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deudas.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{d.fuente || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{d.categoria || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{d.descripcion || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{d.cuotas_total ? `${d.cuotas_pagadas}/${d.cuotas_total}` : 'Pago único'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{d.fecha_fin ? new Date(d.fecha_fin).toLocaleDateString('es-CO') : '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700',
                          background: d.estado === 'pagada' ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)',
                          color: d.estado === 'pagada' ? '#34d399' : '#60a5fa',
                          border: `1px solid ${d.estado === 'pagada' ? 'rgba(52,211,153,0.35)' : 'rgba(96,165,250,0.35)'}`,
                        }}>
                          {d.estado === 'pagada' ? '✓ Pagada' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: '800', color: '#c084fc' }}>${Number(d.monto).toLocaleString('es-CO')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => abrirEditar(d)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(192,132,252,0.5)', background: 'rgba(192,132,252,0.10)', color: '#c084fc', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,132,252,0.22)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(192,132,252,0.10)'}>Editar</button>
                          <button onClick={() => setConfirmarId(d.id)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.10)', color: '#f87171', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.22)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.10)'}>Eliminar</button>
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
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>✏️ Editar Deuda</h4>
            <p style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '8px' }}>Modifica los campos que necesites y guarda.</p>

            <label style={labelModal}>Fuente *</label>
            <input style={inputModal} type="text" name="fuente" placeholder="Ej: Banco, Tarjeta..." value={modalEditar.fuente} onChange={handleEditarChange} />

            <label style={labelModal}>Categoría</label>
            <select style={inputModal} name="id_categoria" value={modalEditar.id_categoria || ''} onChange={handleEditarChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
            </select>

            <label style={labelModal}>Monto *</label>
            <input style={inputModal} type="number" name="monto" min="0" step="0.01" value={modalEditar.monto} onChange={handleEditarChange} />

            <label style={labelModal}>Descripción</label>
            <input style={inputModal} type="text" name="descripcion" placeholder="Descripción opcional" value={modalEditar.descripcion} onChange={handleEditarChange} />

            <label style={labelModal}>Estado</label>
            <select style={inputModal} name="estado" value={modalEditar.estado} onChange={handleEditarChange}>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
            </select>

            <label style={labelModal}>Cuotas pagadas</label>
            <input style={inputModal} type="number" name="cuotas_pagadas" min="0" step="1" value={modalEditar.cuotas_pagadas} onChange={handleEditarChange} />

            <label style={labelModal}>Total de cuotas</label>
            <input style={inputModal} type="number" name="cuotas_total" min="1" step="1" placeholder="Vacío si es pago único" value={modalEditar.cuotas_total} onChange={handleEditarChange} />

            <label style={labelModal}>Fecha de inicio</label>
            <input style={inputModal} type="date" name="fecha_inicio" value={modalEditar.fecha_inicio} onChange={handleEditarChange} />

            <label style={labelModal}>Fecha de fin</label>
            <input style={inputModal} type="date" name="fecha_fin" value={modalEditar.fecha_fin} onChange={handleEditarChange} />

            {errorModal && <p style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontSize: '0.8rem', fontWeight: '600' }}>{errorModal}</p>}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalEditar(null)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardando} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: guardando ? 'not-allowed' : 'pointer', border: 'none', background: guardando ? 'rgba(192,132,252,0.4)' : 'linear-gradient(135deg, #c084fc, #a855f7)', color: 'white' }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {confirmarId && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '380px', border: '1px solid rgba(248,113,113,0.25)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171', marginBottom: '8px' }}>🗑️ ¿Eliminar deuda?</h4>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Esta acción no se puede deshacer.</p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setConfirmarId(null)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancelar</button>
              <button onClick={confirmarEliminar} disabled={eliminando} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: eliminando ? 'not-allowed' : 'pointer', border: 'none', background: eliminando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)', color: 'white' }}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Deudas