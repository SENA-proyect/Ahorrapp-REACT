import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PanelHistorial from '../pages/PanelHistorial';
import Mismovimientos from '../components/Mismovimientos';
import * as api from '../services/api';

vi.mock('../services/api');

// Modal falso: no nos interesa su contenido, solo que se abra y se cierre
vi.mock('../components/modals/InfoActividad', () => ({
  default: ({ onClose }) => (
    <div>
      Modal de información
      <button onClick={onClose}>Cerrar modal</button>
    </div>
  ),
}));

describe('Historial: PanelHistorial (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar las acciones registradas', async () => {
    api.getHistorial.mockResolvedValue([
      {
        id_historial: 1,
        ID_usuario: 3,
        usuario_nombre: 'Ana',
        usuario_apellido: 'Gomez',
        accion: 'Inició sesión',
        detalles: null,
        fecha: '2026-11-23T10:00:00Z',
      },
    ]);
    render(<PanelHistorial />);

    expect(await screen.findByText(/Ana Gomez/)).toBeInTheDocument();
    expect(screen.getByText('Inició sesión')).toBeInTheDocument();
    expect(screen.getByText('Sin detalles')).toBeInTheDocument();
  });

  it('debe avisar cuando no hay historial', async () => {
    api.getHistorial.mockResolvedValue([]);
    render(<PanelHistorial />);

    expect(await screen.findByText('No hay historial registrado.')).toBeInTheDocument();
  });

  it('debe mostrar un error si la API falla', async () => {
    api.getHistorial.mockRejectedValueOnce(new Error('fallo'));
    render(<PanelHistorial />);

    expect(await screen.findByText('No se pudo cargar el historial')).toBeInTheDocument();
  });

  it('debe abrir y cerrar el modal de información', async () => {
    api.getHistorial.mockResolvedValue([]);
    render(<PanelHistorial />);

    expect(screen.queryByText('Modal de información')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Acerca de este módulo/i }));
    expect(screen.getByText('Modal de información')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar modal/i }));
    expect(screen.queryByText('Modal de información')).not.toBeInTheDocument();
  });
});

describe('Historial: MisMovimientos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar los movimientos del usuario, el más reciente primero', async () => {
    api.getMovimientos.mockResolvedValue([
      { tipo: 'ingreso', monto: 2000, fecha: '2026-11-01T00:00:00Z', descripcion: 'Salario' },
      { tipo: 'gasto', monto: 150, fecha: '2026-11-20T00:00:00Z', descripcion: 'Mercado' },
    ]);
    render(<Mismovimientos />);

    expect(await screen.findByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText('Ingreso')).toBeInTheDocument();
    expect(screen.getByText('Gasto')).toBeInTheDocument();
    expect(screen.getByText('20/11/2026')).toBeInTheDocument();

    const descripciones = screen.getAllByText(/Salario|Mercado/).map((el) => el.textContent);
    expect(descripciones).toEqual(['Mercado', 'Salario']);
  });

  it('debe avisar cuando no hay movimientos', async () => {
    api.getMovimientos.mockResolvedValue([]);
    render(<Mismovimientos />);

    expect(await screen.findByText('Todavía no tienes movimientos registrados.')).toBeInTheDocument();
  });
});