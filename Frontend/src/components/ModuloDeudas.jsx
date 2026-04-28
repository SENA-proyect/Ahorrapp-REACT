import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

const Deudas = () => {
  const [deudas,   setDeudas]   = useState([])
  const [cargando, setCargando] = useState(true)

  // ── Detecta si la ventana es menor o igual a 768px ──
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // ── Escucha cuando el usuario redimensiona la ventana ──
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    // Limpia el listener cuando el componente se desmonta
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/movimientos/deudas', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDeudas(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const total = deudas.reduce((acc, d) => acc + Number(d.monto), 0)
  const pendientes = deudas.filter(d => d.estado === 'pendiente')

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
              <li><Link to="/ModuloImprevistos"   className="nav-link">Imprevistos</Link></li>
              <li><Link to="/ModuloDeudas"        className="nav-link active">Deudas</Link></li>
              <li><Link to="/ModulosDependientes" className="nav-link">Dependientes</Link></li>
              <li><Link to="/ModulosCategorias"   className="nav-link">Categorías</Link></li>
            </ul>
          </nav>

          <section className="modulo-ahorros">
            <header className="modulo-header">
              <h3>Módulo de Deudas</h3>
              <div className="acciones-ahorro">
                <Link to="/movimientos/nuevo">
                  <button type="button" className="btn-secundario">Nueva Deuda</button>
                </Link>
                <Link to="/">
                  <button type="button" className="btn-secundario">Pagar deuda.</button>
                </Link>
              </div>
            </header>

            <div className="resumen-container">
              <p className="total-ahorros">
                Total Deuda Acumulada: <strong>${total.toLocaleString('es-CO')}</strong>
                {pendientes.length > 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--deudas-dark)', marginLeft: '12px' }}>
                    ({pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''})
                  </span>
                )}
              </p>

              <div style={{ marginTop: '20px' }}>
                {cargando ? (
                  <p className="mensaje-vacio">Cargando...</p>

                ) : deudas.length === 0 ? (
                  <p className="mensaje-vacio">¡Felicidades! No tienes deudas pendientes registradas.</p>

                ) : isMobile ? (
                  // ── VISTA MÓVIL: cards ──
                  <div className="cards-mobile">
                    {deudas.map(d => (
                      // Cada deuda se renderiza como una tarjeta
                      <div key={d.id} className="card-deuda">

                        <div className="card-row">
                          <span className="card-label">Fuente</span>
                          <span className="card-value">{d.fuente || '—'}</span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Categoría</span>
                          <span className="card-value">{d.categoria || '—'}</span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Descripción</span>
                          <span className="card-value">{d.descripcion || '—'}</span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Cuotas</span>
                          {/* Si tiene cuotas_total mostramos pagadas/total,
                              si no, mostramos "Pago único" */}
                          <span className="card-value">
                            {d.cuotas_total ? `${d.cuotas_pagadas}/${d.cuotas_total}` : 'Pago único'}
                          </span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Fecha fin</span>
                          <span className="card-value">
                            {d.fecha_fin ? new Date(d.fecha_fin).toLocaleDateString('es-CO') : '—'}
                          </span>
                        </div>

                        <div className="card-row">
                          <span className="card-label">Estado</span>
                          {/* Badge de estado igual que en la tabla:
                              verde si pagada, azul si pendiente */}
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: d.estado === 'pagada' ? 'var(--ingresos-bg)' : 'var(--deudas-bg)',
                            color: d.estado === 'pagada' ? 'var(--ingresos-dark)' : 'var(--deudas-dark)',
                          }}>
                            {d.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                          </span>
                        </div>

                        {/* Separador visual antes del monto */}
                        <div className="card-row card-monto">
                          <span className="card-label">Monto</span>
                          <span className="card-value" style={{ color: 'var(--deudas-dark)', fontWeight: 700 }}>
                            ${Number(d.monto).toLocaleString('es-CO')}
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>

                ) : (
                  // ── VISTA ESCRITORIO: tabla normal ──
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={thStyle}>Fuente</th>
                        <th style={thStyle}>Categoría</th>
                        <th style={thStyle}>Descripción</th>
                        <th style={thStyle}>Cuotas</th>
                        <th style={thStyle}>Fecha fin</th>
                        <th style={thStyle}>Estado</th>
                        <th style={thStyle}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deudas.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={tdStyle}>{d.fuente}</td>
                          <td style={tdStyle}>{d.categoria || '—'}</td>
                          <td style={tdStyle}>{d.descripcion || '—'}</td>
                          <td style={tdStyle}>
                            {d.cuotas_total ? `${d.cuotas_pagadas}/${d.cuotas_total}` : 'Pago único'}
                          </td>
                          <td style={tdStyle}>{d.fecha_fin ? new Date(d.fecha_fin).toLocaleDateString('es-CO') : '—'}</td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: d.estado === 'pagada' ? 'var(--ingresos-bg)' : 'var(--deudas-bg)',
                              color: d.estado === 'pagada' ? 'var(--ingresos-dark)' : 'var(--deudas-dark)',
                            }}>
                              {d.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--deudas-dark)', fontWeight: 600 }}>
                            ${Number(d.monto).toLocaleString('es-CO')}
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

export default Deudas

const thStyle = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }