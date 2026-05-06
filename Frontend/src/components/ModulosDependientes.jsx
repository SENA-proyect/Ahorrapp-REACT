import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const PESO_LABELS = {
  1: 'Muy bajo',
  2: 'Bajo',
  3: 'Medio',
  4: 'Alto',
  5: 'Muy alto',
}

const Dependientes = () => {
  const [mostrarModal, setMostrarModal] = useState(false)
  const [dependientes, setDependientes] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [formDatos, setFormDatos] = useState({
    Nombre: '',
    Relacion: '',
    Ocupacion: '',
    Fecha_nacimiento: '',
    Peso_economico: '3',
  })

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetch('/api/dependientes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setDependientes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando dependientes:', err))
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setFormDatos(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const payload = {
      ...formDatos,
      Peso_economico: parseInt(formDatos.Peso_economico),
      Fecha_nacimiento: formDatos.Fecha_nacimiento || null,
    }

    if (editandoId) {
      try {
        const res = await fetch(`/api/dependientes/${editandoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          setDependientes(dependientes.map(dep =>
            dep.ID_dependientes === editandoId
              ? { ...payload, ID_dependientes: editandoId }
              : dep
          ))
        } else {
          const data = await res.json()
          alert(data.error || 'Error al actualizar el dependiente')
        }
      } catch (err) {
        console.error(err)
        alert('Error de conexión')
      }
    } else {
      try {
        const res = await fetch('/api/dependientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (res.ok) {
          setDependientes([...dependientes, { ...payload, ID_dependientes: data.id }])
        } else {
          alert(data.error || 'Error al guardar el dependiente')
        }
      } catch (err) {
        console.error(err)
        alert('Error de conexión')
      }
    }

    cerrarModal()
  }

  const handleEditar = dependiente => {
    setFormDatos({
      Nombre: dependiente.Nombre,
      Relacion: dependiente.Relacion,
      Ocupacion: dependiente.Ocupacion || '',
      Fecha_nacimiento: dependiente.Fecha_nacimiento
        ? dependiente.Fecha_nacimiento.split('T')[0]
        : '',
      Peso_economico: String(dependiente.Peso_economico ?? '3'),
    })
    setEditandoId(dependiente.ID_dependientes)
    setMostrarModal(true)
  }

  const handleEliminar = async id => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este dependiente?')) return

    try {
      const res = await fetch(`/api/dependientes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setDependientes(dependientes.filter(dep => dep.ID_dependientes !== id))
      } else {
        alert('Error al eliminar el dependiente')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión')
    }
  }

  const abrirModal = () => {
    setFormDatos({
      Nombre: '',
      Relacion: '',
      Ocupacion: '',
      Fecha_nacimiento: '',
      Peso_economico: '3',
    })
    setEditandoId(null)
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setEditandoId(null)
    setFormDatos({
      Nombre: '',
      Relacion: '',
      Ocupacion: '',
      Fecha_nacimiento: '',
      Peso_economico: '3',
    })
  }

  const navLinks = [
    { to: '/Dashboard', label: 'Dashboard' },
    { to: '/ModulosIngresos', label: 'Ingresos' },
    { to: '/ModulosGastos', label: 'Gastos' },
    { to: '/ModuloAhorros', label: 'Ahorros' },
    { to: '/ModuloImprevistos', label: 'Imprevistos' },
    { to: '/ModuloDeudas', label: 'Deudas' },
    { to: '/ModulosDependientes', label: 'Dependientes', active: true },
    { to: '/ModulosCategorias', label: 'Categorías' },
  ]

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] bg-white px-5 py-5 pb-20 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-[#2D2D2D]">
      <div className="box-border px-4 py-2 lg:px-[100px]">
        <header className="mx-auto mb-5 flex w-full flex-col items-start justify-between gap-3 border-b-2 border-[#82F182] bg-white px-5 py-[5px] text-center md:flex-row md:items-center">
          <Link to="/">
            <button className="flex w-[140px] cursor-pointer items-center gap-2 rounded-[10px] border border-[#82F182] bg-white px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#82F182]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 10">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
              </svg>
              Inicio
            </button>
          </Link>

          <h1 className="text-[28px] font-bold text-[#2E7D2E]">Ahorrapp</h1>

          <button className="w-[150px] cursor-pointer rounded-[10px] border border-[#82F182] bg-white px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#82F182]">
            Cerrar Sesión
          </button>
        </header>

        <main className="animate-[fadeUp_0.6s_ease]">
          <p className="mb-4 text-[#2D2D2D]">
            Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos
          </p>

          <nav className="my-2.5 flex w-full flex-wrap items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-[#4CB04C]/10 px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <ul className="flex list-none flex-wrap justify-center gap-2.5 p-0">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`inline-flex items-center whitespace-nowrap rounded-lg px-4 py-2 text-[0.85rem] font-semibold no-underline shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2E7D2E] hover:bg-[#E8FFE8] hover:text-[#2E7D2E] ${
                      link.active
                        ? 'bg-[#E8FFE8] text-[#2D2D2D] shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
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
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Módulo de dependientes</h3>

              <button
                type="button"
                className="cursor-pointer rounded-[10px] bg-[#3DA63D] px-5 py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D]"
                onClick={abrirModal}
              >
                Agregar dependiente
              </button>
            </header>

            <div className="my-5 flex min-h-[150px] w-full flex-col justify-center rounded-[15px] border-2 border-[#4CB04C]/20 bg-white p-[30px] text-center">
              <p className="mb-2.5 text-2xl text-[#2D2D2D]">
                Total dependientes: <strong>{dependientes.length}</strong>
              </p>

              <div className="mt-5">
                {dependientes.length === 0 ? (
                  <p className="italic text-[#9AA19A]">
                    No hay dependientes registrados. Agrega tu primer dependiente para comenzar.
                  </p>
                ) : (
                  <div className="mt-[15px] grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[15px] text-left">
                    {dependientes.map(dependiente => (
                      <div
                        key={dependiente.ID_dependientes}
                        className="flex flex-col gap-3 rounded-lg border border-[#82F182] bg-[#F4F6F4] p-[15px] shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[3px] hover:border-[#3DA63D] hover:shadow-[0_4px_12px_rgba(76,176,76,0.12)]"
                      >
                        <div className="flex flex-col gap-1.5">
                          <p className={infoClass}><strong className={strongClass}>Nombre:</strong> {dependiente.Nombre}</p>
                          <p className={infoClass}><strong className={strongClass}>Relación:</strong> {dependiente.Relacion}</p>
                          <p className={infoClass}><strong className={strongClass}>Ocupación:</strong> {dependiente.Ocupacion || 'N/A'}</p>
                          <p className={infoClass}>
                            <strong className={strongClass}>Fecha Nac.:</strong>{' '}
                            {dependiente.Fecha_nacimiento ? dependiente.Fecha_nacimiento.split('T')[0] : 'N/A'}
                          </p>
                          <p className={infoClass}>
                            <strong className={strongClass}>Peso Económico:</strong>{' '}
                            {PESO_LABELS[dependiente.Peso_economico] ?? 'N/A'}
                          </p>
                        </div>

                        <div className="mt-2 flex gap-2">
                          <button
                            className="flex-1 cursor-pointer rounded-md border border-[#3DA63D] bg-[#E8FFE8] px-3 py-2 text-[0.8rem] font-semibold text-[#2E7D2E] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D] hover:text-white hover:shadow-[0_3px_6px_rgba(76,176,76,0.25)]"
                            onClick={() => handleEditar(dependiente)}
                          >
                            Editar
                          </button>

                          <button
                            className="flex-1 cursor-pointer rounded-md border border-[#F87171] bg-[#FEE2E2] px-3 py-2 text-[0.8rem] font-semibold text-[#C04141] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#EF4444] hover:text-white hover:shadow-[0_3px_6px_rgba(239,68,68,0.25)]"
                            onClick={() => handleEliminar(dependiente.ID_dependientes)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 z-[100] w-full border-t border-[#82F182] bg-white p-3 text-center text-xs text-[#9AA19A]">
          <p>&copy; 2026 Mi Aplicación de Finanzas</p>
        </footer>

        {mostrarModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4">
            <div className="w-full max-w-[460px] rounded-xl bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
              <h2 className="mb-5 text-2xl font-bold text-[#2E7D2E]">
                {editandoId ? 'Editar Dependiente' : 'Agregar Dependiente'}
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label htmlFor="Nombre" className={labelClass}>Nombre</label>
                  <input
                    className={inputClass}
                    type="text"
                    id="Nombre"
                    name="Nombre"
                    value={formDatos.Nombre}
                    onChange={handleChange}
                    required
                    placeholder="Nombre del dependiente"
                  />
                </div>

                <div>
                  <label htmlFor="Relacion" className={labelClass}>Relación</label>
                  <select
                    className={inputClass}
                    id="Relacion"
                    name="Relacion"
                    value={formDatos.Relacion}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona una relación</option>
                    <option value="Hijo">Hijo</option>
                    <option value="Hija">Hija</option>
                    <option value="Hermano">Hermano</option>
                    <option value="Hermana">Hermana</option>
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Abuelo">Abuelo</option>
                    <option value="Abuela">Abuela</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="Ocupacion" className={labelClass}>Ocupación</label>
                  <input
                    className={inputClass}
                    type="text"
                    id="Ocupacion"
                    name="Ocupacion"
                    value={formDatos.Ocupacion}
                    onChange={handleChange}
                    placeholder="Ocupación del dependiente"
                  />
                </div>

                <div>
                  <label htmlFor="Fecha_nacimiento" className={labelClass}>Fecha de Nacimiento</label>
                  <input
                    className={inputClass}
                    type="date"
                    id="Fecha_nacimiento"
                    name="Fecha_nacimiento"
                    value={formDatos.Fecha_nacimiento}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="Peso_economico" className={labelClass}>Peso Económico</label>
                  <select
                    className={inputClass}
                    id="Peso_economico"
                    name="Peso_economico"
                    value={formDatos.Peso_economico}
                    onChange={handleChange}
                  >
                    <option value="1">1 - Muy bajo</option>
                    <option value="2">2 - Bajo</option>
                    <option value="3">3 - Medio</option>
                    <option value="4">4 - Alto</option>
                    <option value="5">5 - Muy alto</option>
                  </select>
                </div>

                <div className="mt-3 flex gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 cursor-pointer rounded-lg bg-[#3DA63D] px-5 py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2E7D2E]"
                  >
                    Guardar
                  </button>

                  <button
                    type="button"
                    className="flex-1 cursor-pointer rounded-lg border border-[#D4DCE9] bg-white px-5 py-2.5 font-semibold text-[#4A5568] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8FFE8]"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dependientes

const infoClass = 'm-0 text-[0.85rem] font-medium leading-[1.3] text-[#2D2D2D]'
const strongClass = 'font-semibold text-[#2E7D2E]'
const labelClass = 'mb-1.5 block text-sm font-semibold text-[#1A1A1A]'
const inputClass =
  'w-full rounded-lg border border-[#D4DCE9] px-3 py-2.5 text-sm outline-none transition focus:border-[#4CB04C] focus:ring-2 focus:ring-[#4CB04C]/20'
