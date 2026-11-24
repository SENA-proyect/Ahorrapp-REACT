/**
 * RF-05 · Gestionar imprevistos (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/ModuloImprevistos.jsx         → listado, edición y eliminación
 *   Frontend/src/components/Modalnuevomovimiento.jsx → formulario "Registrar Imprevisto"
 *   Frontend/src/utils/validaciones.js               → validarMonto, validarLongitud, validarNoFutura
 * Endpoints (fetch simulado): GET/POST /api/movimientos(/imprevistos) · PUT/DELETE /api/movimientos/imprevistos/:id
 * Nota: en la web la causa es obligatoria; el backend la acepta vacía (ver docs/RF05).
 * La lógica común vive en test/frontend/helpers/crudModulo.jsx.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { instalarFetch } from "../helpers/fetchMock";

const { mostrarToast, revisarAhora } = vi.hoisted(() => ({ mostrarToast: vi.fn(), revisarAhora: vi.fn() }));
vi.mock("../../../Frontend/src/components/HeaderModulos", () => ({ default: () => null }));
vi.mock("../../../Frontend/src/context/ToastContext", () => ({ useToast: () => ({ mostrarToast }) }));
vi.mock("../../../Frontend/src/context/NotificacionesContext", () => ({ useNotificaciones: () => ({ revisarAhora }) }));

import ModuloImprevistos from "../../../Frontend/src/pages/ModuloImprevistos";
import { pruebasCrud } from "../helpers/crudModulo";

pruebasCrud(
  {
    rf: "RF-05",
    Pagina: ModuloImprevistos,
    etiqueta: "Imprevisto",
    ruta: "imprevistos",
    tipoFlujo: "Salida",
    subtipo: "Imprevisto",
    textos: {
      agregar: /Registrar Imprevisto/,
      tituloModal: /Registrar Imprevisto/,
      botonRegistrar: "Registrar Imprevisto",
      tituloEditar: /Editar Imprevisto/,
      eliminarTitulo: /¿Eliminar imprevisto\?/,
      vacio: "No hay imprevistos registrados aún.",
      primer: "Registrar primer imprevisto",
      toastCrear: "Imprevisto registrado correctamente",
      toastEditar: "Imprevisto actualizado correctamente",
      toastEliminar: "Imprevisto eliminado correctamente",
    },
    filas: [
      { id: 1, monto: "320000", causa: "Reparación nevera", fecha: "2026-11-08T00:00:00.000Z", id_categoria: 3, categoria: "Cat", id_dependientes: null },
      { id: 2, monto: "80000", causa: "Grúa", fecha: "2026-11-09T00:00:00.000Z", id_categoria: null, categoria: null, id_dependientes: null },
    ],
    textoFila: "Reparación nevera",
    fechaTexto: "08/11/2026",
    montoTexto: "$320.000",
    total: "$400.000",
    crearValido: { monto: "150000", causa: "Arreglo urgente", fecha_registro: "2026-11-08" },
    cuerpoCrear: { monto: 150000, causa: "Arreglo urgente", fecha_registro: "2026-11-08", id_categoria: null, id_dependientes: null },
    invalidos: [
      ["RF-05.1 monto 0", { monto: "0" }, "El monto debe ser mayor a 0"],
      ["RF-05.1 monto negativo", { monto: "-5" }, "El monto debe ser mayor a 0"],
      ["monto sobre el máximo", { monto: "1000000000001" }, "no puede superar"],
      ["causa vacía", { causa: "   " }, "La causa es obligatoria"],
      ["causa de más de 255 caracteres", { causa: "c".repeat(256) }, "La causa no puede superar 255 caracteres"],
    ],
    precarga: { monto: 320000, causa: "Reparación nevera", fecha_registro: "2026-11-08", id_categoria: "3" },
    editarCambios: { monto: "350000", causa: "Reparación (ajustada)" },
    cuerpoEditar: { monto: 350000, causa: "Reparación (ajustada)", fecha_registro: "2026-11-08", id_categoria: 3, id_dependientes: null },
    editarInvalidos: [
      ["monto 0", { monto: "0" }, "El monto debe ser mayor a 0"],
      ["causa vacía", { causa: "" }, "La causa es obligatoria"],
      ["fecha futura", { fecha_registro: "2999-01-01" }, "La fecha no puede ser futura"],
    ],
  },
  { mostrarToast, revisarAhora }
);

describe("RF-05 · Particularidades del formulario de imprevistos", () => {
  const montar = async () => {
    const api = instalarFetch([
      ["GET", "/movimientos/imprevistos", () => ({ body: [] })],
      ["GET", "/categorias", () => ({ body: { categorias: [{ id: 3, nombre: "Cat", activa: 1 }] } })],
      ["GET", "/dependientes", () => ({ body: [{ id_dependientes: 4, Nombre: "Ana" }] })],
      ["POST", "/movimientos", () => ({ status: 201, body: { ok: true } })],
    ]);
    render(<MemoryRouter><ModuloImprevistos /></MemoryRouter>);
    await userEvent.click(await screen.findByRole("button", { name: /Registrar Imprevisto/ }));
    return api;
  };
  const campo = (n) => document.querySelector(`[name="${n}"]`);

  it("el formulario ofrece causa, categoría, dependiente y fecha", async () => {
    await montar();
    for (const n of ["monto", "causa", "id_categoria", "id_dependientes", "fecha_registro"]) expect(campo(n)).toBeInTheDocument();
  });

  it("RF-05.6 · el imprevisto puede asociarse a un dependiente y viaja en el POST", async () => {
    const api = await montar();
    await waitFor(() => expect(campo("id_dependientes").querySelectorAll("option").length).toBeGreaterThan(1));
    fireEvent.change(campo("monto"), { target: { value: "90000" } });
    fireEvent.change(campo("causa"), { target: { value: "Médico" } });
    fireEvent.change(campo("id_dependientes"), { target: { value: "4" } });
    await userEvent.click(screen.getByRole("button", { name: "Registrar Imprevisto" }));

    await waitFor(() => expect(api.llamadas("POST", "/movimientos")).toHaveLength(1));
    expect(api.llamadas("POST", "/movimientos")[0].cuerpo.datos.id_dependientes).toBe("4");
  });
});
