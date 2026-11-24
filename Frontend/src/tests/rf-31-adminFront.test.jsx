import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PanelAdmin from '../pages/PanelAdmin';
import PanelUsuarios from '../pages/PanelUsuarios';
import PanelDependientes from '../pages/PanelDependientes';
import PanelMovimientos from '../pages/PanelMovimientos';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

vi.mock('../services/api');
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────
describe('RF-31: Panel Admin (Frontend)', () => {
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

// ─────────────────────────────────────────────────────────────
describe('RF-31.3: Panel de Usuarios (Frontend)', () => {
  const respuestaConUsuarios = {
    json: async () => ({
      ok: true,
      usuarios: [
        { ID_usuario: 1, Nombre: 'Maria', Apellido: 'Rodriguez', Email: 'maria@correo.com', Cargo: 'admin', ID_rol: 2 },
        { ID_usuario: 2, Nombre: 'Pedro', Apellido: 'Lopez', Email: 'pedro@correo.com', Cargo: 'user', ID_rol: 1 },
      ],
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { roles: ['admin'] } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaConUsuarios));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('debe listar los usuarios con su correo y rol', async () => {
    render(<MemoryRouter><PanelUsuarios /></MemoryRouter>);

    expect(await screen.findByText('Maria Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('maria@correo.com')).toBeInTheDocument();
    expect(screen.getByText(/ID 1 · admin/)).toBeInTheDocument();
    expect(screen.getByText('Pedro Lopez')).toBeInTheDocument();
    expect(screen.getByText('2 cuentas activas')).toBeInTheDocument();
  });

  it('debe mostrar el mensaje del backend si la consulta falla', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ ok: false, mensaje: 'Acceso denegado' }),
    });
    render(<MemoryRouter><PanelUsuarios /></MemoryRouter>);

    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument();
  });

  it('debe avisar cuando no hay usuarios', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ ok: true, usuarios: [] }),
    });
    render(<MemoryRouter><PanelUsuarios /></MemoryRouter>);

    expect(await screen.findByText('No hay usuarios registrados.')).toBeInTheDocument();
  });

  it('debe abrir el modal de edición con los datos del usuario', async () => {
    render(<MemoryRouter><PanelUsuarios /></MemoryRouter>);

    await screen.findByText('Maria Rodriguez');
    fireEvent.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    expect(screen.getByText('Editar usuario')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Maria')).toBeInTheDocument();
    expect(screen.getByDisplayValue('maria@correo.com')).toBeInTheDocument();
  });

  it('un admin no debe ver el selector de rol en el modal', async () => {
    render(<MemoryRouter><PanelUsuarios /></MemoryRouter>);

    await screen.findByText('Maria Rodriguez');
    fireEvent.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    expect(screen.queryByText('Rol')).not.toBeInTheDocument();
  });

  it('un superuser sí debe ver el selector de rol en el modal', async () => {
    useAuth.mockReturnValue({ user: { roles: ['superuser'] } });
    render(<MemoryRouter><PanelUsuarios /></MemoryRouter>);

    await screen.findByText('Maria Rodriguez');
    fireEvent.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    expect(screen.getByText('Rol')).toBeInTheDocument();
  });

  it('debe eliminar el usuario cuando el admin confirma', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MemoryRouter><PanelUsuarios /></MemoryRouter>);

    await screen.findByText('Maria Rodriguez');
    fetch.mockResolvedValueOnce({ json: async () => ({ ok: true }) });
    fireEvent.click(screen.getAllByRole('button', { name: /Borrar/i })[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/PanelUsuarios/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(screen.queryByText('Maria Rodriguez')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Pedro Lopez')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────
describe('RF-31.4: Panel de Dependientes (Frontend)', () => {
  const respuestaConDependientes = {
    json: async () => ({
      ok: true,
      dependientes: [
        {
          id_dependientes: 1,
          Nombre: 'Lucas',
          Relacion: 'Hijo',
          usuario_nombre: 'Ana',
          ID_usuario: 3,
          Ocupacion: 'Estudiante',
          Fecha_nacimiento: '2015-05-20T00:00:00.000Z',
        },
      ],
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaConDependientes));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('debe listar los dependientes con sus datos', async () => {
    render(<MemoryRouter><PanelDependientes /></MemoryRouter>);

    expect(await screen.findByText('Lucas')).toBeInTheDocument();
    expect(screen.getByText('Hijo')).toBeInTheDocument();
    expect(screen.getByText('Estudiante')).toBeInTheDocument();
    expect(screen.getByText('20/05/2015')).toBeInTheDocument();
  });

  it('debe eliminar el dependiente cuando el admin confirma', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.eliminarDependienteAdmin.mockResolvedValueOnce({});
    render(<MemoryRouter><PanelDependientes /></MemoryRouter>);

    await screen.findByText('Lucas');
    fireEvent.click(screen.getByRole('button', { name: /Borrar/i }));

    await waitFor(() => {
      expect(api.eliminarDependienteAdmin).toHaveBeenCalledWith(1);
      expect(screen.queryByText('Lucas')).not.toBeInTheDocument();
    });
  });

  it('no debe eliminar si el admin cancela la confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<MemoryRouter><PanelDependientes /></MemoryRouter>);

    await screen.findByText('Lucas');
    fireEvent.click(screen.getByRole('button', { name: /Borrar/i }));

    expect(api.eliminarDependienteAdmin).not.toHaveBeenCalled();
    expect(screen.getByText('Lucas')).toBeInTheDocument();
  });

  it('debe mostrar el mensaje del backend si la consulta falla', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ ok: false, mensaje: 'Acceso denegado' }),
    });
    render(<MemoryRouter><PanelDependientes /></MemoryRouter>);

    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────
describe('RF-31.5: Panel de Movimientos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar los movimientos del administrador', async () => {
    api.getMovimientos.mockResolvedValue([
      { tipo: 'ingreso', monto: 2000, fecha: '2026-11-01T00:00:00Z', descripcion: 'Salario' },
      { tipo: 'deuda', monto: 500, fecha: '2026-11-10T00:00:00Z', estado: 'pagada', descripcion: 'Préstamo' },
    ]);
    render(<MemoryRouter><PanelMovimientos /></MemoryRouter>);

    expect(await screen.findByText('Salario')).toBeInTheDocument();
    expect(screen.getByText('Ingreso')).toBeInTheDocument();
    expect(screen.getByText('Deuda')).toBeInTheDocument();
    expect(screen.getByText('Pagada')).toBeInTheDocument();
    expect(screen.getByText('2 movimientos registrados')).toBeInTheDocument();
  });

  it('debe avisar cuando no hay movimientos', async () => {
    api.getMovimientos.mockResolvedValue([]);
    render(<MemoryRouter><PanelMovimientos /></MemoryRouter>);

    expect(await screen.findByText('No hay movimientos registrados.')).toBeInTheDocument();
  });
});