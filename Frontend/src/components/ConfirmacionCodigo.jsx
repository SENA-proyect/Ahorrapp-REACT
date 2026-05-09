import { useState, useRef, useEffect } from "react";

export default function CodigoRecu() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = () => {
    if (!canResend) return;
    setOtp(["", "", "", "", "", ""]);
    setCountdown(30);
    setCanResend(false);
    inputs.current[0]?.focus();
  };

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const filled = otp.filter(Boolean).length;
  const allFilled = filled === 6;

  const handleSubmit = () => {
    if (!allFilled) return;
    setShowModal(true);
  };

  const handleContinue = () => {
    setShowModal(false);
    setVerified(true);
  };

  // Redirige a la vista de restablecer contraseña
  if (verified) return <RestablecerContra />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b14] relative overflow-hidden px-4">

      {/* Ambient glows */}
      <div className="absolute -top-24 -right-16 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-3xl p-10 backdrop-blur-xl">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-9">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-wide">AhorrApp</span>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-2xl mb-6">
          🔐
        </div>

        {/* Heading */}
        <h1 className="text-white text-3xl font-semibold mb-2.5">Verificar tu identidad</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-9">
          Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
        </p>

        {/* OTP inputs */}
        <div className="flex justify-between gap-3 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border bg-white/[0.04] text-violet-300 outline-none caret-violet-400 transition-all
                ${digit
                  ? "border-violet-500/55 bg-violet-500/[0.07]"
                  : "border-white/10 focus:border-violet-500/70 focus:bg-violet-500/[0.08] focus:scale-105"
                }`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.06] rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-200"
            style={{ width: `${(filled / 6) * 100}%` }}
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className={`w-full py-4 rounded-xl text-sm font-semibold transition-all mb-6
            ${allFilled
              ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:opacity-90 active:scale-[0.98]"
              : "bg-white/[0.05] text-white/20 cursor-not-allowed"
            }`}
        >
          Restablecer contraseña
        </button>

        {/* Resend */}
        <p className="text-center text-xs text-white/30">
          ¿No recibiste el código?{" "}
          <span
            onClick={handleResend}
            className={`font-medium transition-colors ${
              canResend
                ? "text-violet-400 cursor-pointer hover:text-violet-300"
                : "text-white/20 cursor-default"
            }`}
          >
            {canResend ? "Reenviar código" : `Reenviar en ${countdown}s`}
          </span>
        </p>
      </div>
    </div>
  );
}