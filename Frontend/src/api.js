const API_URL = "http://localhost:3000/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, { headers: authHeaders(), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (datos) =>
  fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).then((r) => r.json());

export const loginUser = (datos) =>
  fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).then((r) => r.json());

// ── Movimientos (base) ────────────────────────────────────────────────────────
export const getMovimientos = async () => {
  try {
    const data = await fetchJSON(`${API_URL}/movimientos`);
    return Array.isArray(data) ? data : (data.movimientos ?? []);
  } catch {
    return [];
  }
};

// ── Dashboard (una sola llamada) ──────────────────────────────────────────────
export const getDashboardData = async () => {
  const movimientos = await getMovimientos();

  const sumar = (tipo) =>
    movimientos
      .filter((m) => (m.tipo ?? m.Tipo ?? "").toLowerCase() === tipo)
      .reduce((acc, m) => acc + Number(m.monto ?? m.Monto ?? 0), 0);

  const totalIngresos = sumar("ingreso");
  const totalGastos = sumar("gasto");
  const totalAhorros = sumar("ahorro");
  const balance = totalIngresos - totalGastos;

  return { totalIngresos, totalGastos, totalAhorros, balance };
};

// ── Dependientes ──────────────────────────────────────────────────────────────
export const getDependientes = async () => {
  try {
    return await fetchJSON(`${API_URL}/dependientes`);
  } catch (error) {
    console.error("Error en getDependientes:", error);
    throw error;
  }
};

// ── Categorías ────────────────────────────────────────────────────────────────
export const getCategorias = async () => {
  const data = await fetchJSON(`${API_URL}/categorias`);
  return data.categorias ?? [];
};

export const crearCategoria = (datos) =>
  fetchJSON(`${API_URL}/categorias`, {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const editarCategoria = (id, datos) =>
  fetchJSON(`${API_URL}/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });

export const deshabilitarCategoria = (id) =>
  fetchJSON(`${API_URL}/categorias/${id}/deshabilitar`, { method: "PATCH" });

export const habilitarCategoria = (id) =>
  fetchJSON(`${API_URL}/categorias/${id}/habilitar`, { method: "PATCH" });

// ── Resumen financiero (para el Asistente) ────────────────────────────────────
export const getResumenFinancieroBreve = async () => {
  try {
    const movimientos = await getMovimientos();

    const sumar = (tipo) =>
      movimientos
        .filter((m) => (m.tipo ?? m.tipo_movimiento ?? "").toLowerCase() === tipo)
        .reduce((acc, m) => acc + Number(m.monto ?? 0), 0);

    const ingresosTotales = sumar("ingreso");
    const gastosTotales = sumar("gasto");
    const deudas = movimientos.filter((m) =>
      ["deuda"].includes((m.tipo ?? m.tipo_movimiento ?? "").toLowerCase())
    );
    const ahorros = movimientos.filter((m) =>
      ["ahorro"].includes((m.tipo ?? m.tipo_movimiento ?? "").toLowerCase())
    );

    const lines = [
      "CONTEXTO FINANCIERO REAL DEL USUARIO:",
      `- Ingresos totales de este mes: $${ingresosTotales}`,
      `- Gastos totales de este mes: $${gastosTotales}`,
      `- Balance actual: $${ingresosTotales - gastosTotales}`,
      "",
      "DEUDAS ACTIVAS:",
      deudas.length === 0
        ? "  Sin deudas registradas."
        : deudas
            .map(
              (d) =>
                `  * ${d.descripcion ?? "Deuda"}: $${d.monto} (Estado: ${d.estado ?? "Pendiente"})`
            )
            .join("\n"),
      "",
      "PLANES DE AHORRO:",
      ahorros.length === 0
        ? "  Sin ahorros registrados."
        : ahorros
            .map((a) => `  * ${a.descripcion ?? "Ahorro"}: $${a.monto}`)
            .join("\n"),
    ];

    return lines.join("\n");
  } catch (error) {
    console.error("Error al recopilar el contexto financiero:", error);
    return "No se pudo cargar la información financiera actual del usuario.";
  }
};

// ── Exportar Datos ────────────────────────────────────────────────────────────
export const exportarDatos = async (payload, { onError, onDone } = {}) => {
  try {
    const res = await fetch(`${API_URL}/exportar`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? "Error al exportar datos");
    }

    const contentType = res.headers.get("Content-Type") ?? "";
    const contentDisposition = res.headers.get("Content-Disposition") ?? "";
    const match = contentDisposition.match(/filename\"?=\"?([^;\"]+)/i);
    const filename = match?.[1]?.trim() ?? `reporte_financiero.${payload.formato}`;

    const blob = await res.blob();

    // Detectar respuesta corrupta (JSON/HTML cuando se esperaba binario)
    const isExpectedType =
      contentType.includes("application/pdf") ||
      contentType.includes("text/csv") ||
      payload.formato === "json";

    if (!isExpectedType) {
      const text = await blob.text().catch(() => "");
      try {
        const { error } = JSON.parse(text);
        throw new Error(error ?? "Respuesta inesperada del servidor");
      } catch {
        if (text) throw new Error(text.slice(0, 200));
      }
    }

    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);

    onDone?.();
  } catch (error) {
    console.error("Error en exportarDatos:", error);
    onError?.(error.message);
    throw error;
  }
};