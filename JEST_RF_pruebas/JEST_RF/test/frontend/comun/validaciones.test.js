/**
 * Validaciones compartidas del frontend (web)
 * Archivo bajo prueba: Frontend/src/utils/validaciones.js
 * Sustenta las reglas de formulario de RF-02, RF-03 (mínimo 50), RF-04, RF-05, RF-06, RF-07 y RF-26.
 * Cada función devuelve un mensaje de error (string) o null si el valor es válido.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  MONTO_MAXIMO, MONTO_MINIMO_GASTO, LIMITES, hoyISO,
  validarMonto, validarLongitud, validarCuotas, validarOrdenFechas, validarNoFutura, primerError,
} from "../../../Frontend/src/utils/validaciones";

afterEach(() => vi.useRealTimers());

describe("constantes", () => {
  it("el mínimo de un gasto es 50 (RF-03.2) y el máximo de un monto es 1 billón", () => {
    expect(MONTO_MINIMO_GASTO).toBe(50);
    expect(MONTO_MAXIMO).toBe(1_000_000_000_000);
  });
  it("límites de texto coherentes con el backend", () => {
    expect(LIMITES).toEqual({ descripcion: 255, causa: 255, fuente: 150, meta: 100, nombrePresupuesto: 80, descripcionPresupuesto: 255 });
  });
});

describe("validarMonto", () => {
  it.each([["", null], [null, null], [undefined, null]])("vacío (%p) → 'El monto es obligatorio'", (v) => {
    expect(validarMonto(v)).toBe("El monto es obligatorio");
  });
  it.each([["abc"], [NaN], [Infinity]])("no numérico (%p) → 'debe ser un número válido'", (v) => {
    expect(validarMonto(v)).toBe("El monto debe ser un número válido");
  });
  it.each([[0], ["0"], [-1], ["-0.5"]])("%p → 'debe ser mayor a 0'", (v) => {
    expect(validarMonto(v)).toBe("El monto debe ser mayor a 0");
  });
  it.each([[0.01], [1], ["100"], [MONTO_MAXIMO]])("%p es válido", (v) => {
    expect(validarMonto(v)).toBeNull();
  });
  it("sobre el máximo → 'no puede superar 1.000.000.000.000'", () => {
    expect(validarMonto(MONTO_MAXIMO + 1)).toBe("El monto no puede superar 1.000.000.000.000");
  });

  describe("mínimo (RF-03.2: gastos desde 50)", () => {
    const gasto = (v) => validarMonto(v, { minimo: MONTO_MINIMO_GASTO });
    it.each([[49], [49.99], [1]])("%p → 'debe ser de al menos 50'", (v) => {
      expect(gasto(v)).toBe("El monto debe ser de al menos 50");
    });
    it.each([[50], [50.01], ["1000"]])("%p es válido", (v) => {
      expect(gasto(v)).toBeNull();
    });
    it("0 y negativos se rechazan primero por 'mayor a 0'", () => {
      expect(gasto(0)).toBe("El monto debe ser mayor a 0");
      expect(gasto(-5)).toBe("El monto debe ser mayor a 0");
    });
  });

  describe("permitirCero (metas e ingreso estimado, RF-06.2)", () => {
    const meta = (v) => validarMonto(v, { nombre: "La meta", permitirCero: true });
    it("0 es válido", () => expect(meta(0)).toBeNull());
    it("negativo → 'La meta no puede ser negativo'", () => expect(meta(-1)).toBe("La meta no puede ser negativo"));
    it("vacío → 'La meta es obligatorio'", () => expect(meta("")).toBe("La meta es obligatorio"));
  });
});

describe("validarLongitud", () => {
  it("dentro del límite → null", () => expect(validarLongitud("a".repeat(255), 255, "La descripción")).toBeNull());
  it("excede el límite → mensaje con el máximo", () => {
    expect(validarLongitud("a".repeat(256), 255, "La descripción")).toBe("La descripción no puede superar 255 caracteres");
  });
  it("ignora los espacios de los extremos al medir", () => {
    expect(validarLongitud(`  ${"a".repeat(255)}  `, 255, "La descripción")).toBeNull();
  });
  it.each([[""], [null], [undefined], [123]])("valor no texto o vacío (%p) → null", (v) => {
    expect(validarLongitud(v, 255, "La descripción")).toBeNull();
  });
});

describe("validarCuotas (RF-07.3)", () => {
  it.each([[1], ["1"], [12], ["360"]])("%p es válido", (v) => expect(validarCuotas(v)).toBeNull());
  it.each([[0], ["0"], [-1], [2.5], ["abc"], [NaN]])("%p → 'debe ser un entero mayor a 0'", (v) => {
    expect(validarCuotas(v)).toBe("El número de cuotas debe ser un entero mayor a 0");
  });
  it.each([[""], [null], [undefined]])("vacío (%p) es válido por defecto (pago único)", (v) => {
    expect(validarCuotas(v)).toBeNull();
  });
  it("vacío con opcional:false → 'es obligatorio'", () => {
    expect(validarCuotas("", { opcional: false })).toBe("El número de cuotas es obligatorio");
  });
});

describe("validarOrdenFechas (RF-04.5, RF-07.7)", () => {
  const msg = "La fecha fin no puede ser anterior a la de inicio";
  it("fin anterior al inicio → mensaje", () => expect(validarOrdenFechas("2026-11-10", "2026-11-09", msg)).toBe(msg));
  it("fin igual al inicio → válido", () => expect(validarOrdenFechas("2026-11-10", "2026-11-10", msg)).toBeNull());
  it("fin posterior al inicio → válido", () => expect(validarOrdenFechas("2026-11-10", "2026-12-01", msg)).toBeNull());
  it.each([["", "2026-11-09"], ["2026-11-10", ""], ["", ""], [null, null]])("falta una fecha (%p, %p) → no valida", (i, f) => {
    expect(validarOrdenFechas(i, f, msg)).toBeNull();
  });
});

describe("hoyISO / validarNoFutura", () => {
  it("hoyISO devuelve la fecha local en formato AAAA-MM-DD", () => {
    vi.useFakeTimers({ now: new Date(2026, 10, 3, 23, 30), toFake: ["Date"] });
    expect(hoyISO()).toBe("2026-11-03");
  });
  it("hoyISO rellena mes y día con cero", () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 5), toFake: ["Date"] });
    expect(hoyISO()).toBe("2026-01-05");
  });
  it("fecha futura → 'La fecha no puede ser futura'", () => {
    vi.useFakeTimers({ now: new Date(2026, 10, 3), toFake: ["Date"] });
    expect(validarNoFutura("2026-11-04")).toBe("La fecha no puede ser futura");
  });
  it("hoy y fechas pasadas son válidas", () => {
    vi.useFakeTimers({ now: new Date(2026, 10, 3), toFake: ["Date"] });
    expect(validarNoFutura("2026-11-03")).toBeNull();
    expect(validarNoFutura("2020-01-01")).toBeNull();
  });
  it("sin fecha (opcional) → válido", () => {
    expect(validarNoFutura("")).toBeNull();
    expect(validarNoFutura(undefined)).toBeNull();
  });
  it("acepta un nombre personalizado en el mensaje", () => {
    expect(validarNoFutura("2999-01-01", "La fecha de registro")).toBe("La fecha de registro no puede ser futura");
  });
});

describe("primerError", () => {
  it("devuelve el primer error no vacío", () => expect(primerError(null, "A", "B")).toBe("A"));
  it("sin errores → null", () => expect(primerError(null, undefined, "")).toBeNull());
  it("sin argumentos → null", () => expect(primerError()).toBeNull());
});
