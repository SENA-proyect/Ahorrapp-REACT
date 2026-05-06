import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'

export default function FormIngreso({ tipoFlujo, subtipo }) {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    monto: '',
    descripcion: '',
    fuente: '',
    fecha_registro: '',
    id_categoria: '',
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
          tipo_flujo: tipoFlujo,
          subtipo_modulo: subtipo,
          datos: {
            monto: Number(form.monto),
            descripcion: form.descripcion || null,
            fuente: form.fuente || null,
            fecha_registro: form.fecha_registro || null,
            id_categoria: form.id_categoria || null,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-xl font-bold text-emerald-700">
        Datos del ingreso
      </h3>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Monto *
        </label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
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
        <label className="block text-sm font-semibold text-slate-700">
          Fuente
        </label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          type="text"
          name="fuente"
          placeholder="Ej: Salario, Freelance..."
          value={form.fuente}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Categoría
        </label>
        <select
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          name="id_categoria"
          value={form.id_categoria}
          onChange={handleChange}
        >
          <option value="">Sin categoría</option>
          {categorias.filter(c => c.activa == 1).map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Descripción
        </label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          type="text"
          name="descripcion"
          placeholder="Descripción opcional"
          value={form.descripcion}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Fecha
        </label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          type="date"
          name="fecha_registro"
          value={form.fecha_registro}
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
        className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : 'Registrar ingreso'}
      </button>
    </form>
  )
}
