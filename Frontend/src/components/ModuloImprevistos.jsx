import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

const Imprevistos = () => {
  const [imprevistos, setImprevistos] = useState([])
  const [cargando,    setCargando]    = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/movimientos/imprevistos', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setImprevistos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const total = imprevistos.reduce((acc, i) => acc + Number(i.monto), 0)

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
              <li><Link to="/ModulosGastos"       className="nav-link">Gastos</Link></li>
              <li><Link to="/ModuloAhorros"       className="nav-link">Ahorros</Link></li>
              <li><Link to="/ModuloImprevistos"   className="nav-link active">Imprevistos</Link></li>
              <li><Link to="/ModuloDeudas"        className="nav-link">Deudas</Link></li>
              <li><Link to="/ModulosDependientes" className="nav-link">Dependientes</Link></li>
              <li><Link to="/modulosCategorias"   className="nav-link">Categorías</Link></li>
            </ul>
          </nav>

          <section className="modulo-ahorros">
            <header className="modulo-header">
              <h3>Fondo de Imprevistos</h3>
              <div className="acciones-ahorro">
                <Link to="/movimientos/nuevo">
                  <button type="button" className="btn-secundario">Registrar Imprevisto</button>
                </Link>
              </div>
            </header>

            <div className="resumen-container">
              <p className="total-ahorros">
                Total Imprevistos: <strong>${total.toLocaleString('es-CO')}</strong>
              </p>

              <div style={{ marginTop: '20px' }}>
                {cargando ? (
                  <p className="mensaje-vacio">Cargando...</p>
                ) : imprevistos.length === 0 ? (
                  <p className="mensaje-vacio">Tu fondo de imprevistos está vacío. Es recomendable ahorrar al menos 3 meses de gastos.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={thStyle}>Fecha</th>
                        <th style={thStyle}>Causa</th>
                        <th style={thStyle}>Categoría</th>
                        <th style={thStyle}>Dependiente</th>
                        <th style={thStyle}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {imprevistos.map(i => (
                        <tr key={i.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={tdStyle}>{i.fecha ? new Date(i.fecha).toLocaleDateString('es-CO') : '—'}</td>
                          <td style={tdStyle}>{i.causa || '—'}</td>
                          <td style={tdStyle}>{i.categoria || '—'}</td>
                          <td style={tdStyle}>{i.dependiente || '—'}</td>
                          <td style={{ ...tdStyle, color: 'var(--imprevistos-dark)', fontWeight: 600 }}>
                            ${Number(i.monto).toLocaleString('es-CO')}
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
          <p>&copy; 2024 Mi Aplicación de Finanzas</p>
        </footer>
      </div>
    </>
  )
}

export default Imprevistos

const thStyle = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }