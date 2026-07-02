export default function ModalVerificacion({ visible, onContinue }) {
  if (visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-[#0d1526] border border-[#e0b855]/10 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl animate-[fadeScaleIn_0.25s_ease_forwards]">

        {/* Success icon */}
        <div className="relative mb-7">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-[#e0b855]/20 blur-xl scale-150" />
          {/* Ring */}
          <div className="relative w-24 h-24 rounded-full border-2 border-[#e0b855]/40 bg-[#e0b855]/10 flex items-center justify-center">
            {/* Checkmark SVG */}
            <svg
              className="w-11 h-11 text-[#e0b855]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-white text-2xl font-semibold mb-2.5">
          Verificación exitosa
        </h2>
        <p className="text-white/40 text-sm leading-relaxed mb-9">
          Tu identidad fue confirmada. Ahora puedes crear una nueva contraseña para tu cuenta.
        </p>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e0b855] to-[#c9a84c] text-[#080c18] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}