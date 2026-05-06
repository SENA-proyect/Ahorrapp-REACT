import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

const API = 'http://localhost:3000/api/movimientos'

export default function ModuloIngresos() {
  const [ingresos,     setIngresos]     = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [isMobile,     setIsMobile]     = useState(window.innerWidth <= 600)
  const [modalEditar,  setModalEditar]  = useState(null)   // objeto ingreso a editar
  const [confirmarId,  setConfirmarId]  = useState(null)   // id a eliminar
  const [guardando,    setGuardando]    = useState(false)
  const [eliminando,   setEliminando]   = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const cargarIngresos = () => {
    const token = localStorage.getItem('token')
    fetch(`${API}/ingresos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setIngresos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarIngresos() }, [])

  const total = ingresos.reduce((acc, i) => acc + Number(i.monto), 0)

  // ── Editar ──────────────────────────────────────────────────
  const abrirEditar = (ingreso) => {
    setModalEditar({
      id:            ingreso.id,
      monto:         ingreso.monto,
      descripcion:   ingreso.descripcion || '',
      fuente:        ingreso.fuente || '',
      fecha_registro: ingreso.fecha ? ingreso.fecha.slice(0, 10) : '',
      id_categoria:  ingreso.id_categoria || '',
    })
  }

  const guardarEdicion = async () => {
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ingresos/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modalEditar),
      })
      if (res.ok) {
        setModalEditar(null)
        cargarIngresos()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ingresos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setConfirmarId(null)
        cargarIngresos()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="box-content">
      <header className="header">
        <Link to="/"><button className="buttonHeader">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 10">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
          </svg>
          Inicio
        </button></Link>
        <h1>Ahorrapp</h1>
        <button className="buttonCerrarSesion">Cerrar Sesion</button>
      </header>

      <main>
        <p className="parrafo1">Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos</p>

        <nav className="navbar" aria-label="Menú de secciones">
          <ul className="nav-list">
            <li><Link to="/Dashboard"          className="nav-link">Dashboard</Link></li>
            <li><Link to="/ModulosIngresos"     className="nav-link active">Ingresos</Link></li>
            <li><Link to="/ModulosGastos"       className="nav-link">Gastos</Link></li>
            <li><Link to="/ModuloAhorros"       className="nav-link">Ahorros</Link></li>
            <li><Link to="/ModuloImprevistos"   className="nav-link">Imprevistos</Link></li>
            <li><Link to="/ModuloDeudas"        className="nav-link">Deudas</Link></li>
            <li><Link to="/ModulosDependientes" className="nav-link">Dependientes</Link></li>
            <li><Link to="/ModulosCategorias"   className="nav-link">Categorias</Link></li>
          </ul>
        </nav>

        <section className="modulo-ahorros">
          <header className="modulo-header">
            <h3>Módulo de ingresos</h3>
            <div className="acciones-ahorro">
              <Link to="/movimientos/nuevo">
                <button type="button" className="btn-secundario">Agregar ingreso</button>
              </Link>
            </div>
          </header>

          <div className="resumen-container">
            <p className="total-ahorros">Total Ingresos: <strong>${total.toLocaleString('es-CO')}</strong></p>

            <div className="tabla-ingresos" style={{ marginTop: '20px' }}>
              {cargando ? (
                <p className="mensaje-vacio">Cargando...</p>
              ) : ingresos.length === 0 ? (
                <p className="mensaje-vacio">No hay ingresos registrados. Agrega tu primer ingreso para comenzar.</p>
              ) : isMobile ? (
                <div className="cards-mobile">
                  {ingresos.map(i => (
                    <div key={i.id} className="card-ingreso">
                      <div className="card-row"><span className="card-label">Fecha</span><span className="card-value">{i.fecha ? new Date(i.fecha).toLocaleDateString('es-CO') : '—'}</span></div>
                      <div className="card-row"><span className="card-label">Fuente</span><span className="card-value">{i.fuente || '—'}</span></div>
                      <div className="card-row"><span className="card-label">Categoría</span><span className="card-value">{i.categoria || '—'}</span></div>
                      <div className="card-row"><span className="card-label">Descripción</span><span className="card-value">{i.descripcion || '—'}</span></div>
                      <div className="card-row card-monto"><span className="card-label">Monto</span><span className="card-value monto">${Number(i.monto).toLocaleString('es-CO')}</span></div>
                      <div className="card-row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                        <button style={btnEditar} onClick={() => abrirEditar(i)}>Editar</button>
                        <button style={btnEliminar} onClick={() => setConfirmarId(i.id)}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Fuente</th>
                      <th style={thStyle}>Categoría</th>
                      <th style={thStyle}>Descripción</th>
                      <th style={thStyle}>Monto</th>
                      <th style={thStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={tdStyle}>{i.fecha ? new Date(i.fecha).toLocaleDateString('es-CO') : '—'}</td>
                        <td style={tdStyle}>{i.fuente || '—'}</td>
                        <td style={tdStyle}>{i.categoria || '—'}</td>
                        <td style={tdStyle}>{i.descripcion || '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--ingresos-dark)', fontWeight: 600 }}>${Number(i.monto).toLocaleString('es-CO')}</td>
                        <td style={{ ...tdStyle, display: 'flex', gap: '8px' }}>
                          <button style={btnEditar} onClick={() => abrirEditar(i)}>Editar</button>
                          <button style={btnEliminar} onClick={() => setConfirmarId(i.id)}>Eliminar</button>
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
            <h4 style={{ marginBottom: '16px' }}>Editar Ingreso</h4>
            <label style={labelStyle}>Monto</label>
            <input style={inputStyle} type="number" value={modalEditar.monto}
              onChange={e => setModalEditar({ ...modalEditar, monto: e.target.value })} />
            <label style={labelStyle}>Fuente</label>
            <input style={inputStyle} type="text" value={modalEditar.fuente}
              onChange={e => setModalEditar({ ...modalEditar, fuente: e.target.value })} />
            <label style={labelStyle}>Descripción</label>
            <input style={inputStyle} type="text" value={modalEditar.descripcion}
              onChange={e => setModalEditar({ ...modalEditar, descripcion: e.target.value })} />
            <label style={labelStyle}>Fecha</label>
            <input style={inputStyle} type="date" value={modalEditar.fecha_registro}
              onChange={e => setModalEditar({ ...modalEditar, fecha_registro: e.target.value })} />
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
            <h4 style={{ marginBottom: '12px' }}>¿Eliminar ingreso?</h4>
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
  )
}

const thStyle     = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle     = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle  = { background: 'var(--bg-card, #fff)', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }
const labelStyle  = { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', marginTop: '12px' }
const inputStyle  = { padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }
const btnEditar   = { padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--ingresos-dark, #2e7d32)', background: 'transparent', color: 'var(--ingresos-dark, #2e7d32)', cursor: 'pointer', fontSize: '0.8rem' }
const btnEliminar = { padding: '4px 12px', borderRadius: '6px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem' }
const btnCancelar = { padding: '8px 18px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem' }
const btnGuardar  = { padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'var(--ingresos-dark, #2e7d32)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }
const btnEliminarConfirm = { padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }