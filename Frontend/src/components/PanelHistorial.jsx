

export default function PanelHistorial({ historial = [] }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #0d1a0d)' }} >

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