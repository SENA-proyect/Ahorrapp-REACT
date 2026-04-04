// src/components/Dashboard.jsx
import { Link } from 'react-router-dom'
import '../styles/dashboard.css'

export default function Dashboard() {
  return (
    <div className="page-wrapper">

      {/* HEADER */}
      <header className="header">
        <Link to="/Index">
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
      <nav className="navbar">
        <Link to="/dashboard"><button className="nav-item">Dashboard</button></Link>
        <Link to="/ingresos"><button className="nav-item">Ingresos</button></Link>
        <Link to="/gastos"><button className="nav-item">Gastos</button></Link>
        <Link to="/ahorros"><button className="nav-item">Ahorros</button></Link>
        <Link to="/imprevistos"><button className="nav-item">Imprevistos</button></Link>
        <Link to="/deudas"><button className="nav-item">Deudas</button></Link>
        <Link to="/dependientes"><button className="nav-item">Dependientes</button></Link>
        <Link to="/categorias"><button className="nav-item">Categorias</button></Link>
      </nav>

      {/* MAIN */}
      <main className="dashboard-main-content">

        <div className="dashboard-header">
          <div className="header-left">
            <section className="sectionHeader">
              <svg xmlns="http://www.w3.org/2000/svg" style={{ padding: '5px' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
              </svg>
              <h2>Dashboard Financiero Inteligente</h2>
            </section>
            <p className="pHeaderLeft">Analisis completo con insights automaticos</p>
          </div>
          <div className="header-right">
            <Link to="/VentanaModalDashboard">
              <button className="btn-outline" onClick={() => navigate ('/VentanaModalDashboard')}>Ayuda</button>
            </Link>
            <button className="btn-solid">Exportar Reporte</button>
          </div>
        </div>

        <section className="box">
          <article className="iconBox">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
            </svg>
          </article>
          <p className="text-box">Puntuacion de Salud Financiera</p>
        </section>

        <br />

        <section className="box2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
          </svg>
          <p>Insights Inteligentes</p>
          <ul>
            <li><p>Tu balance mensual es negativo. Considera reducir gastos o aumentar ingresos.</p></li>
            <li><p>Tu tasa de ahorro es baja (0.0%). Recomendamos ahorrar al menos 20%</p></li>
            <li><p>Tu fondo de emergencia está muy bien establecido (más de 6 meses de gastos)</p></li>
          </ul>
        </section>

        <br />

        <div className="boxes">
          <section className="box-section1"><p>Ingresos Totales</p></section>
          <section className="box-section1"><p>Gastos Totales</p></section>
          <section className="box-section1"><p>Ahorros Totales</p></section>
          <section className="box-section1"><p>Patrimonio Neto</p></section>
          <section className="box-section1"><p>Dinero Disponible</p></section>
        </div>

      </main>

      <footer></footer>
    </div>
  )
}