import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';



// ====================================================
// Componentes públicos
// ====================================================
import Index from './components/Index.jsx';
import Login from './components/Login.jsx';
import OlvidarContrasena from './components/OlvidarContrasena.jsx';
import VerificacionCorreo from './components/VerificacionCorreo.jsx';

// ====================================================
// Componentes protegidos (requieren sesión)
// ====================================================
import Dashboard from './components/Dashboard.jsx';
import ModuloAhorros from './components/ModuloAhorros.jsx';
import ModuloDeudas from './components/ModuloDeudas.jsx';
import ModuloImprevistos from './components/ModuloImprevistos.jsx';
import ModulosCategorias from './components/ModulosCategorias.jsx';
import ModulosDependientes from './components/ModulosDependientes.jsx';
import ModulosGastos from './components/ModulosGastos.jsx';
import ModulosIngresos from './components/ModulosIngresos.jsx';
import VMIDependientes from './components/VM_I-Dependientes.jsx';
import Asistente from './components/Asistente/Asistente';
import Noticias from './components/Noticias';
import Export from "./components/exportar.jsx"
import ModulosPresupuestos from './components/ModulosPresupuestos.jsx'

// ______________________________________________________________________________________________________________________________________________________________________
// ruta del archivo corregida debido a actualizacion de la logica al registrar un movimiento para los modulos financieros
// import FormMovimiento from './components/movimientos/FormMovimientos.jsx';
import Modalnuevomovimiento from './components/Modalnuevomovimiento.jsx';
// ______________________________________________________________________________________________________________________________________________________________________


// ====================================================
// Componentes de ADMIN (requieren admin o superuser)
// ====================================================
import PanelAdmin from './components/PanelAdmin.jsx';
import PanelDependientes from './components/PanelDependientes.jsx';
import PanelHistorial from './components/PanelHistorial.jsx';
import PanelMovimientos from './components/PanelMovimientos.jsx';
import PanelUsuarios from './components/PanelUsuarios.jsx';

// Componente para acceso denegado
import Unauthorized from './components/Unauthorized.jsx';

// Muestra el Asistente solo si hay sesión activa, sin redirigir nunca la URL
function AsistenteFlotante() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return null;

  return <Asistente />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ========== RUTAS PÚBLICAS (sin sesión) ========== */}
          <Route path="/" element={<Index />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/OlvidarContrasena" element={<OlvidarContrasena />} />
          <Route path="/VerificacionCorreo" element={<VerificacionCorreo />} />
          
          {/* ========== RUTA DE ACCESO DENEGADO ========== */}
          <Route path="/Unauthorized" element={<Unauthorized />} />

          {/* ========== RUTAS PROTEGIDAS (requieren sesión) ========== */}
          <Route 
            path="/Dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ModuloAhorros" 
            element={
              <ProtectedRoute>
                <ModuloAhorros />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ModuloDeudas" 
            element={
              <ProtectedRoute>
                <ModuloDeudas />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ModuloImprevistos" 
            element={
              <ProtectedRoute>
                <ModuloImprevistos />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ModulosCategorias" 
            element={
              <ProtectedRoute>
                <ModulosCategorias />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ModulosDependientes" 
            element={
              <ProtectedRoute>
                <ModulosDependientes />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ModulosGastos" 
            element={
              <ProtectedRoute>
                <ModulosGastos />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ModulosIngresos" 
            element={
              <ProtectedRoute>
                <ModulosIngresos />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/VM_I-Dependientes" 
            element={
              <ProtectedRoute>
                <VMIDependientes />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/noticias" 
            element={
              <ProtectedRoute>
                <Noticias />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/exportar" 
            element={
              <ProtectedRoute>
                <Export />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/ModulosPresupuestos"
            element={
              <ProtectedRoute>
                <ModulosPresupuestos />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/movimientos/nuevo" 
            element={
              <ProtectedRoute>
                <Modalnuevomovimiento />
              </ProtectedRoute>
            } 
          />
          

          {/* ========== RUTAS DE ADMIN (requieren admin o superuser) ========== */}
          <Route 
            path="/PanelAdmin" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'superuser']}>
                <PanelAdmin />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/PanelDependientes" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'superuser']}>
                <PanelDependientes />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/PanelHistorial" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'superuser']}>
                <PanelHistorial />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/PanelMovimientos" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'superuser']}>
                <PanelMovimientos />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/PanelUsuarios" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'superuser']}>
                <PanelUsuarios />
              </ProtectedRoute>
            } 
          />

          {/* ========== REDIRECCIÓN ========== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Asistente visible en todas las páginas (solo si hay sesión) */}
        <AsistenteFlotante />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;