import { useState } from "react";

export default function RestablecerContra() {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const rules = [
    { label: "Mínimo 8 caracteres", pass: newPass.length >= 8 },
    { label: "Al menos una mayúscula", pass: /[A-Z]/.test(newPass) },
    { label: "Al menos un número", pass: /[0-9]/.test(newPass) },
  ];

  const allRules = rules.every((r) => r.pass);
  const matches = newPass && confirmPass && newPass === confirmPass;
  const canSubmit = allRules && matches;

  const strength = rules.filter((r) => r.pass).length;
  const strengthLabel = ["", "Débil", "Regular", "Fuerte"][strength];
  const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-emerald-500"][strength];
  const strengthWidth = ["w-0", "w-1/3", "w-2/3", "w-full"][strength];

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
            A
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-wide">AhorrApp</span>
        </div>

        {/* Heading */}
        <h1 className="text-white text-3xl font-semibold mb-2">Nueva contraseña</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          Elige una contraseña segura para proteger tu cuenta.
        </p>

        {/* Nueva contraseña */}
        <div className="mb-3">
          <label className="block text-white/45 text-[10px] font-medium uppercase tracking-widest mb-2">
            Nueva contraseña
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">
              🔒
            </span>
            <input
              type={showNew ? "text" : "password"}
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 pl-9 pr-11 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:bg-violet-500/[0.06] transition-all"
            />
            <button
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm"
            >
              {showNew ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* Strength bar */}
        {newPass.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/30 text-[10px] uppercase tracking-widest">Seguridad</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                strength === 1 ? "text-red-400" : strength === 2 ? "text-amber-400" : "text-emerald-400"
              }`}>{strengthLabel}</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${strengthColor} ${strengthWidth}`} />
            </div>
          </div>
        )}

        {/* Rules checklist */}
        {newPass.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-5">
            {rules.map((rule) => (
              <div key={rule.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  rule.pass ? "bg-emerald-500/20 border border-emerald-500/40" : "border border-white/10"
                }`}>
                  {rule.pass && (
                    <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs transition-colors ${rule.pass ? "text-emerald-400" : "text-white/30"}`}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Confirmar contraseña */}
        <div className="mb-7">
          <label className="block text-white/45 text-[10px] font-medium uppercase tracking-widest mb-2">
            Confirmar contraseña
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">
              🔒
            </span>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className={`w-full bg-white/[0.04] border rounded-xl py-3.5 pl-9 pr-11 text-white text-sm placeholder:text-white/25 outline-none transition-all ${
                confirmPass
                  ? matches
                    ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                    : "border-red-500/50 bg-red-500/[0.04]"
                  : "border-white/10 focus:border-violet-500/60 focus:bg-violet-500/[0.06]"
              }`}
            />
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm"
            >
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>
          {confirmPass && !matches && (
            <p className="text-red-400 text-xs mt-1.5">Las contraseñas no coinciden</p>
          )}
        </div>

        {/* Submit */}
        <button
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl text-sm font-semibold transition-all ${
            canSubmit
              ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:opacity-90 active:scale-[0.98]"
              : "bg-white/[0.05] text-white/20 cursor-not-allowed"
          }`}
        >
          Guardar contraseña
        </button>
      </div>
    </div>
  );
}