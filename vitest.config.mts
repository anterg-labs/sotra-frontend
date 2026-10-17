import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      // Next lo resuelve solo al compilar; en las pruebas se reemplaza por un módulo vacío.
      "server-only": resolve(import.meta.dirname, "src/pruebas/server-only-vacio.ts"),
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: resolve(import.meta.dirname, "vitest.setup.ts"),
    globals: true,
    exclude: ["e2e/**", "e2e-casos/**", "node_modules/**"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/pruebas/**",
      ],
    },
  },
});