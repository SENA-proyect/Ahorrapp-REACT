import { Link } from 'react-router-dom'
import '../styles/panel.css'

export default function PanelAdmin() {
  return (
    <div>

      {/* TABLAS GENERALES */}
      <div className="inf-container">
        <h2>Tablas generales del panel de control</h2>

        <div className="inf-listas">

          <div className="general-card">
            <Link to="/panel/dependientes">
              <button>Panel de Dependientes</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/panel/historial">
              <button>Panel de Historial</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/panel/movimientos">
              <button>Panel de Movimientos</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/panel/usuario">
              <button>Panel de Usuario</button>
            </Link>
          </div>

        </div>
      </div>

    </div>
  )
}