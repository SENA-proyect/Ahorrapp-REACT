import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost:3000/api/movimientos'

const navLinks = [
  { to: '/Dashboard',          label: 'Dashboard' },
  { to: '/ModulosIngresos',    label: 'Ingresos' },
  { to: '/ModulosGastos',      label: 'Gastos',       active: true },
  { to: '/ModuloAhorros',      label: 'Ahorros' },
  { to: '/ModuloImprevistos',  label: 'Imprevistos' },
  { to: '/ModuloDeudas',       label: 'Deudas' },
  { to: '/ModulosDependientes',label: 'Dependientes' },
  { to: '/ModulosCategorias',  label: 'Categorías' },
]

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1 mt-3'

const Gastos = () => {
  const [gastos,      setGastos]      = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [errorModal,  setErrorModal]  = useState(null)

  const cargarGastos = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/gastos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGastos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarGastos() }, [])

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0)

  const abrirEditar = (g) => {
    setErrorModal(null)
    setModalEditar({
      id:          g.id,
      monto:       String(g.monto),
      descripcion: g.descripcion || '',
      fecha:       g.fecha ? g.fecha.slice(0, 10) : '',
    })
  }

  const handleEditarChange = (e) => {
    setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const guardarEdicion = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) {
      setErrorModal('El monto debe ser un número mayor a 0')
      return
    }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/gastos/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto:          Number(modalEditar.monto),
          descripcion:    modalEditar.descripcion    || null,
          fecha_registro: modalEditar.fecha          || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarGastos() }
      else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/gastos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarGastos() }
    } catch { /* silencioso */ }
    finally { setEliminando(false) }
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] bg-white px-5 py-5 pb-20 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-[#2D2D2D]">
      <div className="box-border px-4 py-2 lg:px-[100px]">

        <header className="mx-auto mb-5 flex w-full flex-col items-start justify-between gap-3 border-b-2 border-[#82F182] bg-white px-5 py-[5px] md:flex-row md:items-center">
          <Link to="/">
            <button className="flex w-[140px] cursor-pointer items-center gap-2 rounded-[10px] border border-[#82F182] bg-white px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#82F182]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 10">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              Inicio
            </button>
          </Link>
          <h1 className="text-[28px] font-bold text-[#2E7D2E]">Ahorrapp</h1>
          <button className="w-[150px] cursor-pointer rounded-[10px] border border-[#82F182] bg-white px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#82F182]">Cerrar Sesión</button>
        </header>

        <main className="animate-[fadeUp_0.6s_ease]">
          <p className="mb-4 text-[#2D2D2D]">Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos</p>

          <nav className="my-2.5 flex w-full flex-wrap items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-[#4CB04C]/10 px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]" aria-label="Menú de secciones">
            <ul className="flex list-none flex-wrap justify-center gap-2.5 p-0">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-[0.85rem] font-semibold no-underline shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E8FFE8] hover:text-[#2E7D2E] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] ${link.active ? 'bg-[#E8FFE8] text-[#2D2D2D] shadow-[0_4px_12px_rgba(0,0,0,0.12)]' : 'border border-transparent bg-[#F4F6F4] text-[#2D2D2D]'}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section>
            <header className="mt-[30px] flex flex-col items-start justify-between gap-3 px-2.5 md:flex-row md:items-center">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Módulo de Gastos</h3>
              <Link to="/movimientos/nuevo">
                <button type="button" className="cursor-pointer rounded-[10px] bg-[#3DA63D] px-5 py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2E7D2E]">
                  Registrar Gasto
                </button>
              </Link>
            </header>

            <div className="my-5 w-full rounded-[15px] border-2 border-[#4CB04C]/20 bg-white p-[30px]">
              <p className="mb-2.5 text-2xl text-[#2D2D2D]">
                Total Gastos: <strong>${total.toLocaleString('es-CO')}</strong>
              </p>

              <div className="mt-5 overflow-x-auto">
                {cargando ? (
                  <p className="italic text-[#9AA19A]">Cargando...</p>
                ) : gastos.length === 0 ? (
                  <p className="italic text-[#9AA19A]">No has registrado gastos. Mantén tus cuentas claras agregando tus consumos.</p>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-[#D4DCE9]">
                        {['Fecha', 'Categoría', 'Descripción', 'Dependiente', 'Monto', 'Acciones'].map(col => (
                          <th key={col} className="px-3 py-2.5 text-left text-[0.85rem] font-semibold text-[#4A5568]">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map(g => (
                        <tr key={g.id} className="border-b border-[#D4DCE9] transition-colors hover:bg-slate-50">
                          <td className="px-3 py-2.5 align-middle text-sm">{g.fecha ? new Date(g.fecha).toLocaleDateString('es-CO') : '—'}</td>
                          <td className="px-3 py-2.5 align-middle text-sm">{g.categoria || '—'}</td>
                          <td className="px-3 py-2.5 align-middle text-sm">{g.descripcion || '—'}</td>
                          <td className="px-3 py-2.5 align-middle text-sm">{g.dependiente || '—'}</td>
                          <td className="px-3 py-2.5 align-middle text-sm font-semibold text-[#B96F00]">${Number(g.monto).toLocaleString('es-CO')}</td>
                          <td className="px-3 py-2.5 align-middle">
                            <div className="flex gap-2">
                              <button onClick={() => abrirEditar(g)} className="rounded-lg border border-amber-500 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50">Editar</button>
                              <button onClick={() => setConfirmarId(g.id)} className="rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50">Eliminar</button>
                            </div>
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

      {/* ── Modal Editar ── */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h4 className="mb-1 text-lg font-bold text-slate-800">Editar Gasto</h4>
            <p className="mb-4 text-xs text-slate-400">Modifica los campos que necesites y guarda.</p>

            <label className={labelCls}>Monto *</label>
            <input className={inputCls} type="number" name="monto" min="0" step="0.01"
              value={modalEditar.monto} onChange={handleEditarChange} />

            <label className={labelCls}>Descripción</label>
            <input className={inputCls} type="text" name="descripcion" placeholder="Descripción opcional"
              value={modalEditar.descripcion} onChange={handleEditarChange} />

            <label className={labelCls}>Fecha</label>
            <input className={inputCls} type="date" name="fecha"
              value={modalEditar.fecha} onChange={handleEditarChange} />

            {errorModal && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{errorModal}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModalEditar(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardando} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:bg-amber-300">
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar Eliminar ── */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h4 className="mb-2 text-lg font-bold text-slate-800">¿Eliminar gasto?</h4>
            <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmarId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmarEliminar} disabled={eliminando} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-red-300">
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gastos