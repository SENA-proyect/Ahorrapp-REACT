
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Index from './components/Index.jsx'
import Login from './components/Login.jsx'
// import Registrar from './components/Registrar.jsx'
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
// import VistaEmail from './components/VistaEmail.jsx'
import VMIDependientes from './components/VM_I-Dependientes.jsx'
import FormMovimiento from './components/movimientos/FormMovimientos.jsx'
import Asistente from './components/Asistente/Asistente'
import Export from './components/exportar.jsx'
import Configuracion from './components/Configuracion.jsx'
import Sidebar from './components/Sidebar.jsx'
import { useTheme } from './hooks/useTheme'



function AppContent() {
  const location = useLocation()
  const currentPath = location.pathname.toLowerCase()
  const showSidebar = !['/', '/login', '/registro'].includes(currentPath)
  const { isDarkMode } = useTheme()

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${showSidebar ? 'text-white' : 'text-slate-950'}`}
      style={showSidebar ? {
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      } : undefined}
    >
      {showSidebar && <Sidebar />}

      <div className={`${showSidebar ? 'pt-16 md:pt-0' : ''}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* <Route path="/Registrar" element={<Registrar />} /> */}
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
          {/* <Route path="/VistaEmail" element={<VistaEmail />} /> */}
          <Route path='/VM_I-Dependientes' element={<VMIDependientes />} />
          <Route path="/movimientos/nuevo" element={<FormMovimiento />} />
          <Route path="/exportar" element={<Export />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </div>

      {showSidebar && <Asistente />}
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