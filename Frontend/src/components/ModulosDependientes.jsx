import { Link } from "react-router-dom"
import { useState } from "react"
import '../styles/generalModulos.css'
import '../styles/VentanaModal.css'
import '../styles/dependientes.css'

const Dependientes = () => {
  const [mostrarModal, setMostrarModal] = useState(false)
  const [dependientes, setDependientes] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [formDatos, setFormDatos] = useState({
    Nombre: '',
    Relacion: '',
    Ocupacion: '',
    Fecha_nacimiento: '',
    Peso_economico: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormDatos(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editandoId) {
      // Actualizar dependiente existente
      setDependientes(dependientes.map(dep => 
        dep.id === editandoId ? { ...formDatos, id: editandoId } : dep
      ))
      setEditandoId(null)
    } else {
      // Agregar nuevo dependiente
      setDependientes([...dependientes, { ...formDatos, id: Date.now() }])
    }
    
    setMostrarModal(false)
    setFormDatos({
      Nombre: '',
      Relacion: '',
      Ocupacion: '',
      Fecha_nacimiento: '',
      Peso_economico: ''
    })
  }

  const handleEditar = (dependiente) => {
    setFormDatos(dependiente)
    setEditandoId(dependiente.id)
    setMostrarModal(true)
  }

  const handleEliminar = (id) => {
    setDependientes(dependientes.filter(dep => dep.id !== id))
  }

  const abrirModal = () => {
    setFormDatos({
      Nombre: '',
      Relacion: '',
      Ocupacion: '',
      Fecha_nacimiento: '',
      Peso_economico: ''
    })
    setEditandoId(null)
    setMostrarModal(true)
  }

  return (
    <>
    <div className="box-content">
      <header className="header">
        <Link to="/">
          <button className="buttonHeader">
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

        <h1>Ahorrapp</h1>
        <button className="buttonCerrarSesion">Cerrar Sesión</button>
      </header>

      <main>
        <p className="parrafo1">
          Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros,
          deudas e imprevistos
        </p>

        <nav className="navbar" aria-label="Menú de secciones">
          <ul className="nav-list">
            <li><Link to="/Dashboard" className="nav-link">Dashboard</Link></li>
            <li><Link to="/ModulosIngresos" className="nav-link">Ingresos</Link></li>
            <li><Link to="/ModulosGastos" className="nav-link">Gastos</Link></li>
            <li><Link to="/ModuloAhorros" className="nav-link">Ahorros</Link></li>
            <li><Link to="/ModuloImprevistos" className="nav-link">Imprevistos</Link></li>
            <li><Link to="/ModuloDeudas" className="nav-link">Deudas</Link></li>
            <li><Link to="/ModulosDependientes" className="nav-link active">Dependientes</Link></li>
            <li><Link to="/ModulosCategorias" className="nav-link">Categorías</Link></li>
          </ul>
        </nav>
{/* PARTE DEL CRUD */}
        <section className="modulo-ahorros">
          <header className="modulo-header">
            <h3>Módulo de dependientes</h3>
            <div className="acciones-ahorro">
              <button 
                type="button"
                className="btn-secundario"
                onClick={abrirModal}
              >
                Agregar dependiente
              </button>
            </div>
          </header>

          <div className="resumen-container">
            <p className="total-ahorros">
              Total dependientes: <strong>{dependientes.length}</strong>
            </p>

            <div className="tabla-ingresos" style={{ marginTop: "20px" }}>
              {dependientes.length === 0 ? (
                <p className="mensaje-vacio">
                  No hay dependientes registrados. Agrega tu primer dependiente para comenzar.
                </p>
              ) : (
                <div className="dependientes-lista">
                  {dependientes.map(dependiente => (
                    <div key={dependiente.id} className="dependiente-card">
                      <div className="dependiente-info">
                        <p><strong>Nombre:</strong> {dependiente.Nombre}</p>
                        <p><strong>Relación:</strong> {dependiente.Relacion}</p>
                        <p><strong>Ocupación:</strong> {dependiente.Ocupacion || 'N/A'}</p>
                        <p><strong>Fecha Nac.:</strong> {dependiente.Fecha_nacimiento}</p>
                        <p><strong>Peso Económico:</strong> {dependiente.Peso_economico || 'N/A'}%</p>
                      </div>
                      <div className="dependiente-acciones">
                        <button 
                          className="btn-editar"
                          onClick={() => handleEditar(dependiente)}
                        >
                          Editar
                        </button>
                        <button 
                          className="btn-eliminar"
                          onClick={() => handleEliminar(dependiente.id)}
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

      <footer className="footer-app">
        <p>&copy; 2024 Mi Aplicación de Finanzas</p>
      </footer>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="h2Modal">{editandoId ? 'Editar Dependiente' : 'Agregar Dependiente'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="Nombre">Nombre</label>
                <input
                  type="text"
                  id="Nombre"
                  name="Nombre"
                  value={formDatos.Nombre}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del dependiente"
                />
              </div>

              <div className="form-group">
                <label htmlFor="Relacion">Relación</label>
                <select
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

              <div className="form-group">
                <label htmlFor="Ocupacion">Ocupación</label>
                <input
                  type="text"
                  id="Ocupacion"
                  name="Ocupacion"
                  value={formDatos.Ocupacion}
                  onChange={handleChange}
                  placeholder="Ocupación del dependiente"
                />
              </div>

              <div className="form-group">
                <label htmlFor="Fecha_nacimiento">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="Fecha_nacimiento"
                  name="Fecha_nacimiento"
                  value={formDatos.Fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="Peso_economico">Peso Económico</label>
                <input
                  type="number"
                  id="Peso_economico"
                  name="Peso_economico"
                  value={formDatos.Peso_economico}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Peso económico del dependiente"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-modal btn-guardar">Guardar</button>
                <button type="button" className="btn-modal btn-cancelar" onClick={() => setMostrarModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Dependientes;