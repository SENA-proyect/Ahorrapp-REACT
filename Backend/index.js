const express = require("express");
const cors = require("cors");
require("dotenv").config();


const authRoutes = require("./src/routes/authRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const dependientesRoutes = require("./src/routes/dependientesRoutes");
const movimientosRoutes = require("./src/routes/movimientosRoutes");

const app = express();


// Middlewares globales
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());


// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/dependientes", dependientesRoutes);
app.use("/api/movimientos", movimientosRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor AhorrApp corriendo" });
});


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});