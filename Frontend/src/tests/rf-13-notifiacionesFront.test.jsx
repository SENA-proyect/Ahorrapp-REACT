import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Historialnotificaciones from '../components/Historialnotificaciones';
import * as api from '../services/api';

vi.mock('../services/api');

// Mockeamos el Toast y el Contexto de Notificaciones para evitar llamadas reales
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ mostrarToast: vi.fn() }),
}));
vi.mock('../context/NotificacionesContext', () => ({
  useNotificaciones: () => ({ refrescarCount: vi.fn() }),
}));

describe('RF-13: Historial de Notificaciones (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar las notificaciones obtenidas de la API', async () => {
    api.getNotificaciones.mockResolvedValueOnce({
      notificaciones: [
        { id: 1, tipo: 'alerta_presupuesto', mensaje: 'Has superado tu presupuesto', leida: false, fecha: new Date().toISOString() }
      ],
      paginacion: { page: 1, totalPaginas: 1 }
    });

    render(<Historialnotificaciones />);

    await waitFor(() => {
      expect(screen.getByText('Has superado tu presupuesto')).toBeInTheDocument();
    });
  });

  it('debe llamar a la API al hacer clic en marcar como leída', async () => {
    api.getNotificaciones.mockResolvedValueOnce({
      notificaciones: [{ id: 1, tipo: 'sistema', mensaje: 'Hola', leida: false, fecha: new Date().toISOString() }],
      paginacion: null
    });
    api.marcarNotificacionLeida.mockResolvedValueOnce({ ok: true });

    render(<Historialnotificaciones />);

    const btnMarcar = await screen.findByTitle('Marcar como leída');
    fireEvent.click(btnMarcar);

    await waitFor(() => {
      expect(api.marcarNotificacionLeida).toHaveBeenCalledWith(1);
    });
  });
});