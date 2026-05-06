import { Link } from 'react-router-dom'

export default function PanelAdmin() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #0d1a0d)' }}>

      {/* TABLAS GENERALES */}
      <div className="inf-container">
        <h2>Tablas generales del panel de control</h2>

        <div className="inf-listas">

          <div className="general-card">
            <Link to="/PanelDependientes">
              <button>Panel de Dependientes</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/PanelHistorial">
              <button>Panel de Historial</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/PanelMovimientos">
              <button>Panel de Movimientos</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/PanelUsuarios">
              <button>Panel de Usuario</button>
            </Link>
          </div>

        </div>
      </div>

    </div>
  )
}