// src/components/ModuloDeudas.jsx
import { Link } from 'react-router-dom'
import '../styles/generalModulos.css'

export default function ModuloDeudas() {
  return (
    <div>

      {/* HEADER */}
      <header className="header">
        <Link to="/" className="btn-inicio">Inicio</Link>
        <h1>Mi aplicación de finanzas</h1>
        <hr className="linea" />
      </header>

      <main>
        <p className="parrafo1">
          Gestiona de manera integral tus finanzas: ingresos, gastos, ahorros, deudas e imprevistos
        </p>

        {/* NAVBAR */}
        <nav className="navbar" aria-label="Menú de secciones">
          <ul className="nav-list">
            <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
            <li><Link to="/ingresos" className="nav-link">Ingresos</Link></li>
            <li><Link to="/gastos" className="nav-link">Gastos</Link></li>
            <li><Link to="/ahorros" className="nav-link">Ahorros</Link></li>
            <li><Link to="/imprevistos" className="nav-link">Imprevistos</Link></li>
            <li><Link to="/deudas" className="nav-link active">Deudas</Link></li>
            <li><Link to="/dependientes" className="nav-link">Dependientes</Link></li>
            <li><Link to="/categorias" className="nav-link">Categorias</Link></li>
          </ul>
        </nav>

        {/* MODULO */}
        <section className="modulo-ahorros">
          <header className="modulo-header">
            <h3>Módulo de Deudas</h3>
            <div className="acciones-ahorro">
              <button type="button" className="btn-primario">Nueva Deuda</button>
              <button type="button" className="btn-secundario">Abonar a la Deuda</button>
            </div>
          </header>

          <div className="resumen-container">
            <p className="total-ahorros">Total Deuda Acumulada: <strong>$0</strong></p>
            <p className="mensaje-vacio">¡Felicidades! No tienes deudas pendientes registradas.</p>
          </div>
        </section>
      </main>

      <footer className="footer-app">
        <p>&copy; 2024 Mi Aplicación de Finanzas</p>
      </footer>

    </div>
  )
}