export default function InfoDashboard({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <h2 className="h2Modal">Dashboard Financiero Inteligente</h2>
        <p>Tu centro de control financiero con análisis avanzado y reportes detallados.</p>
        <hr />

        <h2 className="h2Modal">¿Que puedes hacer aqui?</h2>
        <ul>
          <li>Vista panorámica de tu situación financiera</li>
          <li>Análisis inteligente de salud financiera con puntuación</li>
          <li>Gráficos interactivos y visualizaciones avanzadas</li>
          <li>Insights automáticos y recomendaciones personalizadas</li>
          <li>Reportes detallados exportables</li>
          <li>Tendencias y análisis temporal</li>
          <li>Métricas clave y indicadores de rendimiento</li>
        </ul>
        <br />

        <button className="btn-modal" onClick={onClose} id="closeModal">OK</button>

      </div>
    </div>
  )
}
