const API_URL = "https://localhost:3000/api";

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
  const data = await fetchJSON(`${API_URL}/dashboard/resumen`);
  return {
    totalIngresos: data.totalIngresos ?? 0,
    totalGastos:   data.totalGastos   ?? 0,
    totalAhorros:  data.totalAhorros  ?? 0,
    balance:       data.balance       ?? 0,
    periodo:       data.periodo       ?? null,
    sin_periodo:   data.sin_periodo   ?? true,
  };
};
 
export const getPresupuestoVsEjecutado = async () => {
  const data = await fetchJSON(`${API_URL}/dashboard/presupuesto-vs-ejecutado`);
  return data.data ?? [];
};
 
export const getFlujoPorSemana = async () => {
  const data = await fetchJSON(`${API_URL}/dashboard/flujo-semanal`);
  return data.data ?? [];
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

// ── Presupuestos ──────────────────────────────────────────────────────────────
export const getPerfilesPrespuesto = () =>
  fetchJSON(`${API_URL}/presupuestos`);
 
export const crearPerfil = (datos) =>
  fetchJSON(`${API_URL}/presupuestos`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
 
export const editarPerfil = (id, datos) =>
  fetchJSON(`${API_URL}/presupuestos/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
 
export const eliminarPerfil = (id) =>
  fetchJSON(`${API_URL}/presupuestos/${id}`, { method: "DELETE" });
 
export const activarPerfil = (id) =>
  fetchJSON(`${API_URL}/presupuestos/${id}/activar`, { method: "PUT" });
 
// ── Períodos ──────────────────────────────────────────────────────────────────
export const getPeriodoActivo = () =>
  fetchJSON(`${API_URL}/presupuestos/periodos/activo`);
 
export const abrirPeriodo = (ingreso_estimado) =>
  fetchJSON(`${API_URL}/presupuestos/periodos/abrir`, {
    method: "POST",
    body: JSON.stringify({ ingreso_estimado }),
  });
 
export const cerrarPeriodo = () =>
  fetchJSON(`${API_URL}/presupuestos/periodos/cerrar`, { method: "PUT" });
 
export const ajustarIngresoPeriodo = (ingreso_estimado) =>
  fetchJSON(`${API_URL}/presupuestos/periodos/ajustar-ingreso`, {
    method: "PATCH",
    body: JSON.stringify({ ingreso_estimado }),
  });
 
// ── Movimientos extra ─────────────────────────────────────────────────────────
export const abonarDeuda = (id, cuotas = 1) =>
  fetchJSON(`${API_URL}/movimientos/deudas/${id}/abonar`, {
    method: "PATCH",
    body: JSON.stringify({ cuotas }),
  });
 
export const abonarAhorro = (id, monto) =>
  fetchJSON(`${API_URL}/movimientos/ahorros/${id}/abonar`, {
    method: "PATCH",
    body: JSON.stringify({ monto }),
  });
 

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

// ── Historial de Exportaciones ───────────────────────────────────────────────
export const getHistorialExportaciones = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  const response = await fetch(`${API_URL}/exportar?${query}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.error || "Error al obtener historial de exportaciones"
    );
  }

  return response.json();
};

// ── Eliminar Exportación del Historial ───────────────────────────────────────
export const eliminarExportacion = async (id) => {
  const response = await fetch(`${API_URL}/exportar/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.error || "Error al eliminar exportación"
    );
  }

  return response.json();
};

// ── Ingresos / Gastos ─────────────────────────────────────────────────────────
export const getIngresos = async () => {
  const movimientos = await getMovimientos();
  return movimientos.filter(m =>
    (m.tipo ?? m.tipo_movimiento ?? "").toLowerCase() === "ingreso"
  );
};

export const getGastos = async () => {
  const movimientos = await getMovimientos();
  return movimientos.filter(m =>
    (m.tipo ?? m.tipo_movimiento ?? "").toLowerCase() === "gasto"
  );
};

// ── Panel Admin ───────────────────────────────────────────────────────────────
// export const getUsuariosPanelAdmin = async () =>
//   fetchJSON(`${API_URL}/auth/usuarios/PanelAdmin`);

// export const getDependientesPanelAdmin = async () =>
//   fetchJSON(`${API_URL}/auth/dependientes/PanelAdmin`);

// export const getTodosDependientesAdmin = async () => {
//   const data = await fetchJSON(`${API_URL}/auth/PanelDependientes`);
//   return data.dependientes ?? data;
// };

export const getUsuariosPanelAdmin = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/auth/usuarios/PanelAdmin`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener total de usuarios");
  }

  return response.json(); 
}

export const getDependientesPanelAdmin = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/auth/dependientes/PanelAdmin`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener total de dependientes");
  }

  return response.json(); 
}

// Todos los dependientes para admin
export const getTodosDependientesAdmin = async () => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}/auth/PanelDependientes`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error al obtener todos los dependientes');
  }

  const data = await res.json();

  return data.dependientes ?? data;
};