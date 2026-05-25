import { useState, useEffect } from 'react'
import HeaderModulos from './HeaderModulos'

const API = 'http://localhost:3000/api/movimientos'

const usuario = JSON.parse(localStorage.getItem('usuario'))

const Ahorros = () => {
  const [ahorros,     setAhorros]     = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [errorModal,  setErrorModal]  = useState(null)

  const cargarAhorros = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/ahorros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAhorros(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarAhorros() }, [])

  const total = ahorros.reduce((acc, a) => acc + Number(a.monto), 0)

  const abrirEditar = (a) => {
    setErrorModal(null)
    setModalEditar({
      id: a.id,
      monto: String(a.monto),
      monto_acumulado: String(a.monto_acumulado ?? 0),
      meta: a.meta || '',
      descripcion: a.descripcion || '',
      fecha_registro: a.fecha ? a.fecha.slice(0, 10) : '',
      fecha_meta: a.fecha_meta ? a.fecha_meta.slice(0, 10) : '',
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
    if (modalEditar.fecha_meta && modalEditar.fecha_registro && modalEditar.fecha_meta < modalEditar.fecha_registro) {
      setErrorModal('La fecha meta no puede ser anterior a la fecha de registro')
      return
    }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/ahorros/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto: Number(modalEditar.monto),
          monto_acumulado: Number(modalEditar.monto_acumulado) || 0,
          meta: modalEditar.meta || null,
          descripcion: modalEditar.descripcion || null,
          fecha_registro: modalEditar.fecha_registro || null,
          fecha_meta: modalEditar.fecha_meta || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarAhorros() }
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
      const res = await fetch(`${API}/ahorros/${confirmarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarAhorros() }
    } catch {}
    finally { setEliminando(false) }
  }

  return (
    // ─── PÁGINA COMPLETA ────────────────────────────────────────────────────────
    // min-h-screen     → minHeight: '100vh'
    // w-full           → width: '100%'
    // flex flex-col    → display:flex + flexDirection:column
    // text-white       → color: white
    // overflow-x-hidden → overflowX: hidden
    // El degradado radial va en style inline porque Tailwind no lo soporta nativamente
    <div
      className="min-h-screen w-full flex flex-col text-white overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }}
    >

      {/* HEADER — componente externo, sin cambios */}
      <HeaderModulos section="Ahorros" />

      {/* SEPARADOR decorativo
          my-1   → margin top y bottom: 4px
          border-none → elimina el borde por defecto del <hr>
          h-px   → height: 1px
          El degradado lineal va inline */}
      <hr
        className="my-1 border-none h-px"
        style={{ background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }}
      />

      {/* ─── MAIN ───────────────────────────────────────────────────────────────
          flex-1           → flex: 1 (ocupa todo el espacio vertical libre)
          flex flex-col    → columna
          w-full           → ancho completo
          max-w-[1400px]   → maxWidth 1400px con valor arbitrario entre corchetes
          mx-auto          → margen horizontal automático (centra el contenido)
          p-8              → padding: 32px  (8 × 4px en la escala de Tailwind)
          gap-6            → gap: 24px entre hijos directos del flex
      */}
      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto p-8 gap-6">

        {/* Saludo */}
        <div>
          {/* text-sm      → fontSize: 0.875rem
              text-zinc-400 → color grisáceo medio */}
          <p className="text-sm text-zinc-400">Bienvenido de vuelta</p>
          {/* text-2xl       → fontSize: 1.5rem  (el original era 1.4rem, el más cercano es 2xl)
              font-extrabold → fontWeight: 800 */}
          <h2 className="text-2xl font-extrabold text-white">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* ─── TARJETA ESTADÍSTICA ──────────────────────────────────────────────
            p-6 px-8          → padding vertical 24px, horizontal 32px
            rounded-2xl       → borderRadius: 16px
            border border-white/10 → borde blanco al 10% de opacidad
            flex items-center justify-between → fila, centrado vertical, extremos
            El fondo radial con colores amber/orange va inline */}
        <article
          className="p-6 px-8 rounded-2xl border border-white/10 flex items-center justify-between"
          style={{ background: 'radial-gradient(ellipse at left, rgba(245,158,11,0.35), rgba(249,115,22,0.04))' }}
        >
          <div>
            {/* text-xs          → fontSize: 0.75rem
                font-bold        → fontWeight: 700
                uppercase        → textTransform: uppercase
                tracking-widest  → letterSpacing muy amplio (aprox 0.08em)
                text-amber-400   → color #fbbf24
                mb-1             → marginBottom: 4px */}
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              🎯 Total Ahorros
            </p>
            {/* text-4xl   → fontSize: 2.25rem (más cercano al 2rem original)
                font-black → fontWeight: 900 */}
            <p className="text-4xl font-black text-white">
              ${total.toLocaleString('es-CO')}
            </p>
          </div>

          {/* BOTÓN "Nueva Meta"
              px-5 py-2.5         → padding horizontal 20px, vertical 10px
              rounded-xl          → borderRadius: 12px
              font-bold text-sm   → 700 y 0.875rem
              cursor-pointer border-none
              hover:-translate-y-px → se eleva 1px en hover
              transition-all duration-300
              text-[#0f172a]      → color oscuro para contraste sobre el fondo amarillo
              El degradado lineal va inline */}
          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300 text-[#0f172a]"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            ➕ Nueva Meta
          </button>
        </article>

        {/* ─── SECCIÓN TABLA ────────────────────────────────────────────────────
            rounded-2xl          → borderRadius: 16px
            bg-white/[0.04]      → fondo blanco al 4% de opacidad
            backdrop-blur-2xl    → desenfoque de fondo intenso (≈ blur(16px))
            border border-white/10
            shadow-[0_8px_32px_rgba(0,0,0,0.35)] → sombra personalizada con corchetes
            overflow-hidden      → recorta las esquinas redondeadas del contenido interior
        */}
        <section className="w-full rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden">

          {/* Encabezado de la sección
              px-7 py-5                   → padding horizontal 28px, vertical 20px
              border-b border-white/[0.08] → línea inferior muy sutil
              flex items-center justify-between */}
          <div className="px-7 py-5 border-b border-white/[0.08] flex items-center justify-between">
            <h3 className="text-base font-extrabold text-amber-400">📋 Módulo de Ahorros</h3>
            {/* text-xs text-zinc-600 → texto muy pequeño y muy gris */}
            <span className="text-xs text-zinc-600">
              {ahorros.length} registro{ahorros.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Área de la tabla con scroll horizontal en pantallas pequeñas
              overflow-x-auto → habilita scroll horizontal si la tabla no cabe
              px-2 pb-4       → pequeño padding interior */}
          <div className="overflow-x-auto px-2 pb-4">
            {cargando ? (
              <p className="text-zinc-500 italic p-6 text-sm">⏳ Cargando...</p>
            ) : ahorros.length === 0 ? (
              <p className="text-zinc-500 italic p-6 text-sm">
                No hay metas de ahorro creadas. Crea tu primera meta para comenzar a ahorrar.
              </p>
            ) : (
              /* border-collapse → colapsa bordes de celdas adyacentes en uno solo
                 text-left       → alineación de texto izquierda por defecto en toda la tabla */
              <table className="w-full border-collapse text-left">
                <thead>
                  {/* border-b border-white/[0.08] → línea debajo de los encabezados */}
                  <tr className="border-b border-white/[0.08]">
                    {['Fecha', 'Meta', 'Descripción', 'Fecha meta', 'Monto', 'Acumulado', 'Acciones'].map(col => (
                      /* px-4 py-3              → padding de celda
                         text-xs font-bold       → pequeño y en negrita
                         text-zinc-500           → gris medio
                         uppercase tracking-[0.07em] → mayúsculas con espaciado entre letras */
                      <th key={col} className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-[0.07em]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ahorros.map(a => (
                    /* border-b border-white/[0.05]  → línea entre filas muy sutil
                       hover:bg-white/[0.04]          → fondo tenue al pasar el cursor
                       transition-colors              → transición suave del color de fondo */
                    <tr
                      key={a.id}
                      className="border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                    >
                      {/* text-sm text-zinc-300 → texto legible, gris claro */}
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{a.meta || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{a.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {a.fecha_meta ? new Date(a.fecha_meta).toLocaleDateString('es-CO') : '—'}
                      </td>
                      {/* Monto en amarillo/amber — resalta el valor principal de ahorro */}
                      <td className="px-4 py-3 text-sm font-extrabold text-amber-400">
                        ${Number(a.monto).toLocaleString('es-CO')}
                      </td>
                      {/* Acumulado en violeta — text-violet-400 → color #a78bfa */}
                      <td className="px-4 py-3 text-sm font-extrabold text-violet-400">
                        ${Number(a.monto_acumulado).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        {/* flex gap-2 → botones en fila con 8px de espacio */}
                        <div className="flex gap-2">
                          {/* BOTÓN EDITAR
                              px-3.5 py-1         → padding cómodo para el botón pequeño
                              rounded-lg          → borderRadius: 8px
                              text-xs font-bold
                              border border-amber-400/50  → borde amarillo al 50% opacidad
                              bg-amber-400/10             → fondo amarillo al 10%
                              text-amber-400
                              hover:bg-amber-400/20       → más intenso en hover
                              transition-colors cursor-pointer */}
                          <button
                            onClick={() => abrirEditar(a)}
                            className="px-3.5 py-1 rounded-lg text-xs font-bold border border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          {/* BOTÓN ELIMINAR — mismo patrón pero en rojo */}
                          <button
                            onClick={() => setConfirmarId(a.id)}
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

      {/* FOOTER
          w-full p-6 text-center → ancho completo, relleno, texto centrado
          text-zinc-700          → gris muy oscuro (casi invisible, sutil)
          text-[0.7rem]          → tamaño arbitrario exacto del original
          font-mono              → fontFamily: monospace */}
      <footer className="w-full p-6 text-center text-zinc-700 text-[0.7rem] font-mono">
        <p>© <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL EDITAR
          ════════════════════════════════════════════════════════════════════════
          fixed inset-0           → position:fixed, cubre toda la pantalla
          z-[1000]                → zIndex: 1000, encima de todo
          flex items-center justify-center → centra el cuadro del modal
          bg-black/65             → fondo negro al 65% de opacidad
          backdrop-blur-md        → desenfoque del fondo (≈ blur(6px))
          p-4                     → padding de seguridad en pantallas pequeñas
      */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
          {/* CUADRO DEL MODAL
              w-full max-w-[460px]  → responsivo, máximo 460px
              rounded-[20px]        → borderRadius: 20px exacto
              p-7                   → padding: 28px
              border border-white/[0.12]
              shadow-[0_24px_60px_rgba(0,0,0,0.6)] → sombra profunda y difusa
              max-h-[90vh] overflow-y-auto → scroll interno si el contenido es muy largo
              Fondo inline porque rgba(15,23,42,0.92) no tiene equivalente en Tailwind */}
          <div
            className="w-full max-w-[460px] rounded-[20px] p-7 border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.92)' }}
          >
            <h4 className="text-lg font-extrabold text-amber-400 mb-1">✏️ Editar Ahorro</h4>
            <p className="text-xs text-zinc-500 mb-2">Modifica los campos que necesites y guarda.</p>

            {/* ── CAMPOS DEL FORMULARIO ──────────────────────────────────────────
                Cada <label> comparte estas clases:
                  block                              → display: block (su propia línea)
                  text-[0.72rem] font-bold           → tamaño y peso exactos del original
                  uppercase tracking-[0.06em]        → mayúsculas con espaciado
                  text-zinc-400                      → color gris-claro (#a1a1aa aprox)
                  mt-3.5                             → marginTop: 14px

                Cada <input> comparte estas clases:
                  w-full                             → ancho completo
                  px-3.5 py-2.5                      → padding horizontal 14px, vertical 9px
                  rounded-[10px]                     → borderRadius exacto
                  border border-white/[0.15]         → borde sutil
                  bg-white/[0.07]                    → fondo semitransparente
                  text-zinc-100 text-sm              → color claro y tamaño legible
                  outline-none                       → sin anillo de foco azul por defecto
                  mt-1.5                             → pequeño espacio entre label e input
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
              Monto acumulado
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="number" name="monto_acumulado" min="0" step="0.01"
              value={modalEditar.monto_acumulado} onChange={handleEditarChange}
            />

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Meta u objetivo
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="text" name="meta" placeholder="Ej: Vacaciones, Fondo de emergencia..."
              value={modalEditar.meta} onChange={handleEditarChange}
            />

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Descripción
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="text" name="descripcion" placeholder="Descripción opcional"
              value={modalEditar.descripcion} onChange={handleEditarChange}
            />

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Fecha de registro
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="date" name="fecha_registro"
              value={modalEditar.fecha_registro} onChange={handleEditarChange}
            />

            <label className="block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-zinc-400 mt-3.5">
              Fecha meta
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.15] bg-white/[0.07] text-zinc-100 text-sm outline-none mt-1.5"
              type="date" name="fecha_meta"
              value={modalEditar.fecha_meta} onChange={handleEditarChange}
            />

            {/* MENSAJE DE ERROR
                mt-3                       → marginTop: 12px
                p-[10px_14px]              → padding vertical 10px, horizontal 14px (valor arbitrario)
                rounded-[10px]
                bg-red-400/[0.12]          → fondo rojo muy transparente
                border border-red-400/35   → borde rojo al 35% opacidad
                text-red-400 text-[0.8rem] font-semibold */}
            {errorModal && (
              <p className="mt-3 p-[10px_14px] rounded-[10px] bg-red-400/[0.12] border border-red-400/35 text-red-400 text-[0.8rem] font-semibold">
                {errorModal}
              </p>
            )}

            {/* BOTONES DEL MODAL
                mt-6 flex justify-end gap-2.5 → margen top, fila alineada a la derecha */}
            <div className="mt-6 flex justify-end gap-2.5">
              {/* CANCELAR
                  bg-transparent text-zinc-400
                  border border-white/[0.15]
                  hover:bg-white/[0.07] transition-colors */}
              <button
                onClick={() => setModalEditar(null)}
                className="px-5 py-2.5 rounded-[10px] text-sm font-bold cursor-pointer bg-transparent text-zinc-400 border border-white/[0.15] hover:bg-white/[0.07] transition-colors"
              >
                Cancelar
              </button>
              {/* GUARDAR
                  disabled:opacity-50 disabled:cursor-not-allowed → estilos cuando está bloqueado
                  text-[#0f172a] → color oscuro para contraste con el fondo amarillo
                  El degradado o color atenuado van inline según el estado de guardando */}
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="px-5 py-2.5 rounded-[10px] text-sm font-bold border-none text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
                style={{ background: guardando ? 'rgba(251,191,36,0.4)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL ELIMINAR
          Mismo overlay que el de editar. Solo cambia:
            - maxWidth a 380px
            - Color del borde: rojo en lugar de blanco
      */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
          <div
            className="w-full max-w-[380px] rounded-[20px] p-7 border border-red-400/25 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            style={{ background: 'rgba(15,23,42,0.92)' }}
          >
            <h4 className="text-lg font-extrabold text-red-400 mb-2">🗑️ ¿Eliminar ahorro?</h4>
            <p className="text-sm text-zinc-400">Esta acción no se puede deshacer.</p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmarId(null)}
                className="px-5 py-2.5 rounded-[10px] text-sm font-bold cursor-pointer bg-transparent text-zinc-400 border border-white/[0.15] hover:bg-white/[0.07] transition-colors"
              >
                Cancelar
              </button>
              {/* El fondo cambia condicionalmente según el estado de eliminando */}
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

export default Ahorros