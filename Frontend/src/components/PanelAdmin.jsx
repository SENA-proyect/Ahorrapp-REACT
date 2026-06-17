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
    };

    cargarDependientes();
  }, []);

  const linksNav = [
    { to: '/PanelUsuarios', label: 'Panel de Usuarios', icon: (
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    ) },
    { to: '/PanelDependientes', label: 'Panel de Dependientes', icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ) },
    { to: '/PanelHistorial', label: 'Panel de Historial', icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ) },
    { to: '/PanelMovimientos', label: 'Panel de Movimientos', icon: (
      <>
        <polyline points="16 3 21 8 16 13" />
        <line x1="21" y1="8" x2="9" y2="8" />
        <polyline points="8 21 3 16 8 11" />
        <line x1="3" y1="16" x2="15" y2="16" />
      </>
    ) },
  ];

  const handleLogout = () => { 
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  }

  return (
    <div className="min-h-screen bg-[#080c18] flex">

      {/* Sidebar */}
      <aside className="w-64 bg-[#0d1526] border-r border-[#1c2942] fixed top-0 left-0 h-screen flex flex-col p-5 z-10">

        <div className="mb-8">
          <p className="text-xs text-[#7d8aa8] mb-1">Bienvenido</p>
          <p className="text-base font-semibold text-[#e0b855]">Administrador</p>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {linksNav.map((item) => (
            <Link key={item.to} to={item.to}>
              <button className="w-full p-3 rounded-lg text-sm font-medium text-[#9aa6c4] hover:text-[#e0b855] hover:bg-[#1a2438] flex items-center gap-3 transition-colors duration-200">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {item.icon}
                </svg>
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#1c2942] pt-4">
          <button onClick={handleLogout} className="w-full p-2.5 rounded-lg text-sm font-medium text-red-300 border border-red-900/40 hover:bg-red-900/20 transition-colors duration-200 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 ml-64 p-8 flex flex-col gap-6">

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#f4f1e8]">Panel de administrador</h1>
            <p className="text-sm text-[#7d8aa8] mt-1">Resumen general del sistema</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#1a2438] border border-[#2a3a5a] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#e0b855]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </header>

        {/* Tarjetas de estadisticas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="bg-[#0d1526] border border-[#1c2942] rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9aa6c4]">Usuarios registrados</p>
              <div className="w-8 h-8 rounded-md bg-[#e0b855]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#e0b855]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#f4f1e8]">{usuarios.totalUsuarios}</p>
            <p className="text-xs text-[#9aa6c4]">Total de cuentas activas</p>
          </div>

          <div className="bg-[#0d1526] border border-[#1c2942] rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9aa6c4]">Dependientes</p>
              <div className="w-8 h-8 rounded-md bg-[#e0b855]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#e0b855]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#f4f1e8]">{dependientes.totalDependientes}</p>
            <p className="text-xs text-[#9aa6c4]">Total registrados</p>
          </div>

          <div className="bg-[#0d1526] border border-[#1c2942] rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9aa6c4]">Movimientos</p>
              <div className="w-8 h-8 rounded-md bg-[#e0b855]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#e0b855]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="16 3 21 8 16 13" />
                  <line x1="21" y1="8" x2="9" y2="8" />
                  <polyline points="8 21 3 16 8 11" />
                  <line x1="3" y1="16" x2="15" y2="16" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#f4f1e8]">--</p>
            <p className="text-xs text-[#9aa6c4]">Pendiente de conectar</p>
          </div>

        </section>

        {/* Bloque inferior, listo para tabla o lista de actividad */}
        <section className="bg-[#0d1526] border border-[#1c2942] rounded-xl p-5 flex-1">
          <h2 className="text-base font-semibold text-[#f4f1e8] mb-4">Actividad reciente</h2>
          <p className="text-sm text-[#9aa6c4]">
            Aqui puedes mapear una lista de movimientos, registros recientes u otra
            informacion proveniente de tu API.
          </p>
        </section>

      </main>
    </div>
  );
}