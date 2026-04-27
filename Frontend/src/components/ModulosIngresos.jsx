import { useState, useEffect } from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

export default function ModuloIngresos() {
  const [ingresos, setIngresos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/movimientos/ingresos', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setIngresos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const total = ingresos.reduce((acc, i) => acc + Number(i.monto), 0)

  return (
    <div className="box-content">
      <header className="header">
        <Link to="/">
          <button className="buttonHeader">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 10">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            Inicio
          </button>
        </Link>
        <h1>Ahorrapp</h1>
        <button className="buttonCerrarSesion">Cerrar Sesion</button>
      </header>

      <main>
        <p className="parrafo1">
          Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos
        </p>

        <nav className="navbar" aria-label="Menú de secciones">
          <ul className="nav-list">
            <li><Link to="/Dashboard"           className="nav-link">Dashboard</Link></li>
            <li><Link to="/ModulosIngresos"      className="nav-link active">Ingresos</Link></li>
            <li><Link to="/ModulosGastos"        className="nav-link">Gastos</Link></li>
            <li><Link to="/ModuloAhorros"        className="nav-link">Ahorros</Link></li>
            <li><Link to="/ModuloImprevistos"    className="nav-link">Imprevistos</Link></li>
            <li><Link to="/ModuloDeudas"         className="nav-link">Deudas</Link></li>
            <li><Link to="/ModulosDependientes"  className="nav-link">Dependientes</Link></li>
            <li><Link to="/ModulosCategorias"    className="nav-link">Categorias</Link></li>
            <li><Link to="/Dashboard"           className="nav-link">Dashboard</Link></li>
            <li><Link to="/ModulosIngresos"      className="nav-link active">Ingresos</Link></li>
            <li><Link to="/ModulosGastos"        className="nav-link">Gastos</Link></li>
            <li><Link to="/ModuloAhorros"        className="nav-link">Ahorros</Link></li>
            <li><Link to="/ModuloImprevistos"    className="nav-link">Imprevistos</Link></li>
            <li><Link to="/ModuloDeudas"         className="nav-link">Deudas</Link></li>
            <li><Link to="/ModulosDependientes"  className="nav-link">Dependientes</Link></li>
            <li><Link to="/ModulosCategorias"    className="nav-link">Categorias</Link></li>
          </ul>
        </nav>


        <section className="modulo-ahorros">
          <header className="modulo-header">
            <h3>Módulo de ingresos</h3>
            <div className="acciones-ahorro">
              <Link to="/movimientos/nuevo">
                <button type="button" className="btn-secundario">Agregar ingreso</button>
              </Link>
              <Link to="/movimientos/nuevo">
                <button type="button" className="btn-secundario">Agregar ingreso</button>
              </Link>
            </div>
          </header>

          <div className="resumen-container">
            <p className="total-ahorros">
              Total Ingresos: <strong>${total.toLocaleString('es-CO')}</strong>
            </p>

            <p className="total-ahorros">
              Total Ingresos: <strong>${total.toLocaleString('es-CO')}</strong>
            </p>

            <div className="tabla-ingresos" style={{ marginTop: '20px' }}>
              {cargando ? (
                <p className="mensaje-vacio">Cargando...</p>
              ) : ingresos.length === 0 ? (
                <p className="mensaje-vacio">No hay ingresos registrados. Agrega tu primer ingreso para comenzar.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Fuente</th>
                      <th style={thStyle}>Categoría</th>
                      <th style={thStyle}>Descripción</th>
                      <th style={thStyle}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={tdStyle}>{i.fecha ? new Date(i.fecha).toLocaleDateString('es-CO') : '—'}</td>
                        <td style={tdStyle}>{i.fuente || '—'}</td>
                        <td style={tdStyle}>{i.categoria || '—'}</td>
                        <td style={tdStyle}>{i.descripcion || '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--ingresos-dark)', fontWeight: 600 }}>
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
        <p>&copy; 2026 Mi Aplicación de Finanzas</p>
      </footer>
    </div>
  )
}

const thStyle = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }