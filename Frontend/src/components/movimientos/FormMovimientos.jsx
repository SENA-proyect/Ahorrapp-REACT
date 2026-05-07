import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormIngreso from './FormIngreso'
import FormAhorro from './FormAhorro'
import FormGasto from './FormGasto'
import FormDeuda from './FormDeuda'
import FormImprevisto from './FormImprevisto'
import '../../styles/movimientos.css'

const OPCIONES = {
  Entrada: ['Ingreso', 'Ahorro'],
  Salida:  ['Gasto', 'Deuda', 'Imprevisto'],
}

export default function FormMovimiento() {
  const navigate = useNavigate()
  const [tipoFlujo,     setTipoFlujo]     = useState(null)
  const [subtipoModulo, setSubtipoModulo] = useState(null)

  const handleTipoFlujo = (tipo) => {
    setTipoFlujo(tipo)
    setSubtipoModulo(null)
  }

  const renderFormDetalle = () => {
    switch (subtipoModulo) {
      case 'Ingreso':    return <FormIngreso    tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Ahorro':     return <FormAhorro     tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Gasto':      return <FormGasto      tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Deuda':      return <FormDeuda      tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Imprevisto': return <FormImprevisto tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      default:           return null
    }
  }

  return (
    <div className="movimientos-page">
      <div className="movimientos-card">
        <h2 className="movimientos-titulo">Nuevo movimiento</h2>

        {/* PASO 1 — Tipo de flujo */}
        <div className="mov-grupo">
          <p className="mov-label">¿Qué tipo de movimiento es?</p>
          <div className="mov-opciones">
            {['Entrada', 'Salida'].map(tipo => (
              <button
                key={tipo}
                className={`mov-opcion-btn${tipoFlujo === tipo ? ' activo' : ''}`}
                onClick={() => handleTipoFlujo(tipo)}
              >
                {tipo === 'Entrada' ? '↑ Entrada' : '↓ Salida'}
              </button>
            ))}
          </div>
        </div>

        {/* PASO 2 — Subtipo según flujo */}
        {tipoFlujo && (
          <div className="mov-grupo">
            <p className="mov-label">¿Qué quieres registrar?</p>
            <div className="mov-opciones">
              {OPCIONES[tipoFlujo].map(sub => (
                <button
                  key={sub}
                  className={`mov-opcion-btn${subtipoModulo === sub ? ' activo' : ''}`}
                  onClick={() => setSubtipoModulo(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3 — Formulario del módulo seleccionado */}
        {subtipoModulo && (
          <div className="mov-form-detalle">
            {renderFormDetalle()}
          </div>
        )}

        <button className="form-btn-cancelar" onClick={() => navigate(-1)}>
          Cancelar
        </button>
      </div>
    </div>
  )
}