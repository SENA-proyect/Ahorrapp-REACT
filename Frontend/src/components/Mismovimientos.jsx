import { useState, useEffect } from 'react'
import { getMovimientos } from '../services/api'

const TIPO_LABEL = {
  ahorro: { label: 'Ahorro', color: '#e0b855' },
  ingreso: { label: 'Ingreso', color: '#97c459' },
  deuda: { label: 'Deuda', color: '#e24b4a' },
  gasto: { label: 'Gasto', color: '#85b7eb' },
  imprevisto: { label: 'Imprevisto', color: '#85b7eb' },
}

const TIPO_DEFAULT = { label: 'Movimiento', color: '#9aa6c4' }

export default function MisMovimientos() {
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getMovimientos()
      .then(setMovimientos)
      .finally(() => setCargando(false))
  }, [])

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-1">Mis movimientos</h3>
      <p className="text-sm text-zinc-400 mb-5">
        Registro de tus ingresos, gastos, ahorros, deudas e imprevistos.
      </p>

      {cargando ? (
        <p className="text-sm text-zinc-400">Cargando movimientos...</p>
      ) : movimientos.length === 0 ? (
        <p className="text-sm text-zinc-400">Todavía no tienes movimientos registrados.</p>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
          {movimientos
            .slice()
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map((mov, idx) => {
              const tipoKey = (mov.tipo || '').toLowerCase()
              const tipo = TIPO_LABEL[tipoKey] || TIPO_DEFAULT

              return (
                <div
                  key={`${tipoKey}-${idx}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="shrink-0 text-[0.65rem] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                      style={{ color: tipo.color, background: `${tipo.color}1A` }}
                    >
                      {tipo.label}
                    </span>
                    <p className="text-sm text-zinc-300 truncate">
                      {mov.descripcion || mov.causa || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">
                      ${Number(mov.monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[0.7rem] text-zinc-500">
                      {mov.fecha ? mov.fecha.slice(0, 10).split('-').reverse().join('/') : 'N/A'}
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}