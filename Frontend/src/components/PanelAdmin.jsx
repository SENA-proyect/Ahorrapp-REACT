import { Link } from 'react-router-dom'

export default function PanelAdmin() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #081374ff, #928400ff)' }}>

      {/* TABLAS GENERALES */}
      <div className="inf-container">
        <h2>Tablas generales del panel de control</h2>

        <div className="flex justify-between">

          <div className="general-card">
            <Link to="/PanelDependientes">
              <button className='p-10 bg-black rounded-xl text-white text-sm font-bold'>Panel de Dependientes</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/PanelHistorial">
              <button className='p-10 bg-black rounded-xl text-white text-sm font-bold'>Panel de Historial</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/PanelMovimientos">
              <button className='p-10 bg-black rounded-xl text-white text-sm font-bold'>Panel de Movimientos</button>
            </Link>
          </div>

          <div className="general-card">
            <Link to="/PanelUsuarios">
              <button className='p-10 bg-black rounded-xl text-white text-sm font-bold'>Panel de Usuario</button>
            </Link>
          </div>

        </div>
      </div>

    </div>
  )
}