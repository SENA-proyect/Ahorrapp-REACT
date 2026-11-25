import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const FRONTEND = path.dirname(fileURLToPath(import.meta.url));
// Vitest define VITEST=true. Solo en ese caso la raíz sube a la carpeta del
// proyecto para poder ejecutar las pruebas de <raíz>/test/frontend.
const ES_VITEST = Boolean(process.env.VITEST);

// Las pruebas viven fuera de Frontend/, así que sus imports "desnudos"
// (react, vitest, @testing-library/*) se resuelven contra Frontend/node_modules.
const resolverDesdeFrontend = {
  name: 'resolver-desde-frontend',
  enforce: 'pre',
  async resolveId(source, importer, opts) {
    if (!ES_VITEST || !importer) return null;
    const esBare = !source.startsWith('.') && !source.startsWith('/') && !path.isAbsolute(source);
    const desdeTests = importer.replace(/\\/g, '/').includes('/test/frontend/');
    if (!esBare || !desdeTests) return null;
    return this.resolve(source, path.join(FRONTEND, 'index.html'), { ...opts, skipSelf: true });
  },
};

export default defineConfig({
  root: ES_VITEST ? path.resolve(FRONTEND, '..') : undefined,
  plugins: [react(), resolverDesdeFrontend], 
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: path.join(FRONTEND, 'setupTests.js'),
    include: ['Frontend/src/**/*.test.{js,jsx}', 'test/frontend/**/*.test.{js,jsx}'],
    exclude: ['**/node_modules/**'],
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
        target: "https://ahorrapp-react.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
