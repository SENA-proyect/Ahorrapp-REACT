const express = require("express");
const cors = require("cors");
require("dotenv").config();

// requires de rutas
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const authRoutes = require("./src/routes/authRoutes");

const app = express();

// Middlewares globales
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Rutas (usuarios)
app.use("/api/auth", authRoutes);

// Rutas (categorias)
app.use("/api/categorias", categoriasRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor AhorrApp corriendo" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

