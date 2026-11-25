import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Noticias from "../../Frontend/src/pages/Noticias";

vi.mock("../../Frontend/src/components/HeaderModulos", () => ({
  default: () => <header>Barra de navegación</header>,
}));

const respuestaNoticias = (total, titulo) => ({
  ok: true,
  json: async () => ({
    total,
    articulos: [{
      titulo,
      descripcion: "Información financiera para el usuario.",
      url: "https://example.com/noticia",
      imagen: "https://example.com/noticia.png",
      fuente: "Medio de prueba",
      fecha: "2026-11-25T10:00:00Z",
    }],
  }),
});

beforeEach(() => {
  localStorage.setItem("token", "token-de-prueba");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("RF-29 · Noticias e indicadores en la web", () => {
  it("lista noticias, filtra por categoría y pagina resultados", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuestaNoticias(25, "Resumen económico"))
      .mockResolvedValueOnce(respuestaNoticias(1, "Noticias del dólar"))
      .mockResolvedValueOnce(respuestaNoticias(25, "Resumen página 2"));
    vi.stubGlobal("fetch", fetch);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Noticias />
      </MemoryRouter>
    );

    expect(await screen.findByText("Resumen económico")).toBeTruthy();
    expect(screen.getByText("25 artículos")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Dólar" }));
    expect(await screen.findByText("Noticias del dólar")).toBeTruthy();
    expect(fetch.mock.calls[1][0]).toContain("categoria=dolar&pagina=1");

    await user.click(screen.getByRole("button", { name: "Todos" }));
    expect(await screen.findByText("Resumen página 2")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Siguiente →" }));

    await waitFor(() => {
      expect(fetch.mock.calls[3][0]).toContain("categoria=todos&pagina=2");
    });
    expect(screen.getByText("Página 2 de 3")).toBeTruthy();
  });

  it("muestra una opción de reintento cuando falla la API", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Servicio de noticias no disponible" }),
      })
      .mockResolvedValueOnce(respuestaNoticias(1, "Noticia recuperada"));
    vi.stubGlobal("fetch", fetch);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Noticias />
      </MemoryRouter>
    );

    expect(await screen.findByText("Servicio de noticias no disponible")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Noticia recuperada")).toBeTruthy();
  });
});
