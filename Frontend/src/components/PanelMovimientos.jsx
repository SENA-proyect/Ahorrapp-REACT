import { Link } from 'react-router-dom';


const TIPO_CONFIG = {
  Ahorro: {
    color: '#e0b855',
    bg: 'bg-[#e0b855]/10',
    text: 'text-[#e0b855]',
    icon: (
      <>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  Ingreso: {
    color: '#97c459',
    bg: 'bg-[#97c459]/10',
    text: 'text-[#97c459]',
    icon: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
  },
  Deuda: {
    color: '#e24b4a',
    bg: 'bg-[#e24b4a]/10',
    text: 'text-[#e24b4a]',
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    ),
  },
  Imprevisto: {
    color: '#85b7eb',
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

// Configuración por defecto para tipos no contemplados
const TIPO_DEFAULT = {
  color: '#9aa6c4',
  bg: 'bg-[#9aa6c4]/10',
  text: 'text-[#9aa6c4]',
  icon: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
};

export default function PanelMovimientos({ movimientos = [] }) {
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
        {movimientos.length === 0 ? (
          <p className="text-[#9aa6c4] text-sm">No hay movimientos registrados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {movimientos.map((movimiento) => {
              // Buscamos la config visual del tipo; si no existe, usamos la default
              const tipo = TIPO_CONFIG[movimiento.Subtipo_Modulo] || TIPO_DEFAULT;

              return (
                <div
                  key={movimiento.ID_movimiento}
                  className="bg-[#0d1526] border border-[#1c2942] rounded-xl p-5 flex flex-col gap-4"
                >
                  {/* Encabezado: icono del tipo, nombre del módulo, ID */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tipo.bg} ${tipo.text}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {tipo.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f4f1e8]">{movimiento.Subtipo_Modulo}</p>
                      <p className="text-xs text-[#7d8aa8]">ID {movimiento.ID_movimiento}</p>
                    </div>
                  </div>

                  {/* Monto destacado */}
                  <div className="border-t border-[#1c2942] pt-3">
                    <p className="text-2xl font-bold text-[#f4f1e8]">
                      ${Number(movimiento.Monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[#7d8aa8] mt-1">{movimiento.Fecha_registro}</p>
                  </div>

                  {/* Campos especificos por tipo de movimiento */}
                  <div className="flex flex-col gap-2.5">

                    {movimiento.Subtipo_Modulo === 'Ahorro' && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9aa6c4]">Meta</span>
                          <span className="text-[#f4f1e8]">{movimiento.Meta}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9aa6c4]">Fecha meta</span>
                          <span className="text-[#f4f1e8]">{movimiento.Fecha_meta || 'N/A'}</span>
                        </div>
                      </>
                    )}

                    {movimiento.Subtipo_Modulo === 'Ingreso' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#9aa6c4]">Fuente</span>
                        <span className="text-[#f4f1e8]">{movimiento.Fuente}</span>
                      </div>
                    )}

                    {movimiento.Subtipo_Modulo === 'Deuda' && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9aa6c4]">Acreedor</span>
                          <span className="text-[#f4f1e8]">{movimiento.Fuente}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9aa6c4]">Estado</span>
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                              movimiento.Estado === 'pagada'
                                ? 'bg-[#97c459]/10 text-[#97c459]'
                                : 'bg-[#e0b855]/10 text-[#e0b855]'
                            }`}
                          >
                            {movimiento.Estado
                              ? movimiento.Estado.charAt(0).toUpperCase() + movimiento.Estado.slice(1)
                              : 'Pendiente'}
                          </span>
                        </div>
                      </>
                    )}

                    {movimiento.Subtipo_Modulo === 'Imprevisto' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#9aa6c4]">Causa</span>
                        <span className="text-[#f4f1e8]">{movimiento.Causa}</span>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="border-t border-[#1c2942] pt-3">
                    <p className="text-sm text-[#9aa6c4]">
                      {movimiento.Descripcion || 'Sin descripcion'}
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