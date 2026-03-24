import { Link } from 'react-router-dom'
import '../styles/index.css'

export default function Index() {
  const handleSubmit = (e) => {
    e.preventDefault()
    // lógica de envío de formulario
  }

  return (
    <div>
      <header className="header">
        <div className="header-left">
          <h2>Ahorrapp</h2>
        </div>
        <div className="header-right">
          <Link to="../components/Login.jsx">
            <button className="btn-iniciarsesion">Iniciar sesion.</button>
          </Link>
        </div>
      </header>

      <main className="main-content">
        <div className="firstSection">
          <h1 className="h1-mainContent">Controla tus Finanzas Personales.</h1>
          <p className="p-mainContent">
            Una aplicación completa para gestionar tus ingresos, gastos, ahorros, deudas,
            dependientes y más. Todo en un solo lugar, con un diseño minimalista y herramientas
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
              <p>Control de Deudas</p>
              <p>Administra tus deudas y programa pagos estratégicos</p>
            </div>
            <div className="boxIndex">
              <p>Personas a Cargo</p>
              <p>Organiza información y gastos de tus dependientes</p>
            </div>
            <div className="boxIndex">
              <p>Reportes Detallados</p>
              <p>Genera análisis completos con recomendaciones</p>
            </div>
            <div className="boxIndex">
              <p>Registro de Actividad</p>
              <p>Historial completo de todas tus transacciones</p>
            </div>
            <div className="boxIndex">
              <p>Alertas y Recordatorios</p>
              <p>Notificaciones automáticas y recordatorios personalizados</p>
            </div>
            <div className="boxIndex">
              <p>Dashboard Inteligente</p>
              <p>Visualiza tus finanzas con gráficos y métricas en tiempo real</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="f9">
        <div className="top">

          <div className="info">
            <div className="brand">Ahorrapp<span>.</span></div>
            <p className="tagline"></p>
          </div>

          <div className="form-side">
            <h3>Contactanos Aqui!</h3>
            <p>Respondemos en menos de 24 horas.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <input type="text"    name="nombre"      placeholder="Nombre"          required />
                <input type="text"    name="empresa"     placeholder="Empresa" />
                <input type="email"   name="email"       placeholder="Email"           required />
                <input type="text"    name="presupuesto" placeholder="Presupuesto aprox." />
              </div>
              <textarea
                name="mensaje"
                className="msg-field"
                rows="3"
                placeholder="¿Qué quieres construir?"
              />
              <div className="submit-row">
                <span className="privacy">Tus datos están seguros</span>
                <button type="submit" className="submit-btn">Enviar →</button>
              </div>
            </form>
          </div>

        </div>

        <div className="bottom">
          <span>&copy; Ahorrapp</span>
        </div>
      </footer>
    </div>
  )
}