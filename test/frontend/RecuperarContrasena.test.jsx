import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OlvidarContrasena from "../../Frontend/src/pages/OlvidarContrasena";
import VerificacionCorreo from "../../Frontend/src/pages/VerificacionCorreo";
import IngresoNuevaContrasena from "../../Frontend/src/pages/IngresoNuevaContrasena";

const { mockForgotPassword, mockVerifyResetCode, mockResetPassword } = vi.hoisted(() => ({
  mockForgotPassword: vi.fn(),
  mockVerifyResetCode: vi.fn(),
  mockResetPassword: vi.fn(),
}));

vi.mock("../../Frontend/src/services/api", () => ({
  forgotPassword: mockForgotPassword,
  verifyResetCode: mockVerifyResetCode,
  resetPassword: mockResetPassword,
}));

function renderRecoveryFlow() {
  return render(
    <MemoryRouter initialEntries={["/OlvidarContrasena"]}>
      <Routes>
        <Route path="/OlvidarContrasena" element={<OlvidarContrasena />} />
        <Route path="/VerificacionCorreo" element={<VerificacionCorreo />} />
        <Route
          path="/ConfirmacionCambioContrasena"
          element={<IngresoNuevaContrasena />}
        />
        <Route path="/Login" element={<p>Inicio de sesión</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("RF-14 · Recuperar contraseña", () => {
  it("no permite solicitar el código con un correo inválido", async () => {
    const user = userEvent.setup();
    renderRecoveryFlow();

    const submit = screen.getByRole("button", { name: "Enviar código" });
    expect(submit.disabled).toBe(true);

    await user.type(screen.getByPlaceholderText("tu@correo.com"), "correo-invalido");

    expect(submit.disabled).toBe(true);
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it("completa solicitud, verificación del código y cambio de contraseña", async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({ ok: true });
    mockVerifyResetCode.mockResolvedValue({ resetToken: "reset-token-test" });
    mockResetPassword.mockResolvedValue({ ok: true });
    renderRecoveryFlow();

    await user.type(screen.getByPlaceholderText("tu@correo.com"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByText("Verificar tu identidad")).toBeTruthy();
    expect(mockForgotPassword).toHaveBeenCalledWith("ana@example.com");

    const codeFields = screen.getAllByRole("textbox");
    expect(codeFields).toHaveLength(6);
    for (const [index, digit] of [..."123456"].entries()) {
      fireEvent.change(codeFields[index], { target: { value: digit } });
    }

    await user.click(screen.getByRole("button", { name: "Verificar código" }));
    expect(await screen.findByRole("heading", { name: "Nueva contraseña" })).toBeTruthy();
    expect(mockVerifyResetCode).toHaveBeenCalledWith("ana@example.com", "123456");

    const passwordFields = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordFields[0], "Clave123");
    await user.type(passwordFields[1], "Clave123");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("reset-token-test", "Clave123");
    });
    expect(await screen.findByText("Inicio de sesión")).toBeTruthy();
  });

  it("muestra el error del servidor si el código no se puede verificar", async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({ ok: true });
    mockVerifyResetCode.mockRejectedValue({
      response: { data: { mensaje: "Código inválido" } },
    });
    renderRecoveryFlow();

    await user.type(screen.getByPlaceholderText("tu@correo.com"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    const codeFields = await screen.findAllByRole("textbox");
    for (const [index, digit] of [..."000000"].entries()) {
      fireEvent.change(codeFields[index], { target: { value: digit } });
    }
    await user.click(screen.getByRole("button", { name: "Verificar código" }));

    expect(await screen.findByText("Código inválido")).toBeTruthy();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});
