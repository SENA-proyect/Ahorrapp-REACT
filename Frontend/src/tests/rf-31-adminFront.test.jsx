import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PanelAdmin from '../pages/PanelAdmin';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

vi.mock('../services/api');
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Panel Admin (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ logout: vi.fn() });
    api.getUsuariosPanelAdmin.mockResolvedValue({ totalUsuarios: 12 });
    api.getDependientesPanelAdmin.mockResolvedValue({ totalDependientes: 7 });
  });

  it('debe mostrar el total de usuarios y de dependientes', async () => {
    api.getHistorial.mockResolvedValue([]);
    render(<MemoryRouter><PanelAdmin /></MemoryRouter>);

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(await screen.findByText('7')).toBeInTheDocument();
  });

  it('debe mostrar la actividad reciente', async () => {
    api.getHistorial.mockResolvedValue([
      {
        id_historial: 1,
        usuario_nombre: 'Ana',
        usuario_apellido: 'Gomez',
        accion: 'Inició sesión',
        detalles: 'Desde el navegador',
        fecha: '2026-11-23T10:00:00Z',
      },
    ]);
    render(<MemoryRouter><PanelAdmin /></MemoryRouter>);

    expect(await screen.findByText('Ana Gomez')).toBeInTheDocument();
    expect(screen.getByText(/Inició sesión/)).toBeInTheDocument();
    expect(screen.getByText('Desde el navegador')).toBeInTheDocument();
  });

  it('debe avisar cuando no hay actividad registrada', async () => {
    api.getHistorial.mockResolvedValue([]);
    render(<MemoryRouter><PanelAdmin /></MemoryRouter>);

    expect(await screen.findByText('No hay actividad registrada todavía.')).toBeInTheDocument();
  });

  it('debe mostrar los enlaces a los otros paneles', () => {
    api.getHistorial.mockResolvedValue([]);
    render(<MemoryRouter><PanelAdmin /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /Panel de Usuarios/i })).toHaveAttribute('href', '/PanelUsuarios');
    expect(screen.getByRole('link', { name: /Panel de Dependientes/i })).toHaveAttribute('href', '/PanelDependientes');
  });
});