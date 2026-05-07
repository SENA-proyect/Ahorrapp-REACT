import { useState } from "react";

export default function OlvidarContra() {
  const [email, setEmail] = useState("");

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b14] relative overflow-hidden px-4">

      {/* Ambient glows */}
      <div className="absolute -top-32 -left-24 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-16 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-3xl p-10 backdrop-blur-xl">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            LULU
          </div>
          <p className="text-center text-white/90 text-sm font-semibold tracking-wide">AhorrApp</p>
        </div>

        {/* Heading */}
        <h1 className="text-white text-3xl font-semibold mb-2.5">¿Olvidaste tu contraseña?</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          No te preocupes. Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
        </p>

        {/* Email field */}
        <div className="mb-4">
          <label className="block text-white/45 text-[10px] font-medium uppercase tracking-widest mb-2">
            Correo electrónico
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">
              ✉
            </span>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 pl-9 pr-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:bg-violet-500/[0.06] transition-all"
            />
          </div>
        </div>

        {/* Info hint */}
        <div className="flex items-start gap-2.5 bg-violet-500/[0.07] border border-violet-500/20 rounded-xl px-4 py-3.5 mb-8">
          <span className="text-violet-400 text-sm mt-px flex-shrink-0">ℹ</span>
          <p className="text-violet-300/70 text-xs leading-relaxed">
            Recibirás un código de 6 dígitos en tu bandeja de entrada. Revisa también tu carpeta de spam.
          </p>
        </div>

        {/* Submit button */}
        <button
          disabled={!isValid}
          className={`w-full py-4 rounded-xl text-sm font-semibold transition-all mb-6 ${
            isValid
              ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:opacity-90 active:scale-[0.98]"
              : "bg-white/[0.05] text-white/20 cursor-not-allowed"
          }`}
        >
          Enviar código
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-white/30">
          ¿Recordaste tu contraseña?{" "}
          <a href="/Login">
            <span className="text-violet-400 font-medium cursor-pointer hover:text-violet-300 transition-colors">
              Iniciar sesión
            </span>
          </a>
        </p>
      </div>
    </div>
  );
}