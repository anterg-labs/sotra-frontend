import { expect, test } from "@playwright/test";
import { crearOrdenAsignada } from "./api";

test("el técnico ve su orden, la inicia y la pausa con motivo en un celular de 320 px sin desbordes", async ({ page, request }) => {
  const { ordenId, tecnicoId, nombreActivo } = await crearOrdenAsignada(request);
  const sinDesborde = async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto(`/tecnico?tecnicoId=${tecnicoId}`);
  await expect(page.getByRole("link", { name: new RegExp(nombreActivo) })).toBeVisible();
  await sinDesborde();

  await page.getByRole("link", { name: new RegExp(nombreActivo) }).click();
  await expect(page.getByRole("heading", { name: `Orden #${ordenId}` })).toBeVisible();
  await sinDesborde();

  await page.getByRole("group", { name: "Acciones de la orden" }).getByRole("button", { name: "Iniciar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Iniciar" }).click();
  await expect(page.getByText("Estado actualizado: En ejecución.")).toBeVisible();

  await page.getByRole("button", { name: "Pausar" }).click();
  await page.getByRole("button", { name: "Confirmar pausa" }).click();
  await expect(page.getByText("Indicá por qué pausás la orden.")).toBeVisible();
  await expect(page.getByLabel("Motivo de la pausa")).toBeFocused();
  await page.getByLabel("Motivo de la pausa").fill("Falta de material");
  await page.getByRole("button", { name: "Confirmar pausa" }).click();
  await expect(page.getByText("Estado actualizado: Pausada.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reanudar" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Cancelar orden|Cerrar/ })).toHaveCount(0);
});

test("el formulario de evidencias cabe en 320 px y valida junto al campo", async ({ page, request }) => {
  const { ordenId, tecnicoId } = await crearOrdenAsignada(request);

  await page.goto(`/tecnico/${ordenId}?tecnicoId=${tecnicoId}`);
  await page.getByRole("button", { name: "Registrar evidencia" }).click();
  await expect(page.getByLabel("Tipo de evidencia")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Confirmar evidencia" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});
