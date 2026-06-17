import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import { ProtectedRoute, ROUTE_PERMISSIONS } from './components/routes/index.js'

import Index from './components/Index.jsx'
import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'
import ModuloAhorros from './components/ModuloAhorros.jsx'
import ModuloDeudas from './components/ModuloDeudas.jsx'
import ModuloImprevistos from './components/ModuloImprevistos.jsx'
import ModulosCategorias from './components/ModulosCategorias.jsx'
import ModulosDependientes from './components/ModulosDependientes.jsx'
import ModulosGastos from './components/ModulosGastos.jsx'
import ModulosIngresos from './components/ModulosIngresos.jsx'
import OlvidarContrasena from './components/OlvidarContrasena.jsx'
import PanelAdmin from './components/PanelAdmin.jsx'
import PanelDependientes from './components/PanelDependientes.jsx'
import PanelHistorial from './components/PanelHistorial.jsx'
import PanelMovimientos from './components/PanelMovimientos.jsx'
import PanelUsuarios from './components/PanelUsuarios.jsx'
import VerificacionCorreo from './components/VerificacionCorreo.jsx'
import VMIDependientes from './components/VM_I-Dependientes.jsx'
import FormMovimiento from './components/movimientos/FormMovimientos.jsx'
import Asistente from './components/Asistente/Asistente'
import Noticias from './components/Noticias'

const P = ROUTE_PERMISSIONS // alias para mantener las rutas más legibles

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Públicas ─────────────────────────────────────────────────── */}
        <Route path="/"                   element={<Index />} />
        <Route path="/Login"              element={<Login />} />
        <Route path="/OlvidarContrasena"  element={<OlvidarContrasena />} />
        <Route path="/VerificacionCorreo" element={<VerificacionCorreo />} />

        {/* ── Usuario / Administrador / Superusuario ───────────────────── */}
        <Route path="/Dashboard" element={
          <ProtectedRoute allowedRoles={P['/Dashboard']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/ModuloAhorros" element={
          <ProtectedRoute allowedRoles={P['/ModuloAhorros']}>
            <ModuloAhorros />
          </ProtectedRoute>
        } />

        <Route path="/ModuloDeudas" element={
          <ProtectedRoute allowedRoles={P['/ModuloDeudas']}>
            <ModuloDeudas />
          </ProtectedRoute>
        } />

        <Route path="/ModuloImprevistos" element={
          <ProtectedRoute allowedRoles={P['/ModuloImprevistos']}>
            <ModuloImprevistos />
          </ProtectedRoute>
        } />

        <Route path="/ModulosCategorias" element={
          <ProtectedRoute allowedRoles={P['/ModulosCategorias']}>
            <ModulosCategorias />
          </ProtectedRoute>
        } />

        <Route path="/ModulosDependientes" element={
          <ProtectedRoute allowedRoles={P['/ModulosDependientes']}>
            <ModulosDependientes />
          </ProtectedRoute>
        } />

        <Route path="/ModulosGastos" element={
          <ProtectedRoute allowedRoles={P['/ModulosGastos']}>
            <ModulosGastos />
          </ProtectedRoute>
        } />

        <Route path="/ModulosIngresos" element={
          <ProtectedRoute allowedRoles={P['/ModulosIngresos']}>
            <ModulosIngresos />
          </ProtectedRoute>
        } />

        <Route path="/VM_I-Dependientes" element={
          <ProtectedRoute allowedRoles={P['/VM_I-Dependientes']}>
            <VMIDependientes />
          </ProtectedRoute>
        } />

        <Route path="/movimientos/nuevo" element={
          <ProtectedRoute allowedRoles={P['/movimientos/nuevo']}>
            <FormMovimiento />
          </ProtectedRoute>
        } />

        <Route path="/noticias" element={
          <ProtectedRoute allowedRoles={P['/noticias']}>
            <Noticias />
          </ProtectedRoute>
        } />

        {/* ── Solo Administrador y Superusuario ────────────────────────── */}
        <Route path="/PanelAdmin" element={
          <ProtectedRoute allowedRoles={P['/PanelAdmin']}>
            <PanelAdmin />
          </ProtectedRoute>
        } />

                <Route path="/PanelDependientes" element={
          <ProtectedRoute allowedRoles={P['/PanelDependientes']}>
            <PanelDependientes />
          </ProtectedRoute>
        } />

        <Route path="/PanelHistorial" element={
          <ProtectedRoute allowedRoles={P['/PanelHistorial']}>
            <PanelHistorial />
          </ProtectedRoute>
        } />

        <Route path="/PanelMovimientos" element={
          <ProtectedRoute allowedRoles={P['/PanelMovimientos']}>
            <PanelMovimientos />
          </ProtectedRoute>
        } />

        {/*
          PanelUsuarios: Administrador y Superusuario pueden entrar.
          La restricción de editar roles (solo Superusuario) se maneja:
            - En el frontend: con canManageRoles() para ocultar/deshabilitar el botón
            - En el backend:  con middleware de Express que valida el rol antes de ejecutar
        */}
        <Route path="/PanelUsuarios" element={
          <ProtectedRoute allowedRoles={P['/PanelUsuarios']}>
            <PanelUsuarios />
          </ProtectedRoute>
        } />

      </Routes>
      <Asistente />
    </BrowserRouter>
  )
}

export default App