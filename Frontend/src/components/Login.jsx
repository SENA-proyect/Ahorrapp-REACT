import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api";

// ── Mini-componente reutilizable para cada campo del formulario ────────────
function Field({ id, label, type, placeholder, name, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-zinc-400 font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Estado del formulario de login
  const [loginForm, setLoginForm] = useState({
    Email: "",
    Password_hash: "",
  });

  // Estado del formulario de registro
  const [registerForm, setRegisterForm] = useState({
    Nombre: "",
    Apellido: "",
    Email: "",
    Password_hash: "",
  });

  // ── Handlers de login ──────────────────────────────────────────────────
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

  // ── Handlers de registro ───────────────────────────────────────────────
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

    // Validación del checkbox
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
        setIsRegister(false); // Vuelve al login tras registro exitoso
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
      <section className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-zinc-950 to-amber-900">

        {/* Tarjeta principal que contiene los dos lados. */}
        <div
          className="flex items-center bg-zinc-900 w-[1000px] h-[580px] rounded-3xl shadow-2xl overflow-hidden"
          style={{ border: "1px solid #27272a" }}
        >

          {/* ── LADO IZQUIERDO: formularios ──────────────────────────── */}
          {/* "overflow-hidden" oculta el formulario que NO está visible. */}
          <div className="overflow-hidden h-[500px] w-[520px] px-10">

            {/*
              Este div es el "slider" que se desliza hacia arriba/abajo.
              "translateY(0)"      → muestra el formulario de Login (posición normal).
              "translateY(-500px)" → sube el contenedor 500px, mostrando el de Registro.

              El operador ternario evalúa "isRegister":
                - Si es true  → aplica la clase de traslación hacia arriba.
                - Si es false → aplica la clase sin traslación (posición 0).
            */}
            <div
              className={`flex flex-col transition-transform duration-700 ease-in-out ${
                isRegister ? "-translate-y-[500px]" : "translate-y-0"
              }`}
            >

              {/* ── FORMULARIO DE LOGIN ──────────────────────── */}
              <div className="h-[500px] flex flex-col justify-center gap-5">

                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
                    Bienvenido de vuelta
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">Ingresa tus datos para continuar</p>
                </div>

                {/* "onSubmit" llama a handleLoginSubmit cuando el usuario presiona Enter o el botón. */}
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">

                  <Field
                    id="login-email"
                    label="Correo electrónico"
                    type="email"
                    name="Email"
                    placeholder="juan@correo.com"
                    value={loginForm.Email}
                    onChange={handleLoginChange}
                  />
                  <Field
                    id="login-password"
                    label="Contraseña"
                    type="password"
                    name="Password_hash"
                    placeholder="••••••••"
                    value={loginForm.Password_hash}
                    onChange={handleLoginChange}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* "accent-amber-400" colorea el checkbox de dorado. */}
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
                    className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 rounded-xl py-3 w-full cursor-pointer transition-all duration-300 font-semibold tracking-wide shadow-md shadow-amber-900 mt-1 disabled:opacity-60"
                  >
                    {cargando ? "Entrando..." : "Entrar"}
                  </button>
                </form>

                <p className="text-sm text-zinc-500 text-center">
                  ¿No tienes cuenta?&nbsp;
                  {/*
                    Al hacer clic, llamamos a setIsRegister(true).
                    Eso cambia "isRegister" a true, React re-renderiza,
                    y el slider se mueve mostrando el formulario de Registro.
                  */}
                  <button
                    onClick={() => { setIsRegister(true); setError(null); }}
                    className="text-amber-400 font-semibold hover:text-amber-300 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>

              {/* ── FORMULARIO DE REGISTRO ───────────────────── */}
              <div className="h-[500px] flex flex-col justify-center gap-4">

                <div className="mb-1">
                  <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Crear cuenta</h2>
                  <p className="text-sm text-zinc-500 mt-1">Únete y empieza ahora</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">

                  {/* Fila con dos campos lado a lado. */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Field
                        id="nombre"
                        label="Nombre"
                        type="text"
                        name="Nombre"
                        placeholder="Juan"
                        value={registerForm.Nombre}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div className="flex-1">
                      <Field
                        id="apellido"
                        label="Apellido"
                        type="text"
                        name="Apellido"
                        placeholder="García"
                        value={registerForm.Apellido}
                        onChange={handleRegisterChange}
                      />
                    </div>
                  </div>

                  <Field
                    id="reg-email"
                    label="Correo electrónico"
                    type="email"
                    name="Email"
                    placeholder="tu@correo.com"
                    value={registerForm.Email}
                    onChange={handleRegisterChange}
                  />
                  <Field
                    id="reg-password"
                    label="Contraseña"
                    type="password"
                    name="Password_hash"
                    placeholder="Mínimo 6 caracteres"
                    value={registerForm.Password_hash}
                    onChange={handleRegisterChange}
                  />

                  {/* Checkbox de términos */}
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
                    className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 rounded-xl py-3 w-full cursor-pointer transition-all duration-300 font-semibold tracking-wide shadow-md shadow-amber-900 disabled:opacity-60"
                  >
                    {cargando ? "Registrando..." : "Crear cuenta"}
                  </button>
                </form>

                <p className="text-sm text-zinc-500 text-center">
                  ¿Ya tienes cuenta?&nbsp;
                  {/* Al hacer clic, setIsRegister(false) vuelve al Login. */}
                  <button
                    onClick={() => { setIsRegister(false); setError(null); }}
                    className="text-amber-400 font-semibold hover:text-amber-300 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>

            </div>
            {/* fin slider */}
          </div>

          {/* ── LADO DERECHO: branding ───────────────────────────────── */}
          {/*
            "style={{ ... }}" en JSX → los estilos en línea se escriben como objeto JavaScript.
            Las propiedades CSS con guión (border-left) se escriben en camelCase (borderLeft).
          */}
          <div
            className="relative flex flex-col items-center justify-center w-[580px] h-[580px] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden"
            style={{ borderLeft: "1px solid #27272a" }}
          >
            {/* Círculos decorativos de fondo. */}
            <div className="absolute w-80 h-80 bg-amber-400 opacity-5 rounded-full -top-16 -right-16" />
            <div className="absolute w-60 h-60 bg-amber-400 opacity-5 rounded-full -bottom-10 -left-10" />

            {/* Logo / nombre de la app. */}
            {/* "select-none" evita que el usuario pueda seleccionar el texto. */}
            <p className="text-amber-400 text-6xl font-black tracking-tighter select-none drop-shadow-lg">
              AHORRAPP
            </p>

            {/* Línea decorativa degradada. */}
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