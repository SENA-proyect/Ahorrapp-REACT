import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, loginWithGoogle } from "../../Frontend/src/services/api.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loginWithGoogle", () => {
  it("sends Google's ID token to the backend authentication endpoint", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, token: "session-token", usuario: { id: 1 } }),
    });
    vi.stubGlobal("fetch", fetch);

    const result = await loginWithGoogle("google-id-token");

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/google`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        method: "POST",
        body: JSON.stringify({ idToken: "google-id-token" }),
      }
    );
    expect(result).toMatchObject({
      ok: true,
      token: "session-token",
      usuario: { id: 1 },
    });
  });

  it("surfaces authentication errors returned by the backend", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        ok: false,
        mensaje: "El inicio de sesión con Google no está configurado",
      }),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(loginWithGoogle("google-id-token")).rejects.toMatchObject({
      message: "El inicio de sesión con Google no está configurado",
      response: {
        status: 503,
        data: {
          ok: false,
          mensaje: "El inicio de sesión con Google no está configurado",
        },
      },
    });
  });
});
