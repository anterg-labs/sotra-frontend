import { expect, test } from "@playwright/test";
import { buscarEnVivo } from "./filtros";
import { apiBase, sufijo } from "./api";
const cargas = [
  "<img src=x onerror=\"window.__xss=1\">",
  "<script>window.__xss=1</script>",
  "\"><svg onload=window.__xss=1>",
  "javascript:window.__xss=1",
];

test("el texto hostil guardado se muestra como texto y no ejecuta código en listados ni detalles", async ({ page, request }) => {
  const id = sufijo();
  const ids: number[] = [];
  for (const [i, carga] of cargas.entries()) {
    const respuesta = await request.post(`${apiBase}/api/v1/clientes`, {
      data: {
        razonSocial: `xss-${id}-${i} ${carga}`, nombreContacto: `contacto-${id}-${i} ${carga}`,
        correo: `xss.${id}.${i}@pruebas.test`, telefono: String(30000000 + Math.floor(Math.random() * 9000000) + i),
        direccion: carga, observaciones: carga,
      },
    });
    expect(respuesta.ok()).toBe(true);
    ids.push((await respuesta.json()).id);
  }

  const dialogos: string[] = [];
  page.on("dialog", async (dialogo) => {
    dialogos.push(dialogo.message());
    await dialogo.dismiss();
  });

  await page.goto("/clientes");
  await buscarEnVivo(page, page.getByLabel("Buscar"), `xss-${id}`);
  await expect(page.getByRole("row", { name: new RegExp(`xss-${id}-0`) })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("<script>");

  for (const clienteId of ids) {
    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByRole("heading").first()).toBeVisible();
  }

  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  expect(dialogos).toEqual([]);
  expect(await page.locator("main script, main img[src='x'], main svg[onload]").count()).toBe(0);
});
