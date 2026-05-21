import { Link } from 'react-router-dom'

export default function PanelAdmin() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-black to-blue-900 flex flex-col'>

      <header className='p-5'>
        <h2 className='text-white font-bold text-3xl bg-black w-1/2 rounded-xl p-3 text-center mx-auto'>
          Panel de administrador.
        </h2>
      </header>

      {/* flex-1 hace que el main ocupe todo el espacio sobrante */}
      {/* relative aquí es importante para que el sidebar fixed */}
      {/* se posicione relativo a la pantalla y no al main */}
      <main className='flex flex-1 relative'>

        {/* Sidebar */}
        {/* top-0 left-0 → pegado arriba a la izquierda de la pantalla */}
        {/* w-56 → ancho fijo, sin esto fixed no sabe qué tan ancho ser */}
        {/* overflow-y-auto → si los items no caben, hace scroll solo en el sidebar */}
        {/* z-10 → lo pone encima del contenido si se solapan */}
        <div className='bg-blue-900 rounded-lg p-6 fixed top-0 left-0 w-56 h-screen overflow-y-auto z-10'>
          <ul className='flex flex-col gap-3 mt-20'>
            {/* mt-20 → empuja los items hacia abajo para que no queden */}
            {/* tapados por el header que también ocupa espacio arriba */}

            <li>
              <Link to="/PanelDependientes">
                {/* w-full → el botón ocupa todo el ancho del sidebar */}
                <button className='w-full p-4 border border-gray-300 rounded-md text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>
                  Panel de Dependientes
                </button>
              </Link>
            </li>

            <li>
              <Link to="/PanelHistorial">
                <button className='w-full p-4 border border-gray-300 rounded-md text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>
                  Panel de Historial
                </button>
              </Link>
            </li>

            <li>
              <Link to="/PanelMovimientos">
                <button className='w-full p-4 border border-gray-300 rounded-md text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>
                  Panel de Movimientos
                </button>
              </Link>
            </li>

            <li>
              <Link to="/PanelUsuarios">
                <button className='w-full p-4 border border-gray-300 rounded-md text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>
                  Panel de Usuario
                </button>
              </Link>
            </li>

          </ul>
        </div>

        <section className='flex flex-wrap justify-around flex-1 p-10 gap-3 ml-56'>
          <section className='bg-blue-900 rounded-lg p-5 w-96 h-96'>
            <p>Contenido 1</p>
          </section>
          <section className='bg-blue-900 rounded-lg p-5 w-96 h-96'>
            <p>Contenido 2</p>
          </section>
          <section className='bg-blue-900 rounded-lg p-5 w-96 h-96'>
            <p>Contenido 3</p>
          </section>
        </section>

      </main>

      <footer className='p-5'></footer>

    </div>
  )
}