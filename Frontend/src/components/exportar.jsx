import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportarDatos, getHistorialExportaciones, eliminarExportacion } from '../api';

const Exportar = () => {
  const navigate = useNavigate();
  const [formato, setFormato] = useState('csv');
  const [tipo, setTipo] = useState('movimientos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const tipos = useMemo(
    () => [
      { value: 'gastos', label: 'Gastos' },
      { value: 'ingresos', label: 'Ingresos' },
      { value: 'movimientos', label: 'Movimientos' },
      { value: 'dependientes', label: 'Dependientes' },
      // { value: 'ahorros', label: 'Ahorros' },
      // { value: 'deudas', label: 'Deudas' },
      // { value: 'imprevistos', label: 'Imprevistos' },
    ],
    []
  );

  const handleRegresar = () => {
    navigate(-1);
  };

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
      await exportarDatos(payload, {
        onError: setError,
      });
      await cargarHistorial();
    } catch (err) {
      setError(err?.message || 'Error al exportar');
    } finally {
      setLoading(false);
    }
  };

  // Estilos que coinciden con tu dashboard oscuro
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '40px 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    card: {
      maxWidth: '600px',
      margin: '0 auto',
      background: 'rgba(30, 40, 60, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      padding: '40px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '35px',
      paddingBottom: '20px',
      borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
    },
    title: {
      color: '#FFD700',
      fontSize: '28px',
      fontWeight: '700',
      margin: '0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    btnRegresar: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#e0e0e0',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    formGroup: {
      marginBottom: '25px',
    },
    label: {
      display: 'block',
      color: '#e0e0e0',
      fontWeight: '600',
      fontSize: '14px',
      marginBottom: '10px',
      letterSpacing: '0.5px',
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      background: 'rgba(20, 30, 50, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '15px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      background: 'rgba(20, 30, 50, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '15px',
      transition: 'all 0.3s ease',
    },
    fechasContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    btnExportar: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      color: '#1a1a2e',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
      marginTop: '10px',
      letterSpacing: '0.5px',
    },
    error: {
      background: 'rgba(220, 53, 69, 0.2)',
      color: '#ff6b6b',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '20px',
      border: '1px solid rgba(220, 53, 69, 0.3)',
    },
    infoText: {
      textAlign: 'center',
      color: '#a0a0a0',
      fontSize: '13px',
      marginTop: '25px',
      paddingTop: '20px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
    icon: {
      fontSize: '18px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <span style={styles.icon}>📊</span> Exportar reporte
          </h1>
          <button 
            style={styles.btnRegresar} 
            onClick={handleRegresar}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ← Regresar
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Formato de exportación</label>
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value)}
              style={styles.select}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tipo de datos</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={styles.select}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {tipos.map((t) => (
                <option key={t.value} value={t.value} style={{ background: '#1a1a2e', color: '#ffffff' }}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Rango de fechas</label>
            <div style={styles.fechasContainer}>
              <div>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={styles.input}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={styles.input}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnExportar,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
            }}
          >
            {loading ? '⏳ Exportando...' : '📥 Exportar datos'}
          </button>

          <p style={styles.infoText}>
            💡 El reporte se descargará automáticamente en el formato seleccionado.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Exportar;