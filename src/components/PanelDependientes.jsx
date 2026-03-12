// src/components/PanelDependientes.jsx
import { Link } from 'react-router-dom'
import '../styles/panel.css'

export default function PanelDependientes({ dependientes = [] }) {
  return (
    <div>

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