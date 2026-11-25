import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import MisMovimientos from "../../Frontend/src/components/Mismovimientos";

const { mockGetMovimientos } = vi.hoisted(() => ({
  mockGetMovimientos: vi.fn(),
}));

vi.mock("../../Frontend/src/services/api", () => ({
  getMovimientos: mockGetMovimientos,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RF-22 · Movimientos visibles en la web", () => {
  it("muestra movimientos de la cuenta en orden de fecha descendente", async () => {
    mockGetMovimientos.mockResolvedValue([
      {
        tipo: "gasto",
        monto: 120,
        descripcion: "Compra anterior",
        fecha: "2026-11-18",
      },
      {
        tipo: "ingreso",
        monto: 850,
        descripcion: "Ingreso reciente",
        fecha: "2026-11-24",
      },
    ]);

    const { container } = render(<MisMovimientos />);

    expect(await screen.findByText("Ingreso reciente")).toBeTruthy();
    expect(screen.getByText("Compra anterior")).toBeTruthy();
    expect(screen.getByText("Ingreso")).toBeTruthy();
    expect(screen.getByText("Gasto")).toBeTruthy();

    await waitFor(() => {
      const descriptions = [...container.querySelectorAll(".truncate")];
      expect(descriptions.map((node) => node.textContent)).toEqual([
        "Ingreso reciente",
        "Compra anterior",
      ]);
    });
  });
});
