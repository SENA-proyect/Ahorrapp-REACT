import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategorias } from '../api'
import HeaderModulos from './HeaderModulos'

const API = 'http://localhost:3000/api/movimientos'
const usuario = JSON.parse(localStorage.getItem('usuario'))

const Deudas = () => {
  const navigate = useNavigate()

  const [deudas,      setDeudas]      = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [errorModal,  setErrorModal]  = useState(null)
  const [categorias,  setCategorias]  = useState([])

  const cargarDeudas = () => {
    setCargando(true)
    const token = localStorage.getItem('token')
    fetch(`${API}/deudas`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDeudas(data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getCategorias().then(data => { if (Array.isArray(data)) setCategorias(data) }).catch(() => {})
  }, [])

  useEffect(() => { cargarDeudas() }, [])

  const total      = deudas.reduce((acc, d) => acc + Number(d.monto), 0)
  const pendientes = deudas.filter(d => d.estado === 'pendiente')

  const abrirEditar = (d) => {
    setErrorModal(null)
    setModalEditar({
      id: d.id, monto: String(d.monto), fuente: d.fuente || '',
      id_categoria: d.ID_categoria || '', descripcion: d.descripcion || '',
      estado: d.estado || 'pendiente',
      cuotas_pagadas: String(d.cuotas_pagadas ?? 0),
      cuotas_total: d.cuotas_total ? String(d.cuotas_total) : '',
      fecha_inicio: d.fecha_inicio ? d.fecha_inicio.slice(0, 10) : '',
      fecha_fin:    d.fecha_fin    ? d.fecha_fin.slice(0, 10)    : '',
    })
  }

  const handleEditarChange = (e) =>
    setModalEditar(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const guardarEdicion = async () => {
    setErrorModal(null)
    if (!modalEditar.monto || isNaN(modalEditar.monto) || Number(modalEditar.monto) <= 0) {
      setErrorModal('El monto debe ser un número mayor a 0'); return
    }
    if (!modalEditar.fuente.trim()) { setErrorModal('La fuente de la deuda es obligatoria'); return }
    if (modalEditar.fecha_fin && modalEditar.fecha_inicio && modalEditar.fecha_fin < modalEditar.fecha_inicio) {
      setErrorModal('La fecha de fin no puede ser anterior a la de inicio'); return
    }
    const cuotasPagadas = Number(modalEditar.cuotas_pagadas)
    const cuotasTotal   = modalEditar.cuotas_total ? Number(modalEditar.cuotas_total) : null
    if (cuotasTotal !== null && cuotasPagadas > cuotasTotal) {
      setErrorModal('Las cuotas pagadas no pueden superar el total'); return
    }
    setGuardando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/deudas/${modalEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto: Number(modalEditar.monto), fuente: modalEditar.fuente.trim(),
          id_categoria: modalEditar.id_categoria || null, descripcion: modalEditar.descripcion || null,
          estado: modalEditar.estado, cuotas_pagadas: cuotasPagadas, cuotas_total: cuotasTotal,
          fecha_inicio: modalEditar.fecha_inicio || null, fecha_fin: modalEditar.fecha_fin || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { setModalEditar(null); cargarDeudas() }
      else setErrorModal(data.mensaje || 'Error al guardar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setGuardando(false) }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/deudas/${confirmarId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setConfirmarId(null); cargarDeudas() }
    } catch { }
    finally { setEliminando(false) }
  }

  // Clases reutilizables para inputs y labels del modal
  const inputModal = "w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/[0.07] text-[#f4f4f5] text-sm outline-none mt-1.5"
  const labelModal = "block text-[0.72rem] font-bold text-[#a1a1aa] uppercase tracking-widest mt-3.5"

  return (
    <div className="min-h-screen w-full flex flex-col text-white overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }}>

      {/* HEADER */}
      <HeaderModulos section="Deudas" />

      <hr className="my-1 border-none h-px"
        style={{ background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      {/* MAIN */}
      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto px-8 py-8 gap-6">

        {/* Bienvenida */}
        <div>
          <p className="text-[#a1a1aa] text-sm">Bienvenido de vuelta</p>
          <h2 className="text-2xl font-extrabold text-white">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </div>

        {/* Stat card */}
        <article className="flex items-center justify-between flex-wrap gap-4 px-8 py-6 rounded-2xl border border-white/10"
          style={{ background: 'radial-gradient(ellipse at left, rgba(168,85,247,0.35), rgba(147,51,234,0.04))' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c084fc] mb-1">
              💳 Total Deuda Acumulada
            </p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-white">${total.toLocaleString('es-CO')}</p>
              {pendientes.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-400/15 text-blue-400 border border-blue-400/30 font-bold">
                  {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/movimientos/nuevo')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none text-white hover:-translate-y-px transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #c084fc, #a855f7)' }}>
            ➕ Nueva Deuda
          </button>
        </article>

        {/* Tabla */}
        <section className="w-full rounded-2xl border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>

          {/* Tabla header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.08]">
            <h3 className="text-base font-extrabold text-[#fbbf24]">📋 Módulo de Deudas</h3>
            <span className="text-xs text-zinc-600">
              {deudas.length} registro{deudas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto px-2 pb-4">
            {cargando ? (
              <p className="text-zinc-500 italic px-5 py-6 text-sm">⏳ Cargando...</p>
            ) : deudas.length === 0 ? (
              <p className="text-zinc-500 italic px-5 py-6 text-sm">
                ¡Felicidades! No tienes deudas pendientes registradas.
              </p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    {['Fuente', 'Categoría', 'Descripción', 'Cuotas', 'Fecha fin', 'Estado', 'Monto', 'Acciones'].map(col => (
                      <th key={col} className="px-4 py-3 text-[0.72rem] font-bold text-zinc-500 uppercase tracking-widest">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deudas.map(d => (
                    <tr key={d.id}
                      className="border-b border-white/[0.05] transition-colors duration-150 hover:bg-white/[0.04]">
                      <td className="px-4 py-3 text-sm text-zinc-300">{d.fuente || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{d.categoria || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{d.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {d.cuotas_total ? `${d.cuotas_pagadas}/${d.cuotas_total}` : 'Pago único'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {d.fecha_fin ? new Date(d.fecha_fin).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {d.estado === 'pagada' ? (
                          <span className="px-2.5 py-1 rounded-full text-[0.72rem] font-bold bg-emerald-400/15 text-emerald-400 border border-emerald-400/35">
                            ✓ Pagada
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[0.72rem] font-bold bg-blue-400/15 text-blue-400 border border-blue-400/35">
                            ⏳ Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[0.9rem] font-extrabold text-[#c084fc]">
                        ${Number(d.monto).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEditar(d)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-purple-400/50 bg-purple-400/10 text-[#c084fc] hover:bg-purple-400/[0.22] transition-colors duration-150">
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmarId(d.id)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-red-400/50 bg-red-400/10 text-[#f87171] hover:bg-red-400/[0.22] transition-colors duration-150">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-6 text-center text-zinc-700 text-[0.7rem] font-mono">
        <p>© <strong className="text-[#fbbf24]">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-[480px] rounded-[20px] p-7 border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.92)' }}>

            <h4 className="text-lg font-extrabold text-[#fbbf24] mb-1">✏️ Editar Deuda</h4>
            <p className="text-xs text-zinc-500 mb-2">Modifica los campos que necesites y guarda.</p>

            <label className={labelModal}>Fuente *</label>
            <input className={inputModal} type="text" name="fuente" placeholder="Ej: Banco, Tarjeta..." value={modalEditar.fuente} onChange={handleEditarChange} />

            <label className={labelModal}>Categoría</label>
            <select className={inputModal} name="id_categoria" value={modalEditar.id_categoria || ''} onChange={handleEditarChange}>
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>

            <label className={labelModal}>Monto *</label>
            <input className={inputModal} type="number" name="monto" min="0" step="0.01" value={modalEditar.monto} onChange={handleEditarChange} />

            <label className={labelModal}>Descripción</label>
            <input className={inputModal} type="text" name="descripcion" placeholder="Descripción opcional" value={modalEditar.descripcion} onChange={handleEditarChange} />

            <label className={labelModal}>Estado</label>
            <select className={inputModal} name="estado" value={modalEditar.estado} onChange={handleEditarChange}>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
            </select>

            <label className={labelModal}>Cuotas pagadas</label>
            <input className={inputModal} type="number" name="cuotas_pagadas" min="0" step="1" value={modalEditar.cuotas_pagadas} onChange={handleEditarChange} />

            <label className={labelModal}>Total de cuotas</label>
            <input className={inputModal} type="number" name="cuotas_total" min="1" step="1" placeholder="Vacío si es pago único" value={modalEditar.cuotas_total} onChange={handleEditarChange} />

            <label className={labelModal}>Fecha de inicio</label>
            <input className={inputModal} type="date" name="fecha_inicio" value={modalEditar.fecha_inicio} onChange={handleEditarChange} />

            <label className={labelModal}>Fecha de fin</label>
            <input className={inputModal} type="date" name="fecha_fin" value={modalEditar.fecha_fin} onChange={handleEditarChange} />

            {errorModal && (
              <p className="mt-3 px-3.5 py-2.5 rounded-xl bg-red-400/[0.12] border border-red-400/35 text-[#f87171] text-[0.8rem] font-semibold">
                {errorModal}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setModalEditar(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer bg-transparent text-[#a1a1aa] border border-white/15 hover:bg-white/[0.07] transition-colors duration-150">
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white border-none transition-all duration-150"
                style={{
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  background: guardando ? 'rgba(192,132,252,0.4)' : 'linear-gradient(135deg, #c084fc, #a855f7)',
                }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-[380px] rounded-[20px] p-7 border border-red-400/25 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            style={{ background: 'rgba(15,23,42,0.92)' }}>

            <h4 className="text-lg font-extrabold text-[#f87171] mb-2">🗑️ ¿Eliminar deuda?</h4>
            <p className="text-sm text-[#a1a1aa]">Esta acción no se puede deshacer.</p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmarId(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer bg-transparent text-[#a1a1aa] border border-white/15 hover:bg-white/[0.07] transition-colors duration-150">
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white border-none transition-all duration-150"
                style={{
                  cursor: eliminando ? 'not-allowed' : 'pointer',
                  background: eliminando ? 'rgba(248,113,113,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)',
                }}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Deudas