// app.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

<<<<<<< HEAD
const authRoutes = require("./src/routes/authRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
=======
const authRoutes        = require("./src/routes/authRoutes");
const categoriasRoutes  = require("./src/routes/categoriasRoutes");
>>>>>>> Santiago
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const noticiasRoutes = require("./src/routes/noticiasRoutes");
<<<<<<< HEAD


const app = express();

// Middlewares globales
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
=======

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
>>>>>>> Santiago
}));

app.use(express.json());
// express.json() le dice a Express que lea el body de las peticiones como JSON
// Sin esto, req.body sería undefined y el login fallaría silenciosamente

<<<<<<< HEAD
// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos", movimientosRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/noticias", noticiasRoutes);
=======
// ── Rutas ─────────────────────────────────────────────────────────────────────

app.use("/api/auth",         authRoutes);
app.use("/api/categorias",   categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos",  movimientosRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/noticias", noticiasRoutes);

// ── Ruta de prueba ────────────────────────────────────────────────────────────
>>>>>>> Santiago

app.get("/", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor AhorrApp corriendo" });
});

<<<<<<< HEAD
// Iniciar servidor
=======
// ── Iniciar servidor ──────────────────────────────────────────────────────────

>>>>>>> Santiago
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});