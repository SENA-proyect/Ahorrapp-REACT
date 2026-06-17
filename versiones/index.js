import { Navigate, useLocation } from 'react-router-dom'

// ─────────────────────────────────────────────
// Definición de roles del sistema
// ─────────────────────────────────────────────
export const ROLES = {
  USUARIO: 'Usuario',
  ADMINISTRADOR: 'Administrador',
  SUPERUSUARIO: 'Superusuario',
}

// ─────────────────────────────────────────────
// Mapa de permisos por ruta
//
// Rutas públicas:       sin restricción
// Rutas de usuario:     Usuario, Administrador, Superusuario
// Rutas de panel:       Administrador y Superusuario
// Gestión de roles:     Solo Superusuario
// ─────────────────────────────────────────────
export const ROUTE_PERMISSIONS = {
  // ── Públicas (no requieren autenticación) ───
  '/': null,
  '/Login': null,
  '/OlvidarContrasena': null,
  '/VerificacionCorreo': null,

  // ── Requieren login (cualquier rol) ─────────
  '/Dashboard': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/ModuloAhorros': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/ModuloDeudas': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/ModuloImprevistos': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/ModulosCategorias': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/ModulosDependientes': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/ModulosGastos': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/ModulosIngresos': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/PanelDependientes': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/PanelHistorial': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/PanelMovimientos': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/VM_I-Dependientes': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/movimientos/nuevo': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
  '/noticias': [ROLES.USUARIO, ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],

  // ── Solo Administrador y Superusuario ────────
  '/PanelAdmin': [ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],

  // ── PanelUsuarios: ambos pueden verlo,
  //    pero la edición de roles es responsabilidad
  //    del backend (solo Superusuario puede cambiar roles).
  //    A nivel de ruta, ambos acceden; el backend valida la acción.
  '/PanelUsuarios': [ROLES.ADMINISTRADOR, ROLES.SUPERUSUARIO],
}

// ─────────────────────────────────────────────
// Helpers de permisos
// ─────────────────────────────────────────────

/**
 * Verifica si un usuario tiene al menos uno de los roles requeridos.
 * @param {string[]} userRoles   - Roles del usuario autenticado.
 * @param {string[]|null} required - Roles permitidos para la ruta (null = pública).
 * @returns {boolean}
 */
export function hasPermission(userRoles = [], required = null) {
  if (required === null) return true // ruta pública
  if (!userRoles || userRoles.length === 0) return false
  return required.some((role) => userRoles.includes(role))
}

/**
 * Devuelve true si el usuario puede modificar roles de otros usuarios.
 * Solo el Superusuario tiene este permiso.
 * @param {string[]} userRoles
 * @returns {boolean}
 */
export function canManageRoles(userRoles = []) {
  return userRoles.includes(ROLES.SUPERUSUARIO)
}

/**
 * Devuelve true si el usuario tiene acceso a las vistas de Panel.
 * @param {string[]} userRoles
 * @returns {boolean}
 */
export function canAccessAdminPanels(userRoles = []) {
  return (
    userRoles.includes(ROLES.ADMINISTRADOR) ||
    userRoles.includes(ROLES.SUPERUSUARIO)
  )
}

// ─────────────────────────────────────────────
// Componente: ProtectedRoute
//
// Uso en App.jsx:
//   <Route
//     path="/Dashboard"
//     element={
//       <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/Dashboard']}>
//         <Dashboard />
//       </ProtectedRoute>
//     }
//   />
// ─────────────────────────────────────────────

/**
 * Obtiene los roles del usuario desde donde los almacenes
 * (localStorage, contexto, Redux, etc.).
 * Ajusta esta función según tu implementación de autenticación.
 *
 * Se espera que el token/sesión exponga un campo `roles` como array de strings,
 * por ejemplo: ["Usuario"] o ["Administrador", "Superusuario"].
 *
 * @returns {{ isAuthenticated: boolean, roles: string[] }}
 */
function getAuthState() {
  try {
    // ── Ajusta según tu implementación ──────────────────────────────────
    // Opción A: datos guardados en localStorage tras el login
    const raw = localStorage.getItem('auth') // { token, roles: [...] }
    if (!raw) return { isAuthenticated: false, roles: [] }

    const auth = JSON.parse(raw)

    // Acepta tanto un array directo como un objeto con propiedad `roles`
    const roles = Array.isArray(auth.roles) ? auth.roles : []
    const isAuthenticated = Boolean(auth.token) && roles.length > 0

    return { isAuthenticated, roles }
    // ────────────────────────────────────────────────────────────────────
  } catch {
    return { isAuthenticated: false, roles: [] }
  }
}

/**
 * Componente de ruta protegida.
 *
 * @param {Object}        props
 * @param {React.ReactNode} props.children      - Componente de la vista.
 * @param {string[]|null}   props.allowedRoles  - Roles permitidos (null = pública).
 * @param {string}          [props.redirectTo]  - Ruta de redirección si no autenticado.
 * @param {string}          [props.unauthorizedTo] - Ruta si autenticado pero sin permiso.
 */
export function ProtectedRoute({
  children,
  allowedRoles = null,
  redirectTo = '/Login',
  unauthorizedTo = '/Dashboard',
}) {
  const location = useLocation()
  const { isAuthenticated, roles } = getAuthState()

  // Ruta pública: acceso libre
  if (allowedRoles === null) return children

  // No autenticado: redirige al login guardando la URL de origen
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Autenticado pero sin el rol necesario: redirige a su dashboard
  if (!hasPermission(roles, allowedRoles)) {
    return <Navigate to={unauthorizedTo} replace />
  }

  return children
}

// ─────────────────────────────────────────────
// Ejemplo de App.jsx actualizado
// ─────────────────────────────────────────────
//
// import { ProtectedRoute, ROUTE_PERMISSIONS } from './routes/index.js'
//
// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Públicas */}
//         <Route path="/"                  element={<Index />} />
//         <Route path="/Login"             element={<Login />} />
//         <Route path="/OlvidarContrasena" element={<OlvidarContrasena />} />
//         <Route path="/VerificacionCorreo" element={<VerificacionCorreo />} />
//
//         {/* Usuario / Admin / Superusuario */}
//         <Route path="/Dashboard" element={
//           <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/Dashboard']}>
//             <Dashboard />
//           </ProtectedRoute>
//         } />
//         ... (mismo patrón para el resto de rutas de usuario)
//
//         {/* Solo Admin y Superusuario */}
//         <Route path="/PanelAdmin" element={
//           <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/PanelAdmin']}>
//             <PanelAdmin />
//           </ProtectedRoute>
//         } />
//         <Route path="/PanelUsuarios" element={
//           <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/PanelUsuarios']}>
//             <PanelUsuarios />
//           </ProtectedRoute>
//         } />
//       </Routes>
//       <Asistente />
//     </BrowserRouter>
//   )
// }