import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportarDatos, getHistorialExportaciones, eliminarExportacion } from '../api'
import { useTheme } from '../hooks/useTheme'

const Exportar = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  
  const [formato, setFormato] = useState('csv')
  const [tipo, setTipo] = useState('movimientos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  const tipos = useMemo(
    () => [
      { value: 'gastos', label: 'Gastos' },
      { value: 'ingresos', label: 'Ingresos' },
      { value: 'movimientos', label: 'Movimientos' },
      { value: 'dependientes', label: 'Dependientes' },
    ],
    []
  )

  const handleRegresar = () => navigate(-1)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formato || !tipo) return

    const payload = {
      formato,
      tipo,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    }

    try {
      setLoading(true)
      await exportarDatos(payload, { onError: setError })
      await cargarHistorial()
    } catch (err) {
      setError(err?.message || 'Error al exportar')
    } finally {
      setLoading(false)
    }
  }

  const cargarHistorial = async () => {
    setLoadingHistorial(true)
    try {
      const data = await getHistorialExportaciones()
      setHistorial(data)
    } catch (err) {
      setError(err?.message || 'Error al cargar historial')
    } finally {
      setLoadingHistorial(false)
    }
  }

  const parseDetalles = (detalles) => {
    try {
      return typeof detalles === 'string' ? JSON.parse(detalles) : detalles || {}
    } catch {
      return {}
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta exportación del historial?')) return
    try {
      await eliminarExportacion(id)
      setHistorial((prev) => prev.filter((item) => item.ID_historial !== id))
    } catch (err) {
      setError(err?.message || 'Error al eliminar exportación')
    }
  }

  useEffect(() => {
    cargarHistorial()
  }, [])

  // Gradientes de fondo según tema
  const bgGradient = isDarkMode
    ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
    : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)'

  const cardBg = isDarkMode
    ? 'rgba(30, 40, 60, 0.7)'
    : 'rgba(255, 255, 255, 0.85)'

  const sectionBg = isDarkMode
    ? 'rgba(15, 25, 45, 0.85)'
    : 'rgba(255, 255, 255, 0.6)'

  const historialBg = isDarkMode
    ? 'rgba(10, 20, 40, 0.7)'
    : 'rgba(249, 250, 251, 0.8)'

  const inputBg = isDarkMode
    ? 'rgba(20, 30, 50, 0.8)'
    : 'rgba(255, 255, 255, 0.95)'

  const inputBorder = isDarkMode
    ? '1px solid rgba(255, 255, 255, 0.15)'
    : '1px solid rgba(0, 0, 0, 0.15)'

  return (
    <div
      className="min-h-screen p-5 md:p-10 transition-colors duration-300"
      style={{
        background: bgGradient,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        className="max-w-[980px] mx-auto rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-xl transition-colors duration-300"
        style={{
          background: cardBg,
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: isDarkMode ? '0 12px 48px rgba(0, 0, 0, 0.4)' : '0 12px 48px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* HEADER */}
        <div
          className="flex justify-between items-center mb-8 pb-5"
          style={{ borderBottom: isDarkMode ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(0, 0, 0, 0.1)' }}
        >
          <h1
            className="text-2xl md:text-3xl font-bold m-0"
            style={{
              color: '#FFD700',
              textShadow: isDarkMode ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
            }}
          >
            <span className="mr-2">📊</span> Exportar reporte
          </h1>
          <button
            onClick={handleRegresar}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-white/5 text-gray-200 border border-white/20 hover:bg-white/10'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            ← Regresar
          </button>
        </div>

        <div className="grid gap-8">
          {/* SECCIÓN: CREAR EXPORTACIÓN */}
          <div
            className="p-5 md:p-7 rounded-2xl transition-colors duration-300"
            style={{
              background: sectionBg,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-5" style={{ color: isDarkMode ? '#ffd700' : '#d97706' }}>
              Crear exportación
            </h2>

            <form onSubmit={onSubmit}>
              {/* FORMATO */}
              <div className="mb-6">
                <label
                  className={`block text-sm font-semibold mb-2.5 tracking-wide ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Formato de exportación
                </label>
                <select
                  value={formato}
                  onChange={(e) => setFormato(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg text-[15px] cursor-pointer transition-all focus:outline-none focus:border-amber-400 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ background: inputBg, border: inputBorder }}
                >
                  <option value="json" style={{ background: isDarkMode ? '#1a1a2e' : '#ffffff', color: isDarkMode ? '#fff' : '#000' }}>JSON</option>
                  <option value="csv" style={{ background: isDarkMode ? '#1a1a2e' : '#ffffff', color: isDarkMode ? '#fff' : '#000' }}>CSV</option>
                  <option value="pdf" style={{ background: isDarkMode ? '#1a1a2e' : '#ffffff', color: isDarkMode ? '#fff' : '#000' }}>PDF</option>
                </select>
              </div>

              {/* TIPO */}
              <div className="mb-6">
                <label
                  className={`block text-sm font-semibold mb-2.5 tracking-wide ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Tipo de datos
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg text-[15px] cursor-pointer transition-all focus:outline-none focus:border-amber-400 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ background: inputBg, border: inputBorder }}
                >
                  {tipos.map((t) => (
                    <option
                      key={t.value}
                      value={t.value}
                      style={{ background: isDarkMode ? '#1a1a2e' : '#ffffff', color: isDarkMode ? '#fff' : '#000' }}
                    >
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* FECHAS */}
              <div className="mb-6">
                <label
                  className={`block text-sm font-semibold mb-2.5 tracking-wide ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Rango de fechas
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg text-[15px] transition-all focus:outline-none focus:border-amber-400 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    style={{ background: inputBg, border: inputBorder }}
                  />
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg text-[15px] transition-all focus:outline-none focus:border-amber-400 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    style={{ background: inputBg, border: inputBorder }}
                  />
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm mb-5 ${
                    isDarkMode
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  ⚠️ {error}
                </div>
              )}

              {/* BOTÓN EXPORTAR */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 tracking-wide mt-2.5 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  color: '#1a1a2e',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                }}
              >
                {loading ? '⏳ Exportando...' : '📥 Exportar datos'}
              </button>

              <p
                className={`text-center text-[13px] mt-6 pt-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
                style={{ borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)' }}
              >
                💡 El reporte se descargará automáticamente en el formato seleccionado.
              </p>
            </form>
          </div>

          {/* SECCIÓN: HISTORIAL */}
          <div
            className="p-5 md:p-7 rounded-2xl transition-colors duration-300"
            style={{
              background: sectionBg,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-5" style={{ color: isDarkMode ? '#ffd700' : '#d97706' }}>
              Historial de exportaciones
            </h2>

            <div
              className="p-5 rounded-2xl transition-colors duration-300"
              style={{
                background: historialBg,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              {loadingHistorial ? (
                <p className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Cargando historial...</p>
              ) : historial.length === 0 ? (
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No hay exportaciones registradas aún.</p>
              ) : (
                <div className="overflow-x-auto mb-5">
                  <table className="w-full border-collapse mb-5">
                    <thead>
                      <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)' }}>
                        <th className={`text-left px-2.5 py-3 text-[13px] font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tipo</th>
                        <th className={`text-left px-2.5 py-3 text-[13px] font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Formato</th>
                        <th className={`text-left px-2.5 py-3 text-[13px] font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fecha</th>
                        <th className={`text-left px-2.5 py-3 text-[13px] font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((item) => {
                        const detalles = parseDetalles(item.detalles)
                        return (
                          <tr
                            key={item.ID_historial}
                            style={{ borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.08)' }}
                          >
                            <td className={`px-2.5 py-3 text-sm align-middle ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {detalles.tipo_reporte || item.accion || 'N/A'}
                            </td>
                            <td className={`px-2.5 py-3 text-sm align-middle ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {detalles.formato || '-'}
                            </td>
                            <td className={`px-2.5 py-3 text-sm align-middle ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {new Date(item.fecha).toLocaleString()}
                            </td>
                            <td className="px-2.5 py-3 text-sm align-middle">
                              <button
                                type="button"
                                onClick={() => handleEliminar(item.ID_historial)}
                                className="border-none rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-all bg-red-500 hover:bg-red-600 text-white mr-2"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Exportar