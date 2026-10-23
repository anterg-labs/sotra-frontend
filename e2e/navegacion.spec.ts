import { expect, test } from "@playwright/test";

for (const ancho of [1366, 390]) {
  test(`muestra el destino mientras la navegación espera al servidor (${ancho}px)`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: ancho < 600 ? 844 : 768 });
    await page.goto("/usuarios");
    const terminos = page.getByRole("dialog", { name: "Términos y condiciones" });
    await expect(terminos).toBeHidden();

    let liberar = () => {};
    const espera = new Promise<void>((resolver) => { liberar = resolver; });
    await page.route("**/clientes?*", async (ruta) => {
      if (ruta.request().headers().rsc === "1") await espera;
      await ruta.continue();
    });
    try {
      if (ancho < 600) await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
      await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Clientes", exact: true }).click();
      const aviso = page.getByRole("status").filter({ hasText: "Abriendo Clientes…" });
      await expect(aviso).toBeVisible();
      await expect(page.locator(".app-lateral")).toHaveAttribute("data-abierto", "false");
      if (ancho >= 600) await expect.poll(() => page.locator(".app-lateral").evaluate((elemento) => elemento.getBoundingClientRect().width)).toBe(72);
      await expect(page.getByRole("heading", { name: "Gestión de clientes", exact: true })).toHaveCount(0);
      if (ancho < 600) await expect(page.locator(".app-lateral")).toHaveAttribute("data-abierto", "false");
      liberar();
      await expect(page.getByRole("heading", { name: "Gestión de clientes", exact: true })).toBeVisible();
      await expect(aviso).toHaveCount(0);
    } finally {
      liberar();
      await page.unrouteAll({ behavior: "wait" });
    }
  });
}
