import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

const Gastos = () => {
  const [gastos,   setGastos]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // para evitar memory leaks
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/movimientos/gastos', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGastos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0)

  return (
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

            <div className="tabla-ingresos" style={{ marginTop: '20px' }}>
              {cargando ? (
                <p className="mensaje-vacio">Cargando...</p>
              ) : gastos.length === 0 ? (
                <p className="mensaje-vacio">No has registrado gastos. Mantén tus cuentas claras agregando tus consumos.</p>
              ) : isMobile ? (
                /* ── Vista móvil: cards ── */
                <div className="card-gastos">
                  {gastos.map(g => (
                    <div key={g.id} className="card-gastos">
                      <div className="card-row">  
                        <span className="card-label">Fecha</span>
                        <span className="card-value">{g.fecha ? new Date(g.fecha).toLocaleDateString('es-CO') : '—'}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Categoría</span>
                        <span className="card-value">{g.categoria || '—'}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Descripción</span>
                        <span className="card-value">{g.descripcion || '—'}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Dependiente</span>
                        <span className="card-value">{g.dependiente || '—'}</span>
                      </div>
                      <div className="card-row card-monto">
                        <span className="card-label">Monto</span>
                        <span className="card-value monto" style={{ color: 'var(--gastos-dark)', fontWeight: 700 }}>
                          ${Number(g.monto).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── Vista escritorio: tabla normal ── */
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Categoría</th>
                      <th style={thStyle}>Descripción</th>
                      <th style={thStyle}>Dependiente</th>
                      <th style={thStyle}>Monto</th>
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
    </div>
  )
}

export default Gastos

const thStyle = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }