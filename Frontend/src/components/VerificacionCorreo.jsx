// Importamos useRef y useState desde React.
//
// "useRef"   → nos da una referencia directa a un elemento del DOM (como un input).
//              Es como hacer document.getElementById() pero a la manera de React.
//              A diferencia de useState, cambiar un ref NO hace que React redibuje el componente.
//
// "useState" → guarda datos que, cuando cambian, hacen que React redibuje el componente.
//              Lo usamos para guardar los 6 dígitos del código.
import { useRef, useState } from "react";

// Definimos y exportamos el componente principal.
export default function ConfirmarCodigo() {

  // ─── ESTADO ───────────────────────────────────────────────────────────────
  //
  // "useState(['', '', '', '', '', ''])" crea un array de 6 strings vacíos.
  // Cada posición del array representa un dígito del código (del 0 al 5).
  // - "digits"     → el array con los valores actuales de cada input
  // - "setDigits"  → la función para actualizar ese array
  const [digits, setDigits] = useState(['', '', '', '', '', '']);

  // ─── REFS ─────────────────────────────────────────────────────────────────
  //
  // "useRef([])" crea un array vacío que usaremos para guardar referencias
  // a cada uno de los 6 inputs del código.
  //
  // Cuando escribamos "inputRefs.current[0]" obtenemos el primer input del DOM,
  // "inputRefs.current[1]" el segundo, y así hasta el sexto.
  //
  // Esto nos permite hacer .focus() en cualquier input desde JavaScript,
  // que es exactamente lo que necesitamos para saltar entre casillas.
  const inputRefs = useRef([]);

  // ─── FUNCIONES ────────────────────────────────────────────────────────────

  // Esta función se llama cada vez que el usuario escribe en un input.
  //
  // Recibe:
  //   - "value" → el carácter que el usuario escribió
  //   - "index" → la posición del input en el array (0 a 5)
  const handleInput = (value, index) => {

    // Solo permitimos dígitos del 0 al 9.
    // "isNaN(value)" devuelve true si "value" NO es un número.
    // "value.trim() === ''" verifica que no sea un espacio vacío.
    // Si alguna de las dos condiciones es true, salimos de la función sin hacer nada.
    if (isNaN(value) || value.trim() === '') return;

    // Creamos una COPIA del array "digits" usando el spread operator "...".
    // Nunca modificamos el estado directamente; siempre creamos una copia primero.
    // Esto es una regla importante en React para que detecte los cambios correctamente.
    const newDigits = [...digits];

    // Guardamos el nuevo dígito en la posición correcta del array.
    // "value.slice(-1)" toma solo el ÚLTIMO carácter escrito,
    // por si el usuario pega más de un número a la vez.
    newDigits[index] = value.slice(-1);

    // Actualizamos el estado con el nuevo array.
    // React detecta el cambio y redibuja el componente.
    setDigits(newDigits);

    // Si el índice actual NO es el último input (índice 5),
    // movemos el foco al siguiente input automáticamente.
    // "inputRefs.current[index + 1]" es el siguiente input en el DOM.
    // ".focus()" lo activa para que el usuario pueda seguir escribiendo.
    if (index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Esta función se llama cuando el usuario presiona una tecla en un input.
  // La usamos para detectar el "Backspace" (borrar) y retroceder al input anterior.
  //
  // Recibe:
  //   - "e"     → el objeto del evento de teclado (contiene qué tecla se presionó)
  //   - "index" → la posición del input actual (0 a 5)
  const handleKeyDown = (e, index) => {

    // "e.key" contiene el nombre de la tecla presionada.
    // Si fue "Backspace" Y el input actual está vacío Y no es el primero (index > 0):
    if (e.key === 'Backspace' && digits[index] === '' && index > 0) {

      // Movemos el foco al input ANTERIOR.
      // "index - 1" es la posición del input de atrás.
      inputRefs.current[index - 1].focus();
    }
  };

  // Esta función se llama cuando el usuario hace clic en "Confirmar código".
  // "e.preventDefault()" evita el comportamiento por defecto del formulario (recargar página).
  const handleSubmit = (e) => {
    e.preventDefault();

    // ".join('')" une todos los dígitos del array en un solo string.
    // Por ejemplo: ['1','2','3','4','5','6'] → "123456"
    const code = digits.join('');
    console.log("Código ingresado:", code);
    // Aquí conectarías con tu backend para verificar el código.
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (

    // El body original tenía las clases de fondo directamente.
    // En React lo ponemos en un div contenedor que ocupa toda la pantalla.
    <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-zinc-950 to-amber-900">

      <main className="flex items-center justify-center px-4">

        {/*
          "border-t-4 border-t-amber-400" → línea dorada en el borde superior de la tarjeta.
          "backdrop-blur-xl"              → efecto de vidrio esmerilado (blur del fondo).
          "bg-white/5"                    → fondo blanco con 5% de opacidad (casi transparente).
          "border-white/10"              → borde blanco con 10% de opacidad.
          "hover:-translate-y-1"         → sube 1px al hacer hover (efecto flotante).
          "hover:shadow-[...]"           → sombra dorada personalizada al hacer hover.
        */}
        <section className="flex flex-col gap-6 p-10 w-full max-w-md rounded-3xl border border-white/10 border-t-4 border-t-amber-400 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(251,191,36,0.2)]">

          {/* ── Encabezado ── */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Confirma tu código
            </h1>
            <p className="text-sm text-zinc-400">
              Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
            </p>
          </div>

          {/* ── Inputs del código ── */}
          {/*
            ".map()" recorre el array "digits" y por cada elemento genera un input.
            Recibe dos parámetros:
              - "digit" → el valor actual de esa posición (puede ser '' o un número)
              - "i"     → el índice de esa posición (0, 1, 2, 3, 4 o 5)

            Esto reemplaza los 6 inputs repetidos del HTML original.
            En React preferimos generar elementos dinámicamente en lugar de repetir código.
          */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between gap-3">
              {digits.map((digit, i) => (
                <input
                  // "key" es obligatorio cuando usas .map() en React.
                  // Le dice a React cómo identificar cada elemento de la lista.
                  // Usamos el índice "i" porque los inputs no tienen un ID único propio.
                  key={i}

                  // "ref" conecta este input con la posición "i" del array inputRefs.
                  // Así podemos acceder a él más tarde con inputRefs.current[i].
                  // La función "(el) => ..." se ejecuta cuando React monta el input en el DOM.
                  ref={(el) => (inputRefs.current[i] = el)}

                  type="text"
                  inputMode="numeric"
                  maxLength={1}

                  // "value={digit}" hace que el input sea "controlado" por React.
                  // Eso significa que su valor siempre refleja el estado "digits[i]".
                  value={digit}

                  // "onChange" se dispara cuando el usuario escribe.
                  // "e.target.value" es el texto actual del input.
                  onChange={(e) => handleInput(e.target.value, i)}

                  // "onKeyDown" se dispara cuando el usuario presiona una tecla.
                  onKeyDown={(e) => handleKeyDown(e, i)}

                  // "caretColor: 'transparent'" oculta el cursor por defecto.
                  // Lo mostramos en dorado al hacer focus con la clase de Tailwind.
                  // En JSX, "style" recibe un objeto JavaScript, no una cadena CSS.
                  style={{ caretColor: 'transparent' }}
                  onFocus={(e) => (e.target.style.caretColor = '#fbbf24')}
                  onBlur={(e) => (e.target.style.caretColor = 'transparent')}

                  className="w-12 h-14 text-center text-xl font-bold text-zinc-100 bg-zinc-800/60 border border-zinc-700 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all duration-300"
                />
              ))}
            </div>

            {/* ── Botón principal ── */}
            <button
              type="submit"
              className="w-full mt-6 bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 font-semibold tracking-wide rounded-xl py-3 cursor-pointer transition-all duration-300 shadow-md shadow-amber-900/50"
            >
              Confirmar código
            </button>
          </form>

          {/* ── Separador ── */}
          {/*
            Este separador es la línea con "o" en el centro.
            "flex-1" hace que cada <hr> ocupe el espacio restante a los lados del texto.
          */}
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-zinc-700" />
            <span className="text-xs text-zinc-600 uppercase tracking-widest">o</span>
            <hr className="flex-1 border-zinc-700" />
          </div>

          {/* ── Acciones secundarias ── */}
          <div className="flex flex-col gap-3">

            {/* Botón de reenviar código. */}
            {/* "onClick" maneja el clic; aquí conectarías la lógica de reenvío. */}
            <button
              onClick={() => console.log("Reenviar código")}
              className="w-full border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 font-medium rounded-xl py-3 cursor-pointer transition-all duration-300 bg-transparent"
            >
              Reenviar código
            </button>

            {/* Enlace de volver. */}
            {/*
              En HTML era un <a href="...">.
              En React con React Router usarías <Link to="...">.
              Por ahora lo dejamos como <a> para no asumir qué router usas.
            */}
            <a
              href="/RecuperarContraseña"
              className="w-full border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 font-medium rounded-xl py-3 cursor-pointer transition-all duration-300 bg-transparent text-center"
            >
              ← Volver
            </a>

          </div>

        </section>

      </main>

    </div>
  );
}