import { expect, test, type Page } from "@playwright/test";

const claveAceptacion = "sotra.terminos.aceptacion";

async function recorrerTexto(page: Page) {
  const texto = page.getByRole("region", { name: "Texto de los términos y condiciones" });
  await texto.evaluate((elemento) => {
    elemento.scrollTop = elemento.scrollHeight;
    elemento.dispatchEvent(new Event("scroll"));
  });
}

async function aceptar(page: Page) {
  const modal = page.getByRole("dialog", { name: "Términos y condiciones" });
  if (!(await modal.isVisible())) await page.getByRole("button", { name: "Términos y condiciones", exact: true }).click();
  await recorrerTexto(page);
  await expect(page.getByRole("checkbox")).toHaveCSS("cursor", "pointer");
  await page.getByRole("checkbox", { name: "Leí y acepto los términos y condiciones" }).check();
  await page.getByRole("button", { name: "Aceptar", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Términos y condiciones" })).toBeHidden();
}

test.describe("términos en modal, sin modificar datos de la API", () => {
  test("apertura manual desde el footer, lectura, casilla, persistencia y consulta posterior", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (error) => errores.push(error.message));
    await page.goto("/usuarios");
    const modal = page.getByRole("dialog", { name: "Términos y condiciones" });
    await expect(modal).toBeHidden();
    await page.getByRole("button", { name: "Términos y condiciones", exact: true }).click();
    await expect(modal.getByRole("region", { name: "Texto de los términos y condiciones" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Aceptar", exact: true })).toBeDisabled();
    await expect(modal.getByRole("button", { name: "Cerrar" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(modal).toBeVisible();
    await aceptar(page);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Gestión de usuarios" })).toBeVisible();
    await expect(modal).toBeHidden();
    const boton = page.getByRole("button", { name: "Términos y condiciones" });
    await boton.click();
    await expect(modal.getByRole("region", { name: "Texto de los términos y condiciones" })).toBeVisible();
    await expect(modal.getByRole("checkbox")).toHaveCount(0);
    await expect(modal.getByRole("button", { name: "Aceptar", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(boton).toBeFocused();
    expect(errores).toEqual([]);
  });

  test("una aceptación anterior deja de servir y obliga a aceptar la vigente", async ({ page }) => {
    await page.addInitScript((clave) => localStorage.setItem(clave, JSON.stringify({ terminosId: 999999, version: 999999, aceptadoEn: new Date().toISOString() })), claveAceptacion);
    await page.goto("/usuarios");
    await expect(page.getByRole("dialog", { name: "Términos y condiciones" })).toBeHidden();
    await page.getByRole("button", { name: "Términos y condiciones", exact: true }).click();
    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await aceptar(page);
    const guardada = await page.evaluate((clave) => JSON.parse(localStorage.getItem(clave) ?? "null"), claveAceptacion);
    expect(guardada.terminosId).not.toBe(999999);
  });

  test("no existe la página /terminos; la edición permanece en configuración", async ({ page }) => {
    await page.goto("/usuarios");
    await aceptar(page);
    const respuesta = await page.goto("/terminos");
    expect(respuesta?.status()).toBe(404);
    await page.goto("/configuracion/terminos");
    await expect(page.getByRole("textbox", { name: "Texto", exact: true })).toBeVisible();
    await expect(page.getByRole("toolbar", { name: "Herramientas de formato" })).toBeVisible();
    const texto = page.locator("#texto");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await page.getByRole("button", { name: "Términos y condiciones", exact: true }).click();
    const consulta = page.getByRole("dialog", { name: "Términos y condiciones" });
    await expect(consulta.getByRole("region")).toBeVisible();
    await consulta.evaluate(async elemento => { await Promise.all(elemento.getAnimations().map(animacion => animacion.finished)); });
    const medidaFooter = await consulta.boundingBox();
    const contenidoFooter = await consulta.getByRole("region").innerText();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Vista previa", exact: true }).click();
    await expect(consulta.getByRole("region")).toHaveText(contenidoFooter);
    await consulta.evaluate(async elemento => { await Promise.all(elemento.getAnimations().map(animacion => animacion.finished)); });
    const medidaPrevia = await consulta.boundingBox();
    expect(medidaPrevia?.width).toBe(medidaFooter?.width);
    expect(medidaPrevia?.height).toBe(medidaFooter?.height);
    await page.keyboard.press("Escape");
    await texto.fill('Texto con formato visual y contenido seguro.');
    await texto.press("Control+a");
    const negrita = page.getByRole("button", { name: "Negrita", exact: true });
    if (await negrita.getAttribute("aria-pressed") === "true") await negrita.click();
    await expect(texto.locator("strong")).toHaveCount(0);
    await negrita.click();
    await expect(texto.locator("strong")).toHaveText("Texto con formato visual y contenido seguro.");
    await expect(texto).not.toContainText("**");
    await expect(page.getByRole("dialog", { name: "Términos y condiciones" })).toBeHidden();
    await expect(page.getByText("En vivo", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Así se verá", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Historial de versiones" })).toHaveCount(0);
    await page.getByRole("button", { name: "Vista previa", exact: true }).click();
    const previa = page.getByRole("dialog", { name: "Términos y condiciones" });
    await expect(previa.locator("strong")).toHaveText("Texto con formato visual y contenido seguro.");
    await expect(previa.locator("script")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(previa).toBeHidden();
  });

  test.describe("celular de 320 px", () => {
    test.use({ viewport: { width: 320, height: 568 } });
    test("el modal permite leer y aceptar, y el técnico tiene acceso desde el footer", async ({ page }) => {
      await page.goto("/tecnico");
      const modal = page.getByRole("dialog", { name: "Términos y condiciones" });
      await expect(modal).toBeHidden();
      await page.getByRole("button", { name: "Términos y condiciones", exact: true }).click();
      await expect(modal.getByRole("region", { name: "Texto de los términos y condiciones" })).toBeVisible();
      expect(await modal.evaluate((elemento) => elemento.scrollWidth <= elemento.clientWidth)).toBe(true);
      await aceptar(page);
      await page.getByRole("button", { name: "Términos y condiciones" }).click();
      await expect(modal.getByRole("checkbox")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
});
