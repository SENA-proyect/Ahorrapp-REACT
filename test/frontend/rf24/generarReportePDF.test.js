/**
 * RF-24 · Exportación nativa de reportes financieros (PDF) — frontend web
 * Archivo bajo prueba: Frontend/src/utils/generarreportepdf.js → generarReportePDF(informe)
 * El PDF se genera en el propio cliente (RF-24.1) con jsPDF. Aquí jsPDF se reemplaza por un
 * doble que registra cada texto escrito, cada página añadida y el nombre del archivo guardado,
 * lo que permite verificar el CONTENIDO del informe sin generar un binario.
 * Cobertura relacionada: test/frontend/rf11 (consulta del informe), test/backend/rf24 (datos del backend).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Doble de jsPDF: todo método de dibujo es un "no-op" encadenable; se registran text/addPage/save
const { docs } = vi.hoisted(() => ({ docs: [] }));
vi.mock("jspdf", () => {
  class FakeJsPDF {
    constructor(opciones) {
      this.opciones = opciones;
      this.textos = [];
      this.paginas = 1;
      this.archivo = null;
      docs.push(this);
      return new Proxy(this, {
        get: (obj, prop) => {
          if (prop in obj) return obj[prop];
          return () => obj; // setFont, setFontSize, rect, line... (encadenables)
        },
      });
    }
    text(t) { this.textos.push(...[].concat(t).map(String)); return this; }
    addPage() { this.paginas += 1; return this; }
    save(nombre) { this.archivo = nombre; }
    getTextWidth(t) { return String(t).length * 2; }
    splitTextToSize(t) { return [String(t)]; }
  }
  return { default: FakeJsPDF, jsPDF: FakeJsPDF };
});

import { generarReportePDF } from "../../../Frontend/src/utils/generarreportepdf";

const ultimo = () => docs[docs.length - 1];
const contenido = () => ultimo().textos.join("\n");

const informeCompleto = () => ({
  periodo: { fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", id_periodo: 5 },
  resumen: {
    ok: true,
    resumen: { ingresos: 3000000, gastos: 900000, imprevistos: 200000, ahorros: 300000, pagos_deudas: 400000, fondo_emergencia: { aportes: 150000, retiros: 50000, neto: 100000 }, balance: 1100000 },
    deudas: { monto_pagado: 400000, cuotas_pagadas: 4 },
  },
  gastosCategoria: { ok: true, datos: [{ id_categoria: 1, categoria: "Hogar", total: "500000" }, { id_categoria: 2, categoria: "Transporte", total: "400000" }] },
  gastosDependiente: { ok: true, datos: [{ dependiente: "Ana", total: "120000" }] },
  ingresosCategoria: { ok: true, datos: [{ categoria: "Salario", total: "3000000" }] },
  ingresosFuente: { ok: true, datos: [{ fuente: "Empresa SA", total: "3000000" }] },
  ahorros: { ok: true, total_ahorrado: 300000, datos: [{ monto: "300000", meta: "Vacaciones", fecha_registro: "2026-11-10" }] },
  deudas: { ok: true, resumen: { total_pagado: 400000, cuotas_pagadas: 4 }, datos: [{ monto: "100000", cuotas: 1, fuente: "Banco Andino", fecha_registro: "2026-11-05" }] },
  imprevistosCategoria: { ok: true, datos: [{ categoria: "Hogar", total: "200000" }] },
  fondoEmergencia: { ok: true, resumen: { aportes: 150000, retiros: 50000, movimiento_neto: 100000, meta: 5000000 } },
  evolucion: { ok: true, datos: [{ fecha: "2026-11-01", ingresos: 3000000, gastos: 0, imprevistos: 0, ahorros: 0, pagos_deudas: 0, aportes_emergencia: 0, retiros_emergencia: 0, balance: 3000000, balance_acumulado: 3000000 }] },
  estadoAhorros: { ok: true, resumen: { cantidad_metas: 1, meta_total: 1000000, acumulado_total: 300000, porcentaje_cumplimiento: 30 }, datos: [{ id_ahorro: 1, meta_nombre: "Vacaciones", meta: 1000000, monto_acumulado: 300000, porcentaje_cumplimiento: 30 }] },
  estadoDeudas: { ok: true, resumen: { cantidad_deudas: 1, monto_total: 1200000, monto_pagado: 400000, monto_pendiente: 800000, porcentaje_pagado: 33.33 }, datos: [{ id_deuda: 1, fuente: "Banco Andino", monto_total: 1200000, monto_pagado: 400000, monto_pendiente: 800000, cuotas_total: 12, cuotas_pagadas: 4, estado: "pendiente" }] },
  estadoFondoEmergencia: { ok: true, data: { meta: 5000000, saldo_actual: 1250000, porcentaje_meta: 25 } },
  presupuesto: {
    ok: true,
    periodo: { id_periodo: 5, fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", estado: "abierto" },
    presupuesto: { nombre: "Mensual", descripcion: null, porcentajes: { gastos: 40, deudas: 20, imprevistos: 15, ahorros: 10, emergencia: 15 } },
    ingresos: { estimado: 3000000, real: 2800000 },
    saldo: { anterior: 200000, disponible: 1680000 },
    categorias: {
      gastos: { planeado: 1200000, ejecutado: 600000, diferencia: 600000, porcentaje_usado: 50 },
      deudas: { planeado: 600000, ejecutado: 300000, diferencia: 300000, porcentaje_usado: 50 },
      imprevistos: { planeado: 450000, ejecutado: 45000, diferencia: 405000, porcentaje_usado: 10 },
      ahorros: { planeado: 300000, ejecutado: 150000, diferencia: 150000, porcentaje_usado: 50 },
      emergencia: { planeado: 450000, ejecutado: 225000, diferencia: 225000, porcentaje_usado: 50 },
    },
    resumen: { total_planeado: 3000000, total_ejecutado: 1320000, diferencia: 1680000, porcentaje_ejecucion: 44 },
  },
});

beforeEach(() => {
  docs.length = 0;
  vi.useRealTimers();
});

// ═════════════════════════════════════════════════════════════
describe("RF-24 · Generación del documento", () => {
  it("RF-24.1 · crea un documento A4 vertical (en mm) en el propio cliente", async () => {
    await generarReportePDF(informeCompleto());
    expect(docs).toHaveLength(1);
    expect(ultimo().opciones).toEqual({ orientation: "portrait", unit: "mm", format: "a4" });
  });

  it("devuelve true al terminar", async () => {
    await expect(generarReportePDF(informeCompleto())).resolves.toBe(true);
  });

  it("guarda el archivo como AhorrApp_Informe_Financiero_AAAA-MM-DD.pdf con la fecha de hoy", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-23T15:00:00Z"), toFake: ["Date"] });
    await generarReportePDF(informeCompleto());
    expect(ultimo().archivo).toBe("AhorrApp_Informe_Financiero_2026-11-23.pdf");
  });

  it("sin información → lanza 'No existe información para generar el informe.' y no crea documento", async () => {
    await expect(generarReportePDF(null)).rejects.toThrow("No existe información para generar el informe.");
    await expect(generarReportePDF(undefined)).rejects.toThrow("No existe información para generar el informe.");
    expect(docs).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-24 · Contenido del informe", () => {
  it("portada: marca, título y período consultado", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    expect(c).toContain("AhorrApp");
    expect(c).toContain("Informe financiero");
    expect(c).toContain("Período: 2026-11-01 — 2026-11-30");
  });

  it("incluye las 9 secciones numeradas cuando hay datos", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    for (const titulo of [
      "1. Resumen financiero", "2. Ingresos", "3. Gastos", "4. Ahorros", "5. Deudas",
      "6. Imprevistos", "7. Fondo de emergencia", "8. Presupuesto", "9. Evolución temporal",
    ]) expect(c).toContain(titulo);
  });

  it("las secciones aparecen en orden", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    const orden = ["1. Resumen financiero", "2. Ingresos", "3. Gastos", "4. Ahorros", "5. Deudas", "6. Imprevistos", "7. Fondo de emergencia", "8. Presupuesto", "9. Evolución temporal"].map((t) => c.indexOf(t));
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
  });

  it("muestra los valores monetarios en formato colombiano (COP)", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    expect(c).toMatch(/3\.000\.000/); // ingresos
    expect(c).toMatch(/1\.100\.000/); // balance
    expect(c).toMatch(/900\.000/);    // gastos
  });

  it("incluye el detalle de gastos (categoría y dependiente) e ingresos (categoría)", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    for (const texto of ["Hogar", "Transporte", "Ana", "Salario"]) expect(c).toContain(texto);
    expect(c).toMatch(/500\.000/);
    expect(c).toMatch(/120\.000/);
  });

  it("OBSERVACIÓN · «ingresos por fuente» se consulta (RF-11) pero el PDF web no lo imprime", async () => {
    // generarIngresos() calcula datosFuentes, pero solo se dibuja la tabla "por categoría".
    await generarReportePDF(informeCompleto());
    expect(contenido()).toContain("Ingresos por categoría");
    expect(contenido()).not.toContain("Empresa SA");
  });

  it("incluye abonos de ahorro, pagos de deuda y el estado actual de metas y deudas", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    expect(c).toContain("Estado actual de metas");
    expect(c).toContain("30.0%");
    expect(c).toContain("Banco Andino");
    expect(c).toContain("Estado actual de deudas");
    expect(c).toContain("33.3%");
  });

  it("fondo de emergencia: aportes, retiros, saldo actual y progreso hacia la meta", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    for (const texto of ["APORTES", "RETIROS", "SALDO ACTUAL"]) expect(c).toContain(texto);
    expect(c).toMatch(/1\.250\.000/);
    expect(c).toContain("25.0%");
  });

  it("la sección de presupuesto compara lo planeado con lo ejecutado y la diferencia por módulo", async () => {
    await generarReportePDF(informeCompleto());
    const c = contenido();
    for (const columna of ["Planeado", "Ejecutado", "Diferencia"]) expect(c).toContain(columna);
    for (const modulo of ["Gastos", "Deudas", "Imprevistos", "Ahorros", "Fondo de emergencia"]) expect(c).toContain(modulo);
    expect(c).toMatch(/1\.200\.000/); // planeado de gastos
    expect(c).toMatch(/600\.000/);     // ejecutado de gastos
    expect(c).toMatch(/405\.000/);     // diferencia de imprevistos
  });

  it("un informe extenso se reparte en varias páginas", async () => {
    const informe = informeCompleto();
    informe.evolucion.datos = Array.from({ length: 120 }, (_, i) => ({
      fecha: `2026-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      ingresos: 1000, gastos: 500, imprevistos: 0, ahorros: 0, pagos_deudas: 0, aportes_emergencia: 0, retiros_emergencia: 0, balance: 500, balance_acumulado: 500 * (i + 1),
    }));
    await generarReportePDF(informe);
    expect(ultimo().paginas).toBeGreaterThan(1);
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-24 · Informes parciales o sin datos (no se interrumpe la generación)", () => {
  it("RF-24.5 / RF-11.6 · sin presupuesto (no se eligió período) omite esa sección y genera el resto", async () => {
    const informe = informeCompleto();
    informe.presupuesto = null;
    await expect(generarReportePDF(informe)).resolves.toBe(true);
    expect(contenido()).not.toContain("8. Presupuesto");
    expect(contenido()).toContain("9. Evolución temporal");
    expect(ultimo().archivo).toMatch(/\.pdf$/);
  });

  it("OBSERVACIÓN · al omitir el presupuesto igual se añade su página: queda una página en blanco (solo pie)", async () => {
    const informe = informeCompleto();
    informe.presupuesto = null;
    await generarReportePDF(informe);
    expect(ultimo().paginas).toBe(9); // 9 páginas aunque solo hay 8 secciones con contenido
    expect(ultimo().textos.filter((t) => t.includes("Página 8"))).toHaveLength(1);
  });

  it("OBSERVACIÓN · con un informe sin datos, las secciones 2–5 quedan con título y sin leyenda 'sin datos'", async () => {
    // RF-24.5 pide indicar las secciones sin datos como no disponibles; solo Imprevistos lo hace hoy.
    await generarReportePDF({ periodo: { fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" } });
    const c = contenido();
    expect(c).toContain("No se registraron imprevistos durante el período.");
    expect(c).not.toMatch(/no disponible|sin datos/i);
  });

  it("RF-24.6 · sin fondo de emergencia (secciones en null) genera el PDF igualmente", async () => {
    const informe = informeCompleto();
    informe.fondoEmergencia = null;
    informe.estadoFondoEmergencia = null;
    await expect(generarReportePDF(informe)).resolves.toBe(true);
    expect(contenido()).toContain("1. Resumen financiero");
  });

  it.each([
    "resumen", "gastosCategoria", "gastosDependiente", "ingresosCategoria", "ingresosFuente", "ahorros",
    "deudas", "imprevistosCategoria", "fondoEmergencia", "evolucion", "estadoAhorros", "estadoDeudas",
    "estadoFondoEmergencia", "presupuesto",
  ])("la sección «%s» en null no rompe la generación", async (clave) => {
    const informe = informeCompleto();
    informe[clave] = null;
    await expect(generarReportePDF(informe)).resolves.toBe(true);
    expect(ultimo().archivo).toMatch(/^AhorrApp_Informe_Financiero_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it("todas las secciones en null: se genera igualmente la portada", async () => {
    const informe = { periodo: { fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" } };
    await expect(generarReportePDF(informe)).resolves.toBe(true);
    expect(contenido()).toContain("Informe financiero");
    expect(contenido()).toContain("Período: 2026-11-01 — 2026-11-30");
  });

  it("listas vacías (sin movimientos en el rango) no rompen la generación", async () => {
    const informe = informeCompleto();
    for (const k of ["gastosCategoria", "gastosDependiente", "ingresosCategoria", "ingresosFuente", "ahorros", "deudas", "imprevistosCategoria", "evolucion"]) {
      informe[k] = { ...informe[k], datos: [] };
    }
    await expect(generarReportePDF(informe)).resolves.toBe(true);
  });

  it("sin período en el informe: la portada usa texto vacío en las fechas y no falla", async () => {
    const informe = informeCompleto();
    delete informe.periodo;
    await expect(generarReportePDF(informe)).resolves.toBe(true);
    expect(contenido()).toContain("Período:  — ");
  });
});

// ═════════════════════════════════════════════════════════════
describe("RF-24 · El generador no altera los datos de entrada", () => {
  it("el informe recibido queda idéntico tras generar el PDF (RF-24: no modifica ni almacena datos)", async () => {
    const informe = informeCompleto();
    const copia = structuredClone(informe);
    await generarReportePDF(informe);
    expect(informe).toEqual(copia);
  });

  it("no hace peticiones de red al generar (todo ocurre en el dispositivo)", async () => {
    const fetchEspia = vi.fn();
    vi.stubGlobal("fetch", fetchEspia);
    await generarReportePDF(informeCompleto());
    expect(fetchEspia).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
