import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCategorias, getDependientes } from '../api'
import HeaderModulos from './HeaderModulos'

const API = 'http://localhost:3000/api/movimientos'


const usuario = JSON.parse(localStorage.getItem('usuario'))

const Imprevistos = () => {
  const navigate = useNavigate()

  const [imprevistos,  setImprevistos]  = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [modalEditar,  setModalEditar]  = useState(null)
  const [confirmarId,  setConfirmarId]  = useState(null)
  const [guardando,    setGuardando]    = useState(false)
  const [eliminando,   setEliminando]   = useState(false)
  const [errorModal,   setErrorModal]   = useState(null)
  const [categorias,   setCategorias]   = useState([])
  const [dependientes, setDependientes] = useState([])

  const cargarImprevistos = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/imprevistos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setImprevistos(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getCategorias().then(d => { if (Array.isArray(d)) setCategorias(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    getDependientes().then(d => { if (Array.isArray(d)) setDependientes(d) }).catch(() => {})
  }, [])

  useEffect(() => { cargarImprevistos() }, [])

  const total = imprevistos.reduce((acc, i) => acc + Number(i.monto), 0)

  const abrirEditar = (i) => {
    setErrorModal(null)
    setModalEditar({
      id: i.id,
      monto: String(i.monto),
      causa: i.causa || '',
      fecha_registro: i.fecha ? i.fecha.slice(0, 10) : '',
      id_categoria: i.ID_categoria || '',
      id_dependientes: i.ID_dependientes || '',
    })
  }

  const handleEditarChange = (e) =>
    setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const guardarEdicion = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) {
      setErrorModal('El monto debe ser un número mayor a 0')
      return
    }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/imprevistos/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto: Number(modalEditar.monto),
          causa: modalEditar.causa || null,
          fecha_registro: modalEditar.fecha_registro || null,
          id_categoria: modalEditar.id_categoria || null,
          id_dependientes: modalEditar.id_dependientes || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarImprevistos() }
      else setErrorModal(data.mensaje || 'Error al guardar')
    } catch {
      setErrorModal('Error al conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/imprevistos/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarImprevistos() }
    } catch {}
    finally { setEliminando(false) }
  }

  return (
    // ─── PÁGINA COMPLETA ────────────────────────────────────────────────────────
    // min-h-screen      → minHeight: '100vh'
    // w-full            → width: '100%'
    // flex flex-col     → display:flex + flexDirection:column
    // text-white        → color: white
    // overflow-x-hidden → overflowX: hidden
    // El degradado radial va inline: Tailwind no soporta radial-gradient nativamente
    <div
      className="min-h-screen w-full flex flex-col text-white overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }}
    >
      <HeaderModulos section="imprevistos" />


      <hr
        className="my-1 border-none h-px"
        style={{ background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }}
      />

      
      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto p-8 gap-6">

        {/* Saludo */}
        <div>

          <p className="text-sm text-zinc-400">Bienvenido de vuelta</p>
          <h2 className="text-2xl font-extrabold text-white">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        <article
          className="p-6 px-8 rounded-2xl border border-white/10 flex items-center justify-between"
          style={{ background: 'radial-gradient(ellipse at left, rgba(251,146,60,0.35), rgba(234,88,12,0.04))' }}
        >
          <div>

            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">
              🛡️ Total Imprevistos
            </p>
            {/* text-4xl   → fontSize: 2.25rem
                font-black → fontWeight: 900 */}
            <p className="text-4xl font-black text-white">
              ${total.toLocaleString('es-CO')}
            </p>
          </div>


          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300 text-white"
            style={{ background: 'linear-gradient(135deg, #fb923c, #ea580c)' }}
          >
            ➕ Registrar Imprevisto
          </button>
        </article>


        <section className="w-full rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden">

          <div className="px-7 py-5 border-b border-white/[0.08] flex items-center justify-between">
            <h3 className="text-base font-extrabold text-amber-400">📋 Fondo de Imprevistos</h3>
            {/* text-xs text-zinc-600 → pequeño y muy grisáceo */}
            <span className="text-xs text-zinc-600">
              {imprevistos.length} registro{imprevistos.length !== 1 ? 's' : ''}
            </span>
          </div>


          <div className="overflow-x-auto px-2 pb-4">
            {cargando ? (
              <p className="text-zinc-500 italic p-6 text-sm">⏳ Cargando...</p>
            ) : imprevistos.length === 0 ? (
              <p className="text-zinc-500 italic p-6 text-sm">
                Tu fondo de imprevistos está vacío. Es recomendable ahorrar al menos 3 meses de gastos.
              </p>
            ) : (

              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    {['Fecha', 'Causa', 'Categoría', 'Dependiente', 'Monto', 'Acciones'].map(col => (

                      <th key={col} className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-[0.07em]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {imprevistos.map(i => (

                    <tr
                      key={i.id}
                      className="border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                    >
                      {/* text-sm text-zinc-300 → texto legible, gris claro */}
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {i.fecha ? new Date(i.fecha).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{i.causa || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{i.categoria || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{i.dependiente || '—'}</td>
                      {/* Monto en naranja — text-orange-400 → color #fb923c del original */}
                      <td className="px-4 py-3 text-sm font-extrabold text-orange-400">
                        ${Number(i.monto).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3">

                        <div className="flex gap-2">
          
                          <button
                            onClick={() => abrirEditar(i)}
                            className="px-3.5 py-1 rounded-lg text-xs font-bold border border-orange-400/50 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20 transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          {/* BOTÓN ELIMINAR — siempre rojo en todos los módulos */}
                          <button
                            onClick={() => setConfirmarId(i.id)}
                            className="px-3.5 py-1 rounded-lg text-xs font-bold border border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full p-6 text-center text-zinc-700 text-[0.7rem] font-mono">
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">

          <div
            className="w-full max-w-[460px] rounded-[20px] p-7 border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.92)' }}
          >
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">✏️ Editar Imprevisto</h4>
            <p className="text-xs text-zinc-500 mb-2">Modifica los campos que necesites y guarda.</p>

            {/* ── CAMPOS DEL FORMULARIO ──────────────────────────────────────────
                Cada <label> comparte:
                  block                              → display: block
                  text-[0.72rem] font-bold           → tamaño y peso exactos
                  uppercase tracking-[0.06em]        → mayúsculas espaciadas
                  text-zinc-400                      → color gris claro (#a1a1aa aprox)
                  mt-3.5                             → marginTop: 14px

                Cada <input> / <select> comparte:
                  w-full                             → ancho total
                  px-3.5 py-2.5                      → padding horizontal 14px, vertical 9px
                  rounded-[10px]                     → borderRadius exacto
                  border border-white/[0.15]         → borde sutil
                  bg-white/[0.07]                    → fondo semitransparente
                  text-zinc-100 text-sm              → color claro y tamaño legible
                  outline-none                       → sin anillo de foco azul
                  mt-1.5                             → pequeño espacio bajo el label
            */}

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Monto *
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="number" name="monto" min="0" step="0.01"
              value={modalEditar.monto} onChange={handleEditarChange}
            />

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Causa
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="text" name="causa" placeholder="Ej: Reparación, Emergencia médica..."
              value={modalEditar.causa} onChange={handleEditarChange}
            />

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Fecha
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="date" name="fecha_registro"
              value={modalEditar.fecha_registro} onChange={handleEditarChange}
            />

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Categoría
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              name="id_categoria" value={modalEditar.id_categoria || ''} onChange={handleEditarChange}
            >
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Dependiente
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              name="id_dependientes" value={modalEditar.id_dependientes || ''} onChange={handleEditarChange}
            >
              <option value="">Sin dependiente</option>
              {dependientes.map(d => (
                <option key={d.ID_dependientes} value={d.ID_dependientes}>{d.Nombre}</option>
              ))}
            </select>
            {errorModal && (
              <p className="mt-3 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">
                {errorModal}
              </p>
            )}

            {/* BOTONES DEL MODAL
                mt-6 flex justify-end gap-2.5 */}
            <div className="mt-6 flex justify-end gap-2.5">
              {/* CANCELAR */}
              <button
                onClick={() => setModalEditar(null)}
                className="px-5 py-2.5 rounded-[10px] text-sm font-bold cursor-pointer bg-transparent text-zinc-400 border border-white/[0.15] hover:bg-white/[0.07] transition-colors"
              >
                Cancelar
              </button>
              {/* GUARDAR
                  disabled:opacity-50 disabled:cursor-not-allowed → estilos de deshabilitado
                  text-white → contraste sobre el fondo naranja
                  Fondo naranja (normal) o atenuado (guardando) va inline */}
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="px-5 py-2.5 rounded-[10px] text-sm font-bold border-none text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
                style={{ background: guardando ? 'rgba(251,146,60,0.4)' : 'linear-gradient(135deg, #fb923c, #ea580c)' }}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL ELIMINAR
          Mismo overlay. Diferencias:
            - maxWidth: 380px
            - Borde rojo (border-red-400/25) en lugar de blanco
      */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
          <div
            className="w-full max-w-[380px] rounded-[20px] p-7 border border-red-400/25 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            style={{ background: 'rgba(15,23,42,0.92)' }}
          >
            <h4 className="text-lg font-extrabold text-red-400 mb-2">🗑️ ¿Eliminar imprevisto?</h4>
            <p className="text-sm text-zinc-400">Esta acción no se puede deshacer.</p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmarId(null)}
                className="px-5 py-2.5 rounded-[10px] text-sm font-bold cursor-pointer bg-transparent text-zinc-400 border border-white/[0.15] hover:bg-white/[0.07] transition-colors"
              >
                Cancelar
              </button>
              {/* Fondo rojo normal o atenuado según el estado de eliminando */}
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="px-5 py-2.5 rounded-[10px] text-sm font-bold border-none text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
                style={{ background: eliminando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)' }}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Imprevistos