import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

export default function Configuracion() {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('cuenta');

  // Mocks de datos del usuario
  const [user, setUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('usuario');
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed || { nombre: 'Usuario', email: 'correo@ejemplo.com' };
    } catch {
      return { nombre: 'Usuario', email: 'correo@ejemplo.com' };
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Estados para modal de contraseña
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState(null); // { tipo, texto }
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Estados para foto de perfil
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef(null);

  const [formData, setFormData] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    email: user.Email || user.email || '',
    idioma: 'es',
    formatoFecha: 'DD/MM/AAAA',
    alertasActivas: true,
    moneda: 'COP',
    presupuestoMensual: 1000000,
    alertaGastos: true,
    recordatorioPresupuesto: true,
    notificacionMetas: true,
    correoResumen: true
  });

  useEffect(() => {
    const fetchConfiguracion = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('http://localhost:3000/api/configuraciones', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.ok && data.datos) {
          setFormData({
            nombre: data.datos.nombre || '',
            apellido: data.datos.apellido || '',
            email: data.datos.email || '',
            idioma: data.datos.idioma || 'es',
            formatoFecha: data.datos.formatoFecha || 'DD/MM/AAAA',
            alertasActivas: data.datos.alertasActivas ?? true,
            moneda: data.datos.moneda || 'COP',
            presupuestoMensual: data.datos.presupuestoMensual || 1000000,
            alertaGastos: data.datos.alertaGastos ?? true,
            recordatorioPresupuesto: data.datos.recordatorioPresupuesto ?? true,
            notificacionMetas: data.datos.notificacionMetas ?? true,
            correoResumen: data.datos.correoResumen ?? true
          });

          // Cargar foto de perfil si existe en la BD
          if (data.datos.fotoUrl) {
            const fullUrl = `http://localhost:3000${data.datos.fotoUrl}`;
            setPhotoPreview(fullUrl);
          }
          
          // Actualizar localStorage parcial si cambió el nombre/email
          const currentUser = JSON.parse(localStorage.getItem('usuario') || '{}');
          localStorage.setItem('usuario', JSON.stringify({
            ...currentUser,
            Nombre: data.datos.nombre,
            Apellido: data.datos.apellido,
            Email: data.datos.email,
            foto: data.datos.fotoUrl || currentUser.foto
          }));
        }
      } catch (error) {
        console.error('Error fetching configuracion:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfiguracion();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      setMensaje({ tipo: 'info', texto: 'Guardando...' });

      const res = await fetch('http://localhost:3000/api/configuraciones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setMensaje({ tipo: 'success', texto: 'Configuración guardada correctamente.' });
        setTimeout(() => setMensaje(null), 3000);
        
        // Sincronizar el localstorage también
        const currentUser = JSON.parse(localStorage.getItem('usuario') || '{}');
        localStorage.setItem('usuario', JSON.stringify({
          ...currentUser,
          nombre: formData.nombre,
          Nombre: formData.nombre,
          Apellido: formData.apellido,
          Email: formData.email
        }));
        // Notificar a otros componentes que el usuario cambió
        window.dispatchEvent(new Event('usuario-updated'));
      } else {
        setMensaje({ tipo: 'error', texto: data.mensaje || 'Error al guardar.' });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    
    setIsSubmittingPassword(true);
    setPasswordStatus(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (data.ok) {
        setPasswordStatus({ tipo: 'success', texto: data.mensaje });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordStatus(null);
        }, 2000);
      } else {
        setPasswordStatus({ tipo: 'error', texto: data.mensaje || 'Error al cambiar contraseña' });
      }
    } catch (error) {
      setPasswordStatus({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handlePasswordFormChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona una imagen válida.' });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La imagen no puede superar 5MB.' });
      return;
    }

    // Crear preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result);
    };
    reader.readAsDataURL(file);

    // Subir foto al servidor
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    try {
      setIsUploadingPhoto(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMensaje({ tipo: 'error', texto: 'No hay sesión activa.' });
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append('photo', file);

      const res = await fetch('http://localhost:3000/api/configuraciones/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const data = await res.json();

      if (data.ok) {
        // Actualizar preview con la URL completa del backend
        const fullUrl = `http://localhost:3000${data.fotoUrl}`;
        setPhotoPreview(fullUrl);

        setMensaje({ tipo: 'success', texto: 'Foto de perfil actualizada correctamente.' });
        setTimeout(() => setMensaje(null), 3000);

        // Actualizar localStorage con la nueva foto
        const currentUser = JSON.parse(localStorage.getItem('usuario') || '{}');
        localStorage.setItem('usuario', JSON.stringify({
          ...currentUser,
          foto: data.fotoUrl || currentUser.foto
        }));
        // Notificar a otros componentes (como el Sidebar) que el usuario cambió
        window.dispatchEvent(new Event('usuario-updated'));
      } else {
        setMensaje({ tipo: 'error', texto: data.mensaje || 'Error al subir la foto.' });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error de conexión al subir la foto.' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const tabs = [
    { id: 'cuenta', label: 'Cuenta', icon: <UserIcon /> },
    { id: 'preferencias', label: 'Preferencias', icon: <CogIcon /> },
    { id: 'financiera', label: 'Config. Financiera', icon: <BanknotesIcon /> },
    { id: 'datos', label: 'Exportación y Datos', icon: <DocumentArrowDownIcon /> },
    { id: 'notificaciones', label: 'Notificaciones', icon: <BellIcon /> },
    { id: 'informacion', label: 'Información', icon: <InformationCircleIcon /> }
  ];

  const inputClass = `w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
    isDarkMode 
      ? 'bg-slate-900 border-white/10 text-white focus:border-transparent placeholder-slate-500' 
      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-transparent placeholder-gray-400'
  }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`;

  const cardClass = `rounded-3xl p-6 md:p-8 shadow-xl border backdrop-blur-sm transition-colors duration-300 ${
    isDarkMode 
      ? 'bg-slate-950/60 border-white/10 shadow-black/40' 
      : 'bg-white/90 border-gray-100 shadow-gray-200/60'
  }`;

  return (
    <div className={`min-h-screen p-6 md:p-10 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
            Configuración
          </h1>
          <p className={`mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Administra tus preferencias, seguridad y datos de cuenta
          </p>
        </motion.div>

        {/* Tabs horizontales estilo Dashboard */}
        <div className="mb-8 flex flex-wrap gap-3 pb-4 border-b border-current border-opacity-10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? isDarkMode
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-green-100 text-green-700 border border-green-200'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="w-5 h-5">{tab.icon}</div>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido Principal en Cards */}
        <AnimatePresence mode="wait">
          {activeTab === 'cuenta' && (
            <motion.div
              key="cuenta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Card de Perfil */}
              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">Perfil</h3>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <img 
                      src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nombre)}&background=10b981&color=fff&size=120`} 
                      alt="Perfil" 
                      className="w-32 h-32 rounded-full border-4 border-green-500/30 object-cover"
                    />
                    <button 
                      onClick={handlePhotoClick}
                      disabled={isUploadingPhoto}
                      className="absolute bottom-0 right-0 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      <CameraIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    aria-label="Seleccionar foto de perfil"
                  />
                  <div className="text-center">
                    <h4 className="font-bold text-lg">{formData.nombre} {formData.apellido}</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{formData.email}</p>
                    {isUploadingPhoto && <p className="text-xs text-green-500 mt-2">Cargando foto...</p>}
                  </div>
                </div>
              </div>

              {/* Card de Información Personal */}
              <div className={`lg:col-span-2 ${cardClass}`}>
                <h3 className="text-lg font-bold mb-6">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Nombre</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Apellido</label>
                    <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Correo Electrónico</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Card de Seguridad */}
              <div className={`lg:col-span-3 ${cardClass}`}>
                <h3 className="text-lg font-bold mb-6 text-red-500">🔒 Seguridad y Privacidad</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                  >
                    Cambiar Contraseña
                  </button>
                  <button className="px-6 py-3 rounded-xl border border-red-500/30 text-red-500 font-semibold hover:bg-red-500/10 transition-colors">
                    Cerrar sesión en todos los dispositivos
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferencias' && (
            <motion.div
              key="preferencias"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">⚙️ Preferencias de la App</h3>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Idioma</label>
                    <select name="idioma" value={formData.idioma} onChange={handleInputChange} className={inputClass}>
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Formato de Fecha</label>
                    <select name="formatoFecha" value={formData.formatoFecha} onChange={handleInputChange} className={inputClass}>
                      <option value="DD/MM/AAAA">DD/MM/AAAA</option>
                      <option value="MM/DD/AAAA">MM/DD/AAAA</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">🔔 Notificaciones Globales</h3>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-current border-opacity-10">
                  <div>
                    <h4 className="font-bold">Habilitar Notificaciones</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Activa o desactiva todas las alertas</p>
                  </div>
                  <Toggle name="alertasActivas" checked={formData.alertasActivas} onChange={handleInputChange} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'financiera' && (
            <motion.div
              key="financiera"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">💰 Configuración Financiera</h3>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Moneda Predeterminada</label>
                    <select name="moneda" value={formData.moneda} onChange={handleInputChange} className={inputClass}>
                      <option value="COP">COP ($) - Peso Colombiano</option>
                      <option value="USD">USD ($) - Dólar Estadounidense</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Presupuesto Mensual Base</label>
                    <input type="number" name="presupuestoMensual" value={formData.presupuestoMensual} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">🏦 Cuentas Bancarias</h3>
                <div className={`p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 text-center ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-gray-300 bg-gray-50'}`}>
                  <BanknotesIcon className="w-10 h-10 text-slate-400" />
                  <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>No hay cuentas vinculadas</p>
                  <button className="text-green-500 font-semibold hover:underline mt-2">+ Vincular Nueva Cuenta</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'datos' && (
            <motion.div
              key="datos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">📥 Exportar Movimientos</h3>
                <div className="space-y-4">
                  <select className={inputClass}>
                    <option value="csv">Formato CSV</option>
                    <option value="pdf">Formato PDF</option>
                    <option value="excel">Formato Excel</option>
                  </select>
                  <button className="w-full px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30">
                    Exportar Ahora
                  </button>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">💾 Respaldo de Datos</h3>
                <div className="space-y-3">
                  <button className="w-full px-6 py-3 rounded-xl bg-blue-500/10 text-blue-500 font-semibold hover:bg-blue-500/20 transition-colors">
                    Crear Respaldo
                  </button>
                  <button className="w-full px-6 py-3 rounded-xl border border-current border-opacity-20 font-semibold hover:bg-black/5 transition-colors">
                    Restaurar Datos
                  </button>
                </div>
              </div>

              <div className={`lg:col-span-2 ${cardClass}`}>
                <h3 className="text-lg font-bold mb-4 text-red-500">⚠️ Zona de Peligro</h3>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Eliminar tu cuenta borrará permanentemente todos tus datos de la plataforma. Esta acción no se puede deshacer.
                </p>
                <button className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                  Eliminar Cuenta y Datos
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'notificaciones' && (
            <motion.div
              key="notificaciones"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cardClass}
            >
              <h3 className="text-xl font-bold mb-8">🔔 Notificaciones Personalizadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NotificationItem 
                  title="Alertas de Gastos" 
                  desc="Avisar cuando se registre un gasto grande"
                  name="alertaGastos"
                  checked={formData.alertaGastos}
                  onChange={handleInputChange}
                  isDarkMode={isDarkMode}
                />
                <NotificationItem 
                  title="Recordatorios de Presupuesto" 
                  desc="Alertar al acercarse al límite mensual"
                  name="recordatorioPresupuesto"
                  checked={formData.recordatorioPresupuesto}
                  onChange={handleInputChange}
                  isDarkMode={isDarkMode}
                />
                <NotificationItem 
                  title="Notificaciones de Metas" 
                  desc="Avisar al cumplir o acercarse a una meta de ahorro"
                  name="notificacionMetas"
                  checked={formData.notificacionMetas}
                  onChange={handleInputChange}
                  isDarkMode={isDarkMode}
                />
                <NotificationItem 
                  title="Correo Electrónico de Resumen" 
                  desc="Recibir un resumen semanal por email"
                  name="correoResumen"
                  checked={formData.correoResumen}
                  onChange={handleInputChange}
                  isDarkMode={isDarkMode}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'informacion' && (
            <motion.div
              key="informacion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">ℹ️ Información de la App</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Versión</p>
                    <p className="font-bold text-lg">v1.0.5 Beta</p>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-bold mb-6">🔗 Enlaces Importantes</h3>
                <div className="space-y-3">
                  <InfoLink title="Términos y Condiciones" isDarkMode={isDarkMode} />
                  <InfoLink title="Política de Privacidad" isDarkMode={isDarkMode} />
                  <InfoLink title="Licencias de Código Abierto" isDarkMode={isDarkMode} />
                </div>
              </div>

              <div className={`lg:col-span-2 ${cardClass}`}>
                <button className="w-full py-4 rounded-xl bg-green-500/10 text-green-500 font-bold hover:bg-green-500/20 transition-colors flex items-center justify-center gap-3">
                  <EnvelopeIcon className="w-6 h-6" />
                  Contactar Soporte
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón Guardar Cambios Global */}
        {['cuenta', 'preferencias', 'financiera', 'notificaciones'].includes(activeTab) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 flex justify-end"
          >
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="px-10 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 text-lg"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </motion.div>
        )}

        {/* Mensajes de feedback */}
        <AnimatePresence>
          {mensaje && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-8 p-4 rounded-xl text-center font-bold ${
                mensaje.tipo === 'success' ? 'bg-green-500/20 text-green-500' :
                mensaje.tipo === 'error' ? 'bg-red-500/20 text-red-500' :
                'bg-blue-500/20 text-blue-500'
              }`}
            >
              {mensaje.texto}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Cambiar Contraseña */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-md p-8 rounded-3xl shadow-2xl relative ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}
            >
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-center">Cambiar Contraseña</h2>
              
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Contraseña Actual</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={passwordForm.currentPassword} 
                    onChange={handlePasswordFormChange} 
                    className={inputClass} 
                    required 
                  />
                </div>
                <div>
                  <label className={labelClass}>Nueva Contraseña</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={passwordForm.newPassword} 
                    onChange={handlePasswordFormChange} 
                    className={inputClass} 
                    required 
                    minLength={6}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirmar Nueva Contraseña</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={passwordForm.confirmPassword} 
                    onChange={handlePasswordFormChange} 
                    className={inputClass} 
                    required 
                    minLength={6}
                  />
                </div>

                {passwordStatus && (
                  <div className={`p-3 rounded-lg text-sm font-bold text-center ${passwordStatus.tipo === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {passwordStatus.texto}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmittingPassword}
                  className="w-full mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Subcomponentes utilitarios

function Toggle({ name, checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
    </label>
  );
}

function NotificationItem({ title, desc, name, checked, onChange, isDarkMode }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-gray-100 bg-gray-50'}`}>
      <div>
        <h4 className="font-bold text-sm md:text-base">{title}</h4>
        <p className={`text-xs md:text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{desc}</p>
      </div>
      <Toggle name={name} checked={checked} onChange={onChange} />
    </div>
  );
}

function InfoLink({ title, isDarkMode }) {
  return (
    <button className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
      isDarkMode 
        ? 'border-slate-800 hover:bg-slate-800' 
        : 'border-gray-100 hover:bg-gray-100'
    }`}>
      <span className="font-semibold text-sm">{title}</span>
      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
    </button>
  );
}

// Iconos SVG simples
function UserIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>; }
function CogIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>; }
function BanknotesIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>; }
function DocumentArrowDownIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>; }
function BellIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>; }
function InformationCircleIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>; }
function CameraIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>; }
function ChevronRightIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>; }
function EnvelopeIcon({ className = "w-5 h-5" }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>; }
