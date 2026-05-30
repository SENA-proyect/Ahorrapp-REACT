const API_URL = "/api";

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerUser = async (datos) => {
  // datos viene con { nombre, apellido, correo, password }
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return response.json();
};

export const loginUser = async (datos) => {
  // datos viene con { correo, password }
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return response.json();
};

// ── Dependientes ────────────────────────────────────────────────────────────────

export const getDependientes = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/dependientes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al obtener dependientes");
    }
    return await res.json(); // array de dependientes
  } catch (error) {
    console.error("Error en API getDependientes:", error);
    throw error;
  }
};

// ── Categorías ────────────────────────────────────────────────────────────────

export const getCategorias = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.categorias ?? [];
};

export const crearCategoria = async (datos) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
  return response.json();
};

export const editarCategoria = async (id, datos) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
  return response.json();
};

export const deshabilitarCategoria = async (id) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/${id}/deshabilitar`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const habilitarCategoria = async (id) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/${id}/habilitar`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// ── Movimientos y Finanzas (Para el Asistente) ────────────────────────────────

export const getMovimientos = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/movimientos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : data.movimientos ?? [];
};

export const getResumenFinancieroBreve = async () => {
  try {
    const movimientos = await getMovimientos();
    const deudas = movimientos.filter((m) => m.tipo === "deuda" || m.tipo_movimiento === "deuda");
    const ahorros = movimientos.filter((m) => m.tipo === "ahorro" || m.tipo_movimiento === "ahorro");

    const ingresosTotales = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

    const gastosTotales = movimientos
      .filter((m) => m.tipo === "gasto")
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

    let contextoTextual = `CONTEXTO FINANCIERO REAL DEL USUARIO:\n`;
    contextoTextual += `- Ingresos totales de este mes: $${ingresosTotales}\n`;
    contextoTextual += `- Gastos totales de este mes: $${gastosTotales}\n`;
    contextoTextual += `- Balance actual: $${ingresosTotales - gastosTotales}\n`;

    contextoTextual += `\nDEUDAS ACTIVAS:\n`;
    if (deudas.length === 0) contextoTextual += "  Sin deudas registradas.\n";
    deudas.forEach((d) => {
      contextoTextual += `  * ${d.descripcion || "Deuda"}: $${d.monto} (Estado: ${d.estado || "Pendiente"})\n`;
    });

    contextoTextual += `\nPLANES DE AHORRO:\n`;
    if (ahorros.length === 0) contextoTextual += "  Sin ahorros registrados.\n";
    ahorros.forEach((a) => {
      contextoTextual += `  * ${a.descripcion || "Ahorro"}: $${a.monto}\n`;
    });

    return contextoTextual;
  } catch (error) {
    console.error("Error al recopilar el contexto financiero:", error);
    return "No se pudo cargar la información financiera actual del usuario.";
  }
};

// ── Exportar Datos ──────────────────────────────────────────────────────────

export const exportarDatos = async (payload, { onError, onDone } = {}) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/exportar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || "Error al exportar datos");
      if (onError) onError(error.message);
      throw error;
    }

    const contentDisposition = response.headers.get("Content-Disposition");
    const contentType = response.headers.get("Content-Type") || "";

    let filename = `reporte_financiero.${payload.formato}`;

    if (contentDisposition) {
      // Regex SIN escapes innecesarios (sin \" dentro de [] )
      const match = contentDisposition.match(/filename\s*=\s*"?([^;\n\r"]+)/iu);
      if (match?.[1]) filename = match[1].trim();
    }

    const blob = await response.blob();

    if (
      !contentType.includes("application/pdf") &&
      !contentType.includes("text/csv") &&
      payload.formato !== "json"
    ) {
      const text = await blob.text().catch(() => "");
      try {
        const asJson = JSON.parse(text);
        throw new Error(asJson.error || "Respuesta inesperada del servidor al exportar");
      } catch {
        if (text) throw new Error(text.slice(0, 200));
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);

    if (onDone) onDone();
  } catch (error) {
    console.error("Error en exportarDatos:", error);
    if (onError) onError(error.message);
    throw error;
  }
};

export const getHistorialExportaciones = async (params = {}) => {
  const token = localStorage.getItem("token");
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/exportar?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al obtener historial de exportaciones");
  }

  return response.json();
};

// ── Noticias ────────────────────────────────────────────────────────────────

export const getNoticiasEconomicas = async ({ categoria = "economia", pagina = 1 } = {}) => {
  const token = localStorage.getItem("token");
  const url = `${API_URL}/noticias?categoria=${encodeURIComponent(categoria)}&pagina=${encodeURIComponent(pagina)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al obtener noticias");
  }

  return res.json();
};

export const eliminarExportacion = async (id) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/exportar/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al eliminar exportación");
  }

  return response.json();
};

// ── Verificación de Email (NUEVO) ─────────────────────────────────────────────

export const verifyEmailCode = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, code: data.code }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error verificando código:", error);
    return { ok: false, mensaje: "Error de conexión" };
  }
};

export const resendVerificationCode = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/resend-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error reenviando código:", error);
    return { ok: false, mensaje: "Error de conexión" };
  }
};

// ── Categorías por Módulo (NUEVO) ─────────────────────────────────────────────

export const getGastosPorCategoria = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/gastos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.categorias ?? [];
};

export const getIngresosPorCategoria = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/ingresos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.categorias ?? [];
};

export const getAhorrosPorCategoria = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/ahorros`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.categorias ?? [];
};

export const getImprevistosPorCategoria = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/imprevistos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.categorias ?? [];
};

export const getDeudasPorCategoria = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias/deudas`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.categorias ?? [];
};

// ── Admin Panel (NUEVO) ────────────────────────────────────────────────────────

export const getUsuariosPanelAdmin = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/auth/usuarios/PanelAdmin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const getDependientesPanelAdmin = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/auth/dependientes/PanelAdmin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

