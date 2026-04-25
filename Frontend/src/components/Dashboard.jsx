import { Link } from "react-router-dom";
import '../styles/dashboard.css';

export default function Dashboard() {
  return (
    <div className="page-wrapper">

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

      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/Dashboard"><button className="nav-item">Dashboard</button></Link>
        <Link to="/ModulosIngresos"><button className="nav-item">Ingresos</button></Link>
        <Link to="/ModulosGastos"><button className="nav-item">Gastos</button></Link>
        <Link to="/ModuloAhorros"><button className="nav-item">Ahorros</button></Link>
        <Link to="/ModuloImprevistos"><button className="nav-item">Imprevistos</button></Link>
        <Link to="/ModuloDeudas"><button className="nav-item">Deudas</button></Link>
        <Link to="/ModulosDependientes"><button className="nav-item">Dependientes</button></Link>
        <Link to="/ModulosCategorias"><button className="nav-item">Categorias</button></Link>
      </nav>

      {/* MAIN */}
      <main className="main-content">
        <div className="dashboard-header">
          <div className="header-left">
            <section className="sectionHeader">
              <svg xmlns="http://www.w3.org/2000/svg" style={{ padding: "5px" }} width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 18V5"/>
                <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/>
              </svg>
              <h2>Dashboard Financiero Inteligente</h2>
            </section>
            <p className="pHeaderLeft">Analisis completo con insights automaticos</p>
          </div>

          <div className="header-right">
            <Link to="/VentanaModalDashboard">
              <button className="btn-outline" id="openModal">Ayuda</button>
            </Link>
            <button className="btn-solid">Exportar Reporte</button>
          </div>
        </div>

        {/* BOX PRINCIPAL */}
        <section className="box1">
          <section className="iconAndText">
            <article className="iconBox">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M22 12h-2.48" />
              </svg>
            </article>
            <p className="text-box">Puntuacion de Salud Financiera</p>
          </section>

          <br />

          <section>
            <p className="pSection2Box">50/100</p>
            <p className="pSection2Box2">Salud Regular</p>
          </section>
        </section>

        <br />

        {/* INSIGHTS */}
        <section className="box2">
          <p>Insights Inteligentes</p>
          <ul>
            <li><p>Tu balance mensual es negativo.</p></li>
            <li><p>Tu tasa de ahorro es baja.</p></li>
            <li><p>Buen fondo de emergencia.</p></li>
          </ul>
        </section>

        <br />

        {/* CARDS */}
        <div className="boxes">
          <section className="box-section1">
            <p>Ingresos Totales</p>
            <p><strong>$0</strong></p>
            <p>Base de tus finanzas</p>
          </section>
          <section className="box-section2">
            <p>Gastos Totales</p>
            <p><strong>$0</strong></p>
            <p>0% de Ingresos</p>
          </section>
          <section className="box-section3">
            <p>Ahorros Totales</p>
            <p><strong>$0</strong></p>
            <p>0% de Ingresos</p>
          </section>
          <section className="box-section4">
            <p>Patrimonio Neto</p>
            <p><strong>$0</strong></p>
            <p>Negativo</p>
          </section>
          <section className="box-section5">
            <p>Dinero Disponible</p>
            <p><strong>$0</strong></p>
            <p>Para gastos adicionales</p>
          </section>
        </div>
      </main>

      <footer className="footer-app">
        <p>© 2026 Mi Aplicación de Finanzas</p>
      </footer>
    </div>
  );
}