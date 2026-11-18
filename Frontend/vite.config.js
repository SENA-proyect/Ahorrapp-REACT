import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; 
import fs from 'fs';

export default defineConfig({
  plugins: [react()], 
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './setupTests.js',
  },
  server: {
    host: `localhost`,
    port: 5173,
    https: fs.existsSync('certs/private.key') && fs.existsSync('certs/certificate.crt')
      ? {
          key: fs.readFileSync('certs/private.key'),
          cert: fs.readFileSync('certs/certificate.crt'),
        }
      : undefined,
    proxy: {
      "/api": {
        target: "https://manuel-4zg4.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});