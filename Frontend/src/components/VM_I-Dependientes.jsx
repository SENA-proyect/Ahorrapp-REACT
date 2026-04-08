// src/components/VentanaModalDependientes.jsx
import { useNavigate } from 'react-router-dom'
import '../styles/VentanaModal.css'

export default function VentanaModalDependientes() {
  const navigate = useNavigate()

  return (
    <div>
      <header></header>
      <main>
        <div className="modal-overlay">
          <div className="modal">

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

            <button className="btn-modal" onClick={() => navigate(-1)}>Entendido!</button>

          </div>
        </div>
      </main>
    </div>
  )
}