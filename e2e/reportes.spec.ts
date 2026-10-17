import { expect, test } from "@playwright/test";

test("la pestaña de análisis carga alertas, tendencias, tiempos y reincidencias sin errores", async ({ page }) => {
  const erroresDeConsola: string[] = [];
  page.on("console", (mensaje) => {
    if (mensaje.type() === "error") erroresDeConsola.push(mensaje.text());
  });

  await page.goto("/reportes");
  await page.getByRole("tab", { name: "Análisis y alertas" }).click();

  await expect(page.getByRole("heading", { name: "Alertas de maquinaria" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Cómo evoluciona el mantenimiento?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Cuánto demoran las órdenes/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /vuelven una y otra vez/ })).toBeVisible();
  await expect(page.getByText(/No se pudieron obtener/)).toHaveCount(0);
  expect(erroresDeConsola).toEqual([]);
});
