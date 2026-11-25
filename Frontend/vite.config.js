import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; 
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isVitest = Boolean(process.env.VITEST);
const frontendNodeModules = path.join(path.dirname(fileURLToPath(import.meta.url)), 'node_modules');
const testDependencyAliases = [
  { find: /^react$/, replacement: path.join(frontendNodeModules, 'react/index.js') },
  { find: /^react\/jsx-runtime$/, replacement: path.join(frontendNodeModules, 'react/jsx-runtime.js') },
  { find: /^react\/jsx-dev-runtime$/, replacement: path.join(frontendNodeModules, 'react/jsx-dev-runtime.js') },
  { find: /^react-dom$/, replacement: path.join(frontendNodeModules, 'react-dom/index.js') },
  { find: /^react-dom\/client$/, replacement: path.join(frontendNodeModules, 'react-dom/client.js') },
  { find: /^react-router-dom$/, replacement: path.join(frontendNodeModules, 'react-router-dom/dist/index.mjs') },
  { find: /^@testing-library\/react$/, replacement: path.join(frontendNodeModules, '@testing-library/react/dist/@testing-library/react.esm.js') },
  { find: /^@testing-library\/user-event$/, replacement: path.join(frontendNodeModules, '@testing-library/user-event/dist/esm/index.js') },
  { find: /^@react-oauth\/google$/, replacement: path.join(frontendNodeModules, '@react-oauth/google/dist/index.esm.js') },
];

export default defineConfig({
  plugins: [react()], 
  resolve: {
    alias: isVitest ? testDependencyAliases : [],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './setupTests.js',
    include: ['../test/frontend/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
  server: {
    fs: {
      allow: isVitest ? [path.resolve(process.cwd(), '..')] : undefined,
    },
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