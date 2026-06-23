const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const noticiasRoutes = require("./src/routes/noticiasRoutes");
const bolsaRoutes = require("./src/routes/alphaVantageRoutes");
const exportRoutes = require("./src/routes/exportRoutes");

const app = express();

// Middlewares globales
app.use(cors({
  origin: "https://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos", movimientosRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/noticias", noticiasRoutes);
app.use("/api/bolsa", bolsaRoutes);
app.use("/api/exportar", exportRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor AhorrApp corriendo" });
});

// 🔒 CONFIGURACIÓN SSL
const PORT = process.env.PORT || 3000;

// 📁 Ruta a tus certificados
const certsPath = path.join(__dirname, 'certs');

try {
  // Verifica que los archivos existen
  const keyFile = path.join(certsPath, 'private.key');
  const certFile = path.join(certsPath, 'certificate.crt');
  
  if (!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
    throw new Error('Archivos de certificado no encontrados');
  }

  // Lee los certificados
  const privateKey = fs.readFileSync(keyFile, 'utf8');
  const certificate = fs.readFileSync(certFile, 'utf8');
  
  // Opcional: si tienes ca_bundle
  let ca = null;
  const caFile = path.join(certsPath, 'ca_bundle.crt');
  if (fs.existsSync(caFile)) {
    ca = fs.readFileSync(caFile, 'utf8');
  }

  const credentials = { 
    key: privateKey, 
    cert: certificate,
    ...(ca && { ca: ca })
  };

  // ✅ CREA SERVIDOR HTTPS
  const httpsServer = https.createServer(credentials, app);
  
  httpsServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Servidor HTTPS ACTIVADO`);
    console.log(`🔒 https://localhost:${PORT}`);
    console.log(`📁 Certificados: ${certsPath}\n`);
    console.log(`📝 Endpoints:`);
    console.log(`   GET  https://localhost:${PORT}/`);
    console.log(`   POST https://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  https://localhost:${PORT}/api/categorias`);
    console.log(`   GET  https://localhost:${PORT}/api/movimientos`);
    console.log(`   POST https://localhost:${PORT}/api/ai/chat`);
    console.log(`\n⚠️  Postman: Settings > SSL verification: OFF\n`);
  });

} catch (error) {
  console.error(`❌ Error SSL: ${error.message}`);
  console.log('\n📝 Verifica la carpeta certs:');
  console.log(`   ${certsPath}`);
  console.log('   Debe contener: private.key, certificate.crt\n');
  console.log('⚠️  Iniciando en modo HTTP...\n');
  
  // 🔄 FALLBACK: Servidor HTTP
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor HTTP corriendo en http://localhost:${PORT}`);
    console.log(`📝 Usa esta URL en Postman: http://localhost:${PORT}\n`);
  });
}

module.exports = app;