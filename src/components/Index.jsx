import { Link } from 'react-router-dom'
import '../styles/index.css'

export default function Index() {
  return (
    <div>
      <header className="header">
        <div className="header-left">
          <h2>Ahorrapp</h2>
        </div>
        <div className="header-right">
          <Link to="/login">
            <button className="btn-iniciarsesion">Iniciar sesion.</button>
          </Link>
        </div>
      </header>

      <main className="main-content">
        <div className="firstSection">
          <h1 className="h1-mainContent">Controla tus Finanzas Personales.</h1>
          <p className="p-mainContent">
            Una aplicación completa para gestionar tus ingresos, gastos, ahorros, deudas,<br />
            dependientes y más. Todo en un solo lugar, con un diseño minimalista y herramientas <br />
            avanzadas de análisis financiero.
          </p>
        </div>

        <div className="caracteristicasPrincipales">
          <div className="h2-caracteristicasPrincipales">
            <h2>Caracteristicas principales.</h2>
          </div>
          <div className="boxes">
            <div className="boxIndex">
              <p>Gestion de ingresos</p>
              <p>Registra y monitorea todos tus ingresos de manera organizada</p>
            </div>
            <div className="boxIndex">
              <p>Gestion de gastos</p>
              <p>Controla tus gastos y evita exceder tu presupuesto</p>
            </div>
            <div className="boxIndex">
              <p>Metas de Ahorro</p>
              <p>Establece objetivos financieros y sigue tu progreso</p>
            </div>
            <div className="boxIndex">
              <p>Fondo de Imprevistos</p>
              <p>Prepárate para gastos inesperados con un fondo de emergencia</p>
            </div>
            <div className="boxIndex">
              <p>Gestion de ingresos</p>
              <p>Registra y monitorea todos tus ingresos de manera organizada</p>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <section className="contactenos">
          <Link to="/contactanos">
            <button className="btn-contactenos">ola</button>
          </Link>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium impedit dolorem aperiam? Inventore nemo, sapiente est facilis eveniet iusto repellendus et expedita ea deserunt? Quae vel tempore autem nobis iste!</p>
        </section>
        <br />
        <div className="marquillaFooter">
          <h1>&copy; 2026 - Ahorrapp</h1>
        </div>
      </footer>
    </div>
  )
}