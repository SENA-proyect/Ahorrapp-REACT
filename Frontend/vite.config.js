import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Usamos <rootDir> para que busque desde la raíz del proyecto
    setupFiles: ['./src/tests/setupTests.js'], 
    // Si sigue fallando, usa esta ruta absoluta (descomenta la de abajo)
    // setupFiles: [path.resolve(__dirname, './src/setupTests.js')],
  },
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      "/api": {
        target: "https://ahorrapp-react-gia9.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});