export default function InfoActividad({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <h2 className="h2Modal">Registro de Actividad</h2>
        <p>Visualiza y audita todas las acciones realizadas en el sistema</p>
        <hr />

        <h2 className="h2Modal">¿Que puedes hacer aqui?</h2>
        <ul>
          <li>Registro completo de todas las acciones del usuario</li>
          <li>Filtrado por módulo, fecha y búsqueda de texto</li>
          <li>Exportación de datos para análisis externos</li>
          <li>Estadísticas de uso y actividad</li>
          <li>Timestamps precisos para auditoría</li>
          <li>Información detallada de cada transacción</li>
        </ul>
        <br />

        <button className="btn-modal" onClick={onClose}>OK</button>

      </div>
    </div>
  )
}
