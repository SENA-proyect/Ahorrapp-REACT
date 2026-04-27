import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategorias, crearCategoria, editarCategoria, deshabilitarCategoria, habilitarCategoria } from '../api'
import '../styles/generalModulos.css'

export default function ModuloCategorias() {
  const [categorias, setCategorias]         = useState([])
  const [modalAgregar, setModalAgregar]     = useState(false)
  const [modalEditar, setModalEditar]       = useState(false)
  const [categoriaEdit, setCategoriaEdit]   = useState(null)
  const [formNombre, setFormNombre]         = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')

  // ── Cargar categorías del backend al montar ────────────────────────────
  useEffect(() => {
    getCategorias()
      .then(data => {
        if (Array.isArray(data)) setCategorias(data)
      })
      .catch(() => {})
  }, [])
  // ── Agregar categoría ──────────────────────────────────────────────────
  const handleAgregar = async () => {
    if (!formNombre.trim()) return alert('El nombre es obligatorio')

    const respuesta = await crearCategoria({
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
    })

    if (respuesta.ok) {
      const nueva = {
        id: respuesta.id,
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim(),
        activa: true,
        sistema: false,
        es_global: false,
      }
      setCategorias(prev => [...prev, nueva])
      setFormNombre('')
      setFormDescripcion('')
      setModalAgregar(false)
    } else {
      alert(respuesta.mensaje || 'Error al crear la categoría')
    }
  }

  // ── Abrir modal editar ─────────────────────────────────────────────────
  const abrirEditar = (cat) => {
    setCategoriaEdit({ ...cat })
    setModalEditar(true)
  }

  // ── Guardar edición ────────────────────────────────────────────────────
  const handleGuardarEdicion = async () => {
    if (!categoriaEdit.nombre.trim()) return alert('El nombre es obligatorio')

    const respuesta = await editarCategoria(categoriaEdit.id, {
      nombre: categoriaEdit.nombre,
      descripcion: categoriaEdit.descripcion,
    })

    if (respuesta.ok) {
      setCategorias(prev =>
        prev.map(c => c.id === categoriaEdit.id ? { ...c, ...categoriaEdit } : c)
      )
      setModalEditar(false)
    } else {
      alert(respuesta.mensaje || 'Error al editar la categoría')
    }
  }

  // ── Deshabilitar categoría ─────────────────────────────────────────────
  const handleDeshabilitar = async (id) => {
    if (!window.confirm('¿Seguro que deseas deshabilitar esta categoría?')) return

    const respuesta = await deshabilitarCategoria(id)

    if (respuesta.ok) {
      setCategorias(prev =>
        prev.map(c => c.id === id ? { ...c, activa: false } : c)
      )
    } else {
      alert(respuesta.mensaje || 'Error al deshabilitar la categoría')
    }
  }

  // ── Habilitar categoría ────────────────────────────────────────────────
  const handleHabilitar = async (id) => {
    const respuesta = await habilitarCategoria(id)

    if (respuesta.ok) {
      setCategorias(prev =>
        prev.map(c => c.id === id ? { ...c, activa: true } : c)
      )
    } else {
      alert(respuesta.mensaje || 'Error al habilitar la categoría')
    }
  }

  const activas   = categorias.filter(c => c.activa)
  const inactivas = categorias.filter(c => !c.activa)

  return (
    <div className="box-content">

      {/* HEADER */}
      <header className="header">
        <Link to="/">
          <button className="buttonHeader">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 10">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            Inicio
          </button>
        </Link>
        <h1>Ahorrapp</h1>
        <button className="buttonCerrarSesion">Cerrar Sesion</button>
      </header>

      <main>
        <p className="parrafo1">
          Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos
        </p>

        {/* NAVBAR */}
        <nav className="navbar" aria-label="Menú de secciones">
          <ul className="nav-list">
            <li><Link to="/Dashboard"           className="nav-link">Dashboard</Link></li>
            <li><Link to="/ModulosIngresos"     className="nav-link">Ingresos</Link></li>
            <li><Link to="/ModulosGastos"       className="nav-link">Gastos</Link></li>
            <li><Link to="/ModuloAhorros"       className="nav-link">Ahorros</Link></li>
            <li><Link to="/ModuloImprevistos"   className="nav-link">Imprevistos</Link></li>
            <li><Link to="/ModuloDeudas"        className="nav-link">Deudas</Link></li>
            <li><Link to="/ModulosDependientes" className="nav-link">Dependientes</Link></li>
            <li><Link to="/ModulosCategorias"   className="nav-link active">Categorias</Link></li>
          </ul>
        </nav>

        {/* CRUD */}
        <section className="modulo-ahorros">
          <header className="modulo-header">
            <h3>Módulo de categorías</h3>
            <div className="acciones-ahorro">
              <button type="button" className="btn-secundario" onClick={() => setModalAgregar(true)}>
                + Agregar categoría
              </button>
            </div>
          </header>

          <div className="resumen-container">
            <p className="total-ahorros">
              Total categorías activas: <strong>{activas.length}</strong>
            </p>

            {/* TABLA DE CATEGORÍAS ACTIVAS */}
            <div className="tabla-ingresos" style={{ marginTop: '20px' }}>
              {activas.length === 0 ? (
                <p className="mensaje-vacio">No hay categorías activas.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={thStyle}>Nombre</th>
                      <th style={thStyle}>Descripción</th>
                      <th style={thStyle}>Tipo</th>
                      <th style={thStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activas.map(cat => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={tdStyle}><strong>{cat.nombre}</strong></td>
                        <td style={tdStyle}>{cat.descripcion || '—'}</td>
                        <td style={tdStyle}>
                          <span style={cat.es_global ? badgeSistema : badgeUsuario}>
                            {cat.es_global ? 'Sistema' : 'Personalizada'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {/* Solo se pueden editar/deshabilitar las categorías del usuario */}
                          {!cat.es_global && (
                            <>
                              <button
                                className="btn-secundario"
                                style={{ marginRight: '8px', fontSize: '0.8rem', padding: '4px 10px' }}
                                onClick={() => abrirEditar(cat)}
                              >
                                Editar
                              </button>
                              <button
                                style={{ ...btnDeshabilitar, fontSize: '0.8rem', padding: '4px 10px' }}
                                onClick={() => handleDeshabilitar(cat.id)}
                              >
                                Deshabilitar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* CATEGORÍAS DESHABILITADAS */}
            {inactivas.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px' }}>
                  Categorías deshabilitadas ({inactivas.length})
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', opacity: 0.6 }}>
                  <tbody>
                    {inactivas.map(cat => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={tdStyle}><s>{cat.nombre}</s></td>
                        <td style={tdStyle}>{cat.descripcion || '—'}</td>
                        <td style={tdStyle}>
                          <button
                            className="btn-secundario"
                            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
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

      <footer className="footer-app">
        <p>&copy; 2026 Mi Aplicación de Finanzas</p>
      </footer>

      {/* ── MODAL AGREGAR ──────────────────────────────────────────────────── */}
      {modalAgregar && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginBottom: '16px' }}>Nueva categoría</h3>

            <label style={labelStyle}>Nombre *</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Ej: Ropa, Mascotas..."
              value={formNombre}
              onChange={e => setFormNombre(e.target.value)}
            />

            <label style={labelStyle}>Descripción</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Descripción opcional"
              value={formDescripcion}
              onChange={e => setFormDescripcion(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secundario" onClick={handleAgregar}>Guardar</button>
              <button style={btnCancelar} onClick={() => { setModalAgregar(false); setFormNombre(''); setFormDescripcion('') }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ───────────────────────────────────────────────────── */}
      {modalEditar && categoriaEdit && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginBottom: '16px' }}>Editar categoría</h3>

            <label style={labelStyle}>Nombre *</label>
            <input
              style={inputStyle}
              type="text"
              value={categoriaEdit.nombre}
              onChange={e => setCategoriaEdit(prev => ({ ...prev, nombre: e.target.value }))}
            />

            <label style={labelStyle}>Descripción</label>
            <input
              style={inputStyle}
              type="text"
              value={categoriaEdit.descripcion || ''}
              onChange={e => setCategoriaEdit(prev => ({ ...prev, descripcion: e.target.value }))}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secundario" onClick={handleGuardarEdicion}>Guardar cambios</button>
              <button style={btnCancelar} onClick={() => setModalEditar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Estilos inline reutilizables ─────────────────────────────────────────────
const thStyle       = { padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }
const tdStyle       = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' }
const badgeSistema  = { background: 'var(--color-primary-soft)', color: 'var(--color-primary-dark)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }
const badgeUsuario  = { background: 'var(--ingresos-bg)', color: 'var(--ingresos-dark)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }
const btnDeshabilitar = { background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }
const overlayStyle  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle    = { background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }
const labelStyle    = { display: 'block', marginBottom: '6px', marginTop: '14px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }
const inputStyle    = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none' }
const btnCancelar   = { padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }