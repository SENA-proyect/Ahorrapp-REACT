// vite.config.js

import { defineConfig } from "vite";   // Importa la función de configuración de Vite
import react from "@vitejs/plugin-react"; // Importa el plugin de React para Vite

export default defineConfig({
  plugins: [react()], // Le dice a Vite que este proyecto usa React

  server: {
    // Esta sección configura el servidor de desarrollo local

    proxy: {
      // "proxy" le dice a Vite: "cuando veas una petición que empiece con /api,
      // no la manejes tú — reenvíala a otro servidor"

      "/api": {
        // Esta es la clave: cualquier URL que empiece con "/api" será interceptada

        target: "http://localhost:3000",
        // "target" es la dirección real de tu backend.
        // Vite tomará la petición de /api/auth/login
        // y la enviará a http://localhost:3000/api/auth/login

        changeOrigin: true,
        // Esto cambia el encabezado "Origin" de la petición
        // para que el backend crea que la petición viene desde localhost:3000
        // y no desde localhost:5173 (el puerto de Vite)
        // Sin esto, algunos backends rechazan la petición por CORS
      },
    },
  },
});