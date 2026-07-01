const express = require("express");
const cors = require("cors");
const https = require("https");        // ✅ NUEVO: Para crear servidor HTTPS
const fs = require("fs");              // ✅ NUEVO: Para leer archivos (certificados)
const path = require("path");          // ✅ NUEVO: Para manejar rutas de archivos
require("dotenv").config();

const authRoutes          = require("./src/routes/authRoutes");
const categoriasRoutes    = require("./src/routes/categoriasRoutes");
const dependientesRoutes  = require("./src/routes/dependientesRoutes");
const movimientosRoutes   = require("./src/routes/movimientosRoutes");
const aiRoutes            = require("./src/routes/aiRoutes");
const noticiasRoutes      = require("./src/routes/noticiasRoutes");
const bolsaRoutes         = require('./src/routes/alphaVantageRoutes');
const exportarRoutes      = require('./src/routes/exportar');
const PresupuestosRoutes  = require('./src/routes/PresupuestosRoutes');
const dashboardRoutes     = require('./src/routes/dashboardRoutes');
const NotificacionesRoutes = require ('./src/routes/NotificacionesRoutes');
const historialRoutes = require('./src/routes/historialRoutes');

const { iniciarVencimientosJob } = require('./src/service/jobs/VencimientosJob');
const { iniciarArchivadoHistorialJob } = require('./src/service/jobs/archivadoHistorialJob');

const app = express();

// Middlewares globales
app.use(cors({
  origin: "https://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Rutas
app.use("/api/auth",         authRoutes);
app.use("/api/categorias",   categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos",  movimientosRoutes);
app.use("/api/ai",           aiRoutes);
app.use("/api/noticias",     noticiasRoutes);
app.use('/api',              bolsaRoutes);
app.use('/api/exportar',     exportarRoutes);
app.use('/api/presupuestos', PresupuestosRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api', NotificacionesRoutes);
app.use('/api', historialRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor AhorrApp corriendo" });
});

// ============================================
// 🚀 CONFIGURACIÓN SSL (NUEVO)
// ============================================

const PORT = process.env.PORT || 3000;

// 📁 PASO 1: Definir la ruta donde están los certificados
const certsPath = path.join(__dirname, 'certs');

// 🔐 PASO 2: Intentar cargar los certificados SSL
try {
  // 📂 PASO 3: Leer los archivos de certificados
  const privateKey = fs.readFileSync(path.join(certsPath, 'private.key'), 'utf8');
  const certificate = fs.readFileSync(path.join(certsPath, 'certificate.crt'), 'utf8');
  
  // 📂 PASO 4: Leer CA Bundle (opcional, si existe)
  let ca = null;
  const caPath = path.join(certsPath, 'ca_bundle.crt');
  if (fs.existsSync(caPath)) {
    ca = fs.readFileSync(caPath, 'utf8');
    console.log('✅ CA Bundle cargado');
  }

  // 🔧 PASO 5: Crear objeto con las credenciales SSL
  const credentials = { 
    key: privateKey,    // Clave privada del servidor
    cert: certificate,  // Certificado público
    ...(ca && { ca: ca }) // Si existe CA, lo añade
  };

  // 🌐 PASO 6: Crear servidor HTTPS
  const httpsServer = https.createServer(credentials, app);

  // 🚀 PASO 7: Iniciar servidor HTTPS
  httpsServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor HTTPS corriendo en https://localhost:${PORT}`);
    console.log(`🔒 SSL activado correctamente`);
    console.log(`📁 Certificados cargados desde: ${certsPath}`);
    console.log(`\n📝 Endpoints disponibles:`);
    console.log(`   GET  https://localhost:${PORT}/`);
    console.log(`   POST https://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  https://localhost:${PORT}/api/categorias`);
    console.log(`   GET  https://localhost:${PORT}/api/movimientos`);
    console.log(`   POST https://localhost:${PORT}/api/ai/chat`);
    console.log(`   GET  https://localhost:${PORT}/api/dashboard`);
    console.log(`   GET  https://localhost:${PORT}/api/presupuestos`);
    console.log(`   GET  https://localhost:${PORT}/api/notificaciones`);
    console.log(`   GET  https://localhost:${PORT}/api/historial`);
    console.log(`\n⚠️  Configuración para POSTMAN:`);
    console.log(`   1. Settings (engranaje)`);
    console.log(`   2. General`);
    console.log(`   3. SSL certificate verification: OFF`);

    // Cron de notificaciones: solo se inicia si el servidor levantó con éxito
    iniciarVencimientosJob();
    // Cron de archivado de historial (RF-11): cada 3 días
    iniciarArchivadoHistorialJob();
  });

} catch (error) {
  // ❌ PASO 8: Si falla SSL, mostrar error y usar HTTP como fallback
  console.error(`\n❌ Error al cargar certificados SSL:`);
  console.error(`   ${error.message}`);
  console.log(`\n📁 Verifica que los archivos existan en: ${certsPath}`);
  console.log(`   Archivos necesarios:`);
  console.log(`   - private.key`);
  console.log(`   - certificate.crt`);
  console.log(`   - ca_bundle.crt (opcional)`);
  console.log(`\n📝 Para generar certificados autofirmados ejecuta:`);
  console.log(`   openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"`);
  console.log(`   Luego renombra key.pem → private.key y cert.pem → certificate.crt`);
  console.log(`\n⚠️  Iniciando servidor en modo HTTP (sin SSL)...`);
}

module.exports = app;