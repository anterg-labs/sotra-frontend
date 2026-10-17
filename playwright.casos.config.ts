import { defineConfig, devices } from "@playwright/test";

/**
 * Ejecución local de los casos de interfaz de Bugasura (Usuarios y Clientes) contra la pila ya levantada.
 * Los resultados se acumulan en resultados-pruebas-locales/ui-usuarios-clientes.json (ver e2e-casos/cierre.ts).
 */
export default defineConfig({
  testDir: "./e2e-casos",
  testMatch: /(usuarios|clientes)\.spec\.ts/,
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  globalTeardown: "./e2e-casos/cierre.ts",
  use: {
    baseURL: process.env.SOTRA_URL ?? "http://localhost",
    ...devices["Desktop Chrome"],
    channel: "chrome",
  },
});
