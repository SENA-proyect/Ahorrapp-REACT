const API_URL = "http://localhost:3000/api";


export const registerUser = async (datos) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const data = await response.json();

  return {
    ok: response.ok,
    ...data
    };
};

export const loginUser = async (datos) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const data = await response.json();

  return {
    ok: response.ok,
    ...data
  };
};