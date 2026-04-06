// Obtener elementos
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const modal = document.getElementById("modal");

// Validación (MUY importante)
if (!openBtn || !closeBtn || !modal) {
  console.warn("Elementos del modal no encontrados");
}

// Funciones reutilizables
function openModal() {
  modal.classList.add("open");
  document.body.style.overflow = "hidden"; // bloquea scroll
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "auto";
}

// Eventos
openBtn?.addEventListener("click", openModal);
closeBtn?.addEventListener("click", closeModal);

// Cerrar con ESC (PRO)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

// Cerrar haciendo click fuera (overlay)
modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});