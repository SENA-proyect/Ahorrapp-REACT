import { Link } from "react-router-dom";
import '../styles/generalModulos.css'

const Ahorros = () => {
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
            <li><Link to="/ModuloAhorros" className="nav-link active">Ahorros</Link></li>
            <li><Link to="/ModuloImprevistos" className="nav-link">Imprevistos</Link></li>
            <li><Link to="/ModuloDeudas" className="nav-link">Deudas</Link></li>
            <li><Link to="/ModulosDependientes" className="nav-link">Dependientes</Link></li>
            <li><Link to="/ModulosCategorias" className="nav-link">Categorías</Link></li>
          </ul>
        </nav>

        <section className="modulo-ahorros">
          <header className="modulo-header">
            <h3>Módulo de ahorros</h3>
            <div className="acciones-ahorro">
              <button type="button" className="btn-primario">
                Agregar dinero
              </button>
              <button type="button" className="btn-secundario">
                Nueva Meta
              </button>
            </div>
          </header>

          <div className="resumen-container">
            <p className="total-ahorros">
              Total Ahorros: <strong>$0</strong>
            </p>
            <p className="mensaje-vacio">
              No hay metas de ahorro creadas. Crea tu primera meta para comenzar a ahorrar.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer-app">
        <p>&copy; 2024 Mi Aplicación de Finanzas</p>
      </footer>
    </div>
    </>
  );
};

export default Ahorros;