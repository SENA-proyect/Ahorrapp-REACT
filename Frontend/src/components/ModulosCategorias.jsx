import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getCategorias,
  crearCategoria,
  editarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
} from '../api'

export default function ModuloCategorias() {
  const [categorias, setCategorias] = useState([])
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [categoriaEdit, setCategoriaEdit] = useState(null)
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')

  useEffect(() => {
    getCategorias()
      .then(data => {
        if (Array.isArray(data)) setCategorias(data)
      })
      .catch(() => {})
  }, [])

  const handleAgregar = async () => {
    if (!formNombre.trim()) return alert('El nombre es obligatorio')

    const respuesta = await crearCategoria({
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
    })

    if (respuesta.ok) {
      setCategorias(prev => [
        ...prev,
        {
          id: respuesta.id,
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim(),
          activa: true,
          sistema: false,
          es_global: false,
        },
      ])
      setFormNombre('')
      setFormDescripcion('')
      setModalAgregar(false)
    } else {
      alert(respuesta.mensaje || 'Error al crear la categoría')
    }
  }

  const abrirEditar = cat => {
    setCategoriaEdit({ ...cat })
    setModalEditar(true)
  }

  const handleGuardarEdicion = async () => {
    if (!categoriaEdit.nombre.trim()) return alert('El nombre es obligatorio')

    const respuesta = await editarCategoria(categoriaEdit.id, {
      nombre: categoriaEdit.nombre,
      descripcion: categoriaEdit.descripcion,
    })

    if (respuesta.ok) {
      setCategorias(prev =>
        prev.map(c => (c.id === categoriaEdit.id ? { ...c, ...categoriaEdit } : c))
      )
      setModalEditar(false)
    } else {
      alert(respuesta.mensaje || 'Error al editar la categoría')
    }
  }

  const handleDeshabilitar = async id => {
    if (!window.confirm('¿Seguro que deseas deshabilitar esta categoría?')) return

    const respuesta = await deshabilitarCategoria(id)

    if (respuesta.ok) {
      setCategorias(prev => prev.map(c => (c.id === id ? { ...c, activa: false } : c)))
    } else {
      alert(respuesta.mensaje || 'Error al deshabilitar la categoría')
    }
  }

  const handleHabilitar = async id => {
    const respuesta = await habilitarCategoria(id)

    if (respuesta.ok) {
      setCategorias(prev => prev.map(c => (c.id === id ? { ...c, activa: true } : c)))
    } else {
      alert(respuesta.mensaje || 'Error al habilitar la categoría')
    }
  }

  const activas = categorias.filter(c => c.activa)
  const inactivas = categorias.filter(c => !c.activa)

  const navLinks = [
    { to: '/Dashboard', label: 'Dashboard' },
    { to: '/ModulosIngresos', label: 'Ingresos' },
    { to: '/ModulosGastos', label: 'Gastos' },
    { to: '/ModuloAhorros', label: 'Ahorros' },
    { to: '/ModuloImprevistos', label: 'Imprevistos' },
    { to: '/ModuloDeudas', label: 'Deudas' },
    { to: '/ModulosDependientes', label: 'Dependientes' },
    { to: '/ModulosCategorias', label: 'Categorias', active: true },
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
            Cerrar Sesion
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
              <h3 className="text-xl font-semibold text-[#2D2D2D]">
                Módulo de categorías
              </h3>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="cursor-pointer rounded-[10px] bg-[#3DA63D] px-5 py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D]"
                  onClick={() => setModalAgregar(true)}
                >
                  + Agregar categoría
                </button>
              </div>
            </header>

            <div className="my-5 flex min-h-[150px] w-full flex-col justify-center rounded-[15px] border-2 border-[#4CB04C]/20 bg-white p-[30px] text-center">
              <p className="mb-2.5 text-2xl text-[#2D2D2D]">
                Total categorías activas: <strong>{activas.length}</strong>
              </p>

              <div className="mt-5 overflow-x-auto">
                {activas.length === 0 ? (
                  <p className="italic text-[#9AA19A]">No hay categorías activas.</p>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-[#D4DCE9]">
                        <th className={thClass}>Nombre</th>
                        <th className={thClass}>Descripción</th>
                        <th className={thClass}>Tipo</th>
                        <th className={thClass}>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {activas.map(cat => (
                        <tr key={cat.id} className="border-b border-[#D4DCE9]">
                          <td className={tdClass}>
                            <strong>{cat.nombre}</strong>
                          </td>
                          <td className={tdClass}>{cat.descripcion || '—'}</td>
                          <td className={tdClass}>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                cat.es_global
                                  ? 'bg-[#4CB04C]/10 text-[#2E7D2E]'
                                  : 'bg-[#E7F7F1] text-[#1F7A59]'
                              }`}
                            >
                              {cat.es_global ? 'Sistema' : 'Personalizada'}
                            </span>
                          </td>
                          <td className={tdClass}>
                            {!cat.es_global && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="cursor-pointer rounded-md bg-[#3DA63D] px-2.5 py-1 text-[0.8rem] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D]"
                                  onClick={() => abrirEditar(cat)}
                                >
                                  Editar
                                </button>

                                <button
                                  className="cursor-pointer rounded-md border border-[#FFCC80] bg-[#FFF3E0] px-2.5 py-1 text-[0.8rem] font-semibold text-[#E65100] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFE0B2]"
                                  onClick={() => handleDeshabilitar(cat.id)}
                                >
                                  Deshabilitar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {inactivas.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                  <p className="mb-2.5 text-left font-semibold text-[#4A5568]">
                    Categorías deshabilitadas ({inactivas.length})
                  </p>

                  <table className="w-full border-collapse text-left opacity-60">
                    <tbody>
                      {inactivas.map(cat => (
                        <tr key={cat.id} className="border-b border-[#D4DCE9]">
                          <td className={tdClass}>
                            <s>{cat.nombre}</s>
                          </td>
                          <td className={tdClass}>{cat.descripcion || '—'}</td>
                          <td className={tdClass}>
                            <button
                              className="cursor-pointer rounded-md bg-[#3DA63D] px-2.5 py-1 text-[0.8rem] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D]"
                              onClick={() => handleHabilitar(cat.id)}
                            >
                              Habilitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 z-[100] w-full border-t border-[#82F182] bg-white p-3 text-center text-xs text-[#9AA19A]">
          <p>&copy; 2026 Mi Aplicación de Finanzas</p>
        </footer>
      </div>

      {modalAgregar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[420px] rounded-xl bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
            <h3 className="mb-4 text-xl font-semibold text-[#2D2D2D]">Nueva categoría</h3>

            <label className={labelClass}>Nombre *</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Ej: Ropa, Mascotas..."
              value={formNombre}
              onChange={e => setFormNombre(e.target.value)}
            />

            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Descripción opcional"
              value={formDescripcion}
              onChange={e => setFormDescripcion(e.target.value)}
            />

            <div className="mt-5 flex gap-2.5">
              <button
                className="cursor-pointer rounded-[10px] bg-[#3DA63D] px-5 py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D]"
                onClick={handleAgregar}
              >
                Guardar
              </button>

              <button
                className="cursor-pointer rounded-lg border border-[#D4DCE9] bg-white px-[18px] py-2 font-semibold text-[#4A5568] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8FFE8]"
                onClick={() => {
                  setModalAgregar(false)
                  setFormNombre('')
                  setFormDescripcion('')
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEditar && categoriaEdit && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[420px] rounded-xl bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
            <h3 className="mb-4 text-xl font-semibold text-[#2D2D2D]">
              Editar categoría
            </h3>

            <label className={labelClass}>Nombre *</label>
            <input
              className={inputClass}
              type="text"
              value={categoriaEdit.nombre}
              onChange={e =>
                setCategoriaEdit(prev => ({ ...prev, nombre: e.target.value }))
              }
            />

            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              type="text"
              value={categoriaEdit.descripcion || ''}
              onChange={e =>
                setCategoriaEdit(prev => ({ ...prev, descripcion: e.target.value }))
              }
            />

            <div className="mt-5 flex gap-2.5">
              <button
                className="cursor-pointer rounded-[10px] bg-[#3DA63D] px-5 py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3DA63D]"
                onClick={handleGuardarEdicion}
              >
                Guardar cambios
              </button>

              <button
                className="cursor-pointer rounded-lg border border-[#D4DCE9] bg-white px-[18px] py-2 font-semibold text-[#4A5568] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8FFE8]"
                onClick={() => setModalEditar(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thClass = 'px-3 py-2.5 text-left text-[0.85rem] font-semibold text-[#4A5568]'
const tdClass = 'px-3 py-2.5 align-middle text-sm'
const labelClass = 'mb-1.5 mt-3.5 block text-sm font-semibold text-[#1A1A1A]'
const inputClass =
  'w-full rounded-lg border border-[#D4DCE9] px-3 py-2.5 text-sm outline-none transition focus:border-[#4CB04C] focus:ring-2 focus:ring-[#4CB04C]/20'
