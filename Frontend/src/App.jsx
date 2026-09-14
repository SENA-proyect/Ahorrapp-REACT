import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import { ProtectedRoute } from './components/ProtectedRoute';



// ====================================================
// Páginas públicas
// ====================================================
import ConfirmacionCambioContrasena from './pages/ConfirmacionCambioContrasena.jsx'
import Index from './pages/Index.jsx';
import Login from './pages/Login.jsx';
import OlvidarContrasena from './pages/OlvidarContrasena.jsx';
import VerificacionCorreo from './pages/VerificacionCorreo.jsx';
import IngresoNuevaContrasena from './pages/IngresoNuevaContrasena.jsx';

// ====================================================
// Páginas protegidas (requieren sesión)
// ====================================================
import Dashboard from './pages/Dashboard.jsx';
import IndexLogeado from './pages/IndexLogeado.jsx'
import ModuloAhorros from './pages/ModuloAhorros.jsx';
import ModuloDeudas from './pages/ModuloDeudas.jsx';
import ModuloImprevistos from './pages/ModuloImprevistos.jsx';
import ModuloFondoEmergencia from './pages/Modulofondoemergencia.jsx';
import ModulosCategorias from './pages/ModulosCategorias.jsx';
import ModulosDependientes from './pages/ModulosDependientes.jsx';
import ModulosGastos from './pages/ModulosGastos.jsx';
import ModulosIngresos from './pages/ModulosIngresos.jsx';
import Asistente from './components/Asistente/Asistente';
import Noticias from './pages/Noticias.jsx';
// import Export from "./pages/exportar.jsx"
import ModulosPresupuestos from './pages/ModulosPresupuestos.jsx'
import Configuracion from './pages/Configuracion.jsx'
import Reportes from './pages/reportes.jsx'

// ______________________________________________________________________________________________________________________________________________________________________
// ruta del archivo corregida debido a actualizacion de la logica al registrar un movimiento para los modulos financieros
// import FormMovimiento from './components/movimientos/FormMovimientos.jsx';
import Modalnuevomovimiento from './components/Modalnuevomovimiento';
// ______________________________________________________________________________________________________________________________________________________________________


// ====================================================
// Páginas de ADMIN (requieren admin o superuser)
// ====================================================
import PanelAdmin from './pages/PanelAdmin.jsx';
import PanelDependientes from './pages/PanelDependientes.jsx';
import PanelHistorial from './pages/PanelHistorial.jsx';
import PanelMovimientos from './pages/PanelMovimientos.jsx';
import PanelUsuarios from './pages/PanelUsuarios.jsx';

// Página de acceso denegado
import Unauthorized from './pages/Unauthorized.jsx';

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
      <ToastProvider>
        <NotificacionesProvider>
          <BrowserRouter>
            <Routes>
          {/* ========== RUTAS PÚBLICAS (sin sesión) ========== */}
          <Route path="/" element={<Index />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/OlvidarContrasena" element={<OlvidarContrasena />} />
          <Route path="/VerificacionCorreo" element={<VerificacionCorreo />} />
          <Route path="/ConfirmacionCambioContrasena" element={<ConfirmacionCambioContrasena />} />
          <Route path="/IngresoNuevaContrasena" element={<IngresoNuevaContrasena />} />
          


          
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
            path="/IndexLogeado" 
            element={
              <ProtectedRoute>
                <IndexLogeado />
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
            path="/ModuloFondoEmergencia"
            element={
              <ProtectedRoute>
                <ModuloFondoEmergencia />
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
            path="/Reportes"
            element={
              <ProtectedRoute>
                <Reportes />
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

          {/* <Route 
            path="/exportar" 
            element={
              <ProtectedRoute>
                <Export />
              </ProtectedRoute>
            } 
          /> */}

          <Route
            path="/ModulosPresupuestos"
            element={
              <ProtectedRoute>
                <ModulosPresupuestos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Configuracion"
            element={
              <ProtectedRoute>
                <Configuracion />
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
        </NotificacionesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;