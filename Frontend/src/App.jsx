
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Index from './components/pages/Index.jsx'
import Login from './components/auth/Login.jsx'
import Dashboard from './components/pages/Dashboard.jsx'
import ModuloAhorros from './components/modulos/ModuloAhorros.jsx'
import ModuloDeudas from './components/modulos/ModuloDeudas.jsx'
import ModuloImprevistos from './components/modulos/ModuloImprevistos.jsx'
import ModulosCategorias from './components/modulos/ModulosCategorias.jsx'
import ModulosDependientes from './components/modulos/ModulosDependientes.jsx'
import ModulosGastos from './components/modulos/ModulosGastos.jsx'
import ModulosIngresos from './components/modulos/ModulosIngresos.jsx'
import OlvidarContrasena from './components/auth/OlvidarContrasena.jsx'
import PanelAdmin from './components/panels/PanelAdmin.jsx'
import PanelDependientes from './components/panels/PanelDependientes.jsx'
import PanelHistorial from './components/panels/PanelHistorial.jsx'
import PanelMovimientos from './components/panels/PanelMovimientos.jsx'
import PanelUsuarios from './components/panels/PanelUsuarios.jsx'
import VerificacionCorreo from './components/auth/VerificacionCorreo.jsx'
import VMIDependientes from './components/vistas/VM_I-Dependientes.jsx'

import Asistente from './components/widgets/Asistente/Asistente'
import Export from './components/widgets/Exportar.jsx'
import Configuracion from './components/pages/Configuracion.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import { useTheme } from './hooks/useTheme'
import Noticias from "./components/pages/Noticias.jsx"
import ModulosPresupuestos from './components/modulos/ModulosPresupuestos.jsx'
import Modalnuevomovimiento from './components/forms/Modalnuevomovimiento.jsx'

function AppContent() {
  const location = useLocation()
  const currentPath = location.pathname.toLowerCase()
  const isAdminPanel = currentPath.startsWith('/panel')
  const showSidebar = !['/', '/login', '/registro'].includes(currentPath) && !isAdminPanel
  const { isDarkMode } = useTheme()

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${showSidebar ? 'text-white' : 'text-slate-950'}`}
    >
      {showSidebar && <Sidebar />}

      <div className={`${showSidebar ? 'pt-16 md:pt-0' : ''}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} caseSensitive={false} />
          <Route path="/registro" element={<Login />} caseSensitive={false} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/ModuloAhorros" element={<ModuloAhorros />} />
          <Route path="/ModuloDeudas" element={<ModuloDeudas />} />
          <Route path="/ModuloImprevistos" element={<ModuloImprevistos />} />
          <Route path="/ModulosCategorias" element={<ModulosCategorias />} />
          <Route path="/ModulosDependientes" element={<ModulosDependientes />} />
          <Route path="/ModulosGastos" element={<ModulosGastos />} />
          <Route path="/ModulosIngresos" element={<ModulosIngresos />} />
          <Route path="/OlvidarContrasena" element={<OlvidarContrasena />} />
          <Route path="/PanelAdmin" element={<PanelAdmin />} />
          <Route path="/PanelDependientes" element={<PanelDependientes />} />
          <Route path="/PanelHistorial" element={<PanelHistorial />} />
          <Route path="/PanelMovimientos" element={<PanelMovimientos />} />
          <Route path="/PanelUsuarios" element={<PanelUsuarios />} />
          <Route path="/VerificacionCorreo" element={<VerificacionCorreo />} />
          <Route path='/VM_I-Dependientes' element={<VMIDependientes />} />
          <Route path="/movimientos/nuevo" element={<Modalnuevomovimiento />} />
          <Route path="/exportar" element={<Export />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/ModulosPresupuestos" element={<ModulosPresupuestos />} />
        </Routes>
      </div>

      {showSidebar && !isAdminPanel && <Asistente />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
