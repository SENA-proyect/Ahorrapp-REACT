const API_URL = "/api"; // ← antes: "http://localhost:3000/api"

export const registerUser = async (datos) => {
  // Normalizamos el campo contraseña → password antes de enviarlo
  const payload = {
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: datos.correo,
    password: datos.contraseña,  // ← aquí está el fix
  };

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const loginUser = async (datos) => {
  const payload = {
    correo: datos.correo,
    password: datos.contraseña,  // ← aquí está el fix
  };

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
};


export const getCategorias = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/categorias`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
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
