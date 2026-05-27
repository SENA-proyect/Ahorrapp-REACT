import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getUsuariosPanelAdmin, getDependientesPanelAdmin } from '../api.js';

export default function PanelAdmin() {
  const [usuarios, setUsuarios] = useState({ totalUsuarios: 0 });
  const [dependientes, setDependientes] = useState({ totalDependientes: 0 });

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await getUsuariosPanelAdmin();
        setUsuarios(data);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };

    cargarUsuarios();
  }, []);

  useEffect(() => {
    const cargarDependientes = async () => {
      try {
        const data = await getDependientesPanelAdmin();
        setDependientes(data);
      } catch (error) {
        console.error('Error al obtener dependientes:', error);
      }
    }

    cargarDependientes();
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-black via-green-950 to-blue-900 flex flex-col'>
      <header className='p-5'>
        <h2 className='text-white font-bold text-3xl w-1/2 rounded-xl p-3 text-center'>
          Panel de administrador.
        </h2>
      </header>

      <main className='flex flex-1 relative'>
        <div className='bg-blue-950/80 backdrop-blur-lg border-r border-blue-800/40 p-5 fixed top-0 left-0 w-56 h-screen overflow-y-auto z-10'>
          <ul className='flex flex-col gap-3 mt-20'>
            <li>
              <Link to="/PanelDependientes">
                <button className='w-full p-3 border border-blue-800/40 hover:border-blue-400 rounded-lg text-gray-400 hover:text-white text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-3 hover:bg-blue-900/40 hover:scale-[1.02] active:scale-[0.98]'>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Panel de Dependientes</span>
                </button>
              </Link>
            </li>

            <li>
              <Link to="/PanelHistorial">
                <button className='w-full p-3 border border-blue-800/40 hover:border-blue-400 rounded-lg text-gray-400 hover:text-white text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-3 hover:bg-blue-900/40 hover:scale-[1.02] active:scale-[0.98]'>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                  </svg>
                  <span>Panel de Historial</span>
                </button>
              </Link>
            </li>

            <li>
              <Link to="/PanelMovimientos">
                <button className='w-full p-3 border border-blue-800/40 hover:border-blue-400 rounded-lg text-gray-400 hover:text-white text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-3 hover:bg-blue-900/40 hover:scale-[1.02] active:scale-[0.98]'>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="16 3 21 8 16 13" />
                    <line x1="21" y1="8" x2="9" y2="8" />
                    <polyline points="8 21 3 16 8 11" />
                    <line x1="3" y1="16" x2="15" y2="16" />
                  </svg>
                  <span>Panel de Movimientos</span>
                </button>
              </Link>
            </li>

            <li>
              <Link to="/PanelUsuarios">
                <button className='w-full p-3 border border-blue-800/40 hover:border-blue-400 rounded-lg text-gray-400 hover:text-white text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-3 hover:bg-blue-900/40 hover:scale-[1.02] active:scale-[0.98]'>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Panel de Usuarios</span>
                </button>
              </Link>
            </li>
          </ul>

          <div className='border-1 border-gray-700 p-5 mt-96 mx-0 flex-col justify-center items-center rounded-lg'>
            <h1 className='text-white text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-3 hover:bg-blue-900/40 hover:scale-[1.02] active:scale-[0.98]'>
              Bienvenido, Administrador.
            </h1>

            <button className='w-full p-2 mt-1 border-red-600 rounded-lg text-red-400 text-white font-semibold cursor-pointer transition-all duration-300 flex items-center gap-3 bg-red-700 hover:bg-red-800/40 hover:scale-[1.02] active:scale-[0.98]'>
              Cerrar sesion
            </button>
          </div>
        </div>

        <section className='flex flex-wrap justify-around flex-1 p-10 gap-3 ml-56'>
          <section className='bg-gradient-to-br from-green-950 to-blue-900 border-2 border-blue-600 rounded-lg p-5 w-96 h-96'>
            <h1 className='text-white font-bold text-xl text-center'>Usuarios</h1>

            <p className='text-white text-center mt-10 text-6xl font-bold'>
              {usuarios.totalUsuarios}
            </p>

            <p className='text-gray-300 text-center mt-4'>
              Usuarios registrados
            </p>
          </section>

          <section className='bg-gradient-to-br from-green-950 to-blue-900 border-2 border-blue-600 rounded-lg p-5 w-96 h-96'>
            <h1 className='text-white font-bold text-xl text-center'>Movimientos</h1>
            <p className='text-white text-center mt-5'>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error blanditiis voluptate nobis,
              officiis repellat nesciunt rerum, quod modi delectus voluptates totam quidem.
              Recusandae voluptatem nisi amet saepe, in quaerat officiis.
            </p>
          </section>

          <section className='bg-gradient-to-br from-green-950 to-blue-900 border-2 border-blue-600 rounded-lg p-5 w-96 h-96'>
            <h1 className='text-white font-bold text-xl text-center'>Dependientes</h1>
            <p className='text-white text-center mt-10 text-6xl font-bold'>
              {dependientes.totalDependientes}
            </p>

            <p className='text-gray-300 text-center mt-4'>
              Dependientes registrados
            </p>
          </section>
        </section>
      </main>
    </div>
  );
}