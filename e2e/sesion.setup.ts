import { expect, test as preparar } from "@playwright/test";

/** Sesión que comparten las pruebas (cookie de Auth.js). No se versiona: está en .gitignore. */
export const ARCHIVO_SESION = "e2e/.auth/sesion.json";

/**
 * Inicia sesión una vez en la pantalla de Keycloak con un usuario de prueba administrador y guarda la sesión.
 * Las credenciales llegan por variables de entorno (nunca en el código): SOTRA_E2E_USUARIO y SOTRA_E2E_CONTRASENA.
 */
preparar("iniciar sesión en Keycloak", async ({ page }) => {
  const usuario = process.env.SOTRA_E2E_USUARIO;
  const contrasena = process.env.SOTRA_E2E_CONTRASENA;
  if (!usuario || !contrasena) {
    throw new Error("Definí SOTRA_E2E_USUARIO y SOTRA_E2E_CONTRASENA (un usuario administrador de prueba de Keycloak).");
  }

  await page.goto("/");
  await expect(page).toHaveTitle(/SOTRA/);
  await page.locator("#username").fill(usuario);
  await page.locator("#password").fill(contrasena);
  await page.locator("#kc-login").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/api/auth") && !url.host.endsWith(":9080"));
  await page.context().storageState({ path: ARCHIVO_SESION });
});
