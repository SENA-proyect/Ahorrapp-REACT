import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'
import '../../styles/movimientos.css'

export default function FormIngreso({ tipoFlujo, subtipo }) {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [cargando,   setCargando]   = useState(false)
  const [error,      setError]      = useState(null)

  const [form, setForm] = useState({
    monto:          '',
    descripcion:    '',
    fuente:         '',
    fecha_registro: '',
    id_categoria:   '',
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
            descripcion:    form.descripcion || null,
            fuente:         form.fuente || null,
            fecha_registro: form.fecha_registro || null,
            id_categoria:   form.id_categoria || null,
          },
        }),
      })

      const data = await res.json()

      if (data.ok) {
        navigate('/ModulosIngresos')
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
      <h3 className="form-subtitulo ingresos">Datos del ingreso</h3>

      <div className="form-grupo">
        <label className="form-label">Monto *</label>
        <input
          className="form-input"
          type="number"
          name="monto"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={form.monto}
          onChange={handleChange}
        />
      </div>

      <div className="form-grupo">
        <label className="form-label">Fuente</label>
        <input
          className="form-input"
          type="text"
          name="fuente"
          placeholder="Ej: Salario, Freelance..."
          value={form.fuente}
          onChange={handleChange}
        />
      </div>

      <div className="form-grupo">
        <label className="form-label">Categoría</label>
        <select
          className="form-select"
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

      <div className="form-grupo">
        <label className="form-label">Descripción</label>
        <input
          className="form-input"
          type="text"
          name="descripcion"
          placeholder="Descripción opcional"
          value={form.descripcion}
          onChange={handleChange}
        />
      </div>

      <div className="form-grupo">
        <label className="form-label">Fecha</label>
        <input
          className="form-input"
          type="date"
          name="fecha_registro"
          value={form.fecha_registro}
          onChange={handleChange}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button
        type="submit"
        className="form-btn-submit ingresos"
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : 'Registrar ingreso'}
      </button>
    </form>
  )
}