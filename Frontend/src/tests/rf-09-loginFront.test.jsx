import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Simulamos la API y el contexto de autenticación
vi.mock('../services/api');
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Simulamos useNavigate de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('RF-09: Iniciar Sesión (Frontend)', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it('debe mostrar error si el correo es inválido', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    
    fireEvent.change(screen.getByPlaceholderText('juan@correo.com'), { target: { value: 'correo-invalido' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
    });
  });

  it('debe llamar a la API y guardar el token si el login es exitoso', async () => {
    api.loginUser.mockResolvedValueOnce({ ok: true, token: 'token-falso', usuario: { id: 1 } });
    
    render(<MemoryRouter><Login /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('juan@correo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(api.loginUser).toHaveBeenCalledWith({ Email: 'test@test.com', Password_hash: 'Password123!' });
      expect(mockLogin).toHaveBeenCalledWith({ id: 1 });
      expect(mockNavigate).toHaveBeenCalledWith('/Dashboard');
    });
  });
});