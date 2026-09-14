const express = require("express");
const cors = require("cors");
require("dotenv").config();

const aiRoutes = require("./src/routes/aiRoutes");
const alphaVantageRoutes = require("./src/routes/alphaVantageRoutes");
const authRoutes = require("./src/routes/authRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const exportRoutes= require("./src/routes/exportRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");
const noticiasRoutes = require("./src/routes/noticiasRoutes");
const NotificacionesRoutes = require("./src/routes/NotificacionesRoutes");
const PresupuestosRoutes = require("./src/routes/PresupuestosRoutes");
const fondoemergenciaRoutes = require("./src/routes/fondoemergenciaRoutes");
const ReportesRoutes = require("./src/routes/ReportesRoutes");
const historialRoutes = require("./src/routes/Historialroutes");

const { iniciarEliminacionCuentasJob } = require("./src/service/jobs/EliminacioncuentasJob");
const { iniciarVencimientosJob } = require("./src/service/jobs/VencimientosJob");

const app = express();

// ================================
// MIDDLEWARES
// ================================

app.use(cors({
    origin: [
        "https://localhost:5173"
        // Aquí posteriormente agregaremos
        // la URL de producción del frontend
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ================================
// RUTAS
// ================================
app.use("/api/ai", aiRoutes);
// app.use("/api/alphaVantageRoutes", alphaVantageRoutes);
app.use("/api", alphaVantageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/exportRoutes", exportRoutes);
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
// SERVIDOR
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor AhorrApp ejecutándose en el puerto ${PORT}`);

    iniciarEliminacionCuentasJob();
    iniciarVencimientosJob();
});