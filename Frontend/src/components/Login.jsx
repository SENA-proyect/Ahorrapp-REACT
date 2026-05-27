import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, verifyEmailCode, resendVerificationCode, registerUser } from "../api";
import { useTheme } from "../hooks/useTheme";

function Field({ id, label, type, placeholder, name, value, onChange, icon, className, autoComplete, isDarkMode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`w-full rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:border-amber-400 ${icon ? "pr-10" : ""} ${
            isDarkMode
              ? 'bg-[#07152D] border border-zinc-700 text-zinc-100 placeholder:text-zinc-600'
              : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-200'
          } ${className ?? ""}`}
        />
        {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">{icon}</span>}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [isRegister, setIsRegister] = useState(location.pathname.toLowerCase() === '/registro');

  // Estados para verificación
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    setIsRegister(location.pathname.toLowerCase() === '/registro');
  }, [location.pathname]);

  const [loginForm, setLoginForm] = useState({ Email: "", Password_hash: "" });
  const [registerForm, setRegisterForm] = useState({ Nombre: "", Apellido: "", Email: "", Password_hash: "" });

  const loginFieldMap = { loginEmail: "Email", loginPassword: "Password_hash" };
  const registerFieldMap = { registerNombre: "Nombre", registerApellido: "Apellido", registerEmail: "Email", registerPassword: "Password_hash" };

  const handleLoginChange = (e) => {
    const key = loginFieldMap[e.target.name] ?? e.target.name;
    setLoginForm({ ...loginForm, [key]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    const key = registerFieldMap[e.target.name] ?? e.target.name;
    setRegisterForm({ ...registerForm, [key]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!loginForm.Email || !loginForm.Password_hash) return setError("Por favor completa todos los campos");
    setCargando(true);
    try {
      const respuesta = await loginUser(loginForm);
      if (respuesta.ok) {
        localStorage.setItem("token", respuesta.token);
        localStorage.setItem("usuario", JSON.stringify(respuesta.usuario));
        navigate("/Dashboard");
      } else setError(respuesta.mensaje || "Error al iniciar sesión");
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    if (!registerForm.Nombre || !registerForm.Apellido || !registerForm.Email || !registerForm.Password_hash) {
      setError("Todos los campos son obligatorios");
      return setCargando(false);
    }
    const checkbox = document.getElementById("terminos");
    if (!checkbox?.checked) {
      setError("Debes aceptar los términos");
      return setCargando(false);
    }
    try {
      const respuesta = await registerUser(registerForm);
      if (respuesta.ok) {
        setRegisteredEmail(registerForm.Email);
        setShowVerification(true);
      } else setError(respuesta.mensaje || "Error al registrarse");
    } catch {
      setError("Error en el registro");
    } finally {
      setCargando(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    if (!verificationCode) return setError("Ingresa el código de 6 dígitos");
    try {
      const respuesta = await verifyEmailCode({ email: registeredEmail, code: verificationCode });
      if (respuesta.ok) {
        localStorage.setItem("token", respuesta.token);
        localStorage.setItem("usuario", JSON.stringify(respuesta.usuario));
        navigate("/Dashboard");
      } else setError(respuesta.mensaje || "Código inválido");
    } catch {
      setError("Error al verificar");
    } finally {
      setCargando(false);
    }
  };

  const handleResend = async () => {
    setCargando(true);
    try {
      const res = await resendVerificationCode({ email: registeredEmail });
      setError(res.mensaje || "Código reenviado");
    } catch {
      setError("Error al reenviar");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section
      className={`w-screen min-h-screen flex items-center justify-center py-8 transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
      }}
    >
      <div
        className={`flex flex-col lg:flex-row items-center w-full max-w-[1000px] mx-4 h-auto lg:h-[580px] rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#050F24] to-[#152E5E]'
            : 'bg-white'
        }`}
        style={{ border: isDarkMode ? "1px solid #27272a" : "1px solid #e5e7eb" }}
      >
        {/* LADO IZQUIERDO (Formularios) */}
        <div className="overflow-hidden w-full lg:w-[520px] h-auto lg:h-[500px] px-6 lg:px-10 py-8 lg:py-0">
          <div className={`flex flex-col transition-transform duration-700 ease-in-out ${isRegister ? "lg:-translate-y-[500px]" : "translate-y-0"}`}>

            {/* LOGIN */}
            <div className={`h-auto lg:h-[500px] flex flex-col justify-center gap-5 ${isRegister ? "hidden lg:flex" : "flex"}`}>
              <div className="mb-5">
                <p className="text-amber-500 text-sm mb-4 tracking-widest">ACCESO SEGURO</p>
                <div className={`text-3xl lg:text-4xl font-bold flex gap-2 mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <p>Bienvenido</p>
                  <p className="text-amber-500">de vuelta.</p>
                </div>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                  Ingresa tus datos para continuar
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5" autoComplete="off">
                <input type="text" name="fakeusername" autoComplete="username" className="hidden" />
                <input type="password" name="fakepassword" autoComplete="new-password" className="hidden" />

                <Field
                  id="login-email"
                  label="CORREO ELECTRÓNICO"
                  type="email"
                  name="loginEmail"
                  autoComplete="off"
                  placeholder="juan@correo.com"
                  value={loginForm.Email}
                  onChange={handleLoginChange}
                  isDarkMode={isDarkMode}
                />
                <Field
                  id="login-password"
                  label="CONTRASEÑA"
                  type="password"
                  name="loginPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={loginForm.Password_hash}
                  onChange={handleLoginChange}
                  isDarkMode={isDarkMode}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="recordar" className="w-4 h-4 accent-amber-400 cursor-pointer" />
                    <label htmlFor="recordar" className={`text-sm cursor-pointer ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                      Recordar sesión
                    </label>
                  </div>
                  <a href="/OlvidarContrasena" className="text-xs text-amber-500 hover:text-amber-400 hover:underline transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {error && !isRegister && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={cargando}
                  className={`rounded-xl py-3 w-full cursor-pointer transition-all duration-300 font-bold tracking-wider shadow-md mt-1 disabled:opacity-60 active:scale-95 ${
                    isDarkMode
                      ? 'bg-[#1E4B8F] border border-zinc-600 hover:bg-[#102A56] text-white shadow-zinc-900'
                      : 'bg-blue-600 border border-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                  }`}
                >
                  {cargando ? "Entrando..." : "Iniciar Sesión →"}
                </button>
              </form>

              <p className={`text-sm text-center ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                ¿No tienes cuenta? &nbsp;
                <button
                  onClick={() => { setIsRegister(true); setError(null); }}
                  className="text-amber-500 font-semibold hover:text-amber-400 transition-colors cursor-pointer bg-transparent border-none"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>

            {/* REGISTRO */}
            <div className={`h-auto lg:h-[500px] flex flex-col justify-center gap-4 ${isRegister ? "flex" : "hidden lg:flex"}`}>
              <div className="mb-1">
                <p className="text-amber-500 text-sm mb-4 tracking-widest">CREA TU CUENTA</p>
                <div className={`text-3xl lg:text-4xl font-bold flex gap-2 mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <p>Empieza a</p>
                  <p className="text-amber-500">ahorrar hoy.</p>
                </div>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                  Únete y empieza ahora
                </p>
              </div>

              {showVerification ? (
                <div className={`rounded-xl p-5 flex flex-col gap-4 ${
                  isDarkMode
                    ? 'bg-blue-900/30 border border-amber-400/50'
                    : 'bg-amber-50 border border-amber-300'
                }`}>
                  <p className="text-amber-500 text-sm font-semibold">
                    📧 Enviamos un código a: <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{registeredEmail}</span>
                  </p>
                  <Field
                    id="verification-code"
                    label="CÓDIGO DE VERIFICACIÓN"
                    type="text"
                    name="verificationCode"
                    placeholder="Ingresa los 6 dígitos"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    isDarkMode={isDarkMode}
                  />
                  <div className="flex gap-3 justify-between">
                    <button type="button" onClick={handleResend} className="text-xs text-amber-500 hover:text-amber-400 underline transition-colors">
                      Reenviar código
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowVerification(false); setVerificationCode(""); setError(null); }}
                      className={`text-xs transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-zinc-400' : 'text-gray-500 hover:text-gray-600'}`}
                    >
                      Cambiar email
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <button
                    type="button"
                    onClick={handleVerifySubmit}
                    disabled={cargando}
                    className="bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl py-2.5 w-full cursor-pointer transition-all duration-300 font-bold tracking-wide disabled:opacity-60"
                  >
                    {cargando ? "Verificando..." : "Verificar código →"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4" autoComplete="off">
                  <input type="text" name="fakeusername2" autoComplete="off" className="hidden" />
                  <input type="password" name="fakepassword2" autoComplete="new-password" className="hidden" />

                  <div className="flex gap-4">
                    <Field
                      id="nombre"
                      label="Nombre"
                      type="text"
                      name="registerNombre"
                      placeholder="Juan"
                      value={registerForm.Nombre}
                      onChange={handleRegisterChange}
                      isDarkMode={isDarkMode}
                    />
                    <Field
                      id="apellido"
                      label="Apellido"
                      type="text"
                      name="registerApellido"
                      placeholder="García"
                      value={registerForm.Apellido}
                      onChange={handleRegisterChange}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <Field
                    id="reg-email"
                    label="Correo electrónico"
                    type="email"
                    name="registerEmail"
                    placeholder="tu@correo.com"
                    value={registerForm.Email}
                    onChange={handleRegisterChange}
                    isDarkMode={isDarkMode}
                  />
                  <Field
                    id="reg-password"
                    label="Contraseña"
                    type="password"
                    name="registerPassword"
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerForm.Password_hash}
                    onChange={handleRegisterChange}
                    isDarkMode={isDarkMode}
                  />

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="terminos" className="w-4 h-4 accent-amber-400 cursor-pointer" />
                    <label htmlFor="terminos" className={`text-sm cursor-pointer ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                      Acepto los <a href="#" className="text-amber-500 hover:underline">Términos y condiciones</a>
                    </label>
                  </div>

                  {error && isRegister && <p className="text-red-500 text-sm text-center">{error}</p>}

                  <button
                    type="submit"
                    disabled={cargando}
                    className={`rounded-xl py-3 w-full cursor-pointer transition-all duration-300 font-bold tracking-wide shadow-md disabled:opacity-60 active:scale-95 ${
                      isDarkMode
                        ? 'bg-[#1E4B8F] border border-zinc-600 hover:bg-[#102A56] text-white shadow-zinc-900'
                        : 'bg-blue-600 border border-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                    }`}
                  >
                    {cargando ? "Registrando..." : "Crear cuenta →"}
                  </button>
                </form>
              )}

              <p className={`text-sm text-center pb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                ¿Ya tienes cuenta? &nbsp;
                <button
                  onClick={() => { setIsRegister(false); setError(null); setShowVerification(false); }}
                  className="text-amber-500 font-semibold hover:text-amber-400 transition-colors cursor-pointer bg-transparent border-none"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* LADO DERECHO (Branding) */}
        <div
          className={`hidden lg:flex relative flex-col items-center justify-center w-full lg:w-[520px] h-[250px] lg:h-[580px] overflow-hidden transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gradient-to-br from-blue-950 via-zinc-900 to-amber-950'
              : 'bg-gradient-to-br from-amber-50 via-blue-50 to-white'
          }`}
          style={{ borderLeft: isDarkMode ? "1px solid #27272a" : "1px solid #e5e7eb" }}
        >
          <div className={`absolute w-80 h-80 rounded-full -top-16 -right-16 ${isDarkMode ? 'bg-blue-400 opacity-5' : 'bg-amber-300 opacity-20'}`} />
          <div className={`absolute w-60 h-60 rounded-full -bottom-10 -left-10 ${isDarkMode ? 'bg-blue-400 opacity-5' : 'bg-blue-300 opacity-20'}`} />

          <p className="text-amber-500 text-4xl lg:text-6xl font-black tracking-tighter select-none drop-shadow-lg">
            AHORRAPP
          </p>
          <div className="w-60 h-[3px] my-3 rounded-full" style={{ background: "linear-gradient(to right, transparent, #fbbf24aa, transparent)" }} />
          <p className={`text-sm mt-6 tracking-widest uppercase ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            Gestión financiera personal.
          </p>
        </div>
      </div>
    </section>
  );
}