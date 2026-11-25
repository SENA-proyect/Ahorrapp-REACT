/**
 * RF-11 · Generar reportes financieros (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/reportes.jsx  → filtros de fecha/período, consulta y presentación del informe
 *   Frontend/src/services/api.js     → obtenerInformeCompleto + getReporte* / getEstado* / getPeriodos
 * Endpoints (fetch simulado): GET /api/reportes/{resumen, gastos/categorias, gastos/dependientes,
 *   ingresos/categorias, ingresos/fuentes, ahorros, deudas, imprevistos/categorias, fondo-emergencia,
 *   evolucion, ahorros/estado, deudas/estado, fondo-emergencia/estado, presupuesto/:id} y
 *   GET /api/presupuestos/periodos
 * El generador de PDF se reemplaza por un doble (se prueba en test/frontend/rf24).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { instalarFetch } from "../helpers/fetchMock";

const { generarReportePDF } = vi.hoisted(() => ({ generarReportePDF: vi.fn() }));
vi.mock("../../../Frontend/src/components/HeaderModulos", () => ({ default: () => null }));
vi.mock("../../../Frontend/src/utils/generarreportepdf", () => ({ generarReportePDF, default: generarReportePDF }));

import Reportes from "../../../Frontend/src/pages/reportes";
import { obtenerInformeCompleto } from "../../../Frontend/src/services/api";

const R = "/reportes";
const ENDPOINTS_RANGO = [
  "/reportes/resumen", "/reportes/gastos/categorias", "/reportes/gastos/dependientes",
  "/reportes/ingresos/categorias", "/reportes/ingresos/fuentes", "/reportes/ahorros", "/reportes/deudas",
  "/reportes/imprevistos/categorias", "/reportes/fondo-emergencia", "/reportes/evolucion",
];
const ENDPOINTS_ESTADO = ["/reportes/ahorros/estado", "/reportes/deudas/estado", "/reportes/fondo-emergencia/estado"];

const RESUMEN = {
  ok: true,
  periodo: { fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" },
  resumen: { ingresos: 3000000, gastos: 900000, imprevistos: 200000, ahorros: 300000, pagos_deudas: 400000, fondo_emergencia: { aportes: 150000, retiros: 50000, neto: 100000 }, balance: 1100000 },
  deudas: { monto_pagado: 400000, cuotas_pagadas: 4 },
};

/** Rutas de reporte; `sobre` permite reemplazar o fallar endpoints concretos (status 404, etc.) */
const rutasReporte = (sobre = {}) => {
  const base = {};
  for (const e of [...ENDPOINTS_RANGO, ...ENDPOINTS_ESTADO, "/reportes/presupuesto/5"]) base[e] = { body: { ok: true, datos: [] } };
  base["/reportes/resumen"] = { body: RESUMEN };
  return Object.entries({ ...base, ...sobre }).map(([fragmento, resp]) => ["GET", fragmento, () => resp]);
};

let api;
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "tok-123");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ═════════════════════════════════════════════════════════════
describe("RF-11 · obtenerInformeCompleto (services/api.js)", () => {
  it("consulta los 13 endpoints del informe con el rango y el token del usuario", async () => {
    api = instalarFetch(rutasReporte());
    await obtenerInformeCompleto({ fechaInicio: "2026-11-01", fechaFin: "2026-11-30" });

    for (const e of ENDPOINTS_RANGO) {
      const [llamada] = api.llamadas("GET", e).filter((c) => !c.url.includes("/estado"));
      expect(llamada, e).toBeDefined();
      expect(llamada.url).toContain("fecha_inicio=2026-11-01");
      expect(llamada.url).toContain("fecha_fin=2026-11-30");
      expect(llamada.opciones.headers.Authorization).toBe("Bearer tok-123");
    }
    for (const e of ENDPOINTS_ESTADO) expect(api.llamadas("GET", e)).toHaveLength(1);
    expect(api.registro).toHaveLength(13);
  });

  it("sin período de presupuesto NO consulta el reporte de presupuesto", async () => {
    api = instalarFetch(rutasReporte());
    const informe = await obtenerInformeCompleto({ fechaInicio: "2026-11-01", fechaFin: "2026-11-30" });
    expect(api.llamadas("GET", "/reportes/presupuesto")).toHaveLength(0);
    expect(informe.presupuesto).toBeNull();
  });

  it("RF-11.1 · con un período de presupuesto seleccionado consulta /reportes/presupuesto/:id", async () => {
    api = instalarFetch(rutasReporte({ "/reportes/presupuesto/5": { body: { ok: true, resumen: { total_planeado: 100 } } } }));
    const informe = await obtenerInformeCompleto({ fechaInicio: "2026-11-01", fechaFin: "2026-11-30", idPeriodo: 5 });
    expect(api.llamadas("GET", "/reportes/presupuesto/5")).toHaveLength(1);
    expect(informe.presupuesto.resumen.total_planeado).toBe(100);
    expect(api.registro).toHaveLength(14);
  });

  it("ensambla el informe con todas las secciones y el período consultado", async () => {
    api = instalarFetch(rutasReporte());
    const informe = await obtenerInformeCompleto({ fechaInicio: "2026-11-01", fechaFin: "2026-11-30", idPeriodo: 5 });
    expect(Object.keys(informe).sort()).toEqual([
      "ahorros", "deudas", "estadoAhorros", "estadoDeudas", "estadoFondoEmergencia", "evolucion", "fondoEmergencia",
      "gastosCategoria", "gastosDependiente", "imprevistosCategoria", "ingresosCategoria", "ingresosFuente",
      "periodo", "presupuesto", "resumen",
    ]);
    expect(informe.periodo).toEqual({ fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", id_periodo: 5 });
    expect(informe.resumen.resumen.balance).toBe(1100000);
  });

  it("RF-11.5 · si una sección falla (fondo sin crear → 404), esa sección queda null y el resto se genera", async () => {
    api = instalarFetch(rutasReporte({
      "/reportes/fondo-emergencia": { status: 404, body: { ok: false, mensaje: "El usuario no tiene fondo de emergencia" } },
      "/reportes/fondo-emergencia/estado": { status: 404, body: { ok: false, mensaje: "sin fondo" } },
    }));

    const informe = await obtenerInformeCompleto({ fechaInicio: "2026-11-01", fechaFin: "2026-11-30" });

    expect(informe.fondoEmergencia).toBeNull();
    expect(informe.estadoFondoEmergencia).toBeNull();
    expect(informe.resumen.resumen.ingresos).toBe(3000000); // el resto sigue disponible
    expect(informe.gastosCategoria).not.toBeNull();
  });

  it("RF-11.5 · un error 500 en una sección tampoco tumba el informe", async () => {
    api = instalarFetch(rutasReporte({ "/reportes/gastos/categorias": { status: 500, body: { ok: false } } }));
    const informe = await obtenerInformeCompleto({ fechaInicio: "2026-11-01", fechaFin: "2026-11-30" });
    expect(informe.gastosCategoria).toBeNull();
    expect(informe.resumen).not.toBeNull();
  });

  it("si TODAS las secciones fallan, devuelve el informe vacío en vez de lanzar error", async () => {
    api = instalarFetch([]); // ninguna ruta simulada → 404 en todo
    const informe = await obtenerInformeCompleto({ fechaInicio: "2026-11-01", fechaFin: "2026-11-30" });
    expect(informe.resumen).toBeNull();
    expect(informe.evolucion).toBeNull();
    expect(informe.periodo.fecha_inicio).toBe("2026-11-01");
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-11 · Página de reportes (filtros y consulta)", () => {
  const PERIODOS = {
    ok: true,
    data: [
      { ID_periodo: 5, ID_presupuesto: 1, Perfil_nombre: "Mensual", Estado: "abierto", Fecha_fin: "2026-11-30" },
      { ID_periodo: 3, ID_presupuesto: 1, Perfil_nombre: "Mensual", Estado: "cerrado", Fecha_fin: "2026-10-31" },
      { ID_periodo: 4, ID_presupuesto: 2, Perfil_nombre: "Austero", Estado: "cerrado", Fecha_fin: "2026-09-30" },
    ],
  };
  const montar = (sobre = {}, periodos = PERIODOS) => {
    api = instalarFetch([["GET", "/presupuestos/periodos", () => ({ body: periodos })], ...rutasReporte(sobre)]);
    return render(<MemoryRouter><Reportes /></MemoryRouter>);
  };
  const fechas = () => document.querySelectorAll('input[type="date"]');
  const poner = (inicio, fin) => {
    if (inicio !== undefined) fireEvent.change(fechas()[0], { target: { value: inicio } });
    if (fin !== undefined) fireEvent.change(fechas()[1], { target: { value: fin } });
  };
  const consultar = () => userEvent.click(screen.getByRole("button", { name: "Consultar informe" }));
  const llamadasReporte = () => api.registro.filter((r) => r.url.includes("/reportes/"));

  it("RF-11.2 · sin fechas → pide seleccionar inicio y fin y no consulta nada", async () => {
    montar();
    poner("", "");
    await consultar();
    expect(await screen.findByText("Debes seleccionar una fecha de inicio y una fecha de fin.")).toBeInTheDocument();
    expect(llamadasReporte()).toHaveLength(0);
  });

  it("RF-11.2 · falta la fecha de fin → mismo aviso", async () => {
    montar();
    poner("2026-11-01", "");
    await consultar();
    expect(await screen.findByText("Debes seleccionar una fecha de inicio y una fecha de fin.")).toBeInTheDocument();
  });

  it("RF-11.2 · fecha de inicio posterior a la de fin → error y no consulta", async () => {
    montar();
    poner("2026-11-30", "2026-11-01");
    await consultar();
    expect(await screen.findByText("La fecha de inicio no puede ser posterior a la fecha de fin.")).toBeInTheDocument();
    expect(llamadasReporte()).toHaveLength(0);
  });

  it("rango mayor a 5 años (1830 días) → error y no consulta", async () => {
    montar();
    poner("2000-01-01", "2026-11-30");
    await consultar();
    expect(await screen.findByText("El rango del informe no puede superar 5 años (1830 días).")).toBeInTheDocument();
    expect(llamadasReporte()).toHaveLength(0);
  });

  it("RF-11.1 · el selector de período lista un solo renglón por presupuesto (prefiere el período abierto)", async () => {
    montar();
    await waitFor(() => expect(document.querySelectorAll("select option").length).toBe(3)); // "Ninguno" + 2 presupuestos
    const valores = [...document.querySelectorAll("select option")].map((o) => o.value);
    expect(valores).toEqual(["", "4", "5"]); // Austero (4), Mensual → período abierto (5); ordenados por nombre
  });

  it("con fechas válidas consulta el informe y muestra el resumen financiero", async () => {
    montar();
    poner("2026-11-01", "2026-11-30");
    await consultar();

    expect(await screen.findByText("Resumen financiero")).toBeInTheDocument();
    expect(api.llamadas("GET", "/reportes/resumen")[0].url).toContain("fecha_inicio=2026-11-01");
    expect(screen.getAllByText(/3\.000\.000/).length).toBeGreaterThan(0); // ingresos
    expect(screen.getAllByText(/1\.100\.000/).length).toBeGreaterThan(0); // balance
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("RF-11.1 · al elegir un período de presupuesto también consulta su reporte", async () => {
    montar();
    await waitFor(() => expect(document.querySelectorAll("select option").length).toBe(3));
    poner("2026-11-01", "2026-11-30");
    fireEvent.change(document.querySelector("select"), { target: { value: "5" } });
    await consultar();
    await screen.findByText("Resumen financiero");
    expect(api.llamadas("GET", "/reportes/presupuesto/5")).toHaveLength(1);
  });

  it("RF-11.5 · aunque falte el fondo de emergencia, el informe se muestra", async () => {
    montar({
      "/reportes/fondo-emergencia": { status: 404, body: { ok: false } },
      "/reportes/fondo-emergencia/estado": { status: 404, body: { ok: false } },
    });
    poner("2026-11-01", "2026-11-30");
    await consultar();
    expect(await screen.findByText("Resumen financiero")).toBeInTheDocument();
  });

  it("'Descargar PDF' está deshabilitado hasta consultar el informe", async () => {
    montar();
    expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeDisabled();
    poner("2026-11-01", "2026-11-30");
    await consultar();
    await screen.findByText("Resumen financiero");
    expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeEnabled();
  });

  it("RF-24 · 'Descargar PDF' entrega el informe consultado al generador de PDF", async () => {
    generarReportePDF.mockResolvedValue(true);
    montar();
    poner("2026-11-01", "2026-11-30");
    await consultar();
    await screen.findByText("Resumen financiero");
    await userEvent.click(screen.getByRole("button", { name: "Descargar PDF" }));

    await waitFor(() => expect(generarReportePDF).toHaveBeenCalledTimes(1));
    expect(generarReportePDF.mock.calls[0][0].periodo).toEqual({ fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", id_periodo: null });
  });

  it("RF-24 · si el generador falla, muestra el motivo y la página sigue operativa", async () => {
    generarReportePDF.mockRejectedValue(new Error("No fue posible generar el PDF."));
    montar();
    poner("2026-11-01", "2026-11-30");
    await consultar();
    await screen.findByText("Resumen financiero");
    await userEvent.click(screen.getByRole("button", { name: "Descargar PDF" }));
    expect(await screen.findByText("No fue posible generar el PDF.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeEnabled();
  });

  it("RF-11.4 · generar el informe solo hace lecturas (ninguna petición POST/PUT/PATCH/DELETE)", async () => {
    montar();
    poner("2026-11-01", "2026-11-30");
    await consultar();
    await screen.findByText("Resumen financiero");
    expect(api.registro.every((r) => r.metodo === "GET")).toBe(true);
  });
});
