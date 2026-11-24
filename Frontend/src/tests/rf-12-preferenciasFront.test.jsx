import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PreferenciasNotificacion from '../components/Preferenciasnotificaciones';
import * as api from '../services/api';

vi.mock('../services/api');
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ mostrarToast: vi.fn() }),
}));

describe('RF-12: Preferencias de Alertas (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getPreferenciasNotificacion.mockResolvedValue([
      { tipo: 'alerta_presupuesto', activa: true },
      { tipo: 'sistema', activa: true }
    ]);
  });

  it('debe permitir cambiar el estado de una preferencia y guardarla', async () => {
    api.actualizarPreferenciasNotificacion.mockResolvedValueOnce({ ok: true });

    render(<PreferenciasNotificacion />);

    // Esperamos a que carguen las preferencias (los switches en pantalla)
    const switchs = await screen.findAllByRole('switch');
    
    // Cambiamos el primer switch (alerta_presupuesto)
    fireEvent.click(switchs[0]);
    
    // Hacemos clic en guardar
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(api.actualizarPreferenciasNotificacion).toHaveBeenCalled();
    });
  });
});