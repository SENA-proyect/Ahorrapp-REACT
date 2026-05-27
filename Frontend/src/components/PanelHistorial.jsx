
import { useTheme } from '../hooks/useTheme'

export default function PanelHistorial({ historial = [] }) {
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
        <h2>Historial de Acciones</h2>

        <div className="inf-listas">
          {historial.length === 0 ? (
            <p>No hay historial registrado.</p>
          ) : (
            historial.map((log, index) => (
              <div className="general-card log-card" key={index}>
                <p><strong>Fecha:</strong> {log.fecha ? new Date(log.fecha).toLocaleString('es-ES') : 'N/A'}</p>
                <p><strong>Usuario:</strong> {log.usuario_nombre}</p>
                <p><strong>Acción:</strong> <span className="txt-accion">{log.accion}</span></p>
                <p><strong>Detalles:</strong> <em>{log.detalles || 'Sin detalles'}</em></p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}