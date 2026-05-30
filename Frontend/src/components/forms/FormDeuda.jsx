import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../../api'

export default function FormDeuda({ tipoFlujo, subtipo }) {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [cargando,   setCargando]   = useState(false)
  const [error,      setError]      = useState(null)

  const [form, setForm] = useState({
    monto:        '',
    fuente:       '',
    descripcion:  '',
    cuotas_total: '',
    fecha_inicio: '',
    fecha_fin:    '',
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
      const res = await fetch('/api/movimientos', {
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
            descripcion:  form.descripcion  || null,
            cuotas_total: form.cuotas_total ? Number(form.cuotas_total) : null,
            fecha_inicio: form.fecha_inicio || null,
            fecha_fin:    form.fecha_fin    || null,
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

  const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-xl font-bold text-rose-700">Datos de la deuda</h3>

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
        <label className="block text-sm font-semibold text-slate-700">Fuente *</label>
        <input
          className={inputCls}
          type="text"
          name="fuente"
          placeholder="Ej: Banco, Tarjeta de crédito..."
          value={form.fuente}
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
        <label className="block text-sm font-semibold text-slate-700">Número de cuotas</label>
        <input
          className={inputCls}
          type="number"
          name="cuotas_total"
          placeholder="Dejar vacío si es pago único"
          min="1"
          step="1"
          value={form.cuotas_total}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Fecha de inicio</label>
        <input
          className={inputCls}
          type="date"
          name="fecha_inicio"
          value={form.fecha_inicio}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Fecha de fin</label>
        <input
          className={inputCls}
          type="date"
          name="fecha_fin"
          value={form.fecha_fin}
          onChange={handleChange}
        />
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

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : 'Registrar deuda'}
      </button>
    </form>
  )
}