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
      const errorData = await response.json();
      const error = new Error(errorData.error || "Error al exportar datos");
      if (onError) onError(error.message);
      throw error;
    }

    // Manejar la descarga del archivo (blob)
    const contentDisposition = response.headers.get("Content-Disposition");
    const contentType = response.headers.get("Content-Type") || '';

    let filename = `reporte_financiero.${payload.formato}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\"?=\"?([^;\"]+)/i);
      if (match && match[1]) filename = match[1].trim();
    }

    const blob = await response.blob();

    // Si por error el backend devolvió JSON/HTML, evita “descargas” corruptas.
    if (!contentType.includes('application/pdf') && !contentType.includes('text/csv') && payload.formato !== 'json') {
      const text = await blob.text().catch(() => '');
      try {
        const asJson = JSON.parse(text);
        throw new Error(asJson.error || 'Respuesta inesperada del servidor al exportar');
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

    // Limpieza (esperar un tick para que el navegador inicie la descarga)
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



export const getIngresos = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/movimientos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) return [];

  const data = await response.json();
  
  const movimientos = Array.isArray(data) ? data : (data.movimientos || []);
  return movimientos.filter(movimiento =>
    movimiento.tipo === 'ingreso' || 
    movimiento.Tipo === 'Ingreso'
  );
};

export const getGastos = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/movimientos`, {
    headers: {Authorization: `Bearer ${token}`}
  });

  if (!response.ok) return [];

  const data = await response.json();
  const movimientos = Array.isArray(data) ? data : (data.movimientos || []);
  return movimientos.filter(movimiento => 
    movimiento.tipo === 'gasto' ||
    movimiento.Tipo === 'Gasto'
  )
}