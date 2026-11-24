/**
 * RF-06 · Gestionar fondo de emergencia (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/Modulofondoemergencia.jsx → saldo, meta, aportes, retiros e historial
 *   Frontend/src/services/api.js                 → getFondoEmergencia, crearFondoEmergencia,
 *     actualizarMetaFondoEmergencia, registrarAporteFondo, registrarRetiroFondo, getMovimientosFondoEmergencia
 *   Frontend/src/utils/validaciones.js           → validarMonto, validarLongitud
 * Endpoints (fetch simulado):
 *   GET/POST /api/fondo-emergencia · PUT /api/fondo-emergencia/meta
 *   POST /api/fondo-emergencia/aporte · POST /api/fondo-emergencia/retiro
 *   GET /api/fondo-emergencia/movimientos
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { instalarFetch } from "../helpers/fetchMock";

const { mostrarToast } = vi.hoisted(() => ({ mostrarToast: vi.fn() }));
vi.mock("../../../Frontend/src/components/HeaderModulos", () => ({ default: () => null }));
vi.mock("../../../Frontend/src/context/ToastContext", () => ({ useToast: () => ({ mostrarToast }) }));

import ModuloFondoEmergencia from "../../../Frontend/src/pages/Modulofondoemergencia";

const F = "/fondo-emergencia";
const FONDO = { id_fondo: 11, meta: "5000000", saldo_actual: "1250000", fecha_creacion: "2026-01-10T00:00:00.000Z" };
const MOVS = [
  { id_movimiento_fondo: 2, tipo: "retiro", monto: "50000", fecha_registro: "2026-11-10T00:00:00.000Z", descripcion: "Urgencia médica" },
  { id_movimiento_fondo: 1, tipo: "aporte", monto: "200000", fecha_registro: "2026-11-05T00:00:00.000Z", descripcion: "Prima" },
];
let api;

/** fondo = null simula "el usuario aún no tiene fondo" (el backend responde 404) */
const montar = ({ fondo = FONDO, movs = MOVS, extra = [] } = {}) => {
  api = instalarFetch([
    ["GET", F, () => (fondo ? { body: { ok: true, datos: fondo } } : { status: 404, body: { ok: false, mensaje: "sin fondo" } })],
    ["GET", `${F}/movimientos`, () => ({ body: { ok: true, datos: movs } })],
    ...extra,
  ]);
  return render(<MemoryRouter><ModuloFondoEmergencia /></MemoryRouter>);
};
const entrada = (placeholder) => document.querySelector(`input[placeholder="${placeholder}"]`);
const cambiar = (el, v) => fireEvent.change(el, { target: { value: v } });
const click = (nombre) => userEvent.click(screen.getByRole("button", { name: nombre }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "tok-123");
});

// ═════════════════════════════════════════════════════════════
describe("RF-06 · Usuario sin fondo → crear fondo", () => {
  const abrirCrear = async (extra) => {
    montar({ fondo: null, movs: [], extra });
    await userEvent.click(await screen.findByRole("button", { name: "Crear fondo de emergencia" }));
    await screen.findByText(/Crear Fondo de Emergencia/, { selector: "h4" });
  };

  it("ofrece crear el fondo cuando el backend responde 404", async () => {
    montar({ fondo: null, movs: [] });
    expect(await screen.findByRole("button", { name: "Crear fondo de emergencia" })).toBeInTheDocument();
    expect(screen.queryByText("Saldo actual")).not.toBeInTheDocument();
  });

  it("RF-06.2 · meta vacía → 'La meta es obligatorio' y no llama al servidor", async () => {
    await abrirCrear();
    await click("Crear");
    expect(screen.getByText("La meta es obligatorio")).toBeInTheDocument();
    expect(api.llamadas("POST", F)).toHaveLength(0);
  });

  it("RF-06.2 · meta negativa → error y no llama al servidor", async () => {
    await abrirCrear();
    cambiar(entrada("Ej: 3000000"), "-5");
    await click("Crear");
    expect(screen.getByText("La meta no puede ser negativo")).toBeInTheDocument();
    expect(api.llamadas("POST", F)).toHaveLength(0);
  });

  it("meta sobre el máximo permitido → error", async () => {
    await abrirCrear();
    cambiar(entrada("Ej: 3000000"), "1000000000001");
    await click("Crear");
    expect(screen.getByText(/no puede superar/)).toBeInTheDocument();
  });

  it("crea el fondo con POST /fondo-emergencia {meta}, avisa y recarga", async () => {
    await abrirCrear([["POST", F, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(entrada("Ej: 3000000"), "5000000");
    await click("Crear");

    await waitFor(() => expect(api.llamadas("POST", F)).toHaveLength(1));
    const [envio] = api.llamadas("POST", F);
    expect(envio.opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(envio.cuerpo).toEqual({ meta: 5000000 });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Fondo de emergencia creado"));
    await waitFor(() => expect(api.llamadas("GET", F).length).toBeGreaterThanOrEqual(2));
  });

  it("RF-06.2 · meta 0 es válida", async () => {
    await abrirCrear([["POST", F, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(entrada("Ej: 3000000"), "0");
    await click("Crear");
    await waitFor(() => expect(api.llamadas("POST", F)).toHaveLength(1));
    expect(api.llamadas("POST", F)[0].cuerpo).toEqual({ meta: 0 });
  });

  it("OBSERVACIÓN · si el backend responde 409 (ya existe), la web muestra un mensaje genérico", async () => {
    await abrirCrear([["POST", F, () => ({ status: 409, body: { ok: false, mensaje: "El usuario ya tiene un fondo de emergencia" } })]]);
    cambiar(entrada("Ej: 3000000"), "1000");
    await click("Crear");
    expect(await screen.findByText("Error al conectar con el servidor")).toBeInTheDocument();
  });

  it("Cancelar cierra el modal sin crear", async () => {
    await abrirCrear();
    await click("Cancelar");
    expect(screen.queryByText(/Crear Fondo de Emergencia/, { selector: "h4" })).not.toBeInTheDocument();
    expect(api.llamadas("POST", F)).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-06 · Consultar fondo, saldo e historial", () => {
  it("pide el fondo y sus movimientos con el token", async () => {
    montar();
    await screen.findByText("Saldo actual");
    expect(api.llamadas("GET", F)[0].opciones.headers.Authorization).toBe("Bearer tok-123");
    expect(api.llamadas("GET", `${F}/movimientos`)).toHaveLength(1);
  });

  it("RF-06.5 · muestra saldo actual, meta y fecha de creación", async () => {
    montar();
    expect(await screen.findByText("$1.250.000")).toBeInTheDocument();
    expect(screen.getByText(/Meta: \$5\.000\.000 · Creado el 10\/01\/2026/)).toBeInTheDocument();
  });

  it("la barra de progreso refleja saldo / meta (25 %)", async () => {
    montar();
    await screen.findByText("Saldo actual");
    expect(document.querySelector('[style*="width: 25%"]')).toBeInTheDocument();
  });

  it("la barra se limita al 100 % si el saldo supera la meta", async () => {
    montar({ fondo: { ...FONDO, meta: "1000000", saldo_actual: "1500000" } });
    await screen.findByText("Saldo actual");
    expect(document.querySelector('[style*="width: 100%"]')).toBeInTheDocument();
  });

  it("meta 0 → barra en 0 % (sin dividir por cero)", async () => {
    montar({ fondo: { ...FONDO, meta: "0" } });
    await screen.findByText("Saldo actual");
    expect(document.querySelector('[style*="width: 0%"]')).toBeInTheDocument();
  });

  it("lista el historial con aportes (+) y retiros (−)", async () => {
    montar();
    expect(await screen.findByText("Movimientos (2)")).toBeInTheDocument();
    expect(screen.getByText("+$200.000")).toBeInTheDocument();
    expect(screen.getByText("−$50.000")).toBeInTheDocument();
  });

  it("sin movimientos → contador en 0", async () => {
    montar({ movs: [] });
    expect(await screen.findByText("Movimientos (0)")).toBeInTheDocument();
  });

  it("si falla la carga del historial, el fondo igual se muestra", async () => {
    api = instalarFetch([
      ["GET", F, () => ({ body: { ok: true, datos: FONDO } })],
      ["GET", `${F}/movimientos`, () => ({ status: 500, body: { ok: false } })],
    ]);
    render(<MemoryRouter><ModuloFondoEmergencia /></MemoryRouter>);
    expect(await screen.findByText("Saldo actual")).toBeInTheDocument();
    expect(screen.getByText("Movimientos (0)")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-06 · Editar meta", () => {
  const abrirMeta = async (extra) => {
    montar({ extra });
    await screen.findByText("Saldo actual");
    await click("Editar meta");
    await screen.findByText(/Editar meta/, { selector: "h4" });
  };
  const campoMeta = () => document.querySelector('input[type="number"]');

  it("precarga la meta actual", async () => {
    await abrirMeta();
    expect(campoMeta()).toHaveValue(5000000);
  });

  it("actualiza con PUT /fondo-emergencia/meta {meta} y avisa", async () => {
    await abrirMeta([["PUT", `${F}/meta`, () => ({ body: { ok: true } })]]);
    cambiar(campoMeta(), "8000000");
    await click("Guardar");

    await waitFor(() => expect(api.llamadas("PUT", `${F}/meta`)).toHaveLength(1));
    expect(api.llamadas("PUT", `${F}/meta`)[0].cuerpo).toEqual({ meta: 8000000 });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Meta actualizada"));
  });

  it("RF-06.2 · meta negativa → error y no llama al servidor", async () => {
    await abrirMeta();
    cambiar(campoMeta(), "-1");
    await click("Guardar");
    expect(screen.getByText("La meta no puede ser negativo")).toBeInTheDocument();
    expect(api.llamadas("PUT", `${F}/meta`)).toHaveLength(0);
  });

  it("meta vacía → error y no llama al servidor", async () => {
    await abrirMeta();
    cambiar(campoMeta(), "");
    await click("Guardar");
    expect(screen.getByText("La meta es obligatorio")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-06 · Registrar aporte", () => {
  const abrirAporte = async (extra) => {
    montar({ extra });
    await screen.findByText("Saldo actual");
    await click("+ Aportar");
    await screen.findByText(/Registrar aporte/, { selector: "h4" });
  };

  it("RF-06.3 · monto vacío → 'El monto es obligatorio'", async () => {
    await abrirAporte();
    await click("Aportar");
    expect(screen.getByText("El monto es obligatorio")).toBeInTheDocument();
    expect(api.llamadas("POST", `${F}/aporte`)).toHaveLength(0);
  });

  it.each([["0"], ["-100"]])("RF-06.3 · monto %s → 'El monto debe ser mayor a 0'", async (valor) => {
    await abrirAporte();
    cambiar(entrada("Ej: 100000"), valor);
    await click("Aportar");
    expect(screen.getByText("El monto debe ser mayor a 0")).toBeInTheDocument();
    expect(api.llamadas("POST", `${F}/aporte`)).toHaveLength(0);
  });

  it("descripción de más de 255 caracteres → error", async () => {
    await abrirAporte();
    cambiar(entrada("Ej: 100000"), "1000");
    cambiar(entrada("Opcional"), "d".repeat(256));
    await click("Aportar");
    expect(screen.getByText("La descripción no puede superar 255 caracteres")).toBeInTheDocument();
  });

  it("envía POST /fondo-emergencia/aporte {monto, descripcion} y avisa", async () => {
    await abrirAporte([["POST", `${F}/aporte`, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(entrada("Ej: 100000"), "200000");
    cambiar(entrada("Opcional"), "  Prima  ");
    await click("Aportar");

    await waitFor(() => expect(api.llamadas("POST", `${F}/aporte`)).toHaveLength(1));
    expect(api.llamadas("POST", `${F}/aporte`)[0].cuerpo).toEqual({ monto: 200000, descripcion: "Prima" });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Aporte registrado"));
  });

  it("sin descripción se envía null", async () => {
    await abrirAporte([["POST", `${F}/aporte`, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(entrada("Ej: 100000"), "5000");
    await click("Aportar");
    await waitFor(() => expect(api.llamadas("POST", `${F}/aporte`)).toHaveLength(1));
    expect(api.llamadas("POST", `${F}/aporte`)[0].cuerpo).toEqual({ monto: 5000, descripcion: null });
  });

  it("al aportar se recarga el fondo y el historial", async () => {
    await abrirAporte([["POST", `${F}/aporte`, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(entrada("Ej: 100000"), "5000");
    await click("Aportar");
    await waitFor(() => expect(api.llamadas("GET", `${F}/movimientos`)).toHaveLength(2));
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-06 · Registrar retiro", () => {
  const abrirRetiro = async (extra, opciones = {}) => {
    montar({ extra, ...opciones });
    await screen.findByText("Saldo actual");
    await click("− Retirar");
    await screen.findByText(/Registrar retiro/, { selector: "h4" });
  };

  it("muestra el saldo disponible dentro del modal", async () => {
    await abrirRetiro();
    expect(screen.getByText("Saldo disponible: $1.250.000")).toBeInTheDocument();
  });

  it("RF-06.4 · retiro mayor al saldo → 'El retiro no puede ser mayor al saldo disponible' sin llamar al servidor", async () => {
    await abrirRetiro();
    cambiar(entrada("Ej: 50000"), "1250001");
    await click("Retirar");
    expect(screen.getByText("El retiro no puede ser mayor al saldo disponible")).toBeInTheDocument();
    expect(api.llamadas("POST", `${F}/retiro`)).toHaveLength(0);
  });

  it("RF-06.4 · retirar exactamente el saldo disponible es válido", async () => {
    await abrirRetiro([["POST", `${F}/retiro`, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(entrada("Ej: 50000"), "1250000");
    await click("Retirar");
    await waitFor(() => expect(api.llamadas("POST", `${F}/retiro`)).toHaveLength(1));
  });

  it.each([["", "El monto es obligatorio"], ["0", "El monto debe ser mayor a 0"], ["-5", "El monto debe ser mayor a 0"]])(
    "RF-06.3 · monto '%s' → error",
    async (valor, mensaje) => {
      await abrirRetiro();
      cambiar(entrada("Ej: 50000"), valor);
      await click("Retirar");
      expect(screen.getByText(mensaje)).toBeInTheDocument();
      expect(api.llamadas("POST", `${F}/retiro`)).toHaveLength(0);
    }
  );

  it("envía POST /fondo-emergencia/retiro {monto, descripcion} y avisa", async () => {
    await abrirRetiro([["POST", `${F}/retiro`, () => ({ status: 201, body: { ok: true } })]]);
    cambiar(entrada("Ej: 50000"), "50000");
    cambiar(entrada("Opcional"), "Urgencia médica");
    await click("Retirar");

    await waitFor(() => expect(api.llamadas("POST", `${F}/retiro`)).toHaveLength(1));
    expect(api.llamadas("POST", `${F}/retiro`)[0].cuerpo).toEqual({ monto: 50000, descripcion: "Urgencia médica" });
    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Retiro registrado"));
  });

  it("con saldo 0 el botón 'Retirar' está deshabilitado", async () => {
    montar({ fondo: { ...FONDO, saldo_actual: "0" } });
    await screen.findByText("Saldo actual");
    expect(screen.getByRole("button", { name: "− Retirar" })).toBeDisabled();
  });
});
