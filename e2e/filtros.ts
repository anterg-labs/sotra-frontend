import { expect, type Locator, type Page } from "@playwright/test";

/** Región `aria-live` que anuncia «Cargando…» y el total del listado. */
export function regionDeResultados(page: Page) {
  return page.getByRole("status", { name: "Resultados del listado" });
}

/** Espera a que el listado termine de actualizarse tras cambiar un filtro (la URL cambia y la región anuncia el total). */
export async function esperarListadoActualizado(page: Page) {
  await expect(regionDeResultados(page)).toContainText(/resultado/i, { timeout: 15_000 });
  await expect(regionDeResultados(page)).not.toContainText("Cargando");
}

/** Escribe en el buscador del listado y espera el resultado: no hay botón «Aplicar filtros». */
export async function buscarEnVivo(page: Page, campo: Locator, texto: string) {
  const termino = texto.trim();
  await campo.fill(texto);
  await page.waitForURL((url) => (url.searchParams.get("buscar") ?? "") === termino, { timeout: 15_000 });
  await esperarListadoActualizado(page);
}
