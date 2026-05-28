const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const noticiasRoutes = require("./src/routes/noticiasRoutes");
const bolsaRoutes = require('./src/routes/alphaVantageRoutes');
const exportarRoutes = require('./src/routes/exportar');
const exportRoutes = require("./src/routes/exportRoutes");
const configuracionesRoutes = require("./src/routes/configuracionesRoutes");

const app = express();

// Middlewares globales
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Servir archivos estáticos (para uploads)
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos", movimientosRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/noticias", noticiasRoutes);
app.use('/api', bolsaRoutes);
app.use("/api/bolsa", bolsaRoutes);
app.use('/api/exportar', exportarRoutes);
app.use("/api/exportarRoutes", exportRoutes);
app.use("/api/configuraciones", configuracionesRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor AhorrApp corriendo" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
