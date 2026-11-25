import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "../../Frontend/src/pages/Login";
import { loginWithGoogle, registerUser } from "../../Frontend/src/services/api";

const { mockLogin, mockLoginWithGoogle, mockRegisterUser } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockLoginWithGoogle: vi.fn(),
  mockRegisterUser: vi.fn(),
}));

vi.mock("../../Frontend/src/context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock("../../Frontend/src/services/api", () => ({
  loginUser: vi.fn(),
  loginWithGoogle: mockLoginWithGoogle,
  registerUser: mockRegisterUser,
}));

vi.mock("@react-oauth/google", async () => {
  const React = await import("react");
  return {
    GoogleLogin: ({ onSuccess }) =>
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => onSuccess({ credential: "google-id-token" }),
        },
        "Google test login"
      ),
  };
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/Login"]}>
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route path="/Dashboard" element={<p>Dashboard de prueba</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("RF-01 · Registro web", () => {
  it("valida la contraseña antes de enviar el registro", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Regístrate aquí" }));
    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Apellido"), "Gómez");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "debil");
    await user.click(screen.getByLabelText(/Acepto los/));

    fireEvent.submit(screen.getByRole("button", { name: /Crear cuenta/ }).closest("form"));

    expect(await screen.findByText(/Contraseña insegura/)).toBeTruthy();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("envía los datos de registro válidos y vuelve al formulario de acceso", async () => {
    const user = userEvent.setup();
    mockRegisterUser.mockResolvedValue({ ok: true });
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Regístrate aquí" }));
    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Apellido"), "Gómez");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Seguro123!");
    await user.click(screen.getByLabelText(/Acepto los/));

    fireEvent.submit(screen.getByRole("button", { name: /Crear cuenta/ }).closest("form"));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        Nombre: "Ana",
        Apellido: "Gómez",
        Email: "ana@example.com",
        Password_hash: "Seguro123!",
      });
    });
    expect(await screen.findByText(/Bienvenido/)).toBeTruthy();
  });
});

describe("RF-32 · Inicio con Google desde la pantalla web", () => {
  it("guarda la sesión y navega al dashboard cuando Google autentica", async () => {
    const user = userEvent.setup();
    const usuario = { id: 12, email: "ana@example.com", roles: ["user"] };
    mockLoginWithGoogle.mockResolvedValue({
      ok: true,
      token: "jwt-de-prueba",
      usuario,
    });
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Google test login" }));

    expect(await screen.findByText("Dashboard de prueba")).toBeTruthy();
    expect(loginWithGoogle).toHaveBeenCalledWith("google-id-token");
    expect(mockLogin).toHaveBeenCalledWith(usuario);
    expect(localStorage.getItem("token")).toBe("jwt-de-prueba");
    expect(JSON.parse(localStorage.getItem("usuario"))).toEqual(usuario);
  });
});
