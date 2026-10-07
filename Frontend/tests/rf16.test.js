import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

const directory = path.dirname(fileURLToPath(import.meta.url));
const bundle = await build({
  stdin: { contents: `export { AuthProvider, useAuth } from './src/context/AuthContext.jsx';
    export { ProtectedRoute } from './src/components/ProtectedRoute.jsx';
    export { default as Header } from './src/components/HeaderModulos.jsx';
    export { default as PanelAdmin } from './src/pages/PanelAdmin.jsx';`,
    resolveDir: path.resolve(directory, '..'), loader: 'jsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-router-dom'],
  plugins: [{ name: 'network-fixtures', setup(builder) {
    builder.onLoad({ filter: /NotificacionesContext\.jsx$/ }, () => ({ contents:
      'export const useNotificaciones = () => ({ noLeidasCount: 0 });' }));
    builder.onLoad({ filter: /services[\\/]api\.js$/ }, () => ({ contents: `
      export const getUsuariosPanelAdmin = async () => ({totalUsuarios: 0});
      export const getDependientesPanelAdmin = async () => ({totalDependientes: 0});
      export const getHistorial = async () => [];` }));
  } }],
});
const compiled = new Module(path.join(directory, 'rf16-bundle.cjs'));
compiled.paths = Module._nodeModulePaths(directory);
compiled._compile(bundle.outputFiles[0].text, path.join(directory, 'rf16-bundle.cjs'));
const { AuthProvider, useAuth, ProtectedRoute, Header, PanelAdmin } = compiled.exports;
const require = createRequire(import.meta.url);
// JSX is bundled in memory; no generated test code is saved in the repository.
assert.equal(require('react'), React);

let dom, root, auth, navigate;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function Probe() {
  auth = useAuth();
  navigate = useNavigate();
  return null;
}
async function mount({ seed = true, admin = false } = {}) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => {
    if (!error.message.includes('Not implemented: navigation')) throw error;
  });
  dom = new JSDOM('<div id="root"></div>', { url: 'https://localhost/', virtualConsole });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;
  if (seed) {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 7, roles: ['admin'] }));
    localStorage.setItem('usuario', localStorage.getItem('user'));
  }
  root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(AuthProvider, null,
    React.createElement(MemoryRouter, { initialEntries: ['/private', '/private'] },
      React.createElement(Probe),
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/private', element:
          React.createElement(ProtectedRoute, null, admin ? React.createElement(PanelAdmin) :
            React.createElement('div', null, React.createElement(Header), 'CONTENIDO PRIVADO')) }),
        React.createElement(Route, { path: '/Login', element: React.createElement('div', null, 'INICIAR SESIÓN') })
      )))));
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  dom?.window.close();
  root = null;
});
function expectLogin() {
  assert.ok(document.body.textContent.includes('INICIAR SESIÓN'));
  assert.ok(!document.body.textContent.includes('CONTENIDO PRIVADO'));
  assert.equal(auth.isAuthenticated, false);
}

test('Cerrar sesión limpia ambas memorias y bloquea volver atrás', async () => {
  await mount();
  for (const key of ['token', 'user', 'usuario']) sessionStorage.setItem(key, 'old');
  localStorage.setItem('theme', 'dark');
  await act(async () => auth.logout());
  expectLogin();
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ['token', 'user', 'usuario']) assert.equal(storage.getItem(key), null);
  }
  assert.equal(localStorage.getItem('theme'), 'dark');
  await act(async () => navigate(-1));
  expectLogin();
});
test('Recargar después de cerrar sesión pide autenticar de nuevo', async () => {
  await mount();
  await act(async () => auth.logout());
  await act(async () => root.unmount());
  root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(AuthProvider, null,
    React.createElement(MemoryRouter, { initialEntries: ['/private'] }, React.createElement(Probe),
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/private', element: React.createElement(ProtectedRoute, null, 'CONTENIDO PRIVADO') }),
        React.createElement(Route, { path: '/Login', element: React.createElement('div', null, 'INICIAR SESIÓN') }))))));
  expectLogin();
});
test('Cerrar sesión en otra pestaña bloquea la pestaña abierta', async () => {
  await mount();
  localStorage.removeItem('token');
  await act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key: 'token' })));
  expectLogin();
});
for (const event of ['pageshow', 'focus']) {
  test('Regresar mediante '+event+' revalida la sesión', async () => {
    await mount();
    localStorage.clear();
    await act(async () => window.dispatchEvent(new window.Event(event)));
    expectLogin();
  });
}
test('Un perfil sin token no permite acceder', async () => {
  await mount();
  localStorage.removeItem('token');
  await act(async () => window.dispatchEvent(new window.Event('pageshow')));
  expectLogin();
  assert.equal(localStorage.getItem('user'), null);
});
test('Los datos corruptos se eliminan sin recuperar la sesión', async () => {
  await mount();
  localStorage.setItem('user', '{invalid');
  await act(async () => window.dispatchEvent(new window.Event('focus')));
  expectLogin();
  assert.equal(localStorage.getItem('token'), null);
});
test('La ruta protegida rechaza una entrada sin sesión', async () => {
  await mount({ seed: false });
  expectLogin();
});
for (const admin of [false, true]) test('Botón de cierre en '+(admin ? 'administrador' : 'encabezado'), async () => {
  await mount({admin});
  const button = [...document.querySelectorAll('button')].find(b => /Cerrar sesi[oó]n/i.test(b.textContent));
  assert.ok(button);
  // JSDOM no navega documentos; el estado de AuthContext sí debe cambiar.
  await act(async () => button.click());
  expectLogin();
});
test('Una sesión válida se conserva al reabrir', async () => {
  await mount();
  assert.equal(auth.isAuthenticated, true);
  assert.ok(document.body.textContent.includes('CONTENIDO PRIVADO'));
});
