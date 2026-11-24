/**
 * RF-03 · Gestionar gastos (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/ModulosGastos.jsx        → listado, edición y eliminación de gastos
 *   Frontend/src/components/Modalnuevomovimiento.jsx → formulario "Registrar Gasto" (subtipo Gasto)
 *   Frontend/src/utils/validaciones.js          → validarMonto (mínimo 50), validarNoFutura
 * Endpoints consumidos (vía fetch simulado):
 *   GET  /api/movimientos/gastos · POST /api/movimientos
 *   PUT  /api/movimientos/gastos/:id · DELETE /api/movimientos/gastos/:id
 * Estrategia: Testing Library + fetch simulado; contextos (toast/notificaciones) y el
 * encabezado de navegación se reemplazan por dobles para aislar el módulo.
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

import ModulosGastos from "../../../Frontend/src/pages/ModulosGastos";
import ModalNuevoMovimiento from "../../../Frontend/src/components/Modalnuevomovimiento";

const GASTOS = [
  { id: 1, monto: "85000", descripcion: "Mercado semanal", fecha: "2026-11-05T00:00:00.000Z", id_categoria: 3, categoria: "Hogar", id_dependientes: 4, dependiente: "Ana" },
  { id: 2, monto: "50000", descripcion: "Transporte", fecha: "2026-11-06T00:00:00.000Z", id_categoria: null, categoria: null, id_dependientes: null },
];
const CATEGORIAS = [{ id: 3, nombre: "Hogar", activa: 1 }, { id: 9, nombre: "Archivada", activa: 0 }];
const DEPENDIENTES = [{ id_dependientes: 4, Nombre: "Ana" }];

let api;
const montar = (gastos = GASTOS, extra = []) => {
  api = instalarFetch([
    ["GET", "/movimientos/gastos", () => ({ body: gastos })],
    ["GET", "/categorias", () => ({ body: { categorias: CATEGORIAS } })],
    ["GET", "/dependientes", () => ({ body: DEPENDIENTES })],
    ...extra,
  ]);
  return render(<MemoryRouter><ModulosGastos /></MemoryRouter>);
};
const campo = (nombre) => document.querySelector(`[name="${nombre}"]`);
const escribir = (nombre, valor) => fireEvent.change(campo(nombre), { target: { value: valor } });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "tok-123");
  localStorage.setItem("usuario", JSON.stringify({ nombre: "Laura" }));
});

// ═════════════════════════════════════════════════════════════
describe("RF-03 · Consultar gastos (ModulosGastos)", () => {
  it("pide el listado con el token del usuario (GET /movimientos/gastos)", async () => {
    montar();
    await waitFor(() => expect(api.llamadas("GET", "/movimientos/gastos")).toHaveLength(1));
    expect(api.llamadas("GET", "/movimientos/gastos")[0].opciones.headers.Authorization).toBe("Bearer tok-123");
  });

  it("muestra cada gasto con fecha dd/mm/aaaa, descripción, categoría, dependiente y monto", async () => {
    montar();
    expect((await screen.findAllByText("Mercado semanal")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("05/11/2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hogar").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ana/).length).toBeGreaterThan(0); // RF-03.4 dependiente asociado
    expect(screen.getAllByText("$85.000").length).toBeGreaterThan(0);
  });

  it("muestra el total acumulado y la cantidad de registros", async () => {
    montar();
    expect(await screen.findByText("$135.000")).toBeInTheDocument();
    expect(screen.getAllByText("2 registros en total").length).toBeGreaterThan(0);
  });

  it("sin gastos: muestra el estado vacío con acceso para registrar el primero", async () => {
    montar([]);
    expect(await screen.findByText("No hay gastos registrados aún.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar primer gasto" })).toBeInTheDocument();
  });

  it("si el servidor no responde con un arreglo, no rompe y muestra el estado vacío", async () => {
    montar({ ok: false, mensaje: "error" });
    expect(await screen.findByText("No hay gastos registrados aún.")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-03 · Registrar gasto (formulario del modal)", () => {
  const abrirModal = async () => {
    montar();
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getByRole("button", { name: /Agregar Gasto/ }));
    await screen.findByText(/Registrar Gasto/, { selector: "h4" });
  };
  const registrar = () => userEvent.click(screen.getByRole("button", { name: "Registrar Gasto" }));
  const hayError = (texto) => expect(screen.getByText(texto)).toBeInTheDocument();

  it("el modal muestra los campos monto, categoría (solo activas), dependiente, descripción y fecha", async () => {
    await abrirModal();
    expect(campo("monto")).toBeInTheDocument();
    expect(campo("id_categoria")).toBeInTheDocument();
    expect(campo("id_dependientes")).toBeInTheDocument();
    expect(campo("descripcion")).toBeInTheDocument();
    expect(campo("fecha_registro")).toBeInTheDocument();
    await waitFor(() => expect(within(campo("id_categoria")).getByText("Hogar")).toBeInTheDocument());
    expect(within(campo("id_categoria")).queryByText("Archivada")).not.toBeInTheDocument(); // inactiva
  });

  it("RF-03.2 · el campo monto declara mínimo 50", async () => {
    await abrirModal();
    expect(campo("monto")).toHaveAttribute("min", "50");
  });

  it("RF-03.2 · monto vacío → 'El monto es obligatorio' y no envía nada", async () => {
    await abrirModal();
    await registrar();
    hayError("El monto es obligatorio");
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });

  it.each([
    ["RF-03.1 monto 0", "0", "El monto debe ser mayor a 0"],
    ["RF-03.1 monto negativo", "-10", "El monto debe ser mayor a 0"],
    ["RF-03.2 monto 49 (menor al mínimo)", "49", "El monto debe ser de al menos 50"],
    ["RF-03.2 monto 49.99", "49.99", "El monto debe ser de al menos 50"],
    ["monto sobre el máximo", "1000000000001", "no puede superar"],
  ])("%s → error y no envía", async (_n, valor, mensaje) => {
    await abrirModal();
    escribir("monto", valor);
    await registrar();
    expect(screen.getByText(new RegExp(mensaje.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });

  it("RF-03.2 · monto exactamente 50 es válido", async () => {
    api = null;
    await abrirModal();
    api.fetch.mockClear();
    escribir("monto", "50");
    await registrar();
    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
  });

  it("una fecha futura → 'La fecha no puede ser futura'", async () => {
    await abrirModal();
    escribir("monto", "100");
    escribir("fecha_registro", "2999-01-01");
    await registrar();
    hayError("La fecha no puede ser futura");
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });

  it("descripción de más de 255 caracteres → error", async () => {
    await abrirModal();
    escribir("monto", "100");
    escribir("descripcion", "x".repeat(256));
    await registrar();
    hayError("La descripción no puede superar 255 caracteres");
  });

  it("envía POST /movimientos con tipo Salida/Gasto, token y los datos del formulario", async () => {
    api = null;
    montar(GASTOS, [["POST", "/movimientos", () => ({ status: 201, body: { ok: true, ID_detalle: 99 } })]]);
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getByRole("button", { name: /Agregar Gasto/ }));
    await waitFor(() => expect(within(campo("id_categoria")).getByText("Hogar")).toBeInTheDocument());

    escribir("monto", "85000");
    escribir("id_categoria", "3");
    escribir("id_dependientes", "4");
    escribir("descripcion", "Mercado");
    escribir("fecha_registro", "2026-11-05");
    await registrar();

    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
    const [envio] = api.llamadas("POST", "/movimientos");
    expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(envio.cuerpo).toEqual({
      tipo_flujo: "Salida",
      subtipo_modulo: "Gasto",
      datos: { monto: 85000, descripcion: "Mercado", fecha_registro: "2026-11-05", id_categoria: "3", id_dependientes: "4" },
    });
  });

  it("RF-03.3/03.4 · categoría, dependiente, descripción y fecha son opcionales (se envían null)", async () => {
    montar(GASTOS, [["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getByRole("button", { name: /Agregar Gasto/ }));
    escribir("monto", "60");
    await registrar();

    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
    expect(api.llamadas("POST", "/movimientos")[0].cuerpo.datos).toEqual({
      monto: 60, descripcion: null, fecha_registro: null, id_categoria: null, id_dependientes: null,
    });
  });

  it("registro exitoso: confirma con un aviso, revisa alertas, cierra el modal y recarga el listado", async () => {
    montar(GASTOS, [["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })]]);
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getByRole("button", { name: /Agregar Gasto/ }));
    escribir("monto", "100");
    await registrar();

    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Gasto registrado correctamente"));
    expect(revisarAhora).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText(/Registrar Gasto/, { selector: "h4" })).not.toBeInTheDocument());
    await waitFor(() => expect(api.llamadas("GET", "/movimientos/gastos")).toHaveLength(2)); // listado actualizado
  });

  it("si el backend rechaza (ok:false), muestra su mensaje y mantiene el modal abierto", async () => {
    montar(GASTOS, [["POST", "/movimientos", () => ({ status: 400, body: { ok: false, mensaje: "La categoría o el dependiente indicado no existe" } })]]);
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getByRole("button", { name: /Agregar Gasto/ }));
    escribir("monto", "100");
    await registrar();

    expect(await screen.findByText("La categoría o el dependiente indicado no existe")).toBeInTheDocument();
    expect(mostrarToast).not.toHaveBeenCalled();
    expect(campo("monto")).toBeInTheDocument();
  });

  it("si falla la conexión, informa 'Error al conectar con el servidor'", async () => {
    montar();
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getByRole("button", { name: /Agregar Gasto/ }));
    api.fetch.mockImplementationOnce(() => Promise.reject(new Error("offline")));
    escribir("monto", "100");
    await registrar();
    expect(await screen.findByText("Error al conectar con el servidor")).toBeInTheDocument();
  });

  it("Cancelar y la tecla Escape cierran el modal sin enviar", async () => {
    await abrirModal();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/Registrar Gasto/, { selector: "h4" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Agregar Gasto/ }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText(/Registrar Gasto/, { selector: "h4" })).not.toBeInTheDocument();
    expect(api.llamadas("POST", "/movimientos")).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-03 · Editar gasto (modal de edición)", () => {
  const abrirEdicion = async (extra) => {
    montar(GASTOS, extra);
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    await screen.findByText(/Editar Gasto/);
  };
  const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  it("precarga los datos del gasto seleccionado", async () => {
    await abrirEdicion();
    expect(campo("monto")).toHaveValue(85000);
    expect(campo("descripcion")).toHaveValue("Mercado semanal");
    expect(campo("fecha_registro")).toHaveValue("2026-11-05");
    expect(campo("id_categoria")).toHaveValue("3");
    expect(campo("id_dependientes")).toHaveValue("4");
  });

  it("guarda con PUT /movimientos/gastos/:id y confirma", async () => {
    await abrirEdicion([["PUT", "/movimientos/gastos/1", () => ({ body: { ok: true } })]]);
    escribir("monto", "90000");
    escribir("descripcion", "Mercado (editado)");
    await guardar();

    await waitFor(() => expect(api.llamadas("PUT", "/movimientos/gastos/1")).toHaveLength(1));
    const [envio] = api.llamadas("PUT", "/movimientos/gastos/1");
    expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(envio.cuerpo).toEqual({
      monto: 90000, descripcion: "Mercado (editado)", fecha_registro: "2026-11-05", id_categoria: 3, id_dependientes: 4,
    });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Gasto actualizado correctamente"));
    expect(revisarAhora).toHaveBeenCalled();
  });

  it("RF-03.2 · monto menor a 50 → error y no envía", async () => {
    await abrirEdicion();
    escribir("monto", "49");
    await guardar();
    expect(screen.getByText(/El monto debe ser de al menos 50/)).toBeInTheDocument();
    expect(api.llamadas("PUT", "/movimientos/gastos/1")).toHaveLength(0);
  });

  it("RF-03.1 · monto 0 → error y no envía", async () => {
    await abrirEdicion();
    escribir("monto", "0");
    await guardar();
    expect(screen.getByText("El monto debe ser mayor a 0")).toBeInTheDocument();
  });

  it("fecha futura → error y no envía", async () => {
    await abrirEdicion();
    escribir("fecha_registro", "2999-01-01");
    await guardar();
    expect(screen.getByText("La fecha no puede ser futura")).toBeInTheDocument();
    expect(api.llamadas("PUT", "/movimientos/gastos/1")).toHaveLength(0);
  });

  it("muestra el mensaje del backend si rechaza la edición", async () => {
    await abrirEdicion([["PUT", "/movimientos/gastos/1", () => ({ status: 404, body: { ok: false, mensaje: "Gasto no encontrado" } })]]);
    await guardar();
    expect(await screen.findByText("Gasto no encontrado")).toBeInTheDocument();
    expect(mostrarToast).not.toHaveBeenCalled();
  });

  it("Cancelar cierra el modal sin guardar", async () => {
    await abrirEdicion();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/Editar Gasto/)).not.toBeInTheDocument();
    expect(api.llamadas("PUT", "/movimientos/gastos/1")).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-03 · Eliminar gasto (confirmación)", () => {
  it("pide confirmación antes de eliminar y, al confirmar, llama DELETE /movimientos/gastos/:id", async () => {
    montar(GASTOS, [["DELETE", "/movimientos/gastos/2", () => ({ body: { ok: true } })]]);
    await screen.findAllByText("Mercado semanal");

    await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[1]); // segundo gasto (id 2)
    expect(screen.getByText(/¿Eliminar gasto\?/)).toBeInTheDocument();
    expect(api.llamadas("DELETE", "/movimientos/gastos")).toHaveLength(0); // aún no se ejecuta

    await userEvent.click(within(screen.getByText(/¿Eliminar gasto\?/).closest("div")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(api.llamadas("DELETE", "/movimientos/gastos/2")).toHaveLength(1));
    expect(api.llamadas("DELETE", "/movimientos/gastos/2")[0].opciones.headers.Authorization).toBe("Bearer tok-123");
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Gasto eliminado correctamente"));
    await waitFor(() => expect(api.llamadas("GET", "/movimientos/gastos")).toHaveLength(2)); // recarga
  });

  it("Cancelar en la confirmación no elimina nada", async () => {
    montar();
    await screen.findAllByText("Mercado semanal");
    await userEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByText(/¿Eliminar gasto\?/)).not.toBeInTheDocument();
    expect(api.llamadas("DELETE", "/movimientos/gastos")).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-03 · ModalNuevoMovimiento (subtipo Gasto) de forma aislada", () => {
  it("al guardar con éxito invoca onGuardado y onCerrar", async () => {
    instalarFetch([
      ["GET", "/categorias", () => ({ body: { categorias: [] } })],
      ["GET", "/dependientes", () => ({ body: [] })],
      ["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })],
    ]);
    const onGuardado = vi.fn();
    const onCerrar = vi.fn();
    render(<ModalNuevoMovimiento subtipo="Gasto" onCerrar={onCerrar} onGuardado={onGuardado} />);

    escribir("monto", "75");
    await userEvent.click(screen.getByRole("button", { name: "Registrar Gasto" }));

    await waitFor(() => expect(onGuardado).toHaveBeenCalledTimes(1));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
