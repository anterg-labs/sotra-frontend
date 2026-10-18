import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo de los flujos críticos. Corren contra la pila local ya levantada
 * (frontend y backend en Docker) y crean sus propios datos de prueba por la API; no borran nada.
 * Usan el Chrome instalado en el equipo: no hace falta descargar navegadores.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.SOTRA_URL ?? "http://localhost",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", testMatch: /(stock|reportes|orden-escritorio|usuarios-clientes|seguridad-xss|terminos|navegacion)\.spec\.ts/, use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "movil-320", testMatch: /tecnico\.spec\.ts/, use: { ...devices["Pixel 5"], channel: "chrome", viewport: { width: 320, height: 568 } } },
  ],
});
