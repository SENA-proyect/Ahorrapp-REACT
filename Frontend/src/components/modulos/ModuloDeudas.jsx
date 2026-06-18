import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { abonarDeuda, getCategorias } from '../../api'
import ModalNuevoMovimiento from '../forms/Modalnuevomovimiento'
import HeaderModulos from '../layout/HeaderModulos'
import { useTheme } from '../../hooks/useTheme'
const fmt = (n) => `$${Number(n).toLocaleString('es-CO')}`
const costoPorCuota = (monto, ct) => ct ? Number(monto) / Number(ct) : Number(monto)
const montoPendiente = (monto, cp, ct) => ct ? costoPorCuota(monto, ct) * (Number(ct) - Number(cp)) : Number(monto)

const BadgeEstado = ({ estado, isDarkMode }) => (
  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
    estado === 'pagada'
      ? isDarkMode
        ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : isDarkMode
        ? 'bg-blue-400/15 text-blue-400 border-blue-400/30'
        : 'bg-blue-50 text-blue-700 border-blue-200'
  }`}>
    {estado === 'pagada' ? '✓ Pagada' : '⏳ Pendiente'}
  </span>
)

const BadgeVencimiento = ({ fecha_fin, isDarkMode }) => {
  if (!fecha_fin) return null
  const hoy = new Date()
  const fin = new Date(fecha_fin)
  const vencida = fin < hoy
  const diffDays = Math.ceil(Math.abs((fin - hoy) / (1000 * 60 * 60 * 24)))
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
      vencida
        ? isDarkMode
          ? 'bg-red-400/20 text-red-400'
          : 'bg-red-50 text-red-600'
        : isDarkMode
          ? 'bg-amber-400/15 text-amber-400'
          : 'bg-amber-50 text-amber-600'
    }`}>
      {vencida ? `Vencida ${diffDays}d` : `${diffDays}d restantes`}
    </span>
  )
}

const BarraCuotas = ({ pagadas, total, isDarkMode }) => {
  if (!total) return null
  const pct = Math.min(100, (Number(pagadas) / Number(total)) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full max-w-[100px] overflow-hidden rounded-full bg-gray-300/30">
        <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-bold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{pagadas}/{total}</span>
    </div>
  )
}

import deudasImg from '../../assets/Deudas.png' // ✅ Asegúrate de guardar la imagen aquí

const API = '/api/movimientos'

export default function ModuloDeudas() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode } = useTheme()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const [deudas, setDeudas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [modalAbonar, setModalAbonar] = useState(null)
  const [cuotasAbono, setCuotasAbono] = useState(1)
  const [abonando, setAbonando] = useState(false)
  const [verPagadas, setVerPagadas] = useState(false)
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false)

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

  const total = deudas.reduce((acc, d) => acc + Number(d.monto), 0)
  const pendientes = deudas.filter(d => d.estado === 'pendiente')
  const pagadas = deudas.filter(d => d.estado === 'pagada')

  const abrirEditar = (d) => {
    setErrorModal(null)
    setModalEditar({
      id: d.id, monto: String(d.monto), fuente: d.fuente || '',
      id_categoria: d.ID_categoria || '', descripcion: d.descripcion || '',
      estado: d.estado || 'pendiente',
      cuotas_pagadas: String(d.cuotas_pagadas ?? 0),
      cuotas_total: d.cuotas_total ? String(d.cuotas_total) : '',
      fecha_inicio: d.fecha_inicio ? d.fecha_inicio.slice(0, 10) : '',
      fecha_fin: d.fecha_fin ? d.fecha_fin.slice(0, 10) : '',
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
    const cuotasTotal = modalEditar.cuotas_total ? Number(modalEditar.cuotas_total) : null
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

  const formatFecha = fecha => fecha ? new Date(fecha).toLocaleDateString('es-CO') : '—'

  const abrirAbonar = (d) => {
    setErrorModal(null)
    setCuotasAbono(1)
    setModalAbonar(d)
  }

  const hacerAbono = async () => {
    if (cuotasAbono < 1) return setErrorModal('Las cuotas deben ser >= 1')
    setAbonando(true)
    try {
      const data = await abonarDeuda(modalAbonar.id, cuotasAbono)
      if (data.ok) { setModalAbonar(null); cargarDeudas() }
      else setErrorModal(data.mensaje || 'Error al abonar')
    } catch { setErrorModal('Error al conectar con el servidor') }
    finally { setAbonando(false) }
  }

  // Estilos reutilizables
  const inputModal = `mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-white/15 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-400/60 focus:ring-violet-400/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:ring-violet-200'
  }`

  const labelModal = `mt-4 block text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
  }`

  const badgePending = isDarkMode
    ? 'bg-blue-400/15 text-blue-400 border-blue-400/30'
    : 'bg-blue-50 text-blue-700 border-blue-200'

  const badgePaid = isDarkMode
    ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${
      isDarkMode ? 'text-white' : 'text-slate-900'
    }`}>
      <HeaderModulos section="Deudas" />
      <hr className="my-1 h-px border-0 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:gap-6 md:p-8">
        {/* BIENVENIDA */}
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
            Bienvenido de vuelta
          </p>
          <h2
            className={`break-words text-xl font-extrabold sm:text-2xl ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {usuario?.nombre || 'Usuario'} <span></span>
          </h2>
        </div>

        {/* HERO DEUDAS */}
        <article
          className={`grid gap-6 overflow-hidden rounded-[2rem] border px-5 py-6 shadow-2xl transition-colors duration-300 sm:grid-cols-[1.7fr_1.3fr] sm:px-6 sm:py-7 ${
            isDarkMode
              ? 'border-violet-400/20 bg-[#242f40] shadow-violet-300/10'
              : 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-100 shadow-violet-200'
          }`}
        >
          <div className="flex flex-col justify-between gap-6">
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  isDarkMode ? 'bg-violet-400/15 text-violet-300' : 'bg-violet-100 text-violet-700'
                }`}
              >
                Deudas hoy
              </span>
              <h3
                className={`mt-4 text-3xl font-extrabold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Tu espacio para gestionar deudas
              </h3>
              <p className={`mt-3 max-w-xl text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                Visualiza tus compromisos financieros y planifica tus pagos. Este panel te ayuda a
                liberar poco a poco el peso de tus obligaciones.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`rounded-3xl border px-4 py-4 ${
                  isDarkMode ? 'border-violet-300/20 bg-[#1f2b3e]/80' : 'border-gray-200 bg-white'
                }`}
              >
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-violet-200' : 'text-gray-500'}`}>
                  Total deuda
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  ${total.toLocaleString('es-CO')}
                </p>
              </div>
              <div
                className={`rounded-3xl border px-4 py-4 ${
                  isDarkMode ? 'border-violet-500/20 bg-violet-400/10' : 'border-violet-200 bg-violet-50'
                }`}
              >
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-violet-200' : 'text-violet-600'}`}>
                  Pendientes
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  {pendientes.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNuevoMovimiento(true)}
              className="inline-flex w-full max-w-[240px] items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-violet-400 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-px hover:shadow-xl sm:w-auto"
            >
              ➕ Registrar deuda nueva
            </button>
          </div>

          <div
            className={`relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-[2rem] p-4 ${
              isDarkMode ? 'bg-[#242f40]' : 'bg-violet-100/70'
            }`}
          >
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-transparent via-[#7c3aed]/10 to-transparent'
                  : 'bg-gradient-to-br from-transparent via-white/50 to-transparent'
              }`}
            />
            <img
              src={deudasImg}
              alt="Ilustración de deudas"
              className="relative max-h-[320px] w-full object-contain"
            />
          </div>
        </article>

        {/* SECCIÓN DE DEUDAS */}
        <section
          className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
            isDarkMode ? 'border-violet-300/15 bg-[#242f40]/90' : 'border-gray-200 bg-white/80'
          }`}
        >
          {/* HEADER DE LA SECCIÓN */}
          <div
            className={`flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 transition-colors ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-violet-300' : 'text-violet-700'}`}>
               Módulo de Deudas
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {deudas.length} registro{deudas.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* CONTENIDO */}
          <div className="p-4 sm:p-5">
            {cargando ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              </div>
            ) : deudas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-4xl"></span>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  ¡Felicidades! No tienes deudas registradas.
                </p>
                <button
                  onClick={() => setShowNuevoMovimiento(true)}
                  className="mt-2 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 px-5 py-2 text-xs font-bold text-white transition-all hover:-translate-y-px hover:shadow-lg"
                >
                  ➕ Registrar primera deuda
                </button>
              </div>
            ) : (
              <>
                {/* VISTA MÓVIL */}
                <div className="grid gap-3 md:hidden">
                  {deudas.map(d => (
                    <article
                      key={d.id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        isDarkMode ? 'border-white/10 bg-white/[0.05]' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                            }`}
                          >
                            {d.fuente || '—'}
                          </p>
                          <h4
                            className={`mt-1 break-words text-sm font-bold ${
                              isDarkMode ? 'text-zinc-100' : 'text-gray-900'
                            }`}
                          >
                            {d.categoria || 'Sin categoría'}
                          </h4>
                          <p
                            className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}
                          >
                            {d.descripcion || 'Sin descripción'} • Cuotas: {d.cuotas_total ? `${d.cuotas_pagadas}/${d.cuotas_total}` : 'Pago único'}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${d.estado === 'pagada' ? badgePaid : badgePending}`}>
                              {d.estado === 'pagada' ? '✓ Pagada' : '⏳ Pendiente'}
                            </span>
                          </div>
                        </div>
                        <p
                          className={`shrink-0 text-right text-base font-black ${
                            isDarkMode ? 'text-violet-400' : 'text-violet-600'
                          }`}
                        >
                          ${Number(d.monto).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => abrirEditar(d)}
                          className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            isDarkMode
                              ? 'border-violet-400/50 bg-violet-400/10 text-violet-400 hover:bg-violet-400/20'
                              : 'border-violet-500 bg-violet-50 text-violet-700 hover:bg-violet-100'
                          }`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => abrirAbonar(d)}
                          className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            isDarkMode
                              ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                              : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          Abonar
                        </button>
                        <button
                          onClick={() => setConfirmarId(d.id)}
                          className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            isDarkMode
                              ? 'border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20'
                              : 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* VISTA ESCRITORIO */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1100px] border-collapse text-left">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        {['Fuente', 'Categoría', 'Descripción', 'Cuotas', 'Fecha fin', 'Estado', 'Monto', 'Acciones'].map(
                          col => (
                            <th
                              key={col}
                              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                                isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                              }`}
                            >
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {deudas.map(d => (
                        <tr
                          key={d.id}
                          className={`border-b transition-colors ${
                            isDarkMode
                              ? 'border-white/5 hover:bg-white/[0.04]'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {d.fuente || '—'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {d.categoria || '—'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {d.descripcion || '—'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {d.cuotas_total ? `${d.cuotas_pagadas}/${d.cuotas_total}` : 'Pago único'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {formatFecha(d.fecha_fin)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${d.estado === 'pagada' ? badgePaid : badgePending}`}>
                              {d.estado === 'pagada' ? '✓ Pagada' : '⏳ Pendiente'}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-extrabold ${
                              isDarkMode ? 'text-violet-400' : 'text-violet-600'
                            }`}
                          >
                            ${Number(d.monto).toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirEditar(d)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-violet-400/50 bg-violet-400/10 text-violet-400 hover:bg-violet-400/20'
                                    : 'border-violet-500 bg-violet-50 text-violet-700 hover:bg-violet-100'
                                }`}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => abrirAbonar(d)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                                    : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                Abonar
                              </button>
                              <button
                                onClick={() => setConfirmarId(d.id)}
                                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isDarkMode
                                    ? 'border-red-400/50 bg-red-400/10 text-red-400 hover:bg-red-400/20'
                                    : 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>

        {/* DEUDAS PAGADAS (COLLAPSIBLE) */}
        {pagadas.length > 0 && (
          <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
            isDarkMode ? 'border-emerald-400/15 bg-[#242f40]/90' : 'border-emerald-200 bg-white/80'
          }`}>
            <button
              onClick={() => setVerPagadas(!verPagadas)}
              className={`flex w-full items-center justify-between px-5 py-4 text-left sm:px-7 sm:py-5 transition-colors ${
                isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
              }`}
            >
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                ✓ Deudas Pagadas ({pagadas.length})
              </h3>
              <span className={`transition-transform duration-300 ${verPagadas ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {verPagadas && (
              <div className={`border-t px-5 py-4 sm:px-7 sm:py-5 transition-colors ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
                <div className="grid gap-3">
                  {pagadas.map(d => (
                    <div key={d.id} className={`flex items-center justify-between rounded-xl border p-4 ${
                      isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{d.fuente || '—'}</p>
                        <p className={`mt-1 text-sm font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{d.categoria || 'Sin categoría'}</p>
                        <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                          ${Number(d.monto).toLocaleString('es-CO')} • {d.cuotas_total ? `${d.cuotas_pagadas}/${d.cuotas_total} cuotas` : 'Pago único'}
                        </p>
                      </div>
                      <BadgeEstado estado={d.estado} isDarkMode={isDarkMode} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer
        className={`w-full px-4 py-6 text-center font-mono text-[0.7rem] ${
          isDarkMode ? 'text-zinc-600' : 'text-gray-500'
        }`}
      >
        <p>
          © <strong className="text-violet-400">2026 Ahorrapp</strong>. Todos los derechos reservados.
        </p>
      </footer>

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div
            className={`w-full max-w-[480px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
              isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-gray-200 bg-white'
            }`}
          >
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
              ✏️ Editar Deuda
            </h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              Modifica los campos que necesites y guarda.
            </p>

            <label className={labelModal}>Fuente *</label>
            <input
              className={inputModal}
              type="text"
              name="fuente"
              placeholder="Ej: Banco, Tarjeta..."
              value={modalEditar.fuente}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Categoría</label>
            <select
              className={inputModal}
              name="id_categoria"
              value={modalEditar.id_categoria || ''}
              onChange={handleEditarChange}
            >
              <option value="">Sin categoría</option>
              {categorias.filter(c => c.activa == 1).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            <label className={labelModal}>Monto *</label>
            <input
              className={inputModal}
              type="number"
              name="monto"
              min="0"
              step="0.01"
              value={modalEditar.monto}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Descripción</label>
            <input
              className={inputModal}
              type="text"
              name="descripcion"
              placeholder="Descripción opcional"
              value={modalEditar.descripcion}
              onChange={handleEditarChange}
            />

            <label className={labelModal}>Estado</label>
            <select
              className={inputModal}
              name="estado"
              value={modalEditar.estado}
              onChange={handleEditarChange}
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
            </select>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className={labelModal}>Cuotas pagadas</label>
                <input
                  className={inputModal}
                  type="number"
                  name="cuotas_pagadas"
                  min="0"
                  step="1"
                  value={modalEditar.cuotas_pagadas}
                  onChange={handleEditarChange}
                />
              </div>
              <div className="flex-1">
                <label className={labelModal}>Total cuotas</label>
                <input
                  className={inputModal}
                  type="number"
                  name="cuotas_total"
                  min="1"
                  step="1"
                  placeholder="Si aplica"
                  value={modalEditar.cuotas_total}
                  onChange={handleEditarChange}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className={labelModal}>Fecha de inicio</label>
                <input
                  className={inputModal}
                  type="date"
                  name="fecha_inicio"
                  value={modalEditar.fecha_inicio}
                  onChange={handleEditarChange}
                />
              </div>
              <div className="flex-1">
                <label className={labelModal}>Fecha de fin</label>
                <input
                  className={inputModal}
                  type="date"
                  name="fecha_fin"
                  value={modalEditar.fecha_fin}
                  onChange={handleEditarChange}
                />
              </div>
            </div>

            {errorModal && (
              <p
                className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  isDarkMode
                    ? 'border-red-400/40 bg-red-400/10 text-red-400'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}
              >
                {errorModal}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setModalEditar(null)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10'
                    : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmarId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div
            className={`w-full max-w-[380px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
              isDarkMode ? 'border-red-400/30 bg-slate-950/95' : 'border-red-200 bg-white'
            }`}
          >
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              🗑️ ¿Eliminar deuda?
            </h4>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setConfirmarId(null)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10'
                    : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="rounded-xl bg-gradient-to-br from-red-400 to-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNuevoMovimiento && (
        <ModalNuevoMovimiento subtipo="Deuda" onCerrar={() => setShowNuevoMovimiento(false)} onGuardado={() => cargarDeudas()} />
      )}

      {/* MODAL ABONAR */}
      {modalAbonar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[440px] rounded-2xl border p-6 shadow-2xl sm:p-7 transition-colors ${
            isDarkMode ? 'border-violet-400/30 bg-slate-950/95' : 'border-violet-200 bg-white'
          }`}>
            <h4 className={`text-lg font-extrabold ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
              💰 Abonar a deuda
            </h4>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              ¿Cuántas cuotas deseas pagar?
            </p>

            <div className={`mt-6 rounded-xl border p-4 ${
              isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'
            }`}>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
                {modalAbonar.fuente}
              </p>
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                {modalAbonar.categoria || 'Sin categoría'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Total:</span>
                <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {fmt(modalAbonar.monto)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Cuota:</span>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                  {fmt(costoPorCuota(modalAbonar.monto, modalAbonar.cuotas_total))}
                </span>
              </div>
              {modalAbonar.cuotas_total && (
                <div className="mt-3">
                  <BarraCuotas pagadas={modalAbonar.cuotas_pagadas} total={modalAbonar.cuotas_total} isDarkMode={isDarkMode} />
                </div>
              )}
            </div>

            <label className={labelModal}>Cuotas a abonar</label>
            <input
              className={inputModal}
              type="number"
              min="1"
              max={modalAbonar.cuotas_total ? Number(modalAbonar.cuotas_total) - Number(modalAbonar.cuotas_pagadas) : undefined}
              value={cuotasAbono}
              onChange={e => setCuotasAbono(Math.max(1, Number(e.target.value)))}
            />
            {modalAbonar.cuotas_total && (
              <p className={`mt-2 text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Pendiente: {fmt(montoPendiente(modalAbonar.monto, modalAbonar.cuotas_pagadas, modalAbonar.cuotas_total))} (
                {Number(modalAbonar.cuotas_total) - Number(modalAbonar.cuotas_pagadas)} cuotas restantes)
              </p>
            )}

            {errorModal && (
              <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                isDarkMode
                  ? 'border-red-400/40 bg-red-400/10 text-red-400'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}>
                {errorModal}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setModalAbonar(null)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-transparent text-zinc-400 hover:bg-white/10'
                    : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={hacerAbono}
                disabled={abonando}
                className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {abonando ? 'Abonando...' : `Abonar ${cuotasAbono} cuota${cuotasAbono !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}