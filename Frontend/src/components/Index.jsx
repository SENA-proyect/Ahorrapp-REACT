import { Link, useNavigate } from 'react-router-dom'

export default function Index() {
  const navigate = useNavigate()

  // const handleSubmit = e => {
  //   e.preventDefault()
  //   console.log('Formulario enviado')
  // }

  const features = [
    ['ING', 'Gestión de ingresos', 'Registra y monitorea todos tus ingresos de manera organizada'],
    ['GST', 'Gestión de gastos', 'Controla tus gastos y evita exceder tu presupuesto'],
    ['AHO', 'Metas de Ahorro', 'Establece objetivos financieros y sigue tu progreso'],
    ['IMP', 'Fondo de Imprevistos', 'Prepárate para gastos inesperados con un fondo de emergencia'],
    ['DEU', 'Control de Deudas', 'Administra tus deudas y programa pagos estratégicos'],
    ['DEP', 'Personas a Cargo', 'Organiza información y gastos de tus dependientes'],
    ['REP', 'Reportes Detallados', 'Genera análisis completos con recomendaciones'],
    ['ACT', 'Registro de Actividad', 'Historial completo de todas tus transacciones'],
    ['ALR', 'Alertas y Recordatorios', 'Notificaciones automáticas y recordatorios personalizados'],
    ['DSH', 'Dashboard Inteligente', 'Visualiza tus finanzas con gráficos y métricas en tiempo real'],
  ]

  const stats = [
    ['10', 'Módulos financieros'],
    ['24/7', 'Monitoreo de tus finanzas'],
    ['100%', 'Control de tus datos'],
  ]

  return (
    <div className="relative min-h-screen w-full bg-[#080c18] font-['Plus_Jakarta_Sans','Segoe_UI',sans-serif] text-white">
      {/* Header */}
      <header className="sticky top-0 z-[100] flex h-[70px] w-full items-center justify-between border-b border-[#e0b855]/15 bg-[#080c18]/90 px-5 backdrop-blur-md md:px-10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tracking-[0.15em] text-[#e0b855]/60">AH·01</span>
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#e0b855]">
            Ahorrapp
          </h2>
        </div>

        <Link to="/Login">
          <button
            className="cursor-pointer rounded-md border-[1.5px] border-[#c9a84c]/70 bg-transparent px-[22px] py-2.5 text-sm font-semibold tracking-[0.01em] text-[#e0b855] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e0b855] hover:bg-[#e0b855] hover:text-[#080c18] hover:shadow-[0_4px_15px_rgba(224,184,85,0.3)]"
            onClick={() => navigate('/Login')}
          >
            Iniciar sesión
          </button>
        </Link>
      </header>

      <main>
        {/* Hero con textura de "papel de libro contable" */}
        <section
          className="relative w-full overflow-hidden px-6 pb-24 pt-28 text-center md:px-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(224,184,85,0.06) 0px, rgba(224,184,85,0.06) 1px, transparent 1px, transparent 48px), radial-gradient(circle at 50% 0%, rgba(224,184,85,0.10) 0%, transparent 55%)',
          }}
        >
          <p className="relative z-10 mb-5 font-mono text-[12px] uppercase tracking-[0.3em] text-[#e0b855]/70">
            Libro contable personal · v1.0
          </p>

          <h1 className="relative z-10 mx-auto mb-6 max-w-4xl text-[clamp(38px,6.5vw,80px)] font-extrabold leading-[1.05] tracking-[-2px] text-white">
            Cada peso, <span className="text-[#e0b855]">registrado</span>.
            <br />
            Cada meta, <span className="text-[#e0b855]">alcanzada</span>.
          </h1>

          <p className="relative z-10 mx-auto mb-10 max-w-xl text-[clamp(15px,1.6vw,18px)] font-normal leading-[1.8] text-[#9ca3af]">
            Ingresos, gastos, ahorros, deudas y dependientes: toda tu vida financiera
            organizada en un solo libro, con la claridad de una hoja de cuentas y
            la potencia de un dashboard en tiempo real.
          </p>

          <div className="relative z-10 flex items-center justify-center gap-4">
            <Link to="/Login">
              <button
                className="cursor-pointer rounded-md bg-[#e0b855] px-8 py-3 text-sm font-bold uppercase tracking-[0.05em] text-[#080c18] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c9a84c] hover:shadow-[0_8px_24px_rgba(224,184,85,0.35)]"
                onClick={() => navigate('/Login')}
              >
                Empezar ahora
              </button>
            </Link>
          </div>

          {/* Fila de stats estilo "totales de cuenta" */}
          <div className="relative z-10 mx-auto mt-20 grid max-w-3xl grid-cols-3 divide-x divide-[#e0b855]/15 border-y border-[#e0b855]/15">
            {stats.map(([value, label]) => (
              <div key={label} className="px-4 py-6">
                <p className="font-mono text-[clamp(22px,3vw,32px)] font-bold text-[#e0b855]">{value}</p>
                <p className="mt-1 text-[12px] leading-[1.4] text-[#8b93a7]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features como líneas de un libro contable */}
        <section className="w-full bg-[#0d1526] px-6 py-24 md:px-10">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.3em] text-[#e0b855]/70">
              Módulos
            </p>
            <h2 className="text-[clamp(26px,3.2vw,40px)] font-extrabold tracking-[-0.03em] text-white">
              Todo lo que necesitas, en una sola cuenta.
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 border-t border-[#e0b855]/15 md:grid-cols-2">
            {features.map(([code, title, description]) => (
              <div
                key={code}
                className="group flex items-start gap-4 border-b border-r-0 border-[#e0b855]/15 px-5 py-6 transition-colors duration-200 hover:bg-[#e0b855]/[0.04] md:border-r md:even:border-r-0"
              >
                <span className="mt-1 shrink-0 font-mono text-[11px] tracking-[0.1em] text-[#c9a84c]/60 transition-colors duration-200 group-hover:text-[#e0b855]">
                  {code}
                </span>
                <div>
                  <p className="text-[0.95rem] font-bold text-white">{title}</p>
                  <p className="mt-1 text-[0.83rem] leading-[1.6] text-[#8b93a7]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#e0b855]/15 bg-[#080c18] px-6 pb-8 pt-20 md:px-10">
        {/* <div className="mx-auto grid max-w-5xl gap-12 border-b border-[#e0b855]/15 pb-16 md:grid-cols-[1fr_1.2fr] md:gap-20">
          <div>
            <div className="mb-4 text-[2.2rem] font-extrabold leading-none tracking-[3px] text-white">
              Ahorrapp<span className="text-[#e0b855]">.</span>
            </div>
            <p className="max-w-[280px] text-sm font-light leading-[1.8] text-[#8b93a7]">
              Tu aliado financiero inteligente.
            </p>
          </div>

          <div>
            <h3 className="mb-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-[#e0b855]">
              Contáctanos
            </h3>
            <p className="mb-6 text-[13px] font-normal text-[#8b93a7]">
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
                <span className="font-mono text-[11px] text-[#8b93a7]">Tus datos están seguros</span>
                <button
                  type="submit"
                  className="cursor-pointer rounded-md bg-[#e0b855] px-7 py-[11px] text-[13px] font-bold uppercase tracking-[1px] text-[#080c18] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c9a84c] hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
                >
                  Enviar →
                </button>
              </div>
            </form>
          </div>
        </div> */}

        <div className="mx-auto max-w-5xl pt-8 text-center font-mono text-[12px] text-[#8b93a7]">
          © {new Date().getFullYear()} Ahorrapp
        </div>
      </footer>
    </div>
  )
}

// const inputClass =
//   'rounded-md border border-[#e0b855]/25 bg-[#0d1526] px-3.5 py-[11px] font-[\'Plus_Jakarta_Sans\',sans-serif] text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#e0b855] focus:shadow-[0_0_0_3px_rgba(224,184,85,0.15)]'