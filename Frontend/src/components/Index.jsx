import { Link, useNavigate } from 'react-router-dom'

export default function Index() {
  const navigate = useNavigate()

  const handleSubmit = e => {
    e.preventDefault()
    console.log('Formulario enviado')
  }

  const features = [
    ['Gestión de ingresos', 'Registra y monitorea todos tus ingresos de manera organizada'],
    ['Gestión de gastos', 'Controla tus gastos y evita exceder tu presupuesto'],
    ['Metas de Ahorro', 'Establece objetivos financieros y sigue tu progreso'],
    ['Fondo de Imprevistos', 'Prepárate para gastos inesperados con un fondo de emergencia'],
    ['Control de Deudas', 'Administra tus deudas y programa pagos estratégicos'],
    ['Personas a Cargo', 'Organiza información y gastos de tus dependientes'],
    ['Reportes Detallados', 'Genera análisis completos con recomendaciones'],
    ['Registro de Actividad', 'Historial completo de todas tus transacciones'],
    ['Alertas y Recordatorios', 'Notificaciones automáticas y recordatorios personalizados'],
    ['Dashboard Inteligente', 'Visualiza tus finanzas con gráficos y métricas en tiempo real'],
  ]

  return (
    <div className="relative min-h-screen w-full font-['Plus_Jakarta_Sans','Segoe_UI',sans-serif]">
      <header className="sticky top-0 z-[100] flex h-[70px] w-full items-center justify-between border-b border-[#4ADE80]/15 bg-[#F8FFFE]/85 px-5 backdrop-blur-md md:px-10">
        <div>
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#15803D]">
            Ahorrapp
          </h2>
        </div>

        <div className="flex items-center">
          <Link to="/Login">
            <button
              className="cursor-pointer rounded-lg border-[1.5px] border-[#86EFAC] bg-transparent px-[22px] py-2.5 text-sm font-semibold tracking-[0.01em] text-[#15803D] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4ADE80] hover:bg-[#4ADE80] hover:text-white hover:shadow-[0_4px_15px_rgba(74,222,128,0.3)]"
              onClick={() => navigate('/Login')}
            >
              Iniciar sesión.
            </button>
          </Link>
        </div>
      </header>

      <main>
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-white to-[#4ADE80]/10 px-10 pb-[100px] pt-20 text-center before:pointer-events-none before:absolute before:left-1/2 before:top-[-100px] before:h-[600px] before:w-[600px] before:-translate-x-1/2 before:bg-[radial-gradient(circle,rgba(74,222,128,0.08)_0%,transparent_70%)]">
          <h1 className="relative z-10 mb-[30px] mt-[-80px] bg-[url('../assets/08c4711743f9b996bfae50325a4f3c14.jpg')] bg-cover bg-center bg-clip-text text-[clamp(40px,7vw,90px)] font-extrabold leading-[1.1] tracking-[-2px] text-[#15803D] text-transparent">
            Controla tus Finanzas Personales.
          </h1>

          <p className="relative z-10 mx-auto max-w-full text-center text-[clamp(16px,2vw,20px)] font-normal leading-[1.8] text-[#6B7280]">
            Una aplicación completa para gestionar tus ingresos, gastos, ahorros, deudas,
            dependientes y más. Todo en un solo lugar, con un diseño minimalista y herramientas
            avanzadas de análisis financiero.
          </p>
        </section>

        <section className="w-full bg-gradient-to-b from-[#4ADE80]/10 to-[#DCFCE7] px-10 py-20">
          <div className="mb-[50px] text-center">
            <h2 className="text-[clamp(24px,3vw,36px)] font-extrabold tracking-[-0.03em] text-[#15803D]">
              Características principales.
            </h2>
          </div>

          <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-5">
            {features.map(([title, description]) => (
              <div
                key={title}
                className="flex min-h-[160px] w-[calc(50%-10px)] cursor-default flex-col gap-2.5 rounded-2xl border border-[#4ADE80]/25 bg-white px-4 py-6 shadow-[0_2px_12px_rgba(74,222,128,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:border-[#4ADE80] hover:shadow-[0_12px_30px_rgba(74,222,128,0.2)] md:w-[200px]"
              >
                <p className="text-[0.95rem] font-bold text-[#15803D]">{title}</p>
                <p className="text-[0.8rem] leading-[1.5] text-[#6B7280]">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden bg-gradient-to-b from-[#DCFCE7] to-[#22C55E] px-[6vw] pb-8 pt-20 text-[#0A0A0A] before:pointer-events-none before:absolute before:left-[30%] before:top-[-80px] before:h-[300px] before:w-[500px] before:bg-[radial-gradient(ellipse,rgba(255,255,255,0.2)_0%,transparent_70%)]">
        <div className="relative z-10 grid gap-12 border-b border-white/30 pb-16 md:grid-cols-[1fr_1.2fr] md:gap-20">
          <div>
            <div className="mb-6 text-[2.5rem] font-extrabold leading-none tracking-[3px] text-[#0A0A0A]">
              Ahorrapp<span className="text-[#15803D]">.</span>
            </div>

            <p className="max-w-[280px] text-sm font-light leading-[1.8] text-[#0A0A0A]">
              Tu aliado financiero inteligente.
            </p>
          </div>

          <div>
            <h3 className="mb-1.5 text-[1.1rem] font-extrabold uppercase tracking-[0.1em] text-[#15803D]">
              Contáctanos Aquí!
            </h3>

            <p className="mb-6 text-[13px] font-normal text-[#0A0A0A]/70">
              Respondemos en menos de 24 horas.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                <input className={inputClass} type="text" name="nombre" placeholder="Nombre" required />
                <input className={inputClass} type="text" name="empresa" placeholder="Empresa" />
                <input className={inputClass} type="email" name="email" placeholder="Email" required />
                <input className={inputClass} type="text" name="presupuesto" placeholder="Presupuesto aprox." />
              </div>

              <textarea
                name="mensaje"
                className={`${inputClass} mb-3 block w-full resize-y`}
                rows="3"
                placeholder="¿Qué quieres construir?"
                required
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#0A0A0A]/60">Tus datos están seguros</span>

                <button
                  type="submit"
                  className="cursor-pointer rounded-lg bg-[#15803D] px-7 py-[11px] text-[13px] font-bold uppercase tracking-[1px] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0A0A0A] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
                >
                  Enviar →
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="relative z-10 pt-8 text-center text-[13px] text-[#0A0A0A]/60">
          <span>&copy; {new Date().getFullYear()} Ahorrapp</span>
        </div>
      </footer>
    </div>
  )
}

const inputClass =
  'rounded-lg border border-white/60 bg-white/50 px-3.5 py-[11px] font-[\'Plus_Jakarta_Sans\',sans-serif] text-[13px] text-[#0A0A0A] outline-none transition placeholder:text-black/45 focus:border-[#15803D] focus:bg-white/80 focus:shadow-[0_0_0_3px_rgba(74,222,128,0.15)]'
