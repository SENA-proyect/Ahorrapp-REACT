const API_URL = "/api"; // ← antes: "http://localhost:3000/api"

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
