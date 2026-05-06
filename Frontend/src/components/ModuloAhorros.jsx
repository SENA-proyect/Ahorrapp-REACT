import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

const API = 'http://localhost:3000/api/movimientos'

const Ahorros = () => {
  const [ahorros,     setAhorros]     = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)

  const cargarAhorros = () => {
    const token = localStorage.getItem('token')
    fetch(`${API}/ahorros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAhorros(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarAhorros() }, [])

  const total = ahorros.reduce((acc, a) => acc + Number(a.monto), 0)

  const abrirEditar = (a) => setModalEditar({
    id:              a.id,
    monto:           a.monto,
    monto_acumulado: a.monto_acumulado || 0,
    descripcion:     a.descripcion || '',
    meta:            a.meta || '',
    fecha_meta:      a.fecha_meta ? a.fecha_meta.slice(0, 10) : '',
  })

  const guardarEdicion = async () => {
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ahorros/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modalEditar),
      })
      if (res.ok) { setModalEditar(null); cargarAhorros() }
    } catch (e) { console.error(e) }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ahorros/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarAhorros() }
    } catch (e) { console.error(e) }
    finally { setEliminando(false) }
  }

  return (
    <>
      <div className="box-content">
        <header className="header">
          <Link to="/"><button className="buttonHeader">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 10">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
            </svg>
            Inicio
          </button></Link>
          <h1>Ahorrapp</h1>
          <button className="buttonCerrarSesion">Cerrar Sesión</button>
        </header>

        <main>
          <p className="parrafo1">Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos</p>

          <nav className="navbar" aria-label="Menú de secciones">
            <ul className="nav-list">
              <li><Link to="/Dashboard"          className="nav-link">Dashboard</Link></li>
              <li><Link to="/ModulosIngresos"     className="nav-link">Ingresos</Link></li>
              <li><Link to="/ModulosGastos"       className="nav-link">Gastos</Link></li>
              <li><Link to="/ModuloAhorros"       className="nav-link active">Ahorros</Link></li>
              <li><Link to="/ModuloImprevistos"   className="nav-link">Imprevistos</Link></li>
              <li><Link to="/ModuloDeudas"        className="nav-link">Deudas</Link></li>
              <li><Link to="/ModulosDependientes" className="nav-link">Dependientes</Link></li>
              <li><Link to="/ModulosCategorias"   className="nav-link">Categorías</Link></li>
            </ul>
          </nav>

          <section className="modulo-ahorros">
            <header className="modulo-header">
              <h3>Módulo de ahorros</h3>
              <div className="acciones-ahorro">
                <Link to="/movimientos/nuevo">
                  <button type="button" className="btn-secundario">Nueva Meta</button>
                </Link>
              </div>
            </header>

            <div className="resumen-container">
              <p className="total-ahorros">Total Ahorros: <strong>${total.toLocaleString('es-CO')}</strong></p>

              <div style={{ marginTop: '20px' }}>
                {cargando ? (
                  <p className="mensaje-vacio">Cargando...</p>
                ) : ahorros.length === 0 ? (
                  <p className="mensaje-vacio">No hay metas de ahorro creadas. Crea tu primera meta para comenzar a ahorrar.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={thStyle}>Fecha</th>
                        <th style={thStyle}>Meta</th>
                        <th style={thStyle}>Categoría</th>
                        <th style={thStyle}>Descripción</th>
                        <th style={thStyle}>Meta fecha</th>
                        <th style={thStyle}>Monto</th>
                        <th style={thStyle}>Acumulado</th>
                        <th style={thStyle}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ahorros.map(a => (
                        <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={tdStyle}>{a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO') : '—'}</td>
                          <td style={tdStyle}>{a.meta || '—'}</td>
                          <td style={tdStyle}>{a.categoria || '—'}</td>
                          <td style={tdStyle}>{a.descripcion || '—'}</td>
                          <td style={tdStyle}>{a.fecha_meta ? new Date(a.fecha_meta).toLocaleDateString('es-CO') : '—'}</td>
                          <td style={{ ...tdStyle, color: 'var(--ahorros-dark)', fontWeight: 600 }}>${Number(a.monto).toLocaleString('es-CO')}</td>
                          <td style={{ ...tdStyle, color: 'var(--ahorros-base)', fontWeight: 600 }}>${Number(a.monto_acumulado).toLocaleString('es-CO')}</td>
                          <td style={{ ...tdStyle, display: 'flex', gap: '8px' }}>
                            <button style={btnEditar} onClick={() => abrirEditar(a)}>Editar</button>
                            <button style={btnEliminar} onClick={() => setConfirmarId(a.id)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="footer-app"><p>&copy; 2026 Mi Aplicación de Finanzas</p></footer>

        {/* ── Modal Editar ── */}
        {modalEditar && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h4 style={{ marginBottom: '16px' }}>Editar Ahorro</h4>
              <label style={labelStyle}>Monto</label>
              <input style={inputStyle} type="number" value={modalEditar.monto}
                onChange={e => setModalEditar({ ...modalEditar, monto: e.target.value })} />
              <label style={labelStyle}>Monto acumulado</label>
              <input style={inputStyle} type="number" value={modalEditar.monto_acumulado}
                onChange={e => setModalEditar({ ...modalEditar, monto_acumulado: e.target.value })} />
              <label style={labelStyle}>Descripción</label>
              <input style={inputStyle} type="text" value={modalEditar.descripcion}
                onChange={e => setModalEditar({ ...modalEditar, descripcion: e.target.value })} />
              <label style={labelStyle}>Meta</label>
              <input style={inputStyle} type="text" value={modalEditar.meta}
                onChange={e => setModalEditar({ ...modalEditar, meta: e.target.value })} />
              <label style={labelStyle}>Fecha meta</label>
              <input style={inputStyle} type="date" value={modalEditar.fecha_meta}
                onChange={e => setModalEditar({ ...modalEditar, fecha_meta: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button style={btnCancelar} onClick={() => setModalEditar(null)}>Cancelar</button>
                <button style={btnGuardar} onClick={guardarEdicion} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Diálogo Confirmar Eliminar ── */}
        {confirmarId && (
          <div style={overlayStyle}>
            <div style={{ ...modalStyle, maxWidth: '360px' }}>
              <h4 style={{ marginBottom: '12px' }}>¿Eliminar ahorro?</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Esta acción no se puede deshacer.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button style={btnCancelar} onClick={() => setConfirmarId(null)}>Cancelar</button>
                <button style={btnEliminarConfirm} onClick={confirmarEliminar} disabled={eliminando}>
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Ahorros

const thStyle     = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle     = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle  = { background: 'var(--bg-card, #fff)', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }
const labelStyle  = { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', marginTop: '12px' }
const inputStyle  = { padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }
const btnEditar   = { padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--ahorros-dark, #1565c0)', background: 'transparent', color: 'var(--ahorros-dark, #1565c0)', cursor: 'pointer', fontSize: '0.8rem' }
const btnEliminar = { padding: '4px 12px', borderRadius: '6px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem' }
const btnCancelar = { padding: '8px 18px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem' }
const btnGuardar  = { padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'var(--ahorros-dark, #1565c0)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }
const btnEliminarConfirm = { padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }