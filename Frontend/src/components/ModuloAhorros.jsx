import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

const Ahorros = () => {
  const [ahorros,  setAhorros]  = useState([])
  const [cargando, setCargando] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/movimientos/ahorros', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAhorros(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const total = ahorros.reduce((acc, a) => acc + Number(a.monto), 0)

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
              <p className="total-ahorros">
                Total Ahorros: <strong>${total.toLocaleString('es-CO')}</strong>
              </p>

              <div style={{ marginTop: '20px' }}>
                {cargando ? (
                  // Mientras carga mostramos este mensaje
                  <p className="mensaje-vacio">Cargando...</p>

                ) : ahorros.length === 0 ? (
                  // Si no hay datos, mostramos mensaje vacío
                  <p className="mensaje-vacio">No hay metas de ahorro creadas. Crea tu primera meta para comenzar a ahorrar.</p>

                ) : isMobile ? (
                  // ── VISTA MÓVIL: cards ──
                  // Si isMobile es true, mostramos tarjetas en vez de tabla
                  <div className="cards-mobile">
                    {ahorros.map(a => (
                      // Cada ahorro se convierte en una tarjeta
                      // key={a.id} es obligatorio en listas de React para
                      // identificar cada elemento de forma única
                      <div key={a.id} className="card-ahorro">

                        <div className="card-row">
                          <span className="card-label">Fecha</span>
                          {/* El operador ? verifica si a.fecha existe antes
                              de convertirlo a fecha legible, si no existe muestra — */}
                          <span className="card-value">
                            {a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO') : '—'}
                          </span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Meta</span>
                          {/* El operador || '—' muestra — si el valor es falsy
                              (null, undefined, string vacío) */}
                          <span className="card-value">{a.meta || '—'}</span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Categoría</span>
                          <span className="card-value">{a.categoria || '—'}</span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Descripción</span>
                          <span className="card-value">{a.descripcion || '—'}</span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Fecha meta</span>
                          <span className="card-value">
                            {a.fecha_meta ? new Date(a.fecha_meta).toLocaleDateString('es-CO') : '—'}
                          </span>
                        </div>

                        {/* card-monto tiene borde superior para separar visualmente el dinero */}
                        <div className="card-row card-monto">
                          <span className="card-label">Monto</span>
                          {/* toLocaleString('es-CO') formatea el número con separadores
                              de miles en formato colombiano: 1.000.000 */}
                          <span className="card-value" style={{ color: 'var(--ahorros-dark)', fontWeight: 700 }}>
                            ${Number(a.monto).toLocaleString('es-CO')}
                          </span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Acumulado</span>
                          <span className="card-value" style={{ color: 'var(--ahorros-base)', fontWeight: 700 }}>
                            ${Number(a.monto_acumulado).toLocaleString('es-CO')}
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>

                ) : (
                  // ── VISTA ESCRITORIO: tabla normal ──
                  // Si isMobile es false, mostramos la tabla completa
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
                          <td style={{ ...tdStyle, color: 'var(--ahorros-dark)', fontWeight: 600 }}>
                            ${Number(a.monto).toLocaleString('es-CO')}
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--ahorros-base)', fontWeight: 600 }}>
                            ${Number(a.monto_acumulado).toLocaleString('es-CO')}
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
    </>
  )
}

export default Ahorros

// ── Estilos de la tabla de escritorio ──
// thStyle: estilo para los encabezados (th) de la tabla
const thStyle = {
  padding: '10px 12px',       // espacio interior
  textAlign: 'left',          // texto alineado a la izquierda
  color: 'var(--text-secondary)', // color gris del texto
  fontWeight: 600,            // semi-negrita
  fontSize: '0.85rem'         // tamaño pequeño
}

// tdStyle: estilo para las celdas (td) de la tabla
const tdStyle = {
  padding: '10px 12px',
  fontSize: '0.9rem',
  verticalAlign: 'middle'     // contenido centrado verticalmente
}