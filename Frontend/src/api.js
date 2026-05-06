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
  // Si tu backend devuelve un objeto con un array, asegúrate de mapearlo correctamente
  const data = await response.json();
  return data.movimientos ?? data ?? [];
};

export const getResumenFinancieroBreve = async () => {
  try {
    const movimientos = await getMovimientos();
    
    // Clasificamos los movimientos para armar un perfil limpio
    const deudas = movimientos.filter(m => m.tipo === 'deuda' || m.tipo_movimiento === 'deuda');
    const ahorros = movimientos.filter(m => m.tipo === 'ahorro' || m.tipo_movimiento === 'ahorro');
    const ingresosTotales = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    const gastosTotales = movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

    // Formateamos un string estructurado que la IA entienda perfectamente
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
    });

    return contextoTextual;
  } catch (error) {
    console.error("Error al recopilar el contexto financiero:", error);
    return "No se pudo cargar la información financiera actual del usuario.";
  }
};

