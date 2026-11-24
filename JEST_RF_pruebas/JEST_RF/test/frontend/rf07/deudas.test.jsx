/**
 * RF-07 · Gestionar deudas (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/ModuloDeudas.jsx              → deudas, cuotas, pagos, edición y eliminación
 *   Frontend/src/components/Modalnuevomovimiento.jsx → formulario "Registrar Deuda" (subtipo Deuda)
 *   Frontend/src/services/api.js                     → abonarDeuda (PATCH /api/movimientos/deudas/:id/abonar)
 * Endpoints (fetch simulado): GET/POST /api/movimientos(/deudas) · PUT/DELETE /api/movimientos/deudas/:id
 *                             PATCH /api/movimientos/deudas/:id/abonar
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

import ModuloDeudas from "../../../Frontend/src/pages/ModuloDeudas";

const DEUDAS = [
  { id: 1, monto: "1200000", fuente: "Banco Andino", descripcion: "Libre inversión", estado: "pendiente", cuotas_total: 12, cuotas_pagadas: 3, fecha_inicio: "2026-01-01T00:00:00.000Z", fecha_fin: "2030-12-31T00:00:00.000Z", id_categoria: 3, categoria: "Cat" },
  { id: 2, monto: "400000", fuente: "Amigo", descripcion: null, estado: "pendiente", cuotas_total: null, cuotas_pagadas: 0, fecha_inicio: null, fecha_fin: "2020-01-01T00:00:00.000Z", id_categoria: null, categoria: null },
  { id: 3, monto: "300000", fuente: "Tienda", descripcion: null, estado: "pagada", cuotas_total: 3, cuotas_pagadas: 3, fecha_inicio: null, fecha_fin: null, id_categoria: null, categoria: null },
];
const L = "/movimientos/deudas";
let api;

const montar = (deudas = DEUDAS, extra = []) => {
  api = instalarFetch([
    ["GET", L, () => ({ body: deudas })],
    ["GET", "/categorias", () => ({ body: { categorias: [{ id: 3, nombre: "Cat", activa: 1 }] } })],
    ["GET", "/dependientes", () => ({ body: [] })],
    ...extra,
  ]);
  return render(<MemoryRouter><ModuloDeudas /></MemoryRouter>);
};
const campo = (n) => document.querySelector(`[name="${n}"]`);
const escribir = (n, v) => fireEvent.change(campo(n), { target: { value: v } });
const inputCuotas = () => document.querySelector('input[placeholder="1"]');
const esc = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "tok-123");
  localStorage.setItem("usuario", JSON.stringify({ nombre: "Laura" }));
});

// ═════════════════════════════════════════════════════════════
describe("RF-07 · Consultar deudas (ModuloDeudas)", () => {
  it("pide las deudas con el token (GET /movimientos/deudas)", async () => {
    montar();
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(1));
    expect(api.llamadas("GET", L)[0].opciones.headers.Authorization).toBe("Bearer tok-123");
  });

  it("RF-07.8 · muestra el avance de cuotas y el valor de cada cuota", async () => {
    montar();
    expect((await screen.findAllByText("3/12 cuotas")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("25%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$100.000").length).toBeGreaterThan(0); // 1.200.000 ÷ 12
    expect(screen.getAllByText("Pagado: $300.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pendiente: $900.000").length).toBeGreaterThan(0);
  });

  it("una deuda sin cuotas se muestra como 'Pago único'", async () => {
    montar();
    expect((await screen.findAllByText("Pago único")).length).toBeGreaterThan(0);
  });

  it("RF-07.9 · separa las deudas pendientes de las pagadas (colapsadas)", async () => {
    montar();
    await screen.findAllByText("Banco Andino");
    expect(screen.queryByText("Tienda")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Deudas Pagadas/ }));
    expect((await screen.findAllByText("Tienda")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pagada").length).toBeGreaterThan(0);
  });

  it("RF-07.9 · una deuda pagada no ofrece 'Abonar'", async () => {
    montar();
    await screen.findAllByText("Banco Andino");
    await userEvent.click(screen.getByRole("button", { name: /Deudas Pagadas/ }));
    await screen.findAllByText("Tienda");
    // 2 deudas pendientes × (móvil + escritorio) = 4 botones Abonar; la pagada no suma
    expect(screen.getAllByRole("button", { name: "Abonar" })).toHaveLength(4);
  });

  it("muestra el total de deudas y lo que falta por pagar", async () => {
    montar();
    expect(await screen.findByText("$1.900.000")).toBeInTheDocument();
    expect(screen.getByText("$1.300.000")).toBeInTheDocument(); // 900.000 + 400.000
    expect(screen.getByText("2 pendientes")).toBeInTheDocument();
  });

  it("RF-07.11 · señala la deuda vencida", async () => {
    montar();
    expect((await screen.findAllByText(/Vencida/)).length).toBeGreaterThan(0);
  });

  it("RF-07.11 · señala una deuda que vence en 7 días o menos", async () => {
    const pronto = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    montar([{ ...DEUDAS[0], fecha_fin: pronto }]);
    expect((await screen.findAllByText(/Vence en \d+d/)).length).toBeGreaterThan(0);
  });

  it("sin deudas → 'No tienes deudas pendientes.'", async () => {
    montar([]);
    expect(await screen.findByText("No tienes deudas pendientes.")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-07 · Registrar deuda (formulario del modal)", () => {
  const abrir = async (extra) => {
    montar(DEUDAS, extra);
    await screen.findAllByText("Banco Andino");
    await userEvent.click(screen.getByRole("button", { name: /Nueva Deuda/ }));
    await screen.findByText(/Registrar Deuda/, { selector: "h4" });
  };
  const registrar = () => userEvent.click(screen.getByRole("button", { name: "Registrar Deuda" }));

  it("el formulario ofrece monto, fuente, cuotas, descripción, categoría y fechas", async () => {
    await abrir();
    for (const n of ["monto", "fuente", "cuotas_total", "descripcion", "id_categoria", "fecha_inicio", "fecha_fin"]) expect(campo(n)).toBeInTheDocument();
  });

  it("RF-07.2 · monto vacío → 'El monto es obligatorio'", async () => {
    await abrir();
    escribir("fuente", "Banco");
    await registrar();
    expect(screen.getByText("El monto es obligatorio")).toBeInTheDocument();
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });

  it.each([
    ["RF-07.2 monto 0", { monto: "0", fuente: "Banco" }, "El monto debe ser mayor a 0"],
    ["RF-07.2 monto negativo", { monto: "-1", fuente: "Banco" }, "El monto debe ser mayor a 0"],
    ["RF-07.1 fuente vacía", { monto: "1000", fuente: "  " }, "La fuente de la deuda es obligatoria"],
    ["fuente de más de 150 caracteres", { monto: "1000", fuente: "f".repeat(151) }, "La fuente no puede superar 150 caracteres"],
    ["RF-07.3 cuotas = 0", { monto: "1000", fuente: "Banco", cuotas_total: "0" }, "El número de cuotas debe ser un entero mayor a 0"],
    ["RF-07.3 cuotas negativas", { monto: "1000", fuente: "Banco", cuotas_total: "-2" }, "El número de cuotas debe ser un entero mayor a 0"],
    ["RF-07.3 cuotas decimales", { monto: "1000", fuente: "Banco", cuotas_total: "2.5" }, "El número de cuotas debe ser un entero mayor a 0"],
    ["RF-07.7 fecha de fin anterior a la de inicio", { monto: "1000", fuente: "Banco", fecha_inicio: "2026-11-10", fecha_fin: "2026-11-09" }, "La fecha de fin no puede ser anterior a la de inicio"],
  ])("%s → error y no envía", async (_n, valores, mensaje) => {
    await abrir();
    Object.entries(valores).forEach(([n, v]) => escribir(n, v));
    await registrar();
    expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });

  it("envía POST /movimientos como Salida/Deuda con cuotas numéricas", async () => {
    await abrir([["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
    escribir("monto", "1200000");
    escribir("fuente", "Banco Andino");
    escribir("cuotas_total", "12");
    escribir("descripcion", "Crédito");
    escribir("fecha_inicio", "2026-11-01");
    escribir("fecha_fin", "2027-10-31");
    await registrar();

    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
    const [envio] = api.llamadas("POST", "/movimientos");
    expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(envio.cuerpo).toEqual({
      tipo_flujo: "Salida",
      subtipo_modulo: "Deuda",
      datos: { monto: 1200000, fuente: "Banco Andino", descripcion: "Crédito", cuotas_total: 12, fecha_inicio: "2026-11-01", fecha_fin: "2027-10-31", id_categoria: null },
    });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Deuda registrado correctamente"));
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(2));
  });

  it("pago único: sin cuotas ni fechas se envían null", async () => {
    await abrir([["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
    escribir("monto", "300000");
    escribir("fuente", "Amigo");
    await registrar();
    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
    expect(api.llamadas("POST", "/movimientos")[0].cuerpo.datos).toMatchObject({ cuotas_total: null, fecha_inicio: null, fecha_fin: null });
  });

  it("si el backend rechaza, muestra su mensaje", async () => {
    await abrir([["POST", "/movimientos", () => ({ status: 400, body: { ok: false, mensaje: "Rechazado" } })]]);
    escribir("monto", "1000");
    escribir("fuente", "Banco");
    await registrar();
    expect(await screen.findByText("Rechazado")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-07 · Pagar cuotas (modal 'Abonar cuota')", () => {
  const abrirPago = async (indice = 0, extra) => {
    montar(DEUDAS, extra);
    await screen.findAllByText("Banco Andino");
    await userEvent.click(screen.getAllByRole("button", { name: "Abonar" })[indice]);
    await screen.findByText(/Abonar cuota/);
  };
  const confirmar = () => userEvent.click(screen.getByRole("button", { name: "Confirmar pago" }));

  it("propone 1 cuota y calcula el monto a registrar (monto ÷ cuotas totales)", async () => {
    await abrirPago();
    expect(inputCuotas()).toHaveValue(1);
    expect(screen.getByText("$100.000", { selector: "span.text-purple-400" })).toBeInTheDocument();
  });

  it("RF-07.8 · el monto a registrar se recalcula al cambiar el número de cuotas", async () => {
    await abrirPago();
    fireEvent.change(inputCuotas(), { target: { value: "3" } });
    expect(screen.getByText("$300.000", { selector: "span.text-purple-400" })).toBeInTheDocument();
  });

  it.each([
    ["RF-07.5 cero cuotas", "0", "El número de cuotas debe ser al menos 1"],
    ["RF-07.5 vacío", "", "El número de cuotas debe ser al menos 1"],
    ["RF-07.5 negativo", "-2", "El número de cuotas debe ser al menos 1"],
    ["RF-07.4 más cuotas de las pendientes (10 > 9)", "10", "Quedan 9 cuota(s) por pagar."],
  ])("%s → error y no llama al servidor", async (_n, valor, mensaje) => {
    await abrirPago();
    fireEvent.change(inputCuotas(), { target: { value: valor } });
    await confirmar();
    expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
    expect(api.llamadas("PATCH", "/abonar")).toHaveLength(0);
  });

  it("RF-07.4 · pagar exactamente las cuotas pendientes (9) es válido", async () => {
    await abrirPago(0, [["PATCH", `${L}/1/abonar`, () => ({ body: { ok: true, estado: "pagada" } })]]);
    fireEvent.change(inputCuotas(), { target: { value: "9" } });
    await confirmar();
    await waitFor(() => expect(api.llamadas("PATCH", `${L}/1/abonar`)).toHaveLength(1));
  });

  it("envía PATCH /deudas/:id/abonar con las cuotas, avisa y recarga", async () => {
    await abrirPago(0, [["PATCH", `${L}/1/abonar`, () => ({ body: { ok: true, estado: "pendiente" } })]]);
    fireEvent.change(inputCuotas(), { target: { value: "3" } });
    await confirmar();

    await waitFor(() => expect(api.llamadas("PATCH", `${L}/1/abonar`)).toHaveLength(1));
    const [envio] = api.llamadas("PATCH", `${L}/1/abonar`);
    expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(envio.cuerpo).toEqual({ cuotas: 3 });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Abono registrado correctamente"));
    expect(revisarAhora).toHaveBeenCalled();
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(2));
  });

  it("RF-07.9 · si el pago salda la deuda, el aviso dice 'Deuda pagada completamente'", async () => {
    await abrirPago(0, [["PATCH", `${L}/1/abonar`, () => ({ body: { ok: true, estado: "pagada" } })]]);
    fireEvent.change(inputCuotas(), { target: { value: "9" } });
    await confirmar();
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Deuda pagada completamente"));
  });

  it("pago único: muestra el monto completo y solo admite 1 cuota", async () => {
    await abrirPago(1); // 2ª deuda pendiente: "Amigo"
    expect(screen.getByText(/Pago único — \$400\.000/)).toBeInTheDocument();
    fireEvent.change(inputCuotas(), { target: { value: "2" } });
    await confirmar();
    expect(screen.getByText("Quedan 1 cuota(s) por pagar.")).toBeInTheDocument();
  });

  it("OBSERVACIÓN · si el backend rechaza el pago (HTTP 4xx), la web muestra un mensaje genérico", async () => {
    // api.js lanza una excepción en respuestas no-OK; la pantalla la trata como fallo de conexión.
    await abrirPago(0, [["PATCH", `${L}/1/abonar`, () => ({ status: 409, body: { ok: false, mensaje: "Esta deuda ya está pagada" } })]]);
    await confirmar();
    expect(await screen.findByText("Error al conectar con el servidor")).toBeInTheDocument();
    expect(mostrarToast).not.toHaveBeenCalled();
  });

  it("Cancelar cierra el modal sin pagar", async () => {
    await abrirPago();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/Abonar cuota/)).not.toBeInTheDocument();
    expect(api.llamadas("PATCH", "/abonar")).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-07 · Modificar deuda (modal de edición)", () => {
  const abrirEdicion = async (extra) => {
    montar(DEUDAS, extra);
    await screen.findAllByText("Banco Andino");
    await userEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    await screen.findByText(/Editar Deuda/);
  };
  const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  it("precarga la deuda seleccionada", async () => {
    await abrirEdicion();
    expect(campo("fuente")).toHaveValue("Banco Andino");
    expect(campo("monto")).toHaveValue(1200000);
    expect(campo("cuotas_total")).toHaveValue(12);
    expect(campo("cuotas_pagadas")).toHaveValue(3);
    expect(campo("fecha_fin")).toHaveValue("2030-12-31");
  });

  it("guarda con PUT /deudas/:id conservando cuotas pagadas y estado 'pendiente'", async () => {
    await abrirEdicion([["PUT", `${L}/1`, () => ({ body: { ok: true } })]]);
    escribir("fuente", "Banco Andino SA");
    await guardar();

    await waitFor(() => expect(api.llamadas("PUT", `${L}/1`)).toHaveLength(1));
    expect(api.llamadas("PUT", `${L}/1`)[0].cuerpo).toEqual({
      monto: 1200000, fuente: "Banco Andino SA", descripcion: "Libre inversión", estado: "pendiente",
      cuotas_pagadas: 3, cuotas_total: 12, fecha_inicio: "2026-01-01", fecha_fin: "2030-12-31", id_categoria: 3,
    });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Deuda actualizada correctamente"));
  });

  it("RF-07.9 · si las cuotas pagadas igualan el total, el estado enviado es 'pagada'", async () => {
    await abrirEdicion([["PUT", `${L}/1`, () => ({ body: { ok: true } })]]);
    escribir("cuotas_pagadas", "12");
    await guardar();
    await waitFor(() => expect(api.llamadas("PUT", `${L}/1`)).toHaveLength(1));
    expect(api.llamadas("PUT", `${L}/1`)[0].cuerpo).toMatchObject({ cuotas_pagadas: 12, estado: "pagada" });
  });

  it.each([
    ["RF-07.2 monto 0", { monto: "0" }, "El monto debe ser mayor a 0"],
    ["RF-07.1 fuente vacía", { fuente: "" }, "La fuente es obligatoria"],
    ["RF-07.3 cuotas totales = 0", { cuotas_total: "0" }, "El número de cuotas debe ser un entero mayor a 0"],
    ["cuotas pagadas negativas", { cuotas_pagadas: "-1" }, "Las cuotas pagadas deben ser un entero mayor o igual a 0"],
    ["RF-07.4 cuotas pagadas mayores al total", { cuotas_pagadas: "13" }, "Las cuotas pagadas no pueden superar el total"],
    ["RF-07.7 fecha fin anterior a la de inicio", { fecha_fin: "2025-12-31" }, "La fecha fin no puede ser anterior a la de inicio"],
  ])("%s → error y no envía", async (_n, valores, mensaje) => {
    await abrirEdicion();
    Object.entries(valores).forEach(([n, v]) => escribir(n, v));
    await guardar();
    expect(screen.getByText(esc(mensaje))).toBeInTheDocument();
    expect(api.llamadas("PUT", `${L}/1`)).toHaveLength(0);
  });

  it("muestra el mensaje del backend si rechaza la edición", async () => {
    await abrirEdicion([["PUT", `${L}/1`, () => ({ status: 400, body: { ok: false, mensaje: "Las cuotas pagadas no pueden superar el total de cuotas" } })]]);
    await guardar();
    expect(await screen.findByText("Las cuotas pagadas no pueden superar el total de cuotas")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-07 · Eliminar deuda (RF-07.10: confirmación previa)", () => {
  it("pide confirmación y, al confirmar, llama DELETE /deudas/:id", async () => {
    montar(DEUDAS, [["DELETE", `${L}/1`, () => ({ body: { ok: true } })]]);
    await screen.findAllByText("Banco Andino");

    await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    expect(screen.getByText(/¿Eliminar deuda\?/)).toBeInTheDocument();
    expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();
    expect(api.llamadas("DELETE", L)).toHaveLength(0); // aún no se ejecuta

    await userEvent.click(within(screen.getByText(/¿Eliminar deuda\?/).closest("div")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(api.llamadas("DELETE", `${L}/1`)).toHaveLength(1));
    expect(api.llamadas("DELETE", `${L}/1`)[0].opciones.headers.Authorization).toBe("Bearer tok-123");
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Deuda eliminada correctamente"));
    await waitFor(() => expect(api.llamadas("GET", L)).toHaveLength(2));
  });

  it("Cancelar no elimina nada", async () => {
    montar();
    await screen.findAllByText("Banco Andino");
    await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/¿Eliminar deuda\?/)).not.toBeInTheDocument();
    expect(api.llamadas("DELETE", L)).toHaveLength(0);
  });
});
