import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api";

// ── Mini-componente reutilizable para cada campo del formulario ────────────
function Field({ id, label, type, placeholder, name, value, onChange, icon, className }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-zinc-400 font-medium">
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
          className={`w-full bg-[#07152D] border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 transition-colors ${icon ? "pr-10" : ""} ${className ?? ""}`}
        />
        {icon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const [loginForm, setLoginForm] = useState({
    Email: "",
    Password_hash: "",
  });

  const [registerForm, setRegisterForm] = useState({
    Nombre: "",
    Apellido: "",
    Email: "",
    Password_hash: "",
  });

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!loginForm.Email || !loginForm.Password_hash) {
      setError("Por favor completa todos los campos");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await loginUser({
        Email: loginForm.Email,
        Password_hash: loginForm.Password_hash,
      });

      if (respuesta.ok) {
        localStorage.setItem("token", respuesta.token);
        localStorage.setItem("usuario", JSON.stringify(respuesta.usuario));
        navigate("/Dashboard");
      } else {
        setError(respuesta.mensaje || "Error al iniciar sesión");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    if (
      !registerForm.Nombre ||
      !registerForm.Apellido ||
      !registerForm.Email ||
      !registerForm.Password_hash
    ) {
      setError("Todos los campos son obligatorios");
      setCargando(false);
      return;
    }

    const checkbox = document.getElementById("terminos");
    if (!checkbox || !checkbox.checked) {
      setError("Debes aceptar los términos y condiciones.");
      setCargando(false);
      return;
    }

    try {
      const { registerUser } = await import("../api");
      const respuesta = await registerUser(registerForm);
      setCargando(false);

      if (respuesta.ok) {
        setIsRegister(false);
        setError(null);
      } else {
        setError(respuesta.mensaje || "Error al registrarse");
      }
    } catch (err) {
      console.error(err);
      setError("Error en el registro. Intenta de nuevo.");
      setCargando(false);
    }
  };

  return (
    <>

      <section className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-zinc-950 to-amber-900 py-8">
        <div
          className="flex flex-col lg:flex-row items-center bg-gradient-to-br from-[#050F24] to-[#152E5E] w-full max-w-[1000px] mx-4 h-auto lg:h-[580px] rounded-3xl shadow-2xl overflow-hidden"
          style={{ border: "1px solid #27272a" }}
        >
          <div className="overflow-hidden w-full lg:w-[520px] h-auto lg:h-[500px] px-6 lg:px-10 py-8 lg:py-0">

            <div
              className={`flex flex-col transition-transform duration-700 ease-in-out ${
                isRegister ? "lg:-translate-y-[500px]" : "translate-y-0"
              }`}
            >
              <div className={`h-auto lg:h-[500px] flex flex-col justify-center gap-5 ${isRegister ? "hidden lg:flex" : "flex"}`}>
                <div className="mb-5">
                  <p className="text-amber-400 text-sm mb-4 tracking-widest">ACCESO SEGURO</p>
                  <div className="text-3xl lg:text-4xl font-bold text-white flex gap-2 mb-1">
                    <p className="text-white">Bienvenido </p>
                    <p className="text-amber-400">de vuelta.</p>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">Ingresa tus datos para continuar</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                  <Field
                    id="login-email"
                    label="CORREO ELECTRÓNICO"
                    type="email"
                    name="Email"
                    icon={<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffbe33"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="#ffbe33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> <rect x="3" y="5" width="18" height="14" rx="2" stroke="#ffbe33" strokeWidth="2" strokeLinecap="round"></rect> </g></svg>}
                    placeholder="juan@correo.com"
                    value={loginForm.Email}
                    onChange={handleLoginChange}
                    className="bg-[#07152D] hover:border-amber-400"
                  />
                  <Field
                    id="login-password"
                    label="CONTRASEÑA"
                    type="password"
                    name="Password_hash"
                    icon={<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288M7 10.0288V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288" stroke="#ffbe33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>}
                    placeholder="••••••••"
                    value={loginForm.Password_hash}
                    onChange={handleLoginChange}
                    className="bg-[#07152D] hover:border-amber-400"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="recordar" className="w-4 h-4 accent-amber-400 cursor-pointer" />
                      <label htmlFor="recordar" className="text-sm text-zinc-500 cursor-pointer">
                        Recordar sesión
                      </label>
                    </div>
                    <a
                      href="/OlvidarContrasena"
                      className="text-xs text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  {error && !isRegister && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={cargando}
                    className="bg-[#1E4B8F] border border-zinc-600 hover:bg-[#102A56] active:scale-95 text-white rounded-xl py-3 w-full cursor-pointer transition-all duration-300 font-bold tracking-wider shadow-md shadow-zinc-900 mt-1 disabled:opacity-60"
                  >
                    {cargando ? "Entrando..." : "Iniciar Sesión →"}
                  </button>
                </form>

                <p className="text-sm text-zinc-500 text-center">
                  ¿No tienes cuenta?&nbsp;
                  <button
                    onClick={() => { setIsRegister(true); setError(null); }}
                    className="text-amber-400 font-semibold hover:text-amber-300 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
              <div className={`h-auto lg:h-[500px] flex flex-col justify-center gap-4 ${isRegister ? "flex" : "hidden lg:flex"}`}>
                <div className="mb-1">
                  <p className="text-amber-400 text-sm mb-4 tracking-widest">CREA TU CUENTA</p>
                  <div className="text-3xl lg:text-4xl font-bold text-white flex gap-2 mb-1">
                    <p className="text-white">Empieza a</p>
                    <p className="text-amber-400">ahorrar hoy.</p>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">Únete y empieza ahora</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Field
                        id="nombre"
                        label="Nombre"
                        type="text"
                        name="Nombre"
                        icon={<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4ZM14 8C14 6.9 13.1 6 12 6C10.9 6 10 6.9 10 8C10 9.1 10.9 10 12 10C13.1 10 14 9.1 14 8ZM18 18C17.8 17.29 14.7 16 12 16C9.31 16 6.23 17.28 6 18H18ZM4 18C4 15.34 9.33 14 12 14C14.67 14 20 15.34 20 18V20H4V18Z" fill="#ffbe33"></path> </g></svg>}
                        placeholder="Juan"
                        value={registerForm.Nombre}
                        onChange={handleRegisterChange}
                        className="bg-[#07152D] hover:border-amber-400"
                      />
                    </div>
                    <div className="flex-1">
                      <Field
                        id="apellido"
                        label="Apellido"
                        type="text"
                        name="Apellido"
                        icon={<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4ZM14 8C14 6.9 13.1 6 12 6C10.9 6 10 6.9 10 8C10 9.1 10.9 10 12 10C13.1 10 14 9.1 14 8ZM18 18C17.8 17.29 14.7 16 12 16C9.31 16 6.23 17.28 6 18H18ZM4 18C4 15.34 9.33 14 12 14C14.67 14 20 15.34 20 18V20H4V18Z" fill="#ffbe33"></path> </g></svg>}
                        placeholder="García"
                        value={registerForm.Apellido}
                        onChange={handleRegisterChange}
                        className="bg-[#07152D] hover:border-amber-400"
                      />
                    </div>
                  </div>

                  <Field
                    id="reg-email"
                    label="Correo electrónico"
                    type="email"
                    name="Email"
                    icon={<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffbe33"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="#ffbe33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> <rect x="3" y="5" width="18" height="14" rx="2" stroke="#ffbe33" strokeWidth="2" strokeLinecap="round"></rect> </g></svg>}
                    placeholder="tu@correo.com"
                    value={registerForm.Email}
                    onChange={handleRegisterChange}
                    className="bg-[#07152D] hover:border-amber-400"
                  />
                  <Field
                    id="reg-password"
                    label="Contraseña"
                    type="password"
                    name="Password_hash"
                    icon={<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288M7 10.0288V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288" stroke="#ffbe33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>}
                    placeholder="Mínimo 6 caracteres"
                    value={registerForm.Password_hash}
                    onChange={handleRegisterChange}
                    className="bg-[#07152D] hover:border-amber-400"
                  />

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="terminos" className="w-4 h-4 accent-amber-400 cursor-pointer" />
                    <label htmlFor="terminos" className="text-sm text-zinc-500 cursor-pointer">
                      Acepto los <a href="#" className="text-amber-400 hover:underline">Términos y condiciones</a>
                    </label>
                  </div>

                  {error && isRegister && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={cargando}
                    className="bg-[#1E4B8F] border border-zinc-600 hover:bg-[#102A56] active:scale-95 text-white rounded-xl py-3 w-full cursor-pointer transition-all duration-300 font-bold tracking-wide shadow-md shadow-zinc-900 disabled:opacity-60"
                  >
                    {cargando ? "Registrando..." : "Crear cuenta →"}
                  </button>
                </form>

                <p className="text-sm text-zinc-500 text-center pb-2">
                  ¿Ya tienes cuenta?&nbsp;
                  <button
                    onClick={() => { setIsRegister(false); setError(null); }}
                    className="text-amber-400 font-semibold hover:text-amber-300 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>

            </div>
          </div>
          <div
            className="hidden lg:flex relative flex-col items-center justify-center w-full lg:w-[520px] h-[250px] lg:h-[580px] bg-gradient-to-br from-blue-950 via-zinc-900 to-amber-950 overflow-hidden"
            style={{ borderLeft: "1px solid #27272a" }}
          >
            <div className="absolute w-80 h-80 bg-blue-400 opacity-5 rounded-full -top-16 -right-16" />
            <div className="absolute w-60 h-60 bg-blue-400 opacity-5 rounded-full -bottom-10 -left-10" />
            <p className="text-amber-400 text-4xl lg:text-6xl font-black tracking-tighter select-none drop-shadow-lg">
              AHORRAPP
            </p>

            <div
              className="w-60 h-[3px] my-3 rounded-full"
              style={{ background: "linear-gradient(to right, transparent, #fbbf24aa, transparent)" }}
            />

            <p className="text-zinc-500 text-sm mt-6 tracking-widest uppercase">
              Gestión financiera personal.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}