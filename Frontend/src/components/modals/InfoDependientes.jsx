export default function InfoDependientes({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <h2 className="h2Modal">Clasificación de Personas a Cargo</h2>
        <p>Organiza y gestiona la información de tus dependientes</p>
        <hr />

        <h2 className="h2Modal">¿Que puedes hacer aqui?</h2>
        <ul>
          <li>Registra información completa de cada dependiente</li>
          <li>Clasifica por tipo de relación familiar</li>
          <li>Controla gastos mensuales por dependiente</li>
          <li>Registra ingresos de dependientes que trabajen</li>
          <li>Mantén contactos de emergencia organizados</li>
          <li>Seguimiento de estudiantes y sus gastos educativos</li>
        </ul>
        <br />

        <button className="btn-modal" onClick={onClose}>Entendido!</button>

      </div>
    </div>
  )
}
