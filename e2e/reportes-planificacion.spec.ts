import { expect, test } from "@playwright/test";

for (const ancho of [1366, 360]) {
  test(`mantenimiento planificado en horas a ${ancho} px`, async ({ page }, informacion) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    const errores: string[] = [];
    page.on("pageerror", (error) => errores.push(error.message));
    await page.goto("/reportes?abiertas=maquinaria");
    const bloque = page.getByRole("region", { name: "Mantenimiento planificado frente a reactivo en horas", exact: true });
    await expect(bloque).toBeVisible();
    await expect(bloque.getByText("Mantenimiento planificado en horas", { exact: true })).toBeVisible();
    const respuesta = await page.request.get("/api/v1/reportes/desempeno");
    expect(respuesta.ok()).toBeTruthy();
    const datos = await respuesta.json();
    expect(datos.planificacion).toBeDefined();
    const porcentaje = datos.planificacion.resumen.porcentajePlanificado;
    const texto = porcentaje === null ? "Sin dato" : new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(porcentaje) + " %";
    await expect(bloque.locator(".kpi-valor")).toHaveText(texto);
    await expect(bloque.getByText(/Incluye las pausas/)).toBeVisible();
    await bloque.getByRole("button", { name: "Ver como tabla" }).click();
    await expect(bloque.getByRole("table")).toBeVisible();
    await expect(bloque.getByRole("columnheader", { name: "Horas preventivas" })).toBeVisible();
    await bloque.getByRole("button", { name: "Ver gráfica" }).click();
    await bloque.getByText("Cómo se calcula", { exact: true }).click();
    await expect(bloque.getByText(/es tiempo transcurrido, no horas efectivas/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    expect(errores).toEqual([]);
    await page.screenshot({ path: informacion.outputPath(`a17-${ancho}.png`), fullPage: true, caret: "initial" });
  });
}
