import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import * as api from '../services/api';

vi.mock('../services/api');
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Test' } }),
}));
vi.mock('../components/HeaderModulos', () => ({ default: () => <div>Header</div> }));
vi.mock('../components/BolsaWidget', () => ({ default: () => <div>Bolsa</div> }));
vi.mock('../components/modals/InfoDashboard', () => ({ default: () => null }));

describe('RF-27: Dashboard Financiero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mockeamos las 3 llamadas que hace el componente
    api.getDashboardData.mockResolvedValue({ totalIngresos: 1000, totalGastos: 500, totalAhorros: 200, balance: 300, periodo: null });
    api.getPresupuestoVsEjecutado.mockResolvedValue([]);
    api.getFlujoPorSemana.mockResolvedValue([]);
  });

  it('debe mostrar los totales financieros tras cargar los datos', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      // El componente usa toLocaleString, así que buscamos $1.000 o $1000
      expect(screen.getByText(/\$1.000/)).toBeInTheDocument();
      expect(screen.getByText(/\$500/)).toBeInTheDocument();
    });
  });
});