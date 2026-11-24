/**
 * RF-02 · Gestionar ingresos (frontend web)
 * Archivos bajo prueba:
 *   Frontend/src/pages/ModulosIngresos.jsx           → listado, edición y eliminación de ingresos
 *   Frontend/src/components/Modalnuevomovimiento.jsx → formulario "Registrar Ingreso" (subtipo Ingreso)
 *   Frontend/src/utils/validaciones.js               → validarMonto, validarLongitud, validarNoFutura
 * Endpoints (fetch simulado): GET/POST /api/movimientos(/ingresos) · PUT/DELETE /api/movimientos/ingresos/:id
 * La lógica común (consultar/registrar/editar/eliminar) vive en test/frontend/helpers/crudModulo.jsx.
 */
import { describe, vi } from "vitest";

const { mostrarToast, revisarAhora } = vi.hoisted(() => ({ mostrarToast: vi.fn(), revisarAhora: vi.fn() }));
vi.mock("../../../Frontend/src/components/HeaderModulos", () => ({ default: () => null }));
vi.mock("../../../Frontend/src/context/ToastContext", () => ({ useToast: () => ({ mostrarToast }) }));
vi.mock("../../../Frontend/src/context/NotificacionesContext", () => ({ useNotificaciones: () => ({ revisarAhora }) }));

import ModulosIngresos from "../../../Frontend/src/pages/ModulosIngresos";
import { pruebasCrud } from "../helpers/crudModulo";

pruebasCrud(
  {
    rf: "RF-02",
    Pagina: ModulosIngresos,
    etiqueta: "Ingreso",
    ruta: "ingresos",
    tipoFlujo: "Entrada",
    subtipo: "Ingreso",
    textos: {
      agregar: /Agregar Ingreso/,
      tituloModal: /Registrar Ingreso/,
      botonRegistrar: "Registrar Ingreso",
      tituloEditar: /Editar Ingreso/,
      eliminarTitulo: /¿Eliminar ingreso\?/,
      vacio: "No hay ingresos registrados aún.",
      primer: "Registrar primer ingreso",
      toastCrear: "Ingreso registrado correctamente",
      toastEditar: "Ingreso actualizado correctamente",
      toastEliminar: "Ingreso eliminado correctamente",
    },
    filas: [
      { id: 1, monto: "3000000", fuente: "Empresa SA", descripcion: "Salario noviembre", fecha: "2026-11-05T00:00:00.000Z", id_categoria: 3, categoria: "Cat" },
      { id: 2, monto: "150000", fuente: "Freelance", descripcion: "Diseño logo", fecha: "2026-11-06T00:00:00.000Z", id_categoria: null, categoria: null },
    ],
    textoFila: "Salario noviembre",
    fechaTexto: "05/11/2026",
    montoTexto: "$3.000.000",
    total: "$3.150.000",
    crearValido: { monto: "250000", fuente: "Cliente", descripcion: "Pago", fecha_registro: "2026-11-05" },
    cuerpoCrear: { monto: 250000, fuente: "Cliente", descripcion: "Pago", fecha_registro: "2026-11-05", id_categoria: null },
    invalidos: [
      ["RF-02.1 monto 0", { monto: "0" }, "El monto debe ser mayor a 0"],
      ["RF-02.1 monto negativo", { monto: "-5" }, "El monto debe ser mayor a 0"],
      ["monto sobre el máximo", { monto: "1000000000001" }, "no puede superar"],
      ["fuente de más de 150 caracteres", { fuente: "f".repeat(151) }, "La fuente no puede superar 150 caracteres"],
      ["descripción de más de 255 caracteres", { descripcion: "d".repeat(256) }, "La descripción no puede superar 255 caracteres"],
    ],
    precarga: { monto: 3000000, fuente: "Empresa SA", descripcion: "Salario noviembre", fecha_registro: "2026-11-05", id_categoria: "3" },
    editarCambios: { monto: "3200000", fuente: "Empresa SA (ajuste)" },
    cuerpoEditar: { monto: 3200000, fuente: "Empresa SA (ajuste)", descripcion: "Salario noviembre", fecha_registro: "2026-11-05", id_categoria: 3 },
    editarInvalidos: [
      ["monto 0", { monto: "0" }, "El monto debe ser mayor a 0"],
      ["fecha futura", { fecha_registro: "2999-01-01" }, "La fecha no puede ser futura"],
      ["fuente de más de 150 caracteres", { fuente: "f".repeat(151) }, "La fuente no puede superar 150 caracteres"],
    ],
  },
  { mostrarToast, revisarAhora }
);
