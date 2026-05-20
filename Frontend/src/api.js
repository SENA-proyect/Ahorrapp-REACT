<<<<<<< HEAD
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
=======
const API_URL = "http://localhost:3000/api"; 


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
  const token = localStorage.getItem('token');
  
  try {
    const res = await fetch('http://localhost:3000/api/dependientes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al obtener dependientes');
    }

    return await res.json(); // Esto devuelve el array de dependientes
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
  
  if (!response.ok) return []; // Si hay error 404 o 500, devolvemos array vacío

  const data = await response.json();
  // Esto asegura que siempre devuelva un array para que .filter() no falle
  return Array.isArray(data) ? data : (data.movimientos || []);
};


export const getResumenFinancieroBreve = async () => {
  try {
    const movimientos = await getMovimientos();
    
    const deudas = movimientos.filter(m => m.tipo === 'deuda' || m.tipo_movimiento === 'deuda');
    const ahorros = movimientos.filter(m => m.tipo === 'ahorro' || m.tipo_movimiento === 'ahorro');
    const ingresosTotales = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    const gastosTotales = movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

    let contextoTextual = `CONTEXTO FINANCIERO REAL DEL USUARIO:\n`;
    contextoTextual += `- Ingresos totales de este mes: $${ingresosTotales}\n`;
    contextoTextual += `- Gastos totales de este mes: $${gastosTotales}\n`;
    contextoTextual += `- Balance actual: $${ingresosTotales - gastosTotales}\n`;
    
    contextoTextual += `\nDEUDAS ACTIVAS:\n`;
    if (deudas.length === 0) contextoTextual += "  Sin deudas registradas.\n";
    deudas.forEach(d => {
      contextoTextual += `  * ${d.descripcion || 'Deuda'}: $${d.monto} (Estado: ${d.estado || 'Pendiente'})\n`;
    });

    contextoTextual += `\nPLANES DE AHORRO:\n`;
    if (ahorros.length === 0) contextoTextual += "  Sin ahorros registrados.\n";
    ahorros.forEach(a => {
      contextoTextual += `  * ${a.descripcion || 'Ahorro'}: $${a.monto}\n`;
>>>>>>> de95c71353382453444f40e26005b8efe068675f
    });

    return contextoTextual;
  } catch (error) {
    console.error("Error al recopilar el contexto financiero:", error);
<<<<<<< HEAD
    return "No se pudo cargar la informacion financiera actual del usuario.";
  }
};

export const exportarDatos = async (payload, { onError, onDone } = {}) => {
=======
    return "No se pudo cargar la información financiera actual del usuario.";
  }
};

// ── Exportar Datos ──────────────────────────────────────────────────────────
export const exportarDatos = async (payload, { onError, onDone } = {}) => {
  const token = localStorage.getItem("token");
  
>>>>>>> de95c71353382453444f40e26005b8efe068675f
  try {
    const response = await fetch(`${API_URL}/exportar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
<<<<<<< HEAD
        ...authHeaders(),
=======
        Authorization: `Bearer ${token}`,
>>>>>>> de95c71353382453444f40e26005b8efe068675f
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
<<<<<<< HEAD
      const errorData = await response.json().catch(() => ({}));
=======
      const errorData = await response.json();
>>>>>>> de95c71353382453444f40e26005b8efe068675f
      const error = new Error(errorData.error || "Error al exportar datos");
      if (onError) onError(error.message);
      throw error;
    }

<<<<<<< HEAD
    const contentDisposition = response.headers.get("Content-Disposition");
    const contentType = response.headers.get("Content-Type") || "";
    let filename = `reporte_financiero.${payload.formato}`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename"?="?([^;"]+)/i);
=======
    // Manejar la descarga del archivo (blob)
    const contentDisposition = response.headers.get("Content-Disposition");
    const contentType = response.headers.get("Content-Type") || '';

    let filename = `reporte_financiero.${payload.formato}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\"?=\"?([^;\"]+)/i);
>>>>>>> de95c71353382453444f40e26005b8efe068675f
      if (match && match[1]) filename = match[1].trim();
    }

    const blob = await response.blob();

<<<<<<< HEAD
    if (
      !contentType.includes("application/pdf") &&
      !contentType.includes("text/csv") &&
      payload.formato !== "json"
    ) {
      const text = await blob.text().catch(() => "");
      try {
        const asJson = JSON.parse(text);
        throw new Error(asJson.error || "Respuesta inesperada del servidor al exportar");
=======
    // Si por error el backend devolvió JSON/HTML, evita “descargas” corruptas.
    if (!contentType.includes('application/pdf') && !contentType.includes('text/csv') && payload.formato !== 'json') {
      const text = await blob.text().catch(() => '');
      try {
        const asJson = JSON.parse(text);
        throw new Error(asJson.error || 'Respuesta inesperada del servidor al exportar');
>>>>>>> de95c71353382453444f40e26005b8efe068675f
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

<<<<<<< HEAD
=======
    // Limpieza (esperar un tick para que el navegador inicie la descarga)
>>>>>>> de95c71353382453444f40e26005b8efe068675f
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);

<<<<<<< HEAD
    if (onDone) onDone();
=======

    if (onDone) onDone();
    
>>>>>>> de95c71353382453444f40e26005b8efe068675f
  } catch (error) {
    console.error("Error en exportarDatos:", error);
    if (onError) onError(error.message);
    throw error;
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> de95c71353382453444f40e26005b8efe068675f
