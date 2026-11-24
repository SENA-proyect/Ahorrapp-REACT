/**
 * RF-26 · Gestionar presupuestos y períodos presupuestales (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/ModulosPresupuestos.jsx → perfiles (crear/editar/activar/eliminar) y período (abrir/ajustar/cerrar)
 *   Frontend/src/services/api.js               → getPerfilesPrespuesto, crearPerfil, editarPerfil, eliminarPerfil,
 *                                                activarPerfil, getPeriodoActivo, abrirPeriodo, cerrarPeriodo, ajustarIngresoPeriodo
 * Endpoints (fetch simulado):
 *   GET/POST /api/presupuestos · PUT/DELETE /api/presupuestos/:id · PUT /api/presupuestos/:id/activar
 *   GET /api/presupuestos/periodos/activo · POST /periodos/abrir · PUT /periodos/cerrar · PATCH /periodos/ajustar-ingreso
 * Nota: la página muestra errores de activar/eliminar/cambiar perfil con window.alert (se espía en las pruebas).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { instalarFetch } from "../helpers/fetchMock";

vi.mock("../../../Frontend/src/components/HeaderModulos", () => ({ default: () => null }));

import ModulosPresupuestos from "../../../Frontend/src/pages/ModulosPresupuestos";

const P = "/presupuestos";
const PERFIL_ACTIVO = { ID_presupuesto: 1, Nombre: "Mensual", Descripcion: "Plan base", Activo: true, Dia_corte: 15, Porcentaje_gastos: 40, Porcentaje_deudas: 20, Porcentaje_imprevistos: 15, Porcentaje_ahorros: 10, Porcentaje_emergencia: 15 };
const PERFIL_OTRO = { ID_presupuesto: 2, Nombre: "Austero", Descripcion: null, Activo: false, Dia_corte: 1, Porcentaje_gastos: 30, Porcentaje_deudas: 30, Porcentaje_imprevistos: 10, Porcentaje_ahorros: 20, Porcentaje_emergencia: 10 };
const PERIODO = {
  ID_periodo: 50, perfil_nombre: "Mensual", Fecha_inicio: "2026-11-01", Fecha_fin: "2026-11-30", Estado: "abierto",
  Ingreso_estimado: 3000000, Ingreso_real: 2800000, Saldo_anterior: 200000,
  Monto_gastos: 1200000, Monto_deudas: 600000, Monto_imprevistos: 450000, Monto_ahorros: 300000, Monto_emergencia: 450000,
  ejecucion: { gastos: { presupuestado: 1200000, ejecutado: 900000, disponible: 300000 }, deudas: { presupuestado: 600000, ejecutado: 0, disponible: 600000 }, imprevistos: { presupuestado: 450000, ejecutado: 0, disponible: 450000 }, ahorros: { presupuestado: 300000, ejecutado: 0, disponible: 300000 } },
};
let api;

/** periodo = null simula "sin período abierto" */
const montar = ({ perfiles = [PERFIL_ACTIVO, PERFIL_OTRO], periodo = PERIODO, extra = [] } = {}) => {
  api = instalarFetch([
    ["GET", P, () => ({ body: { ok: true, data: perfiles } })],
    ["GET", `${P}/periodos/activo`, () => ({ body: { ok: true, data: periodo } })],
    ...extra,
  ]);
  return render(<MemoryRouter><ModulosPresupuestos /></MemoryRouter>);
};
const campo = (n) => document.querySelector(`input[type="number"][name="${n}"]`);
const campoTexto = (n) => document.querySelector(`input[type="text"][name="${n}"]`);
const cambiar = (el, v) => fireEvent.change(el, { target: { value: v } });
const click = (nombre) => userEvent.click(screen.getByRole("button", { name: nombre }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "tok-123");
  localStorage.setItem("usuario", JSON.stringify({ nombre: "Laura" }));
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Consultar perfiles y período activo", () => {
  it("pide perfiles y período activo con el token del usuario", async () => {
    montar();
    await screen.findByText("Austero");
    expect(api.llamadas("GET", P)[0].opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(api.llamadas("GET", `${P}/periodos/activo`)).toHaveLength(1);
  });

  it("lista los perfiles con día de corte y porcentajes; marca el activo", async () => {
    montar();
    expect((await screen.findAllByText("Mensual", { selector: "p" })).length).toBeGreaterThan(0);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText(/Corte día 15 — G:40% D:20% I:15% A:10% E:15%/)).toBeInTheDocument();
    expect(screen.getByText(/Corte día 1 — G:30% D:30% I:10% A:20% E:10%/)).toBeInTheDocument();
  });

  it("sin perfiles → mensaje vacío", async () => {
    montar({ perfiles: [], periodo: null });
    expect(await screen.findByText("No tienes perfiles de presupuesto.")).toBeInTheDocument();
  });

  it("con período abierto: muestra fechas, montos por módulo, saldo anterior e ingresos", async () => {
    montar();
    expect(await screen.findByText("01/11/2026 → 30/11/2026")).toBeInTheDocument();
    expect(screen.getByText("$1.200.000", { selector: "p.text-lg" })).toBeInTheDocument(); // gastos 40 %
    expect(screen.getByText("$200.000")).toBeInTheDocument(); // saldo anterior
    expect(screen.getByText("$3.000.000")).toBeInTheDocument(); // ingreso estimado
    expect(screen.getByText("$2.800.000")).toBeInTheDocument(); // ingreso real
  });

  it("RF-26.6 · sin período abierto: muestra 'Sin período activo' y ofrece abrir uno (hay perfil activo)", async () => {
    montar({ periodo: null });
    expect(await screen.findByText("Sin período activo")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Abrir período" }).length).toBeGreaterThan(0);
  });

  it("con período abierto, el perfil activo no se puede editar", async () => {
    montar();
    await screen.findByText("Austero");
    expect(screen.getByText(/Tiene un período abierto/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Editar/ })[0]).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Crear perfil", () => {
  const abrirCrear = async (extra) => {
    montar({ extra });
    await screen.findByText("Austero");
    await click(/Nuevo perfil/);
    await screen.findByText(/Nuevo perfil de presupuesto/, { selector: "h4" });
  };
  const guardar = () => click("Guardar perfil");

  it("propone la distribución por defecto 40/20/15/10/15 (suma 100 %) y día de corte 28", async () => {
    await abrirCrear();
    expect(campo("gastos")).toHaveValue(40);
    expect(campo("deudas")).toHaveValue(20);
    expect(campo("imprevistos")).toHaveValue(15);
    expect(campo("ahorros")).toHaveValue(10);
    expect(campo("emergencia")).toHaveValue(15);
    expect(campo("dia_corte")).toHaveValue(28);
    expect(screen.getByText(/100\.0%/)).toBeInTheDocument();
  });

  it("RF-26.1 · si los porcentajes no suman 100, muestra el aviso y deshabilita 'Guardar perfil'", async () => {
    await abrirCrear();
    cambiar(campo("gastos"), "50");
    expect(screen.getByText(/110\.0% — debe ser 100%/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar perfil" })).toBeDisabled();
  });

  it("RF-26.1 · el botón se habilita de nuevo al volver a sumar 100", async () => {
    await abrirCrear();
    cambiar(campo("gastos"), "50");
    cambiar(campo("deudas"), "10");
    expect(screen.getByRole("button", { name: "Guardar perfil" })).toBeEnabled();
  });

  it("RF-26.4 · el día de corte se limita a 1–31 mientras se escribe", async () => {
    await abrirCrear();
    cambiar(campo("dia_corte"), "45");
    expect(campo("dia_corte")).toHaveValue(31);
    cambiar(campo("dia_corte"), "0");
    expect(campo("dia_corte")).toHaveValue(1);
  });

  it("el nombre es obligatorio → 'El nombre del perfil es obligatorio' y no envía", async () => {
    await abrirCrear();
    await guardar();
    expect(screen.getByText("El nombre del perfil es obligatorio")).toBeInTheDocument();
    expect(api.llamadas("POST", P)).toHaveLength(0);
  });

  it("nombre de más de 80 caracteres → error", async () => {
    await abrirCrear();
    cambiar(campoTexto("nombre"), "n".repeat(81));
    await guardar();
    expect(screen.getByText("El nombre no puede superar 80 caracteres")).toBeInTheDocument();
  });

  it("RF-26.2 · un porcentaje fuera de 0–100 → error (aunque la suma sea 100)", async () => {
    await abrirCrear();
    cambiar(campoTexto("nombre"), "Raro");
    cambiar(campo("gastos"), "140");
    cambiar(campo("deudas"), "-40");
    cambiar(campo("imprevistos"), "0");
    cambiar(campo("ahorros"), "0");
    cambiar(campo("emergencia"), "0");
    await guardar();
    expect(screen.getByText("Cada porcentaje debe estar entre 0 y 100")).toBeInTheDocument();
    expect(api.llamadas("POST", P)).toHaveLength(0);
  });

  it("crea el perfil con POST /presupuestos y recarga la lista", async () => {
    await abrirCrear([["POST", P, () => ({ status: 201, body: { ok: true, ID_presupuesto: 9 } })]]);
    cambiar(campoTexto("nombre"), "Quincenal");
    cambiar(campoTexto("descripcion"), "Plan de noviembre");
    cambiar(campo("dia_corte"), "15");
    cambiar(campo("gastos"), "50");
    cambiar(campo("deudas"), "10");
    await guardar();

    await waitFor(() => expect(api.llamadas("POST", P)).toHaveLength(1));
    const [envio] = api.llamadas("POST", P);
    expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(envio.cuerpo).toEqual({
      Nombre: "Quincenal", Descripcion: "Plan de noviembre", Dia_corte: 15,
      Porcentaje_gastos: 50, Porcentaje_deudas: 10, Porcentaje_imprevistos: 15, Porcentaje_ahorros: 10, Porcentaje_emergencia: 15,
    });
    await waitFor(() => expect(screen.queryByText(/Nuevo perfil de presupuesto/, { selector: "h4" })).not.toBeInTheDocument());
    await waitFor(() => expect(api.llamadas("GET", P).length).toBeGreaterThanOrEqual(2));
  });

  it("la descripción vacía se envía como null", async () => {
    await abrirCrear([["POST", P, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(campoTexto("nombre"), "Sin descripción");
    await guardar();
    await waitFor(() => expect(api.llamadas("POST", P)).toHaveLength(1));
    expect(api.llamadas("POST", P)[0].cuerpo.Descripcion).toBeNull();
  });

  it("OBSERVACIÓN · si el backend rechaza con HTTP 400, la web muestra un mensaje genérico", async () => {
    await abrirCrear([["POST", P, () => ({ status: 400, body: { ok: false, mensaje: "Los porcentajes deben sumar 100. Suma actual: 99.00" } })]]);
    cambiar(campoTexto("nombre"), "X");
    await guardar();
    expect(await screen.findByText("Error al conectar con el servidor")).toBeInTheDocument();
  });

  it("Cancelar cierra el modal sin crear", async () => {
    await abrirCrear();
    await click("Cancelar");
    expect(screen.queryByText(/Nuevo perfil de presupuesto/, { selector: "h4" })).not.toBeInTheDocument();
    expect(api.llamadas("POST", P)).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Editar perfil", () => {
  const abrirEditar = async (extra) => {
    montar({ periodo: null, extra }); // sin período abierto → el perfil activo es editable
    await screen.findByText("Austero");
    await userEvent.click(screen.getAllByRole("button", { name: /Editar/ })[0]);
    await screen.findByText(/Editar perfil/, { selector: "h4" });
  };

  it("precarga los datos del perfil", async () => {
    await abrirEditar();
    expect(campoTexto("nombre")).toHaveValue("Mensual");
    expect(campo("dia_corte")).toHaveValue(15);
    expect(campo("gastos")).toHaveValue(40);
  });

  it("guarda con PUT /presupuestos/:id", async () => {
    await abrirEditar([["PUT", `${P}/1`, () => ({ body: { ok: true } })]]);
    cambiar(campoTexto("nombre"), "Mensual 2027");
    await click("Guardar perfil");

    await waitFor(() => expect(api.llamadas("PUT", `${P}/1`)).toHaveLength(1));
    expect(api.llamadas("PUT", `${P}/1`)[0].cuerpo).toMatchObject({ Nombre: "Mensual 2027", Dia_corte: 15, Porcentaje_gastos: 40 });
  });

  it("RF-26.1 · no permite guardar si los porcentajes no suman 100", async () => {
    await abrirEditar();
    cambiar(campo("ahorros"), "20");
    expect(screen.getByRole("button", { name: "Guardar perfil" })).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Activar perfil", () => {
  it("RF-26.3 · sin período abierto, activa con PUT /presupuestos/:id/activar y propone abrir período", async () => {
    montar({ periodo: null, extra: [["PUT", `${P}/2/activar`, () => ({ body: { ok: true } })]] });
    await screen.findByText("Austero");
    await userEvent.click(screen.getByRole("button", { name: "Activar" }));

    await waitFor(() => expect(api.llamadas("PUT", `${P}/2/activar`)).toHaveLength(1));
    expect(await screen.findByText(/Abrir nuevo período/, { selector: "h4" })).toBeInTheDocument();
  });

  it("con un período abierto pide confirmar 'cerrar período y cambiar' antes de activar", async () => {
    montar({ extra: [["PUT", `${P}/2/activar`, () => ({ body: { ok: true } })], ["PUT", `${P}/periodos/cerrar`, () => ({ body: { ok: true } })]] });
    await screen.findByText("Austero");
    await userEvent.click(screen.getByRole("button", { name: "Activar" }));

    expect(await screen.findByText(/¿Cambiar de perfil\?/)).toBeInTheDocument();
    expect(api.llamadas("PUT", `${P}/2/activar`)).toHaveLength(0); // aún no cambia

    await click("Cerrar período y cambiar");
    await waitFor(() => expect(api.llamadas("PUT", `${P}/periodos/cerrar`)).toHaveLength(1));
    await waitFor(() => expect(api.llamadas("PUT", `${P}/2/activar`)).toHaveLength(1));
    // Orden: primero se cierra el período y luego se activa el perfil
    const ordenes = api.registro.filter((r) => r.metodo === "PUT").map((r) => r.url);
    expect(ordenes.findIndex((u) => u.includes("/cerrar"))).toBeLessThan(ordenes.findIndex((u) => u.includes("/activar")));
  });

  it("cancelar el cambio de perfil no llama a ningún endpoint", async () => {
    montar();
    await screen.findByText("Austero");
    await userEvent.click(screen.getByRole("button", { name: "Activar" }));
    await screen.findByText(/¿Cambiar de perfil\?/);
    await userEvent.click(screen.getAllByRole("button", { name: /Cancelar/ })[0]);
    expect(api.llamadas("PUT", "/activar")).toHaveLength(0);
    expect(api.llamadas("PUT", "/cerrar")).toHaveLength(0);
  });

  it("si el backend rechaza activar, avisa con el motivo (alert)", async () => {
    montar({ periodo: null, extra: [["PUT", `${P}/2/activar`, () => ({ status: 409, body: { ok: false, mensaje: "Tienes un período activo. Ciérralo antes de cambiar de perfil." } })]] });
    await screen.findByText("Austero");
    await userEvent.click(screen.getByRole("button", { name: "Activar" }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Tienes un período activo. Ciérralo antes de cambiar de perfil."));
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Eliminar perfil", () => {
  it("solo los perfiles inactivos ofrecen 'Eliminar'", async () => {
    montar();
    await screen.findByText("Austero");
    expect(screen.getAllByRole("button", { name: "Eliminar" })).toHaveLength(1);
  });

  it("confirma antes de eliminar y luego llama DELETE /presupuestos/:id", async () => {
    montar({ extra: [["DELETE", `${P}/2`, () => ({ body: { ok: true } })]] });
    await screen.findByText("Austero");
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(screen.getByText(/¿Eliminar perfil\?/)).toBeInTheDocument();
    expect(api.llamadas("DELETE", P)).toHaveLength(0);

    const botones = screen.getAllByRole("button", { name: "Eliminar" });
    await userEvent.click(botones[botones.length - 1]); // botón del modal
    await waitFor(() => expect(api.llamadas("DELETE", `${P}/2`)).toHaveLength(1));
    await waitFor(() => expect(api.llamadas("GET", P).length).toBeGreaterThanOrEqual(2));
  });

  it("si el backend rechaza (perfil con períodos), avisa con el motivo", async () => {
    montar({ extra: [["DELETE", `${P}/2`, () => ({ status: 409, body: { ok: false, mensaje: "El perfil tiene períodos registrados y no puede eliminarse" } })]] });
    await screen.findByText("Austero");
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    const botones = screen.getAllByRole("button", { name: "Eliminar" });
    await userEvent.click(botones[botones.length - 1]);
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("El perfil tiene períodos registrados y no puede eliminarse"));
  });

  it("Cancelar no elimina nada", async () => {
    montar();
    await screen.findByText("Austero");
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await click("Cancelar");
    expect(screen.queryByText(/¿Eliminar perfil\?/)).not.toBeInTheDocument();
    expect(api.llamadas("DELETE", P)).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Abrir período", () => {
  const abrirModal = async (extra) => {
    montar({ periodo: null, extra });
    await screen.findByText("Sin período activo");
    await userEvent.click(screen.getAllByRole("button", { name: "Abrir período" })[0]);
    await screen.findByText(/Abrir nuevo período/, { selector: "h4" });
  };
  const ingreso = () => document.querySelector('input[placeholder="Ej: 3000000"]');
  const confirmar = () => userEvent.click(screen.getAllByRole("button", { name: "Abrir período" }).pop());

  it("muestra el perfil activo que se usará", async () => {
    await abrirModal();
    expect(screen.getByText("Mensual", { selector: "span" })).toBeInTheDocument();
  });

  it.each([
    ["vacío", "", "El ingreso estimado es obligatorio"],
    ["negativo", "-1", "El ingreso estimado no puede ser negativo"],
    ["sobre el máximo", "1000000000001", "no puede superar"],
  ])("ingreso estimado %s → error y no llama al servidor", async (_n, valor, mensaje) => {
    await abrirModal();
    cambiar(ingreso(), valor);
    await confirmar();
    expect(screen.getByText(new RegExp(mensaje))).toBeInTheDocument();
    expect(api.llamadas("POST", `${P}/periodos/abrir`)).toHaveLength(0);
  });

  it("envía POST /presupuestos/periodos/abrir {ingreso_estimado} y recarga", async () => {
    await abrirModal([["POST", `${P}/periodos/abrir`, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(ingreso(), "3000000");
    await confirmar();

    await waitFor(() => expect(api.llamadas("POST", `${P}/periodos/abrir`)).toHaveLength(1));
    expect(api.llamadas("POST", `${P}/periodos/abrir`)[0].cuerpo).toEqual({ ingreso_estimado: 3000000 });
    await waitFor(() => expect(screen.queryByText(/Abrir nuevo período/, { selector: "h4" })).not.toBeInTheDocument());
  });

  it("ingreso estimado 0 es válido", async () => {
    await abrirModal([["POST", `${P}/periodos/abrir`, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(ingreso(), "0");
    await confirmar();
    await waitFor(() => expect(api.llamadas("POST", `${P}/periodos/abrir`)).toHaveLength(1));
  });

  it("OBSERVACIÓN · si el backend responde 409 (ya hay período abierto), la web muestra un mensaje genérico", async () => {
    await abrirModal([["POST", `${P}/periodos/abrir`, () => ({ status: 409, body: { ok: false, mensaje: "Ya tienes un período abierto." } })]]);
    cambiar(ingreso(), "1000");
    await confirmar();
    expect(await screen.findByText("Error al conectar con el servidor")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Ajustar ingreso estimado y cerrar período", () => {
  it("ajustar: precarga el ingreso, valida y envía PATCH /periodos/ajustar-ingreso", async () => {
    montar({ extra: [["PATCH", `${P}/periodos/ajustar-ingreso`, () => ({ body: { ok: true } })]] });
    await screen.findByText("Austero");
    await click("Ajustar ingreso");
    await screen.findByText(/Ajustar ingreso estimado/, { selector: "h4" });
    const entrada = document.querySelector('input[placeholder="Ej: 3500000"]');
    expect(entrada).toHaveValue(3000000);

    cambiar(entrada, "-1");
    await click("Confirmar ajuste");
    expect(screen.getByText("El ingreso estimado no puede ser negativo")).toBeInTheDocument();
    expect(api.llamadas("PATCH", "/ajustar-ingreso")).toHaveLength(0);

    cambiar(entrada, "3500000");
    await click("Confirmar ajuste");
    await waitFor(() => expect(api.llamadas("PATCH", "/ajustar-ingreso")).toHaveLength(1));
    expect(api.llamadas("PATCH", "/ajustar-ingreso")[0].cuerpo).toEqual({ ingreso_estimado: 3500000 });
  });

  it("cerrar: pide confirmación y luego llama PUT /periodos/cerrar", async () => {
    montar({ extra: [["PUT", `${P}/periodos/cerrar`, () => ({ body: { ok: true } })]] });
    await screen.findByText("Austero");
    await userEvent.click(screen.getAllByRole("button", { name: "Cerrar período" })[0]);
    expect(await screen.findByText(/¿Cerrar el período\?/)).toBeInTheDocument();
    expect(screen.getByText(/saldo sobrante se acumulará al siguiente período/)).toBeInTheDocument();
    expect(api.llamadas("PUT", "/cerrar")).toHaveLength(0);

    const botones = screen.getAllByRole("button", { name: "Cerrar período" });
    await userEvent.click(botones[botones.length - 1]);
    await waitFor(() => expect(api.llamadas("PUT", `${P}/periodos/cerrar`)).toHaveLength(1));
    await waitFor(() => expect(api.llamadas("GET", `${P}/periodos/activo`).length).toBeGreaterThanOrEqual(2));
  });

  it("cerrar: Cancelar no cierra el período", async () => {
    montar();
    await screen.findByText("Austero");
    await userEvent.click(screen.getAllByRole("button", { name: "Cerrar período" })[0]);
    await screen.findByText(/¿Cerrar el período\?/);
    await click("Cancelar");
    expect(api.llamadas("PUT", "/cerrar")).toHaveLength(0);
  });
});
