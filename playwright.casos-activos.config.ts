import { defineConfig, devices } from "@playwright/test";

/** Casos de interfaz de Bugasura (Activos, Modelos de máquina, Tipos de máquina) contra la pila local. */
export default defineConfig({
  testDir: "./e2e-casos",
  testMatch: /(activos|modelos|tipos)\.spec\.ts/,
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.SOTRA_URL ?? "http://localhost",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [{ name: "escritorio", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
