import { Link } from 'react-router-dom'

export default function PanelAdmin() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #081374ff, #928400ff)' }}>

      {/* TABLAS GENERALES */}
      <div className="inf-container">
        <h2 className='text-white font-bold text-3xl mb-5 bg-black w-1/2 rounded-xl p-3 text-center mx-auto'>Panel de administrador.</h2>
        <section className=' flex flex-col w-fit justify-left align-left h-screen rounded-r-[50px]'>
        <ul className="flex flex-col justify-top h-full bg-blue-900 p-10 rounded-xl gap-5">

          <li className="">
            <Link to="/PanelDependientes">
              <button className='p-5 border-gray-300 rounded-md border-1 text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>Panel de Dependientes</button>
            </Link>
          </li>

          <li className="">
            <Link to="/PanelHistorial">
              <button className='p-5 border-gray-300 rounded-md border-1 text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>Panel de Historial</button>
            </Link>
          </li>

          <li className="">
            <Link to="/PanelMovimientos">
              <button className='p-5 border-gray-300 rounded-md border-1 text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>Panel de Movimientos</button>
            </Link>
          </li>

          <li className="">
            <Link to="/PanelUsuarios">
              <button className='p-5 border-gray-300 rounded-md border-1 text-gray-400 hover:text-white text-sm font-bold cursor-pointer transition-all duration-300'>Panel de Usuario</button>
            </Link>
          </li>
        </ul>
        </section>
      </div>

    </div>
  )
}