import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportarDatos, getHistorialExportaciones, eliminarExportacion } from '../services/api';

const Exportar = () => {
  const navigate = useNavigate();
  const [formato, setFormato] = useState('csv');
  const [tipo, setTipo] = useState('movimientos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  const tipos = useMemo(
    () => [
      { value: 'gastos', label: 'Gastos' },
      { value: 'ingresos', label: 'Ingresos' },
      { value: 'movimientos', label: 'Movimientos' },
      { value: 'dependientes', label: 'Dependientes' },
    ],
    []
  );

  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const data = await getHistorialExportaciones();
      setHistorial(Array.isArray(data) ? data : (data?.historial ?? []));
    } catch (err) {
      console.error('Error al cargar historial de exportaciones:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleRegresar = () => navigate(-1);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formato || !tipo) return;

    const payload = {
      formato,
      tipo,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    };

    try {
      setLoading(true);
      await exportarDatos(payload, { onError: setError });
      await cargarHistorial();
    } catch (err) {
      setError(err?.message || 'Error al exportar');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarExportacion(id);
      setHistorial((prev) => prev.filter((h) => h.id_historial !== id));
    } catch (err) {
      setError(err?.message || 'Error al eliminar la exportación');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400">📊 Exportar reporte</h1>
          <button
            type="button"
            onClick={handleRegresar}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
          >
            ← Regresar
          </button>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">Formato de exportación</label>
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-amber-400"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">Tipo de datos</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-amber-400"
            >
              {tipos.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">Rango de fechas (opcional)</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-amber-400"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 px-5 py-3 font-semibold text-gray-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '⏳ Exportando...' : '📥 Exportar datos'}
          </button>

          <p className="text-center text-xs text-gray-500">
            💡 El reporte se descargará automáticamente en el formato seleccionado.
          </p>
        </form>

        {/* Historial de exportaciones */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Historial de exportaciones</h2>

          {loadingHistorial ? (
            <p className="text-sm text-gray-400">Cargando historial...</p>
          ) : historial.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no has generado ninguna exportación.</p>
          ) : (
            <div className="space-y-3">
              {historial.map((h) => (
                <div
                  key={h.id_historial}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">{h.accion}</p>
                    <p className="text-xs text-gray-500">
                      {h.detalles || 'Sin detalles'} ·{' '}
                      {h.fecha ? new Date(h.fecha).toLocaleString('es-CO') : 'N/A'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminar(h.id_historial)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Exportar;
