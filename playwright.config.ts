import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo de los flujos críticos. Corren contra la pila local ya levantada
 * (frontend, backend y Keycloak en Docker) y crean sus propios datos de prueba por la API; no borran nada.
 * Usan el Chrome instalado en el equipo: no hace falta descargar navegadores.
 *
 * Con el login de Keycloak, el proyecto «sesion» inicia sesión una vez (SOTRA_E2E_USUARIO y SOTRA_E2E_CONTRASENA)
 * y el resto reutiliza esa sesión: las páginas y los datos de prueba (que van por `/api/v1` del frontend).
 */
const sesion = "e2e/.auth/sesion.json";

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
    { name: "sesion", testMatch: /sesion\.setup\.ts/, use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    {
      name: "escritorio",
      testMatch: /(stock|reportes|reportes-planificacion|reportes-demoras|orden-escritorio|usuarios-clientes|seguridad-xss|terminos|navegacion)\.spec\.ts/,
      dependencies: ["sesion"],
      use: { ...devices["Desktop Chrome"], channel: "chrome", storageState: sesion },
    },
    {
      name: "movil-320",
      testMatch: /tecnico\.spec\.ts/,
      dependencies: ["sesion"],
      use: { ...devices["Pixel 5"], channel: "chrome", viewport: { width: 320, height: 568 }, storageState: sesion },
    },
  ],
});
