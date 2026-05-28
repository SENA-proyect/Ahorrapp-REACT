import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import FormIngreso    from './FormIngreso'
import FormAhorro     from './FormAhorro'
import FormGasto      from './FormGasto'
import FormDeuda      from './FormDeuda'
import FormImprevisto from './FormImprevisto'

const OPCIONES = {
  Entrada: ['Ingreso', 'Ahorro'],
  Salida:  ['Gasto', 'Deuda', 'Imprevisto'],
}

export default function FormMovimiento() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [searchParams] = useSearchParams()
  const tipoInicial = searchParams.get('tipo')
  const subtipoInicial = searchParams.get('subtipo')
  const subtipoValido =
    tipoInicial &&
    OPCIONES[tipoInicial]?.includes(subtipoInicial)

  const [tipoFlujo,    setTipoFlujo]    = useState(subtipoValido ? tipoInicial : null)
  const [subtipoModulo, setSubtipoModulo] = useState(subtipoValido ? subtipoInicial : null)

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
    <div 
      className={`min-h-screen px-4 py-10 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      <div className={`w-full max-w-2xl rounded-2xl p-8 shadow-xl border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-white/[0.08] border-white/10' 
          : 'bg-white border-slate-200'
      }`}>

        <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">
          Nuevo movimiento
        </h2>

        {/* Paso 1 — Tipo de flujo */}
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            ¿Qué tipo de movimiento es?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Entrada', 'Salida'].map(tipo => (
              <button
                key={tipo}
                type="button"
                className={`rounded-xl px-5 py-4 font-semibold transition-all border ${
                  tipoFlujo === tipo
                    ? tipo === 'Entrada'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => handleTipoFlujo(tipo)}
              >
                {tipo === 'Entrada' ? '↑ Entrada' : '↓ Salida'}
              </button>
            ))}
          </div>
        </div>

        {/* Paso 2 — Subtipo */}
        {tipoFlujo && (
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-slate-600">
              ¿Qué quieres registrar?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OPCIONES[tipoFlujo].map(sub => (
                <button
                  key={sub}
                  type="button"
                  className={`rounded-xl px-4 py-3 font-medium transition-all border ${
                    subtipoModulo === sub
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
                  onClick={() => setSubtipoModulo(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 3 — Formulario detalle */}
        {subtipoModulo && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            {renderFormDetalle()}
          </div>
        )}

        <button
          type="button"
          className="mt-8 w-full rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </button>

      </div>
    </div>
  )
}
