import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'
import '../../styles/movimientos.css'

export default function FormGasto({ tipoFlujo, subtipo }) {
  const navigate = useNavigate()
  const [categorias,   setCategorias]   = useState([])
  const [dependientes, setDependientes] = useState([])
  const [cargando,     setCargando]     = useState(false)
  const [error,        setError]        = useState(null)

  const [form, setForm] = useState({
    monto:          '',
    descripcion:    '',
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
            descripcion:    form.descripcion || null,
            fecha_registro: form.fecha_registro || null,
            id_categoria:   form.id_categoria || null,
            id_dependiente: form.id_dependiente || null,
          },
        }),
      })

      const data = await res.json()

      if (data.ok) {
        navigate('/ModulosGastos')
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
      <h3 className="form-subtitulo gastos">Datos del gasto</h3>

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
        <label className="form-label">Dependiente</label>
        <select
          className="form-select"
          name="id_dependiente"
          value={form.id_dependiente}
          onChange={handleChange}
        >
          <option value="">Ninguno (gasto propio)</option>
          {dependientes.map(dep => (
            <option key={dep.id} value={dep.id}>{dep.nombre}</option>
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
        className="form-btn-submit gastos"
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : 'Registrar gasto'}
      </button>
    </form>
  )
}