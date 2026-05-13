import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getCategorias,
  crearCategoria,
  editarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
} from '../api'

// ─── Navegación ────────────────────────────────────────────────────────────────
// Array de objetos que define cada ítem del menú superior.
// Cada objeto tiene: href (ruta), emoji (ícono visual) y label (texto).
const navItems = [
  { href: '/Dashboard',           emoji: '📊', label: 'Dashboard' },
  { href: '/ModulosIngresos',     emoji: '💰', label: 'Ingresos' },
  { href: '/ModulosGastos',       emoji: '💸', label: 'Gastos' },
  { href: '/ModuloAhorros',       emoji: '🎯', label: 'Ahorrar' },
  { href: '/ModuloImprevistos',   emoji: '🛡️', label: 'Imprevistos' },
  { href: '/ModuloDeudas',        emoji: '💳', label: 'Deudas' },
  { href: '/ModulosDependientes', emoji: '👩‍👧‍👦', label: 'Dependientes' },
  { href: '/ModulosCategorias',   emoji: '🧩', label: 'Categorias' },
  { href: '/movimientos/nuevo',   emoji: '➕', label: 'Nuevo Movimiento' },
  { href: '/Noticias',            emoji: '📰', label: 'Noticias' },
]

// ─── Usuario en sesión ─────────────────────────────────────────────────────────
// Leemos el objeto "usuario" que fue guardado en localStorage al hacer login.
// JSON.parse convierte el texto guardado de vuelta a un objeto JavaScript.
const usuario = JSON.parse(localStorage.getItem('usuario'))

// ─── Estilos reutilizables (objetos de estilo inline) ──────────────────────────
// En React, los estilos inline se escriben como objetos JS, no como strings CSS.
// Por eso usamos camelCase: p.ej. "flexDirection" en vez de "flex-direction".

const bgPage = {
  minHeight: '100vh',          // ocupa al menos toda la altura de la pantalla
  width: '100%',
  display: 'flex',
  flexDirection: 'column',     // apila los hijos verticalmente
  color: 'white',
  overflowX: 'hidden',         // evita scroll horizontal
  background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)',
}

const modalOverlay = {
  position: 'fixed',           // se ancla a la pantalla, no al scroll
  inset: 0,                    // top/right/bottom/left = 0 → cubre toda la pantalla
  zIndex: 1000,                // queda encima de todo lo demás
  display: 'flex',
  alignItems: 'center',        // centra verticalmente el modal
  justifyContent: 'center',    // centra horizontalmente el modal
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(6px)', // desenfoca el fondo detrás del overlay
  padding: '16px',
}

const modalBox = {
  width: '100%',
  maxWidth: '420px',
  borderRadius: '20px',
  padding: '28px',
  background: 'rgba(15,23,42,0.92)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
}

const inputModal = {
  width: '100%',
  padding: '9px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.07)',
  color: '#f4f4f5',
  fontSize: '0.88rem',
  outline: 'none',
  marginTop: '6px',
}

const labelModal = {
  fontSize: '0.72rem',
  fontWeight: '700',
  color: '#a1a1aa',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginTop: '14px',
  display: 'block',
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function ModuloCategorias() {
  // useNavigate nos da una función para cambiar de ruta programáticamente.
  const navigate = useNavigate()
  // useLocation nos da info sobre la ruta actual (pathname, search, etc.).
  const location = useLocation()

  // ── Estado local ─────────────────────────────────────────────────────────────
  // useState(valorInicial) devuelve [valorActual, funcionParaCambiarlo].

  const [categorias,    setCategorias]    = useState([])     // lista de categorías del servidor
  const [modalAgregar,  setModalAgregar]  = useState(false)  // true = mostrar modal de agregar
  const [modalEditar,   setModalEditar]   = useState(false)  // true = mostrar modal de editar
  const [categoriaEdit, setCategoriaEdit] = useState(null)   // categoría seleccionada para editar
  const [formNombre,    setFormNombre]    = useState('')      // campo "nombre" del formulario agregar
  const [formDesc,      setFormDesc]      = useState('')      // campo "descripción" del formulario agregar

  // ── Carga inicial de categorías ───────────────────────────────────────────────
  // useEffect con array vacío [] se ejecuta UNA sola vez, cuando el componente
  // aparece en pantalla por primera vez (equivalente al "componentDidMount" de clases).
  useEffect(() => {
    getCategorias()
      .then(data => {
        // Solo actualizamos el estado si lo que llegó del servidor es un array.
        if (Array.isArray(data)) setCategorias(data)
      })
      .catch(() => {}) // silenciamos el error; puedes agregar un setError aquí si quieres
  }, [])

  // ── Agregar categoría ─────────────────────────────────────────────────────────
  // Función async porque usamos "await" dentro para esperar la respuesta del servidor.
  const handleAgregar = async () => {
    // .trim() elimina espacios al inicio y al final del string.
    if (!formNombre.trim()) return alert('El nombre es obligatorio')

    // Llamamos a la función de la API y esperamos su respuesta.
    const respuesta = await crearCategoria({
      nombre: formNombre.trim(),
      descripcion: formDesc.trim(),
    })

    if (respuesta.ok) {
      // En vez de volver a pedir todas las categorías al servidor,
      // agregamos la nueva directamente al estado local con el spread operator (...prev).
      // Esto es más eficiente porque evita un viaje extra a la red.
      setCategorias(prev => [
        ...prev, // copiamos todas las categorías existentes
        {
          id: respuesta.id,           // id que devolvió el servidor
          nombre: formNombre.trim(),
          descripcion: formDesc.trim(),
          activa: true,               // recién creada, siempre activa
          sistema: false,             // creada por el usuario, no es del sistema
          es_global: false,
        },
      ])
      // Limpiamos el formulario y cerramos el modal.
      setFormNombre('')
      setFormDesc('')
      setModalAgregar(false)
    } else {
      // Si el servidor respondió con error, mostramos el mensaje.
      alert(respuesta.mensaje || 'Error al crear la categoría')
    }
  }

  // ── Abrir modal de edición ────────────────────────────────────────────────────
  // El spread { ...cat } crea una COPIA del objeto cat.
  // Si no copiáramos, estaríamos editando directamente el objeto del array
  // y los cambios se verían antes de guardar (bug de mutación directa).
  const abrirEditar = cat => {
    setCategoriaEdit({ ...cat })
    setModalEditar(true)
  }

  // ── Guardar edición ───────────────────────────────────────────────────────────
  const handleGuardarEdicion = async () => {
    if (!categoriaEdit.nombre.trim()) return alert('El nombre es obligatorio')

    const respuesta = await editarCategoria(categoriaEdit.id, {
      nombre: categoriaEdit.nombre,
      descripcion: categoriaEdit.descripcion,
    })

    if (respuesta.ok) {
      // .map recorre el array y devuelve uno nuevo.
      // Si el id coincide con el editado, reemplazamos el objeto; si no, lo dejamos igual.
      setCategorias(prev =>
        prev.map(c => (c.id === categoriaEdit.id ? { ...c, ...categoriaEdit } : c))
      )
      setModalEditar(false)
    } else {
      alert(respuesta.mensaje || 'Error al editar la categoría')
    }
  }

  // ── Deshabilitar categoría ────────────────────────────────────────────────────
  const handleDeshabilitar = async id => {
    // window.confirm muestra un diálogo nativo del navegador con OK/Cancelar.
    if (!window.confirm('¿Seguro que deseas deshabilitar esta categoría?')) return

    const respuesta = await deshabilitarCategoria(id)

    if (respuesta.ok) {
      // Actualizamos solo la categoría afectada, cambiando activa a false.
      setCategorias(prev =>
        prev.map(c => (c.id === id ? { ...c, activa: false } : c))
      )
    } else {
      alert(respuesta.mensaje || 'Error al deshabilitar la categoría')
    }
  }

  // ── Habilitar categoría ───────────────────────────────────────────────────────
  const handleHabilitar = async id => {
    const respuesta = await habilitarCategoria(id)

    if (respuesta.ok) {
      // Lo mismo pero cambiando activa a true.
      setCategorias(prev =>
        prev.map(c => (c.id === id ? { ...c, activa: true } : c))
      )
    } else {
      alert(respuesta.mensaje || 'Error al habilitar la categoría')
    }
  }

  // ── Filtros de categorías ─────────────────────────────────────────────────────
  // Usamos == (doble igual) para comparar tanto boolean true como el número 1,
  // ya que MySQL a veces devuelve 0/1 en vez de false/true.
  const activas   = categorias.filter(c => c.activa == 1 || c.activa === true)
  const inactivas = categorias.filter(c => c.activa == 0 || c.activa === false)

  // Una categoría es "de sistema" si tiene es_global o sistema en true/1.
  // La definimos como función para poder reutilizarla en distintos lugares.
  const esSistema = cat =>
    cat.es_global == 1 || cat.es_global === true ||
    cat.sistema   == 1 || cat.sistema   === true

  // ── Sub-componente: botón cancelar ───────────────────────────────────────────
  // Lo definimos dentro del componente principal para que tenga acceso al mismo
  // contexto de estilos. Recibe "onClick" como prop para saber qué hacer al pulsar.
  const BtnCancelar = ({ onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem',
        fontWeight: '700', cursor: 'pointer', background: 'transparent',
        color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.15)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      Cancelar
    </button>
  )

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={bgPage}>

      {/* HEADER */}
      <header style={{ zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
        <section style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-green-600 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(31,187,31,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
            Inicio
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
              Ahorrapp
            </h1>
            <span style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Categorías
            </span>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(228,33,33,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </section>

        {/* Barra de navegación */}
        <nav style={{ width: '100%', padding: '0 16px' }}>
          <ul className="flex flex-wrap justify-center gap-4 items-center text-md min-w-max mx-auto pb-2">
            {navItems.map(item => {
              // Comparamos la ruta actual con la del ítem para resaltarlo.
              const isActive = location.pathname === item.href
              return (
                <li
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={
                    isActive
                      ? 'px-3 py-1 rounded-[10px] cursor-pointer transition-all duration-300 font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'px-3 py-1 rounded-[10px] text-white cursor-pointer transition-all duration-300 bg-white/10 hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)]'
                  }
                >
                  {item.emoji} {item.label}
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      {/* Línea decorativa bajo el header */}
      <hr style={{ margin: '4px 0', border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '32px', gap: '24px' }}>

        {/* Saludo */}
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Bienvenido de vuelta</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* Stat card + botón agregar */}
        <article style={{ padding: '24px 32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.10)', background: 'radial-gradient(ellipse at left, rgba(16,185,129,0.25), rgba(5,150,105,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', marginBottom: '4px' }}>
              🧩 Categorías activas
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>
              {activas.length}
            </p>
          </div>
          <button
            onClick={() => setModalAgregar(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none hover:-translate-y-px transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#0f172a' }}
          >
            + Agregar Categoría
          </button>
        </article>

        {/* Tabla de categorías */}
        <section style={{ width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fbbf24' }}>📋 Módulo de Categorías</h3>
          </div>

          <div style={{ overflowX: 'auto', padding: '0 8px 16px' }}>
            {activas.length === 0 ? (
              <p style={{ color: '#71717a', fontStyle: 'italic', padding: '24px 20px', fontSize: '0.88rem' }}>
                No hay categorías activas.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Nombre', 'Descripción', 'Tipo', 'Acciones'].map(col => (
                      <th key={col} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activas.map(cat => (
                    <tr
                      key={cat.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: '700', color: '#f4f4f5' }}>
                        {cat.nombre}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#a1a1aa' }}>
                        {cat.descripcion || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700',
                          background: cat.es_global ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)',
                          color:      cat.es_global ? '#34d399'              : '#818cf8',
                          border:     `1px solid ${cat.es_global ? 'rgba(52,211,153,0.35)' : 'rgba(129,140,248,0.35)'}`,
                        }}>
                          {cat.es_global ? 'Sistema' : 'Personalizada'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {/* Solo mostramos acciones si la categoría NO es del sistema */}
                        {!esSistema(cat) && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => abrirEditar(cat)}
                              style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(52,211,153,0.5)', background: 'rgba(52,211,153,0.10)', color: '#34d399', transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.22)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.10)'}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeshabilitar(cat.id)}
                              style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.10)', color: '#fb923c', transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,146,60,0.22)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,146,60,0.10)'}
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

            {/* Sección de categorías inactivas */}
            {inactivas.length > 0 && (
              <div style={{ marginTop: '24px', opacity: 0.6 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', padding: '0 8px' }}>
                  Categorías deshabilitadas ({inactivas.length})
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {inactivas.map(cat => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 16px', fontSize: '0.85rem', color: '#71717a' }}>
                          <s>{cat.nombre}</s>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '0.85rem', color: '#52525b' }}>
                          {cat.descripcion || '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <button
                            onClick={() => handleHabilitar(cat.id)}
                            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.08)', color: '#34d399' }}
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

      <footer style={{ width: '100%', padding: '24px', textAlign: 'center', color: '#3f3f46', fontSize: '0.7rem', fontFamily: 'monospace' }}>
        <p>© <strong style={{ color: '#fbbf24' }}>2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL: AGREGAR CATEGORÍA */}
      {modalAgregar && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>
              🧩 Nueva Categoría
            </h4>

            <label style={labelModal}>Nombre *</label>
            <input
              style={inputModal}
              type="text"
              placeholder="Ej: Ropa, Mascotas..."
              value={formNombre}
              // onChange se dispara cada vez que el usuario escribe un carácter.
              // e.target.value es el texto actual del input.
              onChange={e => setFormNombre(e.target.value)}
            />

            <label style={labelModal}>Descripción</label>
            <input
              style={inputModal}
              type="text"
              placeholder="Descripción opcional"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <BtnCancelar
                onClick={() => {
                  setModalAgregar(false)
                  setFormNombre('')   // limpiamos el campo nombre al cancelar
                  setFormDesc('')     // limpiamos el campo descripción al cancelar
                }}
              />
              <button
                onClick={handleAgregar}
                style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#0f172a' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CATEGORÍA */}
      {/* El && asegura que solo renderizamos el modal si modalEditar es true
          Y además si categoriaEdit no es null (ya se seleccionó una categoría). */}
      {modalEditar && categoriaEdit && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>
              ✏️ Editar Categoría
            </h4>

            <label style={labelModal}>Nombre *</label>
            <input
              style={inputModal}
              type="text"
              value={categoriaEdit.nombre}
              // prev es el estado anterior; usamos spread para no perder los otros campos
              // y solo sobreescribimos "nombre" con el nuevo valor.
              onChange={e => setCategoriaEdit(prev => ({ ...prev, nombre: e.target.value }))}
            />

            <label style={labelModal}>Descripción</label>
            <input
              style={inputModal}
              type="text"
              value={categoriaEdit.descripcion || ''}
              onChange={e => setCategoriaEdit(prev => ({ ...prev, descripcion: e.target.value }))}
            />

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <BtnCancelar onClick={() => setModalEditar(false)} />
              <button
                onClick={handleGuardarEdicion}
                style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#0f172a' }}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}