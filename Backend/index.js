const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const noticiasRoutes = require("./src/routes/noticiasRoutes");
const bolsaRoutes = require("./src/routes/alphaVantageRoutes");
const exportarRoutes = require("./src/routes/exportar");
const PresupuestosRoutes = require("./src/routes/PresupuestosRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const NotificacionesRoutes = require("./src/routes/NotificacionesRoutes");

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

app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos", movimientosRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/noticias", noticiasRoutes);
app.use("/api", bolsaRoutes);
app.use("/api/exportar", exportarRoutes);
app.use("/api/presupuestos", PresupuestosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", NotificacionesRoutes);

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

    iniciarVencimientosJob();
});