import {Link} from 'react-router-dom'
import { useEffect, useState } from 'react'


export default function PanelDependientes({ dependientes = [] }) {
  return (
    <div  style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1133a1ff, #97720cff)' }} >

       <header>
        <div className="flex p-5 bg-black/10">
        <button className="bg-blue-700 rounded-lg p-3 text-white w-auto transition-all duration-300">
            <Link to="/PanelAdmin">
              ← Volver al Panel Admin
            </Link>
          </button>
          <h2 className="text-center text-white font-bold text-4xl flex justify-center m-auto">Lista de Dependientes</h2>
        </div>
      </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center m-10 text-white">
          {dependientes.length === 0 ? (
            <p>No hay dependientes registrados.</p>
          ) : (
            dependientes.map((dependiente) => (
              <div className="bg-white/20 backdrop-blur-md border-2 border-blue-300 flex flex-col rounded-xl m-5 p-10 text-white" key={dependiente.ID_dependientes}>
                <p><strong>ID:</strong> {dependiente.ID_dependientes}</p>
                <p><strong>Dependiente de:</strong> {dependiente.usuario_nombre}</p>
                <p><strong>Nombre:</strong> {dependiente.Nombre}</p>
                <p><strong>Relación:</strong> {dependiente.Relacion}</p>
                <p><strong>Ocupación:</strong> {dependiente.Ocupacion || 'N/A'}</p>
                <p><strong>Fecha Nac.:</strong> {dependiente.Fecha_nacimiento}</p>
              </div>
            ))
          )}
        </div>
      </div>

  )
}