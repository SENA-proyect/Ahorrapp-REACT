/**
 * Fábrica de pruebas CRUD para las páginas de módulo que comparten patrón
 * (listado + modal "Registrar X" + modal "Editar X" + confirmación "¿Eliminar x?"):
 * RF-02 Ingresos y RF-05 Imprevistos. Cada archivo de prueba la invoca con su configuración.
 * NOTA: los vi.mock de contextos/encabezado se declaran en el archivo que la invoca.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { instalarFetch } from "./fetchMock";

const campo = (n) => document.querySelector(`[name="${n}"]`);
const escribir = (n, v) => fireEvent.change(campo(n), { target: { value: v } });
const llenar = (valores) => Object.entries(valores).forEach(([n, v]) => escribir(n, v));
const esc = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

export function pruebasCrud(cfg, { mostrarToast, revisarAhora }) {
  const { Pagina, etiqueta, ruta, textos: T } = cfg;
  const LISTA = `/movimientos/${ruta}`;
  let api;

  const montar = (filas = cfg.filas, extra = []) => {
    api = instalarFetch([
      ["GET", LISTA, () => ({ body: filas })],
      ["GET", "/categorias", () => ({ body: { categorias: [{ id: 3, nombre: "Cat", activa: 1 }] } })],
      ["GET", "/dependientes", () => ({ body: [] })],
      ...extra,
    ]);
    return render(<MemoryRouter><Pagina /></MemoryRouter>);
  };
  const abrirRegistro = async (extra) => {
    montar(cfg.filas, extra);
    await screen.findAllByText(cfg.textoFila);
    await userEvent.click(screen.getByRole("button", { name: T.agregar }));
    await screen.findByText(T.tituloModal, { selector: "h4" });
  };
  const registrar = () => userEvent.click(screen.getByRole("button", { name: T.botonRegistrar }));
  const abrirEdicion = async (extra) => {
    montar(cfg.filas, extra);
    await screen.findAllByText(cfg.textoFila);
    await userEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    await screen.findByText(T.tituloEditar);
  };
  const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("token", "tok-123");
    localStorage.setItem("usuario", JSON.stringify({ nombre: "Laura" }));
  });

  describe(`${cfg.rf} · Consultar (${Pagina.name})`, () => {
    it(`pide el listado con el token (GET ${LISTA})`, async () => {
      montar();
      await waitFor(() => expect(api.llamadas("GET", LISTA)).toHaveLength(1));
      expect(api.llamadas("GET", LISTA)[0].opciones.headers.Authorization).toBe("Bearer tok-123");
    });

    it("muestra los registros con fecha dd/mm/aaaa y monto formateado", async () => {
      montar();
      expect((await screen.findAllByText(cfg.textoFila)).length).toBeGreaterThan(0);
      expect(screen.getAllByText(cfg.fechaTexto).length).toBeGreaterThan(0);
      expect(screen.getAllByText(cfg.montoTexto).length).toBeGreaterThan(0);
    });

    it("muestra el total acumulado y la cantidad de registros", async () => {
      montar();
      expect(await screen.findByText(cfg.total)).toBeInTheDocument();
      expect(screen.getAllByText("2 registros en total").length).toBeGreaterThan(0);
    });

    it("sin registros → estado vacío con acceso al primer registro", async () => {
      montar([]);
      expect(await screen.findByText(T.vacio)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: T.primer })).toBeInTheDocument();
    });

    it("una respuesta que no es arreglo no rompe la pantalla", async () => {
      montar({ ok: false });
      expect(await screen.findByText(T.vacio)).toBeInTheDocument();
    });
  });

  describe(`${cfg.rf} · Registrar (formulario del modal)`, () => {
    it("el campo monto es obligatorio → 'El monto es obligatorio' y no envía", async () => {
      await abrirRegistro();
      await registrar();
      expect(screen.getByText("El monto es obligatorio")).toBeInTheDocument();
      expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
    });

    it.each(cfg.invalidos)("%s → error y no envía", async (_n, valores, mensaje) => {
      await abrirRegistro();
      llenar({ ...cfg.crearValido, ...valores });
      await registrar();
      expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
      expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
    });

    it("fecha futura → 'La fecha no puede ser futura'", async () => {
      await abrirRegistro();
      llenar({ ...cfg.crearValido, fecha_registro: "2999-01-01" });
      await registrar();
      expect(screen.getByText("La fecha no puede ser futura")).toBeInTheDocument();
      expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
    });

    it(`envía POST /movimientos como ${cfg.tipoFlujo}/${cfg.subtipo} con el token`, async () => {
      await abrirRegistro([["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
      llenar(cfg.crearValido);
      await registrar();

      await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
      const [envio] = api.llamadas("POST", "/movimientos");
      expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
      expect(envio.cuerpo).toEqual({ tipo_flujo: cfg.tipoFlujo, subtipo_modulo: cfg.subtipo, datos: cfg.cuerpoCrear });
    });

    it("registro exitoso: aviso, revisión de alertas, cierra el modal y recarga", async () => {
      await abrirRegistro([["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
      llenar(cfg.crearValido);
      await registrar();

      await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith(T.toastCrear));
      expect(revisarAhora).toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByText(T.tituloModal, { selector: "h4" })).not.toBeInTheDocument());
      await waitFor(() => expect(api.llamadas("GET", LISTA)).toHaveLength(2));
    });

    it("si el backend rechaza, muestra su mensaje y mantiene el modal abierto", async () => {
      await abrirRegistro([["POST", "/movimientos", () => ({ status: 400, body: { ok: false, mensaje: "Rechazado por el servidor" } })]]);
      llenar(cfg.crearValido);
      await registrar();
      expect(await screen.findByText("Rechazado por el servidor")).toBeInTheDocument();
      expect(mostrarToast).not.toHaveBeenCalled();
    });

    it("sin conexión → 'Error al conectar con el servidor'", async () => {
      await abrirRegistro();
      api.fetch.mockImplementationOnce(() => Promise.reject(new Error("offline")));
      llenar(cfg.crearValido);
      await registrar();
      expect(await screen.findByText("Error al conectar con el servidor")).toBeInTheDocument();
    });

    it("Cancelar y Escape cierran el modal sin enviar", async () => {
      await abrirRegistro();
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByText(T.tituloModal, { selector: "h4" })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: T.agregar }));
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByText(T.tituloModal, { selector: "h4" })).not.toBeInTheDocument();
      expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
    });
  });

  describe(`${cfg.rf} · Editar (modal de edición)`, () => {
    it("precarga los datos del registro seleccionado", async () => {
      await abrirEdicion();
      for (const [n, v] of Object.entries(cfg.precarga)) expect(campo(n)).toHaveValue(v);
    });

    it(`guarda con PUT ${LISTA}/:id y confirma`, async () => {
      await abrirEdicion([["PUT", `${LISTA}/1`, () => ({ body: { ok: true } })]]);
      llenar(cfg.editarCambios);
      await guardar();

      await waitFor(() => expect(api.llamadas("PUT", `${LISTA}/1`)).toHaveLength(1));
      const [envio] = api.llamadas("PUT", `${LISTA}/1`);
      expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
      expect(envio.cuerpo).toEqual(cfg.cuerpoEditar);
      await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith(T.toastEditar));
      expect(revisarAhora).toHaveBeenCalled();
    });

    it.each(cfg.editarInvalidos)("%s → error y no envía", async (_n, valores, mensaje) => {
      await abrirEdicion();
      llenar(valores);
      await guardar();
      expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
      expect(api.llamadas("PUT", `${LISTA}/1`)).toHaveLength(0);
    });

    it("muestra el mensaje del backend si rechaza la edición", async () => {
      await abrirEdicion([["PUT", `${LISTA}/1`, () => ({ status: 404, body: { ok: false, mensaje: "No encontrado" } })]]);
      await guardar();
      expect(await screen.findByText("No encontrado")).toBeInTheDocument();
      expect(mostrarToast).not.toHaveBeenCalled();
    });

    it("Cancelar cierra el modal sin guardar", async () => {
      await abrirEdicion();
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByText(T.tituloEditar)).not.toBeInTheDocument();
      expect(api.llamadas("PUT", `${LISTA}/1`)).toHaveLength(0);
    });
  });

  describe(`${cfg.rf} · Eliminar (confirmación)`, () => {
    it(`confirma antes de eliminar y luego llama DELETE ${LISTA}/:id`, async () => {
      montar(cfg.filas, [["DELETE", `${LISTA}/2`, () => ({ body: { ok: true } })]]);
      await screen.findAllByText(cfg.textoFila);

      await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[1]);
      expect(screen.getByText(T.eliminarTitulo)).toBeInTheDocument();
      expect(api.llamadas("DELETE", LISTA)).toHaveLength(0);

      await userEvent.click(within(screen.getByText(T.eliminarTitulo).closest("div")).getByRole("button", { name: "Eliminar" }));

      await waitFor(() => expect(api.llamadas("DELETE", `${LISTA}/2`)).toHaveLength(1));
      expect(api.llamadas("DELETE", `${LISTA}/2`)[0].opciones.headers.Authorization).toBe("Bearer tok-123");
      await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith(T.toastEliminar));
      await waitFor(() => expect(api.llamadas("GET", LISTA)).toHaveLength(2));
    });

    it("Cancelar no elimina nada", async () => {
      montar();
      await screen.findAllByText(cfg.textoFila);
      await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByText(T.eliminarTitulo)).not.toBeInTheDocument();
      expect(api.llamadas("DELETE", LISTA)).toHaveLength(0);
    });
  });
}
