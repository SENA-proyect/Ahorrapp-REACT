import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCategorias } from '../api'

const API = 'http://localhost:3000/api/movimientos'

// ── mismos navItems que el Dashboard ─────────────────────────────────────────
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

// ── Tokens de diseño (espejo del Dashboard) ───────────────────────────────────
const S = {
  // Inputs del modal
  inputModal: {
    width: '100%', padding: '9px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: '#f4f4f5', fontSize: '0.88rem', outline: 'none',
    transition: 'border-color 0.2s', marginTop: '6px',
  },
  labelModal: {
    fontSize: '0.72rem', fontWeight: '700', color: '#a1a1aa',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '14px', display: 'block',
  },
}

export default function ModuloIngresos() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [ingresos,    setIngresos]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [errorModal,  setErrorModal]  = useState(null)
  const [categorias,  setCategorias]  = useState([])

  const cargarIngresos = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/ingresos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setIngresos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getCategorias()
      .then(data => { if (Array.isArray(data)) setCategorias(data) })
      .catch(err => console.error('Error cargando categorías:', err))
  }, [])

  useEffect(() => { cargarIngresos() }, [])

  const total = ingresos.reduce((acc, i) => acc + Number(i.monto), 0)

  const abrirEditar = (i) => {
    setErrorModal(null)
    setModalEditar({
      id:             i.id,
      monto:          String(i.monto),
      id_categoria:   i.id_categoria || '',
      fuente:         i.fuente         || '',
      descripcion:    i.descripcion    || '',
      fecha_registro: i.fecha          ? i.fecha.slice(0, 10) : '',
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
      const res = await fetch(`${API}/ingresos/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto:          Number(modalEditar.monto),
          id_categoria:   modalEditar.id_categoria   || null,
          fuente:         modalEditar.fuente         || null,
          descripcion:    modalEditar.descripcion    || null,
          fecha_registro: modalEditar.fecha_registro || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarIngresos() }
      else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ingresos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarIngresos() }
    } catch { /* silencioso */ }
    finally { setEliminando(false) }
  }

  return (
    <div
      style={{
        minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
        color: 'white', overflowX: 'hidden',
        background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)',
      }}
    >

      {/* ── HEADER ── */}
      <header style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>

        <section style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', marginBottom: '24px' }}>

          {/* Botón Inicio */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-green-600 hover:border-green-500/50 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(31,187,31,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
            Inicio
          </button>

          {/* Título */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
              Ahorrapp
            </h1>
            <span style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Ingresos
            </span>
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-red-600 hover:border-red-500/40 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(228,33,33,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </section>

        {/* ── NAV ── */}
        <nav style={{ width: '100%', padding: '0 16px' }}>
          <ul className="flex flex-wrap justify-center gap-4 items-center text-md min-w-max mx-auto pb-2">
            {navItems.map(item => {
              const isActive = location.pathname === item.href
              return (
                <li
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={
                    isActive
                      ? 'px-3 py-1 rounded-[10px] cursor-pointer transition-all duration-300 font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'px-3 py-1 rounded-[10px] text-white cursor-pointer transition-all duration-300 bg-white/10 shadow-[0_2px_8px_rgba(255,255,255,0.1)] hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)]'
                  }
                >
                  {item.emoji} {item.label}
                </li>
              )
            })}
          </ul>
        </nav>

      </header>

      {/* Separador */}
      <hr style={{ margin: '4px 0', border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '32px', gap: '24px' }}>

        {/* Bienvenida */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Bienvenido de vuelta</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* ── Stat card total ── */}
        <article
          style={{
            padding: '24px 32px', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 2px 8px rgba(255,255,255,0.1)',
            background: 'radial-gradient(ellipse at left, rgba(34,197,94,0.35), rgba(16,185,129,0.04))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', marginBottom: '4px' }}>
              💰 Total Ingresos
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>
              ${total.toLocaleString('es-CO')}
            </p>
          </div>
          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none transition-all duration-300 hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#0f172a' }}
          >
            ➕ Agregar ingreso
          </button>
        </article>

        {/* ── Tabla ── */}
        <section
          style={{
            width: '100%', borderRadius: '16px',
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          {/* Encabezado sección */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fbbf24' }}>
              📋 Módulo de Ingresos
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#52525b' }}>
              {ingresos.length} registro{ingresos.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ overflowX: 'auto', padding: '0 8px 16px' }}>
            {cargando ? (
              <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>⏳ Cargando...</p>
            ) : ingresos.length === 0 ? (
              <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>
                No hay ingresos registrados. Agrega tu primer ingreso para comenzar.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Fecha', 'Fuente', 'Categoría', 'Descripción', 'Monto', 'Acciones'].map(col => (
                      <th key={col} style={{
                        padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700',
                        color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ingresos.map(i => (
                    <tr
                      key={i.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>
                        {i.fecha ? new Date(i.fecha).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{i.fuente || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{i.categoria || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#d4d4d8' }}>{i.descripcion || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: '800', color: '#34d399' }}>
                        ${Number(i.monto).toLocaleString('es-CO')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => abrirEditar(i)}
                            style={{
                              padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700',
                              cursor: 'pointer', transition: 'all 0.15s',
                              border: '1px solid rgba(52,211,153,0.5)', background: 'rgba(52,211,153,0.10)', color: '#34d399',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.22)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.10)' }}
                          >Editar</button>
                          <button
                            onClick={() => setConfirmarId(i.id)}
                            style={{
                              padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700',
                              cursor: 'pointer', transition: 'all 0.15s',
                              border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.10)', color: '#f87171',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.22)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.10)' }}
                          >Eliminar</button>
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

      {/* ── FOOTER ── */}
      <footer style={{ width: '100%', padding: '24px', textAlign: 'center', color: '#3f3f46', fontSize: '0.7rem', fontFamily: 'monospace' }}>
        <p>© <strong style={{ color: '#fbbf24' }}>2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* ── MODAL EDITAR ── */}
      {modalEditar && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '28px',
            background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>✏️ Editar Ingreso</h4>
            <p style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '8px' }}>Modifica los campos que necesites y guarda.</p>

            <label style={S.labelModal}>Monto *</label>
            <input style={S.inputModal} type="number" name="monto" min="0" step="0.01"
              value={modalEditar.monto} onChange={handleEditarChange} />

            <label style={S.labelModal}>Categoría</label>
            <select style={S.inputModal} name="id_categoria"
              value={modalEditar.id_categoria || ''} onChange={handleEditarChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>

            <label style={S.labelModal}>Fuente</label>
            <input style={S.inputModal} type="text" name="fuente" placeholder="Ej: Salario, Freelance..."
              value={modalEditar.fuente} onChange={handleEditarChange} />

            <label style={S.labelModal}>Descripción</label>
            <input style={S.inputModal} type="text" name="descripcion" placeholder="Descripción opcional"
              value={modalEditar.descripcion} onChange={handleEditarChange} />

            <label style={S.labelModal}>Fecha</label>
            <input style={S.inputModal} type="date" name="fecha_registro"
              value={modalEditar.fecha_registro} onChange={handleEditarChange} />

            {errorModal && (
              <p style={{
                marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)',
                color: '#f87171', fontSize: '0.8rem', fontWeight: '600',
              }}>{errorModal}</p>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setModalEditar(null)}
                style={{
                  padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700',
                  cursor: 'pointer', background: 'transparent', color: '#a1a1aa',
                  border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >Cancelar</button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                style={{
                  padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700',
                  cursor: guardando ? 'not-allowed' : 'pointer', border: 'none',
                  background: guardando ? 'rgba(52,211,153,0.4)' : 'linear-gradient(135deg, #34d399, #10b981)',
                  color: '#0f172a', transition: 'opacity 0.15s',
                }}
              >{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINAR ── */}
      {confirmarId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '380px', borderRadius: '20px', padding: '28px',
            background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(248,113,113,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171', marginBottom: '8px' }}>🗑️ ¿Eliminar ingreso?</h4>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Esta acción no se puede deshacer.</p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setConfirmarId(null)}
                style={{
                  padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700',
                  cursor: 'pointer', background: 'transparent', color: '#a1a1aa',
                  border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >Cancelar</button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                style={{
                  padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700',
                  cursor: eliminando ? 'not-allowed' : 'pointer', border: 'none',
                  background: eliminando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)',
                  color: 'white', transition: 'opacity 0.15s',
                }}
              >{eliminando ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}