/**
 * RF-04 · Gestionar ahorros (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/ModuloAhorros.jsx             → metas, progreso, abonos, edición y eliminación
 *   Frontend/src/components/Modalnuevomovimiento.jsx → formulario "Registrar Ahorro" (subtipo Ahorro)
 *   Frontend/src/services/api.js                     → abonarAhorro (PATCH /api/movimientos/ahorros/:id/abonar)
 * Endpoints (fetch simulado): GET/POST /api/movimientos(/ahorros) · PUT/DELETE /api/movimientos/ahorros/:id
 *                             PATCH /api/movimientos/ahorros/:id/abonar
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { instalarFetch } from "../helpers/fetchMock";

const { mostrarToast, revisarAhora } = vi.hoisted(() => ({ mostrarToast: vi.fn(), revisarAhora: vi.fn() }));
vi.mock("../../../Frontend/src/components/HeaderModulos", () => ({ default: () => null }));
vi.mock("../../../Frontend/src/context/ToastContext", () => ({ useToast: () => ({ mostrarToast }) }));
vi.mock("../../../Frontend/src/context/NotificacionesContext", () => ({ useNotificaciones: () => ({ revisarAhora }) }));

import ModuloAhorros from "../../../Frontend/src/pages/ModuloAhorros";

const AHORROS = [
  { id: 1, monto: "1000000", monto_acumulado: "400000", meta: "Vacaciones", descripcion: "Viaje", fecha: "2026-10-01T00:00:00.000Z", fecha_meta: "2027-06-30T00:00:00.000Z", id_categoria: 3, categoria: "Cat" },
  { id: 2, monto: "500000", monto_acumulado: "500000", meta: "Celular nuevo", descripcion: null, fecha: "2026-09-01T00:00:00.000Z", fecha_meta: null, id_categoria: null, categoria: null },
];
const L = "/movimientos/ahorros";
let api;

const montar = (ahorros = AHORROS, extra = []) => {
  api = instalarFetch([
    ["GET", L, () => ({ body: ahorros })],
    ["GET", "/categorias", () => ({ body: { categorias: [{ id: 3, nombre: "Cat", activa: 1 }] } })],
    ["GET", "/dependientes", () => ({ body: [] })],
    ...extra,
  ]);
  return render(<MemoryRouter><ModuloAhorros /></MemoryRouter>);
};
const campo = (n) => document.querySelector(`[name="${n}"]`);
const escribir = (n, v) => fireEvent.change(campo(n), { target: { value: v } });
const inputAbono = () => document.querySelector('input[placeholder="0.00"]');
const esc = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "tok-123");
  localStorage.setItem("usuario", JSON.stringify({ nombre: "Laura" }));
});

// ═════════════════════════════════════════════════════════════
describe("RF-04 · Consultar metas (ModuloAhorros)", () => {
  it("pide las metas con el token (GET /movimientos/ahorros)", async () => {
    montar();
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(1));
    expect(api.llamadas("GET", L)[0].opciones.headers.Authorization).toBe("Bearer tok-123");
  });

  it("lista las metas activas con su progreso hacia la meta (acumulado / objetivo)", async () => {
    montar();
    expect((await screen.findAllByText("Vacaciones")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("$400.000 acumulado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Meta: $1.000.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("40.0%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("30/06/2027").length).toBeGreaterThan(0);
  });

  it("RF-04.4 · una meta completada sale de las activas y aparece en 'Metas Alcanzadas'", async () => {
    montar();
    await screen.findAllByText("Vacaciones");
    expect(screen.queryByText(/Celular nuevo/)).not.toBeInTheDocument(); // completada, sección colapsada

    await userEvent.click(screen.getByRole("button", { name: /Metas Alcanzadas/ }));
    expect((await screen.findAllByText(/Celular nuevo/)).length).toBeGreaterThan(0);
  });

  it("RF-04.4 · una meta completada ya no ofrece 'Abonar'", async () => {
    montar();
    await screen.findAllByText("Vacaciones");
    await userEvent.click(screen.getByRole("button", { name: /Metas Alcanzadas/ }));
    await screen.findAllByText(/Celular nuevo/);
    // Solo la meta activa tiene botón Abonar (móvil + escritorio = 2 apariciones)
    expect(screen.getAllByRole("button", { name: "Abonar" })).toHaveLength(2);
  });

  it("muestra el total de las metas y la cantidad de planes", async () => {
    montar();
    expect(await screen.findByText("$1.500.000")).toBeInTheDocument();
    expect(screen.getByText("2 planes de ahorro")).toBeInTheDocument();
  });

  it("sin metas → estado vacío con acceso a crear la primera", async () => {
    montar([]);
    expect(await screen.findByText("No hay ahorros registrados aún.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar primer ahorro" })).toBeInTheDocument();
  });

  it("si todas las metas están completadas, felicita al usuario", async () => {
    montar([AHORROS[1]]);
    expect(await screen.findByText("¡Alcanzaste todas tus metas activas!")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-04 · Crear meta (formulario del modal)", () => {
  const abrir = async (extra) => {
    montar(AHORROS, extra);
    await screen.findAllByText("Vacaciones");
    await userEvent.click(screen.getByRole("button", { name: /Nuevo Ahorro/ }));
    await screen.findByText(/Registrar Ahorro/, { selector: "h4" });
  };
  const registrar = () => userEvent.click(screen.getByRole("button", { name: "Registrar Ahorro" }));

  it("el formulario ofrece monto objetivo, nombre de meta, categoría, descripción y fechas", async () => {
    await abrir();
    for (const n of ["monto", "meta", "id_categoria", "descripcion", "fecha_registro", "fecha_meta"]) expect(campo(n)).toBeInTheDocument();
  });

  it("RF-04.1 · monto objetivo vacío → 'El monto es obligatorio'", async () => {
    await abrir();
    escribir("meta", "Moto");
    await registrar();
    expect(screen.getByText("El monto es obligatorio")).toBeInTheDocument();
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });

  it.each([
    ["RF-04.1 monto objetivo 0", { monto: "0", meta: "Moto" }, "El monto debe ser mayor a 0"],
    ["RF-04.1 monto objetivo negativo", { monto: "-1", meta: "Moto" }, "El monto debe ser mayor a 0"],
    ["monto sobre el máximo", { monto: "1000000000001", meta: "Moto" }, "no puede superar"],
    ["nombre de meta vacío", { monto: "1000", meta: "   " }, "El nombre de la meta es obligatorio"],
    ["nombre de meta de más de 100 caracteres", { monto: "1000", meta: "m".repeat(101) }, "El nombre de la meta no puede superar 100 caracteres"],
    ["RF-04.5 fecha meta anterior a la de registro", { monto: "1000", meta: "Moto", fecha_registro: "2999-03-10", fecha_meta: "2999-03-01" }, "La fecha meta no puede ser anterior a la de registro"],
    ["fecha meta en el pasado", { monto: "1000", meta: "Moto", fecha_meta: "2020-01-01" }, "La fecha meta no puede estar en el pasado"],
  ])("%s → error y no envía", async (_n, valores, mensaje) => {
    await abrir();
    Object.entries(valores).forEach(([n, v]) => escribir(n, v));
    await registrar();
    expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });

  it("envía POST /movimientos como Entrada/Ahorro y recarga las metas", async () => {
    await abrir([["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
    escribir("monto", "2000000");
    escribir("meta", "Moto");
    escribir("descripcion", "Para el trabajo");
    escribir("fecha_registro", "2026-11-01");
    escribir("fecha_meta", "2999-12-31");
    await registrar();

    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
    const [envio] = api.llamadas("POST", "/movimientos");
    expect(envio.cuerpo).toEqual({
      tipo_flujo: "Entrada",
      subtipo_modulo: "Ahorro",
      datos: { monto: 2000000, meta: "Moto", descripcion: "Para el trabajo", fecha_registro: "2026-11-01", fecha_meta: "2999-12-31", id_categoria: null },
    });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Ahorro registrado correctamente"));
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(2));
  });

  it("fecha meta y descripción son opcionales (se envían null)", async () => {
    await abrir([["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
    escribir("monto", "500");
    escribir("meta", "Bici");
    await registrar();
    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
    expect(api.llamadas("POST", "/movimientos")[0].cuerpo.datos).toMatchObject({ descripcion: null, fecha_meta: null });
  });

  it("si el backend rechaza, muestra su mensaje", async () => {
    await abrir([["POST", "/movimientos", () => ({ status: 400, body: { ok: false, mensaje: "Rechazado" } })]]);
    escribir("monto", "500");
    escribir("meta", "Bici");
    await registrar();
    expect(await screen.findByText("Rechazado")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-04 · Registrar abono (modal 'Abonar al ahorro')", () => {
  const abrirAbono = async (extra) => {
    montar(AHORROS, extra);
    await screen.findAllByText("Vacaciones");
    await userEvent.click(screen.getAllByRole("button", { name: "Abonar" })[0]);
    await screen.findByText(/Abonar al ahorro/);
  };
  const confirmar = () => userEvent.click(screen.getByRole("button", { name: "Confirmar abono" }));

  it("muestra la meta y su progreso actual", async () => {
    await abrirAbono();
    expect(screen.getByText(/Abonar al ahorro/)).toBeInTheDocument();
    expect(screen.getByText("Monto del abono *")).toBeInTheDocument();
    expect(inputAbono()).toBeInTheDocument();
  });

  it.each([
    ["RF-04.2 vacío", "", "El monto del abono debe ser mayor a 0"],
    ["RF-04.2 cero", "0", "El monto del abono debe ser mayor a 0"],
    ["RF-04.2 negativo", "-50", "El monto del abono debe ser mayor a 0"],
    ["RF-04.3 mayor al cupo disponible", "600001", "El abono no puede superar el cupo disponible ($600.000)"],
  ])("%s → error y no llama al servidor", async (_n, valor, mensaje) => {
    await abrirAbono();
    fireEvent.change(inputAbono(), { target: { value: valor } });
    await confirmar();
    expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
    expect(api.llamadas("PATCH", "/abonar")).toHaveLength(0);
  });

  it("RF-04.3 · abonar exactamente el cupo disponible (600.000) es válido", async () => {
    await abrirAbono([["PATCH", `${L}/1/abonar`, () => ({ body: { ok: true } })]]);
    fireEvent.change(inputAbono(), { target: { value: "600000" } });
    await confirmar();
    await waitFor(() => expect(api.llamadas("PATCH", `${L}/1/abonar`)).toHaveLength(1));
  });

  it("RF-04.6 · envía PATCH /ahorros/:id/abonar con el monto, avisa y recarga la meta", async () => {
    await abrirAbono([["PATCH", `${L}/1/abonar`, () => ({ body: { ok: true, acumulado: 500000 } })]]);
    fireEvent.change(inputAbono(), { target: { value: "100000" } });
    await confirmar();

    await waitFor(() => expect(api.llamadas("PATCH", `${L}/1/abonar`)).toHaveLength(1));
    const [envio] = api.llamadas("PATCH", `${L}/1/abonar`);
    expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(envio.cuerpo).toEqual({ monto: 100000 });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Abono registrado correctamente"));
    expect(revisarAhora).toHaveBeenCalled(); // RF-04.7: el backend pudo generar la notificación de meta
    await waitFor(() => expect(screen.queryByText(/Abonar al ahorro/)).not.toBeInTheDocument());
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(2));
  });

  it("OBSERVACIÓN · si el backend rechaza el abono (HTTP 400), la web muestra un mensaje genérico", async () => {
    // api.js lanza una excepción en respuestas no-OK y la pantalla la captura como error de conexión:
    // el motivo del backend ("La meta de ahorro ya fue alcanzada", etc.) no llega al usuario.
    await abrirAbono([["PATCH", `${L}/1/abonar`, () => ({ status: 400, body: { ok: false, mensaje: "La meta de ahorro ya fue alcanzada" } })]]);
    fireEvent.change(inputAbono(), { target: { value: "100" } });
    await confirmar();
    expect(await screen.findByText("Error al conectar con el servidor")).toBeInTheDocument();
    expect(mostrarToast).not.toHaveBeenCalled();
  });

  it("Cancelar cierra el modal sin abonar", async () => {
    await abrirAbono();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/Abonar al ahorro/)).not.toBeInTheDocument();
    expect(api.llamadas("PATCH", "/abonar")).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-04 · Modificar meta (modal de edición)", () => {
  const abrirEdicion = async (extra) => {
    montar(AHORROS, extra);
    await screen.findAllByText("Vacaciones");
    await userEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    await screen.findByText(/Editar Ahorro/);
  };
  const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  it("precarga la meta seleccionada", async () => {
    await abrirEdicion();
    expect(campo("monto")).toHaveValue(1000000);
    expect(campo("monto_acumulado")).toHaveValue(400000);
    expect(campo("meta")).toHaveValue("Vacaciones");
    expect(campo("fecha_meta")).toHaveValue("2027-06-30");
  });

  it("guarda con PUT /ahorros/:id y confirma", async () => {
    await abrirEdicion([["PUT", `${L}/1`, () => ({ body: { ok: true } })]]);
    escribir("monto", "1200000");
    escribir("meta", "Vacaciones 2027");
    await guardar();

    await waitFor(() => expect(api.llamadas("PUT", `${L}/1`)).toHaveLength(1));
    expect(api.llamadas("PUT", `${L}/1`)[0].cuerpo).toEqual({
      monto: 1200000, monto_acumulado: 400000, meta: "Vacaciones 2027", descripcion: "Viaje",
      fecha_registro: "2026-10-01", fecha_meta: "2027-06-30", id_categoria: 3,
    });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Ahorro actualizado correctamente"));
  });

  it.each([
    ["RF-04.1 monto objetivo 0", { monto: "0" }, "La meta debe ser mayor a 0"],
    ["nombre de meta vacío", { meta: "" }, "El nombre de la meta es obligatorio"],
    ["RF-04.5 fecha meta anterior a la de registro", { fecha_meta: "2026-09-01" }, "La fecha meta no puede ser anterior a la de registro"],
    ["RF-04.1 objetivo menor a lo acumulado", { monto: "300000" }, "La meta no puede ser menor a lo ya acumulado ($400.000)"],
  ])("%s → error y no envía", async (_n, valores, mensaje) => {
    await abrirEdicion();
    Object.entries(valores).forEach(([n, v]) => escribir(n, v));
    await guardar();
    expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
    expect(api.llamadas("PUT", `${L}/1`)).toHaveLength(0);
  });

  it("muestra el mensaje del backend si rechaza la edición", async () => {
    await abrirEdicion([["PUT", `${L}/1`, () => ({ status: 400, body: { ok: false, mensaje: "La meta no puede ser menor a lo ya acumulado" } })]]);
    await guardar();
    expect(await screen.findByText("La meta no puede ser menor a lo ya acumulado")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-04 · Eliminar meta (confirmación)", () => {
  it("confirma antes de eliminar y luego llama DELETE /ahorros/:id", async () => {
    montar(AHORROS, [["DELETE", `${L}/1`, () => ({ body: { ok: true } })]]);
    await screen.findAllByText("Vacaciones");

    await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    expect(screen.getByText(/¿Eliminar ahorro\?/)).toBeInTheDocument();
    expect(api.llamadas("DELETE", L)).toHaveLength(0);

    await userEvent.click(within(screen.getByText(/¿Eliminar ahorro\?/).closest("div")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(api.llamadas("DELETE", `${L}/1`)).toHaveLength(1));
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Ahorro eliminado correctamente"));
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(2));
  });

  it("Cancelar no elimina nada", async () => {
    montar();
    await screen.findAllByText("Vacaciones");
    await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/¿Eliminar ahorro\?/)).not.toBeInTheDocument();
    expect(api.llamadas("DELETE", L)).toHaveLength(0);
  });
});
