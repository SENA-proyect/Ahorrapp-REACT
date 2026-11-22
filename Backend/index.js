const express = require("express");
const cors = require("cors");
require("dotenv").config();

const alphaVantageRoutes = require("./src/routes/alphaVantageRoutes");
const authRoutes = require("./src/routes/authRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");
const noticiasRoutes = require("./src/routes/noticiasRoutes");
const NotificacionesRoutes = require("./src/routes/NotificacionesRoutes");
const PresupuestosRoutes = require("./src/routes/PresupuestosRoutes");
const fondoemergenciaRoutes = require("./src/routes/fondoemergenciaRoutes");
const ReportesRoutes = require("./src/routes/ReportesRoutes");
const historialRoutes = require("./src/routes/Historialroutes");

// Jobs
const { iniciarEliminacionCuentasJob } = require("./src/service/jobs/EliminacioncuentasJob");
const { iniciarVencimientosJob } = require("./src/service/jobs/VencimientosJob");
const { iniciarJobDeudas } = require("./src/service/jobs/DeudasJob"); // <-- Importado una sola vez

const app = express();

// ================================
// MIDDLEWARES
// ================================
// Orígenes permitidos: desarrollo y entornos de despliegue.
app.use(cors({
    origin: [
        "https://localhost:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://52.45.67.160",
        "http://52.45.67.160:80",
        "https://ahorrapp-react-gia9.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ================================
// RUTAS
// ================================
app.use("/api", alphaVantageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos", movimientosRoutes);
app.use("/api/noticias", noticiasRoutes);
app.use("/api", NotificacionesRoutes);
app.use("/api/presupuestos", PresupuestosRoutes);
app.use("/api/fondo-emergencia", fondoemergenciaRoutes);
app.use("/api/reportes", ReportesRoutes);
app.use("/api/historial", historialRoutes);

// ================================
// RUTA DE PRUEBA
// ================================
app.get("/", (req, res) => {
    res.json({
        ok: true,
        mensaje: "Servidor AhorrApp corriendo"
    });
});

// ================================
// 404 Y MANEJO GLOBAL DE ERRORES
// ================================
app.use((req, res) => {
    res.status(404).json({ ok: false, mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
        return res.status(400).json({ ok: false, mensaje: "El cuerpo de la petición no es un JSON válido" });
    }
    if (err && err.type === "entity.too.large") {
        return res.status(413).json({ ok: false, mensaje: "El cuerpo de la petición es demasiado grande" });
    }
    console.error("Error no controlado:", err && err.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
});

process.on("unhandledRejection", (motivo) => {
    console.error("unhandledRejection:", motivo && motivo.message ? motivo.message : motivo);
});

// ================================
// SERVIDOR (Solo arranca si NO estamos en entorno de pruebas)
// ================================
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor AhorrApp ejecutándose en el puerto ${PORT}`);
        iniciarEliminacionCuentasJob();
        iniciarVencimientosJob();
        iniciarJobDeudas();
    });
}

// Exportamos la app para que los tests puedan usarla
module.exports = app;