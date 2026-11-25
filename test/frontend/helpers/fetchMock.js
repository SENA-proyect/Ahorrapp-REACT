/**
 * Utilidad compartida de las pruebas de frontend: reemplaza `fetch` global por un
 * simulador que responde según "MÉTODO + fragmento de URL".
 *
 * Uso:
 *   const api = instalarFetch([
 *     ["GET",  "/movimientos/gastos", () => ({ body: [{ id: 1 }] })],
 *     ["POST", "/movimientos",        () => ({ status: 201, body: { ok: true } })],
 *   ]);
 *   api.llamadas("POST", "/movimientos")  → lista de { url, opciones, cuerpo }
 */
import { vi } from "vitest";

export function instalarFetch(rutas = []) {
  const registro = [];

  const fn = vi.fn(async (url, opciones = {}) => {
    const metodo = (opciones.method || "GET").toUpperCase();
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : undefined;
    registro.push({ metodo, url: String(url), opciones, cuerpo });

    // Se busca de la ruta más específica (más larga) a la más general
    const candidatas = rutas
      .filter(([m, fragmento]) => m === metodo && String(url).includes(fragmento))
      .sort((a, b) => b[1].length - a[1].length);

    const respuesta = candidatas.length
      ? await candidatas[0][2]({ url: String(url), cuerpo, opciones })
      : { status: 404, body: { ok: false, mensaje: `Sin simulación para ${metodo} ${url}` } };

    const status = respuesta.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => "application/json" },
      json: async () => respuesta.body,
    };
  });

  vi.stubGlobal("fetch", fn);

  return {
    fetch: fn,
    registro,
    llamadas: (metodo, fragmento) =>
      registro.filter((r) => r.metodo === metodo && r.url.includes(fragmento)),
  };
}
