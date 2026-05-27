// src/components/PanelDependientes.jsx
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'


export default function PanelDependientes({ dependientes = [] }) {
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

      <div className="inf-container">
        <h2>Dependientes</h2>

        <div className="inf-listas">
          {dependientes.length === 0 ? (
            <p>No hay dependientes registrados.</p>
          ) : (
            dependientes.map((dependiente) => (
              <div className="general-card" key={dependiente.ID_dependientes}>
                <p><strong>ID:</strong> {dependiente.ID_dependientes}</p>
                <p><strong>Dependiente de:</strong> {dependiente.usuario_nombre}</p>
                <p><strong>Nombre:</strong> {dependiente.Nombre}</p>
                <p><strong>Relación:</strong> {dependiente.Relacion}</p>
                <p><strong>Ocupación:</strong> {dependiente.Ocupacion || 'N/A'}</p>
                <p><strong>Fecha Nac.:</strong> {dependiente.Fecha_nacimiento}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}