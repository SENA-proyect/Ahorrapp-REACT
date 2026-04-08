import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'

export default function FormDeuda({ tipoFlujo, subtipo }) {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [cargando,   setCargando]   = useState(false)
  const [error,      setError]      = useState(null)

  const [form, setForm] = useState({
    monto:         '',
    fuente:        '',
    descripcion:   '',
    cuotas_total:  '',
    fecha_inicio:  '',
    fecha_fin:     '',
    id_categoria:  '',
  })

  useEffect(() => {
    getCategorias()
      .then(data => { if (Array.isArray(data)) setCategorias(data) })
      .catch(() => {})
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) {
      setError('El monto debe ser un número mayor a 0')
      return
    }

    if (!form.fuente.trim()) {
      setError('La fuente de la deuda es obligatoria')
      return
    }

    if (form.fecha_fin && form.fecha_inicio && form.fecha_fin < form.fecha_inicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio')
      return
    }

    if (form.cuotas_total && (isNaN(form.cuotas_total) || Number(form.cuotas_total) <= 0)) {
      setError('El número de cuotas debe ser mayor a 0')
      return
    }

    setCargando(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3000/api/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo_flujo:     tipoFlujo,
          subtipo_modulo: subtipo,
          datos: {
            monto:        Number(form.monto),
            fuente:       form.fuente.trim(),
            descripcion:  form.descripcion || null,
            cuotas_total: form.cuotas_total ? Number(form.cuotas_total) : null,
            fecha_inicio: form.fecha_inicio || null,
            fecha_fin:    form.fecha_fin || null,
            id_categoria: form.id_categoria || null,
          },
        }),
      })

      const data = await res.json()

      if (data.ok) {
        navigate('/ModuloDeudas')
      } else {
        setError(data.mensaje)
      }
    } catch (_) {
      setError('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={styles.subtitulo}>Datos de la deuda</h3>

      {/* Monto */}
      <div style={styles.grupo}>
        <label style={styles.label}>Monto *</label>
        <input
          style={styles.input}
          type="number"
          name="monto"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={form.monto}
          onChange={handleChange}
        />
      </div>

      {/* Fuente */}
      <div style={styles.grupo}>
        <label style={styles.label}>Fuente *</label>
        <input
          style={styles.input}
          type="text"
          name="fuente"
          placeholder="Ej: Banco, Tarjeta de crédito..."
          value={form.fuente}
          onChange={handleChange}
        />
      </div>

      {/* Categoría */}
      <div style={styles.grupo}>
        <label style={styles.label}>Categoría</label>
        <select
          style={styles.input}
          name="id_categoria"
          value={form.id_categoria}
          onChange={handleChange}
        >
          <option value="">Sin categoría</option>
          {categorias.filter(c => c.activa).map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </div>

      {/* Cuotas */}
      <div style={styles.grupo}>
        <label style={styles.label}>Número de cuotas</label>
        <input
          style={styles.input}
          type="number"
          name="cuotas_total"
          placeholder="Dejar vacío si es pago único"
          min="1"
          step="1"
          value={form.cuotas_total}
          onChange={handleChange}
        />
      </div>

      {/* Fecha inicio */}
      <div style={styles.grupo}>
        <label style={styles.label}>Fecha de inicio</label>
        <input
          style={styles.input}
          type="date"
          name="fecha_inicio"
          value={form.fecha_inicio}
          onChange={handleChange}
        />
      </div>

      {/* Fecha fin */}
      <div style={styles.grupo}>
        <label style={styles.label}>Fecha de fin</label>
        <input
          style={styles.input}
          type="date"
          name="fecha_fin"
          value={form.fecha_fin}
          onChange={handleChange}
        />
      </div>

      {/* Descripción */}
      <div style={styles.grupo}>
        <label style={styles.label}>Descripción</label>
        <input
          style={styles.input}
          type="text"
          name="descripcion"
          placeholder="Descripción opcional"
          value={form.descripcion}
          onChange={handleChange}
        />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        type="submit"
        style={styles.btnSubmit}
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : 'Registrar deuda'}
      </button>
    </form>
  )
}

const styles = {
  subtitulo: {
    fontSize: '1rem',
    fontWeight: 'var(--font-bold)',
    color: 'var(--deudas-dark)',
    marginBottom: '20px',
  },
  grupo: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-background)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    color: 'var(--destructive)',
    fontSize: 'var(--text-sm)',
    marginBottom: '12px',
  },
  btnSubmit: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--deudas-base)',
    color: '#fff',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    cursor: 'pointer',
  },
}