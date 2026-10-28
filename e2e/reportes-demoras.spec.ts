import { expect, test } from "@playwright/test";

for (const ancho of [1366, 360]) {
  test(`demoras por etapa y resumen a ${ancho} px`, async ({ page }, informacion) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    const errores: string[] = [];
    page.on("pageerror", error => errores.push(error.message));
    await page.goto("/reportes?abiertas=proceso");
    const resumen = ["Órdenes de trabajo registradas", "Tiempo promedio hasta el inicio", "Tiempo promedio hasta el cierre", "Atención necesaria"];
    const posiciones = [];
    for (const nombre of resumen) {
      const tarjeta = page.getByRole("heading", { name: nombre, exact: true }).locator("..");
      await expect(tarjeta).toBeVisible();
      posiciones.push((await tarjeta.boundingBox())!);
    }
    if (ancho > 1000) {
      expect(Math.max(...posiciones.map(p => p.y)) - Math.min(...posiciones.map(p => p.y))).toBeLessThan(2);
      expect(new Set(posiciones.map(p => Math.round(p.x))).size).toBe(4);
      expect(posiciones[3].x).toBeGreaterThan(posiciones[2].x);
    } else {
      expect(posiciones[1].y).toBeGreaterThan(posiciones[0].y);
      expect(posiciones[3].y).toBeGreaterThan(posiciones[2].y);
    }
    const bloque = page.getByRole("region", { name: "Demoras por etapa", exact: true });
    for (const nombre of ["Pendiente", "En progreso", "Revisión", "Pausa"]) {
      const etapa = bloque.getByRole("region", { name: nombre, exact: true });
      await expect(etapa.getByRole("img")).toBeVisible();
      await etapa.getByRole("button", { name: "Ver como tabla" }).click();
      await expect(etapa.getByRole("table")).toContainText("Media (promedio)");
      await etapa.getByRole("button", { name: "Ver gráfica" }).click();
    }
    const respuesta = page.waitForResponse(r => r.url().includes("demoras-etapas?") && r.url().includes("etapa=pausa"));
    await bloque.getByLabel("Etapa de las órdenes demoradas").selectOption("pausa");
    expect((await respuesta).ok()).toBeTruthy();
    await expect(bloque.getByText(/Página 1 de/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    expect(errores).toEqual([]);
    await bloque.screenshot({ path: informacion.outputPath(`a18-${ancho}.png`), caret: "initial" });
    await page.goto("/configuracion/demoras-etapas");
    for (const nombre of ["Pendiente", "En progreso", "Revisión", "Pausa"]) {
      await expect(page.getByLabel("Umbral en horas — " + nombre)).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Guardar", exact: true })).toHaveCount(4);
    expect(errores).toEqual([]);
  });
}
