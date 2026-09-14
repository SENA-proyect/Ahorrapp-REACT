import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { actualizarMiPerfil, cambiarMiPassword, desactivarCuentaPropia } from '../services/api'

const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const limpiarTextoNombre = (valor) => valor.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, '')

export default function MiCuenta() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  // ── Editar perfil ──────────────────────────────────────────
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [apellido, setApellido] = useState(user?.apellido || '')
  const [email, setEmail] = useState(user?.email || '')
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState('')
  const [exitoPerfil, setExitoPerfil] = useState('')

  const handleGuardarPerfil = async (e) => {
    e.preventDefault()
    setErrorPerfil('')
    setExitoPerfil('')

    if (!nombre || !apellido || !email) {
      setErrorPerfil('Completa todos los campos')
      return
    }
    if (!NOMBRE_REGEX.test(nombre.trim()) || !NOMBRE_REGEX.test(apellido.trim())) {
      setErrorPerfil('El nombre y el apellido solo pueden contener letras')
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorPerfil('Ingresa un correo electrónico válido')
      return
    }

    setGuardandoPerfil(true)
    try {
      await actualizarMiPerfil({ Nombre: nombre, Apellido: apellido, Email: email })
      login({ ...user, nombre, apellido, email })
      setExitoPerfil('Tus datos se actualizaron correctamente')
    } catch (err) {
      setErrorPerfil(err.message || 'Error al actualizar tus datos')
    } finally {
      setGuardandoPerfil(false)
    }
  }

  // ── Cambiar contraseña ─────────────────────────────────────
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [errorPassword, setErrorPassword] = useState('')
  const [exitoPassword, setExitoPassword] = useState('')

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    setErrorPassword('')
    setExitoPassword('')

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      setErrorPassword('Completa todos los campos')
      return
    }
    if (passwordNueva.length < 8) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (passwordNueva !== passwordConfirmar) {
      setErrorPassword('Las contraseñas nuevas no coinciden')
      return
    }

    setGuardandoPassword(true)
    try {
      await cambiarMiPassword(passwordActual, passwordNueva)
      setExitoPassword('Contraseña actualizada correctamente')
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmar('')
    } catch (err) {
      setErrorPassword(err.message || 'Error al cambiar la contraseña')
    } finally {
      setGuardandoPassword(false)
    }
  }

  // ── Desactivar cuenta ──────────────────────────────────────
  const [desactivando, setDesactivando] = useState(false)
  const [errorDesactivar, setErrorDesactivar] = useState('')

  const handleDesactivar = async () => {
    const confirmado = window.confirm(
      'Tu cuenta quedará desactivada de inmediato y se eliminará de forma PERMANENTE en 30 días si no la reactivas antes (contactando soporte "proyectofinanzassena@gmail.com"). ¿Deseas continuar?'
    )
    if (!confirmado) return

    setDesactivando(true)
    setErrorDesactivar('')
    try {
      const data = await desactivarCuentaPropia()
      alert(data.mensaje || 'Tu cuenta ha sido desactivada')
      logout()
      navigate('/Login')
    } catch (err) {
      setErrorDesactivar(err.message || 'Error al desactivar la cuenta')
      setDesactivando(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Editar datos personales */}
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Mis datos</h3>
        <p className="text-sm text-zinc-400 mb-4">Actualiza tu información personal.</p>

        {errorPerfil && (
          <div className="mb-3 rounded-lg border border-red-900/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
            {errorPerfil}
          </div>
        )}
        {exitoPerfil && (
          <div className="mb-3 rounded-lg border border-emerald-900/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
            {exitoPerfil}
          </div>
        )}

        <form onSubmit={handleGuardarPerfil} className="flex flex-col gap-3 max-w-md">
          <div>
            <label className="block mb-1 text-xs font-semibold text-zinc-400">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(limpiarTextoNombre(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/[0.05] border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-zinc-400">Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(limpiarTextoNombre(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/[0.05] border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-zinc-400">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/[0.05] border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={guardandoPerfil}
            className="self-start mt-1 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm rounded-lg px-4 py-2 transition-colors duration-200 disabled:opacity-60"
          >
            {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <hr className="border-white/10" />

      {/* Cambiar contraseña */}
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Cambiar contraseña</h3>
        <p className="text-sm text-zinc-400 mb-4">Debes confirmar tu contraseña actual.</p>

        {errorPassword && (
          <div className="mb-3 rounded-lg border border-red-900/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
            {errorPassword}
          </div>
        )}
        {exitoPassword && (
          <div className="mb-3 rounded-lg border border-emerald-900/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
            {exitoPassword}
          </div>
        )}

        <form onSubmit={handleCambiarPassword} className="flex flex-col gap-3 max-w-md">
          <div>
            <label className="block mb-1 text-xs font-semibold text-zinc-400">Contraseña actual</label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/[0.05] border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-zinc-400">Nueva contraseña</label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/[0.05] border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-zinc-400">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/[0.05] border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={guardandoPassword}
            className="self-start mt-1 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm rounded-lg px-4 py-2 transition-colors duration-200 disabled:opacity-60"
          >
            {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      <hr className="border-white/10" />

      {/* Desactivar cuenta */}
      <div>
        <h3 className="text-lg font-bold text-red-300 mb-1">Desactivar mi cuenta</h3>
        <p className="text-sm text-zinc-400 mb-4 max-w-md">
          Tu cuenta dejará de estar disponible de inmediato. Si no la reactivas antes,
          será <strong className="text-red-300">eliminada de forma permanente en 30 días</strong>,
          junto con toda la información asociada a ella.
        </p>

        {errorDesactivar && (
          <div className="mb-3 rounded-lg border border-red-900/40 bg-red-900/20 px-3 py-2 text-sm text-red-300 max-w-md">
            {errorDesactivar}
          </div>
        )}

        <button
          onClick={handleDesactivar}
          disabled={desactivando}
          className="border border-red-900/50 text-red-300 hover:bg-red-900/20 font-semibold text-sm rounded-lg px-4 py-2 transition-colors duration-200 disabled:opacity-60"
        >
          {desactivando ? 'Procesando...' : 'Desactivar mi cuenta'}
        </button>
      </div>
    </div>
  )
}