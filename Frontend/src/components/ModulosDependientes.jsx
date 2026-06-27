import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import HeaderModulos from './HeaderModulos'
import { useToast } from './ToastContext'
import { useNotificaciones } from './NotificacionesContext'


let usuario = null
try {
  usuario = JSON.parse(localStorage.getItem('usuario'))
} catch {
  usuario = null
}

const PESO_LABELS = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' }

// Clases reutilizables para el modal
const inputModal = "w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/[0.07] text-[#f4f4f5] text-sm outline-none mt-1.5"
const labelModal = "block text-[0.72rem] font-bold text-[#a1a1aa] uppercase tracking-widest mt-3.5"

const Dependientes = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token    = localStorage.getItem('token')
  const { mostrarToast } = useToast()
  const { revisarAhora } = useNotificaciones()

  const [dependientes, setDependientes] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editandoId,   setEditandoId]   = useState(null)
  const [formDatos,    setFormDatos]    = useState({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' })

  useEffect(() => {
    fetch('/api/dependientes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDependientes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando dependientes:', err))
  }, [])

  const handleChange = e => setFormDatos(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = { ...formDatos, Peso_economico: parseInt(formDatos.Peso_economico), Fecha_nacimiento: formDatos.Fecha_nacimiento || null }
    if (editandoId) {
      const res = await fetch(`/api/dependientes/${editandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      if (res.ok) {
        mostrarToast('Dependiente actualizado correctamente')
        setDependientes(dependientes.map(d => d.ID_dependientes === editandoId ? { ...payload, ID_dependientes: editandoId } : d))
      }
      else { const data = await res.json(); alert(data.error || 'Error al actualizar') }
    } else {
      const res = await fetch('/api/dependientes', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) {
        mostrarToast('Dependiente registrado correctamente')
        setDependientes([...dependientes, { ...payload, ID_dependientes: data.id }])
      }
      else alert(data.error || 'Error al guardar')
    }
    cerrarModal()
  }

  const handleEditar = d => {
    setFormDatos({ Nombre: d.Nombre, Relacion: d.Relacion, Ocupacion: d.Ocupacion || '', Fecha_nacimiento: d.Fecha_nacimiento ? d.Fecha_nacimiento.split('T')[0] : '', Peso_economico: String(d.Peso_economico ?? '3') })
    setEditandoId(d.ID_dependientes)
    setMostrarModal(true)
  }

  const handleEliminar = async id => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este dependiente?')) return
    const res = await fetch(`/api/dependientes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      mostrarToast('Dependiente eliminado correctamente')
      setDependientes(dependientes.filter(d => d.ID_dependientes !== id))
    }
    else alert('Error al eliminar el dependiente')
  }

  const abrirModal  = () => { setFormDatos({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' }); setEditandoId(null); setMostrarModal(true) }
  const cerrarModal = () => { setMostrarModal(false); setEditandoId(null); setFormDatos({ Nombre: '', Relacion: '', Ocupacion: '', Fecha_nacimiento: '', Peso_economico: '3' }) }

  const pesoColor = p => { if (p <= 1) return '#34d399'; if (p <= 2) return '#60a5fa'; if (p <= 3) return '#fbbf24'; if (p <= 4) return '#fb923c'; return '#f87171' }

  return (
    <div className="min-h-screen w-full flex flex-col text-white overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }}>

      {/* HEADER */}
      <HeaderModulos section="dependientes" />

      <hr className="my-1 border-none h-px"
        style={{ background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      {/* MAIN */}
      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto px-8 py-8 gap-6">

        {/* Bienvenida */}
        <div>
          <p className="text-[#a1a1aa] text-sm">Bienvenido de vuelta</p>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white">{usuario?.nombre || 'Usuario'} <span>👋</span></h2>
        </div>

        {/* Stat + botón */}
        <article className="flex items-center justify-between px-8 py-6 rounded-2xl border border-white/10"
          style={{ background: 'radial-gradient(ellipse at left, rgba(99,102,241,0.35), rgba(79,70,229,0.04))' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#818cf8] mb-1">
              👩‍👧‍👦 Total Dependientes
            </p>
            <p className="text-4xl font-black text-white">{dependientes.length}</p>
          </div>
          <button
            onClick={abrirModal}
            className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none text-white hover:-translate-y-px transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
            ➕ Agregar Dependiente
          </button>
        </article>

        {/* Cards */}
        <section className="w-full rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-extrabold text-[#fbbf24]">📋 Módulo de Dependientes</h3>
          </div>

          {dependientes.length === 0 ? (
            <p className="text-zinc-500 italic text-sm">
              No hay dependientes registrados. Agrega tu primer dependiente para comenzar.
            </p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {dependientes.map(dep => (
                <div key={dep.ID_dependientes}
                  className="rounded-2xl p-[18px] border border-white/[0.09] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>

                  <div className="flex flex-col gap-1.5 mb-3.5">
                    <p className="text-base font-extrabold text-[#f4f4f5]">{dep.Nombre}</p>
                    <p className="text-xs text-[#a1a1aa]">
                      {dep.Relacion}{dep.Ocupacion ? ` · ${dep.Ocupacion}` : ''}
                    </p>
                    {dep.Fecha_nacimiento && (
                      <p className="text-[0.72rem] text-zinc-500">
                        Nac: {dep.Fecha_nacimiento.split('T')[0]}
                      </p>
                    )}
                    <span
                      className="inline-block mt-1 px-2.5 py-1 rounded-full text-[0.7rem] font-bold"
                      style={{
                        background: `${pesoColor(dep.Peso_economico)}22`,
                        color: pesoColor(dep.Peso_economico),
                        border: `1px solid ${pesoColor(dep.Peso_economico)}44`,
                      }}>
                      Peso económico: {PESO_LABELS[dep.Peso_economico] ?? 'N/A'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar(dep)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-indigo-400/50 bg-indigo-400/10 text-[#818cf8] hover:bg-indigo-400/[0.22] transition-colors duration-150">
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(dep.ID_dependientes)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-red-400/50 bg-red-400/10 text-[#f87171] hover:bg-red-400/[0.22] transition-colors duration-150">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-6 text-center text-zinc-700 text-[0.7rem] font-mono">
        <p>© <strong className="text-[#fbbf24]">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-[460px] rounded-[20px] p-7 border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.92)' }}>

            <h4 className="text-lg font-extrabold text-[#fbbf24] mb-4">
              {editandoId ? '✏️ Editar Dependiente' : '➕ Agregar Dependiente'}
            </h4>

            <form onSubmit={handleSubmit} className="flex flex-col gap-1">

              <label className={labelModal}>Nombre *</label>
              <input className={inputModal} type="text" name="Nombre" value={formDatos.Nombre} onChange={handleChange} required placeholder="Nombre del dependiente" />

              <label className={labelModal}>Relación *</label>
              <select className={inputModal} name="Relacion" value={formDatos.Relacion} onChange={handleChange} required>
                <option value="">Selecciona una relación</option>
                {['Hijo','Hija','Hermano','Hermana','Padre','Madre','Abuelo','Abuela','Otro'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <label className={labelModal}>Ocupación</label>
              <input className={inputModal} type="text" name="Ocupacion" value={formDatos.Ocupacion} onChange={handleChange} placeholder="Ocupación del dependiente" />

              <label className={labelModal}>Fecha de Nacimiento *</label>
              <input className={inputModal} type="date" name="Fecha_nacimiento" value={formDatos.Fecha_nacimiento} onChange={handleChange} required />

              <label className={labelModal}>Peso Económico</label>
              <select className={inputModal} name="Peso_economico" value={formDatos.Peso_economico} onChange={handleChange}>
                <option value="1">1 - Muy bajo</option>
                <option value="2">2 - Bajo</option>
                <option value="3">3 - Medio</option>
                <option value="4">4 - Alto</option>
                <option value="5">5 - Muy alto</option>
              </select>

              <div className="mt-6 flex gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer border-none text-white"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-transparent text-[#a1a1aa] border border-white/15 hover:bg-white/[0.07] transition-colors duration-150">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dependientes