import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

const API = 'http://localhost:3000/api/movimientos'

const Gastos = () => {
  const [gastos,      setGastos]      = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)

  const cargarGastos = () => {
    const token = localStorage.getItem('token')
    fetch(`${API}/gastos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGastos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarGastos() }, [])

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0)

  const abrirEditar = (g) => setModalEditar({
    id:          g.id,
    monto:       g.monto,
    descripcion: g.descripcion || '',
    fecha:       g.fecha ? g.fecha.slice(0, 10) : '',
  })

  const guardarEdicion = async () => {
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/gastos/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modalEditar),
      })
      if (res.ok) { setModalEditar(null); cargarGastos() }
    } catch (e) { console.error(e) }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/gastos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarGastos() }
    } catch (e) { console.error(e) }
    finally { setEliminando(false) }
  }

  return (
    <>
      <div className="box-content">
        <header className="header">
          <Link to="/">
            <button className="buttonHeader">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 10">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
              </svg>
              Inicio
            </button>
          </Link>
          <h1>Ahorrapp</h1>
          <button className="buttonCerrarSesion">Cerrar Sesión</button>
        </header>

        <main>
          <p className="parrafo1">
            Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos
          </p>

          <nav className="navbar" aria-label="Menú de secciones">
            <ul className="nav-list">
              <li><Link to="/Dashboard"          className="nav-link">Dashboard</Link></li>
              <li><Link to="/ModulosIngresos"     className="nav-link">Ingresos</Link></li>
              <li><Link to="/ModulosGastos"       className="nav-link active">Gastos</Link></li>
              <li><Link to="/ModuloAhorros"       className="nav-link">Ahorros</Link></li>
              <li><Link to="/ModuloImprevistos"   className="nav-link">Imprevistos</Link></li>
              <li><Link to="/ModuloDeudas"        className="nav-link">Deudas</Link></li>
              <li><Link to="/ModulosDependientes" className="nav-link">Dependientes</Link></li>
              <li><Link to="/ModulosCategorias"   className="nav-link">Categorías</Link></li>
            </ul>
          </nav>

          <section className="modulo-ahorros">
            <header className="modulo-header">
              <h3>Módulo de Gastos</h3>
              <div className="acciones-ahorro">
                <Link to="/movimientos/nuevo">
                  <button type="button" className="btn-secundario">Registrar Gasto</button>
                </Link>
              </div>
            </header>

            <div className="resumen-container">
              <p className="total-ahorros">
                Total Gastos: <strong>${total.toLocaleString('es-CO')}</strong>
              </p>

              <div style={{ marginTop: '20px' }}>
                {cargando ? (
                  <p className="mensaje-vacio">Cargando...</p>
                ) : gastos.length === 0 ? (
                  <p className="mensaje-vacio">No has registrado gastos. Mantén tus cuentas claras agregando tus consumos.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={thStyle}>Fecha</th>
                        <th style={thStyle}>Categoría</th>
                        <th style={thStyle}>Descripción</th>
                        <th style={thStyle}>Dependiente</th>
                        <th style={thStyle}>Monto</th>
                        <th style={thStyle}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map(g => (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={tdStyle}>{g.fecha ? new Date(g.fecha).toLocaleDateString('es-CO') : '—'}</td>
                          <td style={tdStyle}>{g.categoria || '—'}</td>
                          <td style={tdStyle}>{g.descripcion || '—'}</td>
                          <td style={tdStyle}>{g.dependiente || '—'}</td>
                          <td style={{ ...tdStyle, color: 'var(--gastos-dark)', fontWeight: 600 }}>
                            ${Number(g.monto).toLocaleString('es-CO')}
                          </td>
                          <td style={{ ...tdStyle, display: 'flex', gap: '8px' }}>
                            <button style={btnEditar}   onClick={() => abrirEditar(g)}>Editar</button>
                            <button style={btnEliminar} onClick={() => setConfirmarId(g.id)}>Eliminar</button>
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

        <footer className="footer-app">
          <p>&copy; 2026 Mi Aplicación de Finanzas</p>
        </footer>

        {/* ── Modal Editar ── */}
        {modalEditar && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h4 style={{ marginBottom: '16px' }}>Editar Gasto</h4>

              <label style={labelStyle}>Monto</label>
              <input style={inputStyle} type="number" value={modalEditar.monto}
                onChange={e => setModalEditar({ ...modalEditar, monto: e.target.value })} />

              <label style={labelStyle}>Descripción</label>
              <input style={inputStyle} type="text" value={modalEditar.descripcion}
                onChange={e => setModalEditar({ ...modalEditar, descripcion: e.target.value })} />

              <label style={labelStyle}>Fecha</label>
              <input style={inputStyle} type="date" value={modalEditar.fecha}
                onChange={e => setModalEditar({ ...modalEditar, fecha: e.target.value })} />

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button style={btnCancelar} onClick={() => setModalEditar(null)}>Cancelar</button>
                <button style={btnGuardar}  onClick={guardarEdicion} disabled={guardando}>
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
              <h4 style={{ marginBottom: '12px' }}>¿Eliminar gasto?</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Esta acción no se puede deshacer.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button style={btnCancelar}        onClick={() => setConfirmarId(null)}>Cancelar</button>
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

export default Gastos

const thStyle            = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle            = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }
const overlayStyle       = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle         = { background: 'var(--bg-card, #fff)', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }
const labelStyle         = { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', marginTop: '12px' }
const inputStyle         = { padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }
const btnEditar          = { padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--gastos-dark, #e74c3c)', background: 'transparent', color: 'var(--gastos-dark, #e74c3c)', cursor: 'pointer', fontSize: '0.8rem' }
const btnEliminar        = { padding: '4px 12px', borderRadius: '6px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem' }
const btnCancelar        = { padding: '8px 18px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem' }
const btnGuardar         = { padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'var(--gastos-dark, #e74c3c)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }
const btnEliminarConfirm = { padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }