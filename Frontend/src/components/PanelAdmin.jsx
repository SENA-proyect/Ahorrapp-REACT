import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

export default function PanelAdmin() {
  const { isDarkMode } = useTheme()
  
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >

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