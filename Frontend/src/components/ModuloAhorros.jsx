import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Ahorros = () => {
  const [ahorros, setAhorros] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    fetch('http://localhost:3000/api/movimientos/ahorros', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAhorros(data)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const total = ahorros.reduce((acc, a) => acc + Number(a.monto), 0)

  const navLinks = [
    { to: '/Dashboard', label: 'Dashboard' },
    { to: '/ModulosIngresos', label: 'Ingresos' },
    { to: '/ModulosGastos', label: 'Gastos' },
    { to: '/ModuloAhorros', label: 'Ahorros', active: true },
    { to: '/ModuloImprevistos', label: 'Imprevistos' },
    { to: '/ModuloDeudas', label: 'Deudas' },
    { to: '/ModulosDependientes', label: 'Dependientes' },
    { to: '/ModulosCategorias', label: 'Categorías' },
  ]

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] bg-white px-5 py-5 pb-20 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-[#2D2D2D]">
      <div className="box-border px-4 py-2 lg:px-[100px]">
        <header className="mx-auto mb-5 flex w-full flex-col items-start justify-between gap-3 border-b-2 border-[#82F182] bg-white px-5 py-[5px] text-center md:flex-row md:items-center">
          <Link to="/">
            <button className="flex w-[140px] cursor-pointer items-center gap-2 rounded-[10px] border border-[#82F182] bg-white px-4 py-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#82F182]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 20 10"
              >
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
              </svg>
              Inicio
            </button>
          </Link>

          <h1 className="text-[28px] font-bold text-[#2E7D2E]">Ahorrapp</h1>

          <button className="w-[150px] cursor-pointer rounded-[10px] border border-[#82F182] bg-white px-4 py-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#82F182]">
            Cerrar Sesión
          </button>
        </header>

        <main className="animate-[fadeUp_0.6s_ease]">
          <p className="mb-4 text-[#2D2D2D]">
            Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos
          </p>

          <nav
            className="my-2.5 flex w-full flex-wrap items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-[#4CB04C]/10 px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            aria-label="Menú de secciones"
          >
            <ul className="flex list-none flex-wrap justify-center gap-2.5 p-0">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-[0.85rem] font-semibold no-underline shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2E7D2E] hover:bg-[#E8FFE8] hover:text-[#2E7D2E] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D2E] ${
                      link.active
                        ? 'border-transparent bg-[#E8FFE8] text-[#2D2D2D] shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                        : 'border border-transparent bg-[#F4F6F4] text-[#2D2D2D]'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section>
            <header className="mt-[30px] flex flex-col items-start justify-between gap-3 px-2.5 md:flex-row md:items-center">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Módulo de ahorros</h3>

              <div className="flex gap-2.5">
                <Link to="/movimientos/nuevo">
                  <button
                    type="button"
                    className="cursor-pointer rounded-[10px] bg-[#3DA63D] px-5 py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D]"
                  >
                    Nueva Meta
                  </button>
                </Link>
              </div>
            </header>

            <div className="my-5 flex min-h-[150px] w-full flex-col justify-center rounded-[15px] border-2 border-[#4CB04C]/20 bg-white p-[30px] text-center">
              <p className="mb-2.5 text-2xl text-[#2D2D2D]">
                Total Ahorros: <strong>${total.toLocaleString('es-CO')}</strong>
              </p>

              <div className="mt-5 overflow-x-auto">
                {cargando ? (
                  <p className="italic text-[#9AA19A]">Cargando...</p>
                ) : ahorros.length === 0 ? (
                  <p className="italic text-[#9AA19A]">
                    No hay metas de ahorro creadas. Crea tu primera meta para comenzar a ahorrar.
                  </p>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-[#D4DCE9]">
                        {['Fecha', 'Meta', 'Categoría', 'Descripción', 'Meta fecha', 'Monto', 'Acumulado'].map(col => (
                          <th key={col} className={thClass}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {ahorros.map(a => (
                        <tr key={a.id} className="border-b border-[#D4DCE9]">
                          <td className={tdClass}>
                            {a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO') : '—'}
                          </td>
                          <td className={tdClass}>{a.meta || '—'}</td>
                          <td className={tdClass}>{a.categoria || '—'}</td>
                          <td className={tdClass}>{a.descripcion || '—'}</td>
                          <td className={tdClass}>
                            {a.fecha_meta ? new Date(a.fecha_meta).toLocaleDateString('es-CO') : '—'}
                          </td>
                          <td className={`${tdClass} font-semibold text-[#5337C9]`}>
                            ${Number(a.monto).toLocaleString('es-CO')}
                          </td>
                          <td className={`${tdClass} font-semibold text-[#7A5AF5]`}>
                            ${Number(a.monto_acumulado).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 z-[100] w-full border-t border-[#82F182] bg-white p-3 text-center text-xs text-[#9AA19A]">
          <p>&copy; 2026 Mi Aplicación de Finanzas</p>
        </footer>
      </div>
    </div>
  )
}

export default Ahorros

const thClass = 'px-3 py-2.5 text-left text-[0.85rem] font-semibold text-[#4A5568]'
const tdClass = 'px-3 py-2.5 align-middle text-sm'
