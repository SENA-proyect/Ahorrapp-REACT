import { defineConfig } from "vite";   // Importa la función de configuración de Vite
import react from "@vitejs/plugin-react"; // Importa el plugin de React para Vite

export default defineConfig({
  plugins: [react()], // Le dice a Vite que este proyecto usa React

  server: {
    // Esta sección configura el servidor de desarrollo local

    allowedHosts: ['trilogy-parted-fastness.ngrok-free.dev'],
    // Permite que ngrok acceda al servidor de desarrollo

    proxy: {
      // "proxy" le dice a Vite: "cuando veas una petición que empiece con /api,
      // no la manejes tú — reenvíala a otro servidor"

      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/uploads": {
        // Igual que /api, pero para servir las imágenes subidas por los usuarios
        // Cuando el navegador pida /uploads/foto.jpg, Vite la busca en el backend
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});