import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { API_URL, loginWithGoogle } from "./api.js";

const originalFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = originalFetch;
});

describe("loginWithGoogle", () => {
  it("sends Google's ID token to the backend authentication endpoint", async () => {
    let request;
    globalThis.fetch = async (...args) => {
      request = args;
      return {
      ok: true,
      json: async () => ({ ok: true, token: "session-token", usuario: { id: 1 } }),
      };
    };

    const result = await loginWithGoogle("google-id-token");

    assert.deepEqual(request, [
      `${API_URL}/auth/google`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        method: "POST",
        body: JSON.stringify({ idToken: "google-id-token" }),
      },
    ]);
    assert.equal(result.ok, true);
    assert.equal(result.usuario.id, 1);
  });

  it("surfaces authentication errors returned by the backend", async () => {
    globalThis.fetch = async () => ({
        ok: false,
        status: 503,
        json: async () => ({ ok: false, mensaje: "El inicio de sesión con Google no está configurado" }),
    });

    await assert.rejects(loginWithGoogle("google-id-token"), {
      message: "El inicio de sesión con Google no está configurado",
      response: { status: 503, data: { ok: false, mensaje: "El inicio de sesión con Google no está configurado" } },
    });
  });
});
