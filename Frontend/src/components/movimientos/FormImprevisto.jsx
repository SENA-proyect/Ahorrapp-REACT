import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'

export default function FormImprevisto({ tipoFlujo, subtipo }) {
  const navigate = useNavigate()
  const [categorias,   setCategorias]   = useState([])
  const [dependientes, setDependientes] = useState([])
  const [cargando,     setCargando]     = useState(false)
  const [error,        setError]        = useState(null)

  const [form, setForm] = useState({
    monto:          '',
    causa:          '',
    fecha_registro: '',
    id_categoria:   '',
    id_dependiente: '',
  })

  useEffect(() => {
    getCategorias()
      .then(data => { if (Array.isArray(data)) setCategorias(data) })
      .catch(() => {})

    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/dependientes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setDependientes(data) })
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
            monto:          Number(form.monto),
            causa:          form.causa || null,
            fecha_registro: form.fecha_registro || null,
            id_categoria:   form.id_categoria || null,
            id_dependiente: form.id_dependiente || null,
          },
        }),
      })

      const data = await res.json()

      if (data.ok) {
        navigate('/ModuloImprevistos')
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
      <h3 style={styles.subtitulo}>Datos del imprevisto</h3>

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

      {/* Causa */}
      <div style={styles.grupo}>
        <label style={styles.label}>Causa</label>
        <input
          style={styles.input}
          type="text"
          name="causa"
          placeholder="Ej: Reparación, Emergencia médica..."
          value={form.causa}
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

      {/* Dependiente */}
      <div style={styles.grupo}>
        <label style={styles.label}>Dependiente</label>
        <select
          style={styles.input}
          name="id_dependiente"
          value={form.id_dependiente}
          onChange={handleChange}
        >
          <option value="">Ninguno (imprevisto propio)</option>
          {dependientes.map(dep => (
            <option key={dep.id} value={dep.id}>{dep.nombre}</option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div style={styles.grupo}>
        <label style={styles.label}>Fecha</label>
        <input
          style={styles.input}
          type="date"
          name="fecha_registro"
          value={form.fecha_registro}
          onChange={handleChange}
        />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        type="submit"
        style={styles.btnSubmit}
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : 'Registrar imprevisto'}
      </button>
    </form>
  )
}

const styles = {
  subtitulo: {
    fontSize: '1rem',
    fontWeight: 'var(--font-bold)',
    color: 'var(--imprevistos-dark)',
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
    background: 'var(--imprevistos-base)',
    color: '#fff',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    cursor: 'pointer',
  },
}