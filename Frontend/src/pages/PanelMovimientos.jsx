import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMovimientos } from '../services/api';

const TIPO_CONFIG = {
  ahorro: {
    label: 'Ahorro',
    bg: 'bg-[#e0b855]/10',
    text: 'text-[#e0b855]',
    icon: (
      <>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  ingreso: {
    label: 'Ingreso',
    bg: 'bg-[#97c459]/10',
    text: 'text-[#97c459]',
    icon: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
  },
  deuda: {
    label: 'Deuda',
    bg: 'bg-[#e24b4a]/10',
    text: 'text-[#e24b4a]',
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    ),
  },
  gasto: {
    label: 'Gasto',
    bg: 'bg-[#85b7eb]/10',
    text: 'text-[#85b7eb]',
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  imprevisto: {
    label: 'Imprevisto',
    bg: 'bg-[#85b7eb]/10',
    text: 'text-[#85b7eb]',
    icon: (
      <>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
};

const TIPO_DEFAULT = {
  label: 'Movimiento',
  bg: 'bg-[#9aa6c4]/10',
  text: 'text-[#9aa6c4]',
  icon: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
};

export default function PanelMovimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getMovimientos()
      .then(setMovimientos)
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#080c18]">

      {/* HEADER */}
      <header className="flex items-center gap-4 p-6 border-b border-[#1c2942]">
        <Link to="/PanelAdmin">
          <button className="flex items-center gap-2 bg-[#0d1526] border border-[#1c2942] text-[#9aa6c4] hover:text-[#e0b855] hover:border-[#e0b855]/40 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Volver al panel
          </button>
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-[#f4f1e8]">Movimientos financieros</h1>
          <p className="text-sm text-[#7d8aa8] mt-1">{movimientos.length} movimientos registrados</p>
        </div>
      </header>

      {/* MAIN */}
      <main className="p-6">
        {cargando ? (
          <p className="text-[#9aa6c4] text-sm">Cargando movimientos...</p>
        ) : movimientos.length === 0 ? (
          <p className="text-[#9aa6c4] text-sm">No hay movimientos registrados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {movimientos.map((movimiento, idx) => {
              const tipoKey = (movimiento.tipo || '').toLowerCase();
              const tipo = TIPO_CONFIG[tipoKey] || TIPO_DEFAULT;

              return (
                <div
                  key={`${tipoKey}-${idx}`}
                  className="bg-[#0d1526] border border-[#1c2942] rounded-xl p-5 flex flex-col gap-4"
                >
                  {/* Encabezado: icono del tipo, nombre del módulo */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tipo.bg} ${tipo.text}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {tipo.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f4f1e8]">{tipo.label}</p>
                    </div>
                  </div>

                  {/* Monto destacado */}
                  <div className="border-t border-[#1c2942] pt-3">
                    <p className="text-2xl font-bold text-[#f4f1e8]">
                      ${Number(movimiento.monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[#7d8aa8] mt-1">
                      {movimiento.fecha ? new Date(movimiento.fecha).toLocaleDateString('es-CO') : 'N/A'}
                    </p>
                  </div>

                  {/* Campos especificos por tipo de movimiento */}
                  {tipoKey === 'deuda' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#9aa6c4]">Estado</span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                          movimiento.estado === 'pagada'
                            ? 'bg-[#97c459]/10 text-[#97c459]'
                            : 'bg-[#e0b855]/10 text-[#e0b855]'
                        }`}
                      >
                        {movimiento.estado
                          ? movimiento.estado.charAt(0).toUpperCase() + movimiento.estado.slice(1)
                          : 'Pendiente'}
                      </span>
                    </div>
                  )}

                  {tipoKey === 'ahorro' && movimiento.fecha_meta && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#9aa6c4]">Fecha meta</span>
                      <span className="text-[#f4f1e8]">
                        {new Date(movimiento.fecha_meta).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  )}

                  {/* Descripción */}
                  <div className="border-t border-[#1c2942] pt-3">
                    <p className="text-sm text-[#9aa6c4]">
                      {movimiento.descripcion || 'Sin descripcion'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
