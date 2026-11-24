import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Micuenta from '../components/Micuenta';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

vi.mock('../services/api');
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Mi Cuenta (Frontend)', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const usuario = { nombre: 'Juan', apellido: 'Perez', email: 'juan@correo.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: usuario, login: mockLogin, logout: mockLogout });
    render(<MemoryRouter><Micuenta /></MemoryRouter>);
  });

  it('debe mostrar error si el correo es inválido', async () => {
    fireEvent.change(screen.getByDisplayValue('juan@correo.com'), { target: { value: 'correo-invalido' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
    });
    expect(api.actualizarMiPerfil).not.toHaveBeenCalled();
  });

  it('debe guardar los datos y mostrar mensaje de éxito', async () => {
    api.actualizarMiPerfil.mockResolvedValueOnce({});

    fireEvent.change(screen.getByDisplayValue('Juan'), { target: { value: 'Pedro' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(api.actualizarMiPerfil).toHaveBeenCalledWith({
        Nombre: 'Pedro', Apellido: 'Perez', Email: 'juan@correo.com',
      });
      expect(mockLogin).toHaveBeenCalled();
      expect(screen.getByText('Tus datos se actualizaron correctamente')).toBeInTheDocument();
    });
  });

  it('debe mostrar error si las contraseñas nuevas no coinciden', async () => {
    const campos = document.querySelectorAll('input[type="password"]');
    fireEvent.change(campos[0], { target: { value: 'ActualPass1!' } });
    fireEvent.change(campos[1], { target: { value: 'Password123!' } });
    fireEvent.change(campos[2], { target: { value: 'Distinta456!' } });
    fireEvent.click(screen.getByRole('button', { name: /Cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas nuevas no coinciden')).toBeInTheDocument();
    });
    expect(api.cambiarMiPassword).not.toHaveBeenCalled();
  });
});