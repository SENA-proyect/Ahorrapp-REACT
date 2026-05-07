import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function VentanaModal() {

  return (
    <div>
      <header></header>
      <main>
        <div className="modal-overlay">
          <div className="modal">

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

            <button className="btn-modal" onClick={() => navigate(-1)} id='closeModal'>OK</button>

          </div>
        </div>
      </main>
    </div>
  )
}