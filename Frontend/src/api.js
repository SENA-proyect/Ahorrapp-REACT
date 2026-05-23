const API_URL = "http://localhost:3000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerUser = async (datos) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  return response.json();
};

export const loginUser = async (datos) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  return response.json();
};

export const getDependientes = async () => {
  const response = await fetch(`${API_URL}/dependientes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.mensaje || "Error al obtener dependientes");
  }

  return response.json();
};

export const getCategorias = async () => {
  const response = await fetch(`${API_URL}/categorias`, {
    headers: authHeaders(),
  });
  const data = await response.json();

  return data.categorias ?? [];
};

export const getGastosPorCategoria = async () => {
  const response = await fetch(`${API_URL}/categorias/gastos`, {
    headers: authHeaders(),
  });
  const data = await response.json();

  return data.categorias ?? [];
};
export const getIngresosPorCategoria = async () => {
  const response = await fetch(`${API_URL}/categorias/ingresos`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  return data.categorias ?? [];
};
export const getAhorrosPorCategoria = async () => {
  const response = await fetch(`${API_URL}/categorias/ahorros`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  return data.categorias ?? [];
};
export const getImprevistosPorCategoria = async () => {
  const response = await fetch(`${API_URL}/categorias/imprevistos`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  return data.categorias ?? [];
};
export const getDeudasPorCategoria = async () => {
  const response = await fetch(`${API_URL}/categorias/deudas`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  return data.categorias ?? [];
};

export const crearCategoria = async (datos) => {
  const response = await fetch(`${API_URL}/categorias`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(datos),
  });

  return response.json();
};

export const editarCategoria = async (id, datos) => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(datos),
  });

  return response.json();
};

export const deshabilitarCategoria = async (id) => {
  const response = await fetch(`${API_URL}/categorias/${id}/deshabilitar`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  return response.json();
};

export const habilitarCategoria = async (id) => {
  const response = await fetch(`${API_URL}/categorias/${id}/habilitar`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  return response.json();
};

export const getMovimientos = async () => {
  const response = await fetch(`${API_URL}/movimientos`, {
    headers: authHeaders(),
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.movimientos || [];
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

    let contextoTextual = "CONTEXTO FINANCIERO REAL DEL USUARIO:\n";
    contextoTextual += `- Ingresos totales de este mes: $${ingresosTotales}\n`;
    contextoTextual += `- Gastos totales de este mes: $${gastosTotales}\n`;
    contextoTextual += `- Balance actual: $${ingresosTotales - gastosTotales}\n`;

    contextoTextual += "\nDEUDAS ACTIVAS:\n";
    if (deudas.length === 0) contextoTextual += "  Sin deudas registradas.\n";
    deudas.forEach((d) => {
      contextoTextual += `  * ${d.descripcion || "Deuda"}: $${d.monto} (Estado: ${d.estado || "Pendiente"})\n`;
    });

    contextoTextual += "\nPLANES DE AHORRO:\n";
    if (ahorros.length === 0) contextoTextual += "  Sin ahorros registrados.\n";
    ahorros.forEach((a) => {
      contextoTextual += `  * ${a.descripcion || "Ahorro"}: $${a.monto}\n`;
    });

    return contextoTextual;
  } catch (error) {
    console.error("Error al recopilar el contexto financiero:", error);
    return "No se pudo cargar la informacion financiera actual del usuario.";
  }
};

export const exportarDatos = async (payload, { onError, onDone } = {}) => {
  try {
    const response = await fetch(`${API_URL}/exportar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
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
      const match = contentDisposition.match(/filename"?="?([^;"]+)/i);
      if (match && match[1]) filename = match[1].trim();
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
