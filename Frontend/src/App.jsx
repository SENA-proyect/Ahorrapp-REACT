
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import VistaEmail from './components/VistaEmail.jsx'
import VMIDependientes from './components/VM_I-Dependientes.jsx'
import FormMovimiento from './components/movimientos/FormMovimientos.jsx'
import Asistente from './components/Asistente/Asistente';
import Noticias from "./components/Noticias";



function App() {
  return (

    <BrowserRouter>
     <Routes>
      <Route path="/" element={<Index />} />
      {/* <Route path="/Registrar" element={<Registrar />} /> */}
      <Route path="/Login" element={<Login />} />
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
      <Route path="/VistaEmail" element={<VistaEmail />} />
      <Route path='/VM_I-Dependientes' element={<VMIDependientes />} />
      <Route path="/movimientos/nuevo" element={<FormMovimiento />} /> 
      <Route path="/noticias" element={<Noticias />} />

     </Routes>
     <Asistente />
    </BrowserRouter>
  )
}

export default App