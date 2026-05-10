import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'

export default function FormAhorro({ tipoFlujo, subtipo }) {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [cargando,   setCargando]   = useState(false)
  const [error,      setError]      = useState(null)


  const [form, setForm] = useState({
    monto:          '',
    descripcion:    '',
    meta:           '',
    fecha_registro: '',
    fecha_meta:     '',
    id_categoria:   '',
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


    if (form.fecha_meta && form.fecha_registro && form.fecha_meta < form.fecha_registro) {
      setError('La fecha meta no puede ser anterior a la fecha de registro')
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
            descripcion:    form.descripcion    || null,
            meta:           form.meta           || null,
            fecha_registro: form.fecha_registro || null,
            fecha_meta:     form.fecha_meta     || null,
            id_categoria:   form.id_categoria   || null,
          },
        }),
      })

      const data = await res.json()


      if (data.ok) {
        navigate('/ModuloAhorros')
      } else {
        setError(data.mensaje)
      }
    } catch (_) {
      setError('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-xl font-bold text-sky-700">Datos del ahorro</h3>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Monto *</label>
        <input
          className={inputCls}
          type="number"
          name="monto"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={form.monto}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Meta u objetivo</label>
        <input
          className={inputCls}
          type="text"
          name="meta"
          placeholder="Ej: Vacaciones, Fondo de emergencia..."
          value={form.meta}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Categoría</label>
        <select
          className={inputCls}
          name="id_categoria"
          value={form.id_categoria}
          onChange={handleChange}
        >
          <option value="">Sin categoría</option>
          {categorias.filter(c => c.activa == 1).map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Descripción</label>
        <input
          className={inputCls}
          type="text"
          name="descripcion"
          placeholder="Descripción opcional"
          value={form.descripcion}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Fecha de registro</label>
        <input
          className={inputCls}
          type="date"
          name="fecha_registro"
          value={form.fecha_registro}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Fecha meta</label>
        <input
          className={inputCls}
          type="date"
          name="fecha_meta"
          value={form.fecha_meta}
          onChange={handleChange}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : 'Registrar ahorro'}
      </button>
    </form>
  )
}
