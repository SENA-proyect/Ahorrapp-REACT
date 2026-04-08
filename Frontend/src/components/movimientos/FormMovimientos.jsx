import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormIngreso from './FormIngreso'
import FormAhorro from './FormAhorro'
import FormGasto from './FormGasto'
import FormDeuda from './FormDeuda'
import FormImprevisto from './FormImprevisto'

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
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>Nuevo movimiento</h2>

        {/* PASO 1 — Tipo de flujo */}
        <div style={styles.grupo}>
          <p style={styles.label}>¿Qué tipo de movimiento es?</p>
          <div style={styles.opciones}>
            {['Entrada', 'Salida'].map(tipo => (
              <button
                key={tipo}
                style={{
                  ...styles.opcionBtn,
                  ...(tipoFlujo === tipo ? styles.opcionActiva : {})
                }}
                onClick={() => handleTipoFlujo(tipo)}
              >
                {tipo === 'Entrada' ? '↑ Entrada' : '↓ Salida'}
              </button>
            ))}
          </div>
        </div>

        {/* PASO 2 — Subtipo según flujo */}
        {tipoFlujo && (
          <div style={styles.grupo}>
            <p style={styles.label}>¿Qué quieres registrar?</p>
            <div style={styles.opciones}>
              {OPCIONES[tipoFlujo].map(sub => (
                <button
                  key={sub}
                  style={{
                    ...styles.opcionBtn,
                    ...(subtipoModulo === sub ? styles.opcionActiva : {})
                  }}
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
          <div style={styles.formDetalle}>
            {renderFormDetalle()}
          </div>
        )}

        <button style={styles.btnCancelar} onClick={() => navigate(-1)}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
  },
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    padding: '36px',
    width: '100%',
    maxWidth: '520px',
  },
  titulo: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--text-lg-color)',
    marginBottom: '28px',
  },
  grupo: {
    marginBottom: '24px',
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
  },
  opciones: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  opcionBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    cursor: 'pointer',
  },
  opcionActiva: {
    background: 'var(--color-primary-soft)',
    border: '1px solid var(--color-primary)',
    color: 'var(--color-primary-dark)',
  },
  formDetalle: {
    marginTop: '8px',
    paddingTop: '24px',
    borderTop: '1px solid var(--border-color)',
  },
  btnCancelar: {
    marginTop: '24px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    cursor: 'pointer',
  },
}