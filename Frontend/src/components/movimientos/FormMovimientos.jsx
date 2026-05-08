import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormIngreso from './FormIngreso'
import FormAhorro from './FormAhorro'
import FormGasto from './FormGasto'
import FormDeuda from './FormDeuda'
import FormImprevisto from './FormImprevisto'

const OPCIONES = {
  Entrada: ['Ingreso', 'Ahorro'],
  Salida: ['Gasto', 'Deuda', 'Imprevisto'],
}

export default function FormMovimiento() {
  const navigate = useNavigate()
  const [tipoFlujo, setTipoFlujo] = useState(null)
  const [subtipoModulo, setSubtipoModulo] = useState(null)

  const handleTipoFlujo = (tipo) => {
    setTipoFlujo(tipo)
    setSubtipoModulo(null)
  }

  const renderFormDetalle = () => {
    switch (subtipoModulo) {
      case 'Ingreso': return <FormIngreso tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Ahorro': return <FormAhorro tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Gasto': return <FormGasto tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Deuda': return <FormDeuda tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      case 'Imprevisto': return <FormImprevisto tipoFlujo={tipoFlujo} subtipo={subtipoModulo} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">
          Nuevo movimiento
        </h2>

        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            ¿Qué tipo de movimiento es?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Entrada', 'Salida'].map(tipo => (
              <button
                key={tipo}
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

        {tipoFlujo && (
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-slate-600">
              ¿Qué quieres registrar?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OPCIONES[tipoFlujo].map(sub => (
                <button
                  key={sub}
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

        {subtipoModulo && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            {renderFormDetalle()}
          </div>
        )}

        <button
          className="mt-8 w-full rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
