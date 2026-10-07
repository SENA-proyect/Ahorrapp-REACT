const SESSION_KEYS = ['user', 'usuario', 'token'];

export function clearSession() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of SESSION_KEYS) storage.removeItem(key);
  }
}

// Los datos de perfil por sí solos no constituyen una sesión.
export function readSession() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  try {
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (token?.trim() && user && typeof user === 'object' && !Array.isArray(user)) return user;
  } catch {
    // Un perfil corrupto se trata como sesión cerrada.
  }
  clearSession();
  return null;
}

// Revalida al volver desde el historial y al cerrar sesión en otra pestaña.
export function watchSession(onChange) {
  const refresh = () => onChange(readSession());
  const onStorage = (event) => {
    if (event.key === null || SESSION_KEYS.includes(event.key)) refresh();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('pageshow', refresh);
    window.removeEventListener('focus', refresh);
  };
}
