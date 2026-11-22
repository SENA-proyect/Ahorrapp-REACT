module.exports = {
  testEnvironment: "node",
  // Los tests viven fuera de Backend/, en <raíz>/test/backend
  roots: ["<rootDir>/../Backend/tests"],
  testMatch: ["**/*.test.js"],
  // Permite que los tests (fuera de Backend/) encuentren supertest, jsonwebtoken, etc.
  modulePaths: ["<rootDir>/node_modules"],
 // setupFiles: ["<rootDir>/../Backend/tests/setupEnv.js"],
  clearMocks: true,
};