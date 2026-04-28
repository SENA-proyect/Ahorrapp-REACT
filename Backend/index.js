// app.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes        = require("./src/routes/authRoutes");
const categoriasRoutes  = require("./src/routes/categoriasRoutes");
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────

app.use(cors({
  origin: [
    "http://localhost:5173", // Puerto de Vite en desarrollo
    "http://localhost:3000", // El mismo backend (por si el proxy cambia el origen)
  ],
  // Agregamos PATCH a la lista — antes faltaba y bloqueaba tus peticiones
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

  allowedHeaders: ["Content-Type", "Authorization"],
  // "Content-Type" → para que acepte JSON en el body
  // "Authorization" → para que acepte el token Bearer
}));

app.use(express.json());
// express.json() le dice a Express que lea el body de las peticiones como JSON
// Sin esto, req.body sería undefined y el login fallaría silenciosamente

// ── Rutas ─────────────────────────────────────────────────────────────────────

app.use("/api/auth",         authRoutes);
app.use("/api/categorias",   categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos",  movimientosRoutes);

// ── Ruta de prueba ────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor AhorrApp corriendo" });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});