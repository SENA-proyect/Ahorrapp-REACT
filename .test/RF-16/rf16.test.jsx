import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from '@jest/globals';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../Frontend/src/context/AuthContext';
import { ProtectedRoute } from '../../Frontend/src/components/ProtectedRoute';

function AreaPrivada() {
  // Componente mínimo que expone la acción de cerrar sesión del contexto de autenticación.
  const { logout } = useAuth();
  return <button onClick={logout}>Cerrar sesión</button>;
}

function abrirRutaPrivada() {
  // Simula una navegación a una ruta protegida y define la pantalla de inicio de sesión.
  render(
    <MemoryRouter initialEntries={['/privado']}>
      <AuthProvider>
        <Routes>
          <Route path="/privado" element={<ProtectedRoute><AreaPrivada /></ProtectedRoute>} />
          <Route path="/Login" element={<h1>Iniciar sesión</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  // Prepara credenciales y una preferencia para comprobar qué datos limpia el cierre de sesión.
  localStorage.clear();
  sessionStorage.clear();
  for (const storage of [localStorage, sessionStorage]) {
    storage.setItem('user', JSON.stringify({ id: 7 }));
    storage.setItem('usuario', 'perfil anterior');
    storage.setItem('token', 'token-de-prueba');
    storage.setItem('preferencia', 'oscuro');
  }
});

test('RF-16 limpia las credenciales y redirige desde la ruta protegida', async () => {
  // Cierra la sesión desde el área privada y comprueba la redirección al login.
  abrirRutaPrivada();
  await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();

  for (const storage of [localStorage, sessionStorage]) {
    // Deben borrarse los datos de sesión, mientras se conserva una preferencia no relacionada.
    for (const key of ['user', 'usuario', 'token']) {
      expect(storage.getItem(key)).toBeNull();
    }
    expect(storage.getItem('preferencia')).toBe('oscuro');
  }
});

test('RF-16 impide abrir una ruta protegida con un perfil sin token', async () => {
  // Sin token válido, la ruta privada debe mostrar la página de inicio de sesión.
  localStorage.removeItem('token');
  abrirRutaPrivada();
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
});

test.each(['storage', 'pageshow'])('RF-16 revalida la sesión con el evento %s', async (evento) => {
  // Comprueba que la aplicación reaccione si otra pestaña cambia la sesión o al volver a ella.
  abrirRutaPrivada();
  expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  localStorage.removeItem('token');
  act(() => window.dispatchEvent(
    evento === 'storage' ? new StorageEvent('storage', { key: 'token' }) : new Event(evento)
  ));
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
});
