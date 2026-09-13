import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { obtenerInformeCompleto, getPeriodos } from "../services/api";
import { generarReportePDF } from "../utils/generarreportepdf";
import HeaderModulos from "../components/HeaderModulos";

const formatearCOP = (valor) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
};

const ResumenCard = ({ titulo, valor, descripcion }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-gray-400">{titulo}</p>

      <p className="mt-2 text-2xl font-bold text-amber-400">
        {valor}
      </p>

      {descripcion && (
        <p className="mt-1 text-xs text-gray-500">
          {descripcion}
        </p>
      )}
    </div>
  );
};

const InfoItem = ({ titulo, disponible }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm text-gray-300">{titulo}</span>

      <span
        className={`text-xs font-medium ${
          disponible ? "text-green-400" : "text-gray-500"
        }`}
      >
        {disponible ? "Disponible" : "Sin datos"}
      </span>
    </div>
  );
};

export default function Reportes() {
  const navigate = useNavigate();

  // Formatea una fecha usando sus componentes LOCALES (evita el desfase
  // de día que produce toISOString(), que convierte a UTC).
  const toLocalISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const fechaActual = new Date();
  const primerDiaMes = new Date(
    fechaActual.getFullYear(),
    fechaActual.getMonth(),
    1
  );

  const [fechaInicio, setFechaInicio] = useState(
    toLocalISODate(primerDiaMes)
  );

  const [fechaFin, setFechaFin] = useState(
    toLocalISODate(fechaActual)
  );

  const [idPeriodo, setIdPeriodo] = useState("");
  const [periodos, setPeriodos] = useState([]);
  const [cargandoPeriodos, setCargandoPeriodos] = useState(true);

  useEffect(() => {
    getPeriodos()
      .then((res) => setPeriodos(res?.data ?? []))
      .catch(() => setPeriodos([]))
      .finally(() => setCargandoPeriodos(false));
  }, []);

  // Un renglón por presupuesto (no uno por cada período histórico): de
  // cada presupuesto se elige el período "abierto" si hay uno, o si no,
  // el cerrado más reciente (por fecha_fin).
  const presupuestosUnicos = useMemo(() => {
    const porPresupuesto = new Map();

    for (const p of periodos) {
      const actual = porPresupuesto.get(p.ID_presupuesto);
      if (!actual) {
        porPresupuesto.set(p.ID_presupuesto, p);
        continue;
      }
      const actualGana =
        actual.Estado === "abierto" ||
        (p.Estado !== "abierto" && actual.Fecha_fin >= p.Fecha_fin);
      if (!actualGana) porPresupuesto.set(p.ID_presupuesto, p);
    }

    return [...porPresupuesto.values()].sort((a, b) =>
      a.Perfil_nombre.localeCompare(b.Perfil_nombre)
    );
  }, [periodos]);

  const [informe, setInforme] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const consultarInforme = async () => {
    setError("");

    if (!fechaInicio || !fechaFin) {
      setError("Debes seleccionar una fecha de inicio y una fecha de fin.");
      return;
    }

    if (fechaInicio > fechaFin) {
      setError(
        "La fecha de inicio no puede ser posterior a la fecha de fin."
      );
      return;
    }

    try {
      setCargando(true);

      const data = await obtenerInformeCompleto({
        fechaInicio,
        fechaFin,
        idPeriodo: idPeriodo || null,
      });

      setInforme(data);
    } catch (err) {
      console.error("Error al obtener el informe:", err);

      setError(
        err?.message ||
          "No fue posible obtener la información del informe."
      );
    } finally {
      setCargando(false);
    }
  };

  const descargarPDF = async () => {
    if (!informe) {
      setError("Primero debes consultar el informe.");
      return;
    }

    try {
      setError("");
      setGenerandoPDF(true);

      await generarReportePDF(informe);
    } catch (err) {
      console.error("Error al generar el PDF:", err);

      setError(
        err?.message ||
          "No fue posible generar el PDF."
      );
    } finally {
      setGenerandoPDF(false);
    }
  };

  const resumen = informe?.resumen ?? {};

  return (
    <div
      className="min-h-screen w-full text-white overflow-x-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)',
      }}
    >
      <HeaderModulos section="Reportes" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Encabezado */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-400">
              Reportes financieros
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Consulta y descarga un informe completo de tu información
              financiera.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
          >
            Volver
          </button>
        </div>

        {/* Filtros */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-5 text-lg font-semibold text-white">
            Periodo del informe
          </h2>

          <div className="grid gap-5 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Fecha inicial
              </label>

              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Fecha final
              </label>

              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Presupuesto
              </label>

              <select
                value={idPeriodo}
                onChange={(e) => setIdPeriodo(e.target.value)}
                disabled={cargandoPeriodos}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-amber-400 disabled:opacity-50"
              >
                <option value="">
                  {cargandoPeriodos ? "Cargando..." : "Ninguno (opcional)"}
                </option>
                {presupuestosUnicos.map((p) => (
                  <option key={p.ID_presupuesto} value={p.ID_periodo}>
                    {p.Perfil_nombre} — {p.Fecha_inicio?.slice(0, 10)} → {p.Fecha_fin?.slice(0, 10)}
                    {p.Estado === "abierto" ? " (en curso)" : " (último cerrado)"}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                Se usará el período abierto de ese presupuesto, o si no hay uno, el último cerrado.
              </p>
            </div>

          </div>

          <div className="mt-5 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={consultarInforme}
              disabled={cargando}
              className="rounded-xl bg-amber-400 px-5 py-3 font-semibold text-gray-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando ? "Consultando..." : "Consultar informe"}
            </button>

            <button
              type="button"
              onClick={descargarPDF}
              disabled={!informe || generandoPDF}
              className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 font-semibold text-amber-400 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generandoPDF
                ? "Generando PDF..."
                : "Descargar PDF"}
            </button>

          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>

        {/* Estado inicial */}
        {!informe && !cargando && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">
              Genera tu informe financiero
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Selecciona el periodo que deseas consultar y presiona
              "Consultar informe".
            </p>
          </div>
        )}

        {/* Informe */}
        {informe && (
          <>
            {/* Resumen */}
            <section className="mb-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Resumen financiero
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {fechaInicio} → {fechaFin}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <ResumenCard
                  titulo="Ingresos"
                  valor={formatearCOP(
                    resumen.totalIngresos ??
                      resumen.total_ingresos ??
                      0
                  )}
                />

                <ResumenCard
                  titulo="Gastos"
                  valor={formatearCOP(
                    resumen.totalGastos ??
                      resumen.total_gastos ??
                      0
                  )}
                />

                <ResumenCard
                  titulo="Ahorros"
                  valor={formatearCOP(
                    resumen.totalAhorros ??
                      resumen.total_ahorros ??
                      0
                  )}
                />

                <ResumenCard
                  titulo="Deudas"
                  valor={formatearCOP(
                    resumen.totalDeudas ??
                      resumen.total_deudas ??
                      0
                  )}
                />

                <ResumenCard
                  titulo="Imprevistos"
                  valor={formatearCOP(
                    resumen.totalImprevistos ??
                      resumen.total_imprevistos ??
                      0
                  )}
                />

                <ResumenCard
                  titulo="Balance"
                  valor={formatearCOP(
                    resumen.balance ?? 0
                  )}
                />

              </div>
            </section>

            {/* Disponibilidad de información */}
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Información incluida
              </h2>

              <div className="grid gap-3 md:grid-cols-2">

                <InfoItem
                  titulo="Gastos por categoría"
                  disponible={
                    !!informe.gastosCategoria
                  }
                />

                <InfoItem
                  titulo="Gastos por dependiente"
                  disponible={
                    !!informe.gastosDependiente
                  }
                />

                <InfoItem
                  titulo="Ingresos por categoría"
                  disponible={
                    !!informe.ingresosCategoria
                  }
                />

                <InfoItem
                  titulo="Ingresos por fuente"
                  disponible={
                    !!informe.ingresosFuente
                  }
                />

                <InfoItem
                  titulo="Ahorros"
                  disponible={
                    !!informe.ahorros
                  }
                />

                <InfoItem
                  titulo="Estado actual de ahorros"
                  disponible={
                    !!informe.estadoAhorros
                  }
                />

                <InfoItem
                  titulo="Deudas"
                  disponible={
                    !!informe.deudas
                  }
                />

                <InfoItem
                  titulo="Estado actual de deudas"
                  disponible={
                    !!informe.estadoDeudas
                  }
                />

                <InfoItem
                  titulo="Imprevistos por categoría"
                  disponible={
                    !!informe.imprevistosCategoria
                  }
                />

                <InfoItem
                  titulo="Fondo de emergencia"
                  disponible={
                    !!informe.fondoEmergencia
                  }
                />

                <InfoItem
                  titulo="Estado actual del fondo de emergencia"
                  disponible={
                    !!informe.estadoFondoEmergencia
                  }
                />

                <InfoItem
                  titulo="Evolución financiera"
                  disponible={
                    !!informe.evolucion
                  }
                />

                <InfoItem
                  titulo="Presupuesto"
                  disponible={
                    !!informe.presupuesto
                  }
                />

              </div>
            </section>

            {/* Información del presupuesto */}
            {informe.presupuesto && (
              <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold text-white">
                  Presupuesto
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  Se encontró información para el periodo de presupuesto
                  seleccionado.
                </p>
              </section>
            )}

            {/* Estado actual del fondo de emergencia */}
            {informe.estadoFondoEmergencia?.data && (
              <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold text-white">
                  Fondo de emergencia
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <ResumenCard
                    titulo="Saldo actual"
                    valor={formatearCOP(informe.estadoFondoEmergencia.data.saldo_actual)}
                  />
                  <ResumenCard
                    titulo="Meta"
                    valor={formatearCOP(informe.estadoFondoEmergencia.data.meta)}
                  />
                  <ResumenCard
                    titulo="Progreso"
                    valor={`${Number(informe.estadoFondoEmergencia.data.porcentaje_meta || 0).toFixed(1)}%`}
                  />
                </div>
              </section>
            )}

            {/* Acción PDF */}
            <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 text-center">
              <h2 className="text-xl font-semibold text-amber-400">
                Informe listo
              </h2>

              <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-400">
                El informe contiene el resumen, distribución financiera,
                ahorros, deudas, imprevistos, fondo de emergencia,
                presupuesto y evolución disponibles para el periodo
                seleccionado.
              </p>

              <button
                type="button"
                onClick={descargarPDF}
                disabled={generandoPDF}
                className="mt-5 rounded-xl bg-amber-400 px-6 py-3 font-semibold text-gray-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generandoPDF
                  ? "Generando PDF..."
                  : "Descargar informe completo"}
              </button>
            </section>
          </>
        )}

      </div>
    </div>
  );
}