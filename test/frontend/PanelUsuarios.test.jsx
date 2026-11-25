import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PanelUsuarios from "../../Frontend/src/pages/PanelUsuarios";

const { mockActualizarRolUsuario } = vi.hoisted(() => ({
  mockActualizarRolUsuario: vi.fn(),
}));

vi.mock("../../Frontend/src/context/AuthContext", () => ({
  useAuth: () => ({ user: { roles: ["superuser"] } }),
}));

vi.mock("../../Frontend/src/services/api", () => ({
  actualizarRolUsuario: mockActualizarRolUsuario,
}));

const respuesta = (data) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("token", "token-de-prueba");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("RF-08 · Gestión de usuarios desde el panel", () => {
  it("lista usuarios y permite al superusuario editar datos y rol", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        respuesta({
          ok: true,
          usuarios: [{
            ID_usuario: 18,
            Nombre: "Ana",
            Apellido: "Gómez",
            Email: "ana@example.com",
            ID_rol: 1,
            Cargo: "user",
          }],
        })
      )
      .mockResolvedValueOnce(respuesta({ ok: true }))
      .mockResolvedValueOnce(respuesta({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    mockActualizarRolUsuario.mockResolvedValue({ ok: true });

    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <PanelUsuarios />
      </MemoryRouter>
    );

    expect(await screen.findByText("Ana Gómez")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Editar" }));

    await user.clear(screen.getByDisplayValue("Ana"));
    await user.type(screen.getByDisplayValue(""), "Anita");
    await user.selectOptions(container.querySelector("select"), "2");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mockActualizarRolUsuario).toHaveBeenCalledWith(18, 2);
    });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/PanelUsuarios/18"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer token-de-prueba",
        }),
      })
    );
    expect(await screen.findByText("Anita Gómez")).toBeTruthy();
  });
});
