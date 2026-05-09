// src/components/PanelMovimientos.jsx


export default function PanelMovimientos({ movimientos = [] }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #0d1a0d)' }} >

      <div className="inf-container">
        <h2>Movimientos Financieros</h2>

        <div className="inf-listas">
          {movimientos.length === 0 ? (
            <p>No hay movimientos registrados.</p>
          ) : (
            movimientos.map((movimiento) => (
              <div className="general-card" key={movimiento.ID_movimiento}>
                <p><strong>ID Movimiento:</strong> {movimiento.ID_movimiento}</p>
                <p><strong>Módulo:</strong> {movimiento.Subtipo_Modulo}</p>
                <p><strong>Monto:</strong> ${Number(movimiento.Monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
                <p><strong>Fecha:</strong> {movimiento.Fecha_registro}</p>

                {movimiento.Subtipo_Modulo === 'Ahorro' && (
                  <>
                    <p><strong>Meta:</strong> {movimiento.Meta}</p>
                    <p><strong>Fecha Meta:</strong> {movimiento.Fecha_meta || 'N/A'}</p>
                  </>
                )}

                {movimiento.Subtipo_Modulo === 'Ingreso' && (
                  <p><strong>Fuente:</strong> {movimiento.Fuente}</p>
                )}

                {movimiento.Subtipo_Modulo === 'Deuda' && (
                  <>
                    <p><strong>Acreedor:</strong> {movimiento.Fuente}</p>
                    <p><strong>Estado:</strong>{' '}
                      <span className={`badge ${movimiento.Estado === 'pagada' ? 'pagada' : 'pendiente'}`}>
                        {movimiento.Estado
                          ? movimiento.Estado.charAt(0).toUpperCase() + movimiento.Estado.slice(1)
                          : 'Pendiente'}
                      </span>
                    </p>
                  </>
                )}

                {movimiento.Subtipo_Modulo === 'Imprevisto' && (
                  <p><strong>Causa:</strong> {movimiento.Causa}</p>
                )}

                <p><strong>Descripción:</strong> {movimiento.Descripcion || 'Sin descripción'}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}