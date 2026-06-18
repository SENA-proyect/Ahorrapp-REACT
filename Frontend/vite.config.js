import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    // port: 5173,
    // https: {
    //   key: fs.readFileSync(('certs/localhost.key')),
    //   cert: fs.readFileSync(('certs/localhost.crt')),
    // },
    allowedHosts: ["trilogy-parted-fastness.ngrok-free.dev"],
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
