import { expect, test } from "@playwright/test";
import { apiBase, crearOrdenAsignada } from "./api";

const pngDeUnPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("una orden recorre su ciclo desde el escritorio con una evidencia y queda cerrada", async ({ page, request }) => {
  const { ordenId } = await crearOrdenAsignada(request);
  const consola: string[] = [];
  page.on("console", (mensaje) => {
    if (mensaje.type() === "error") consola.push(mensaje.text());
  });

  await page.goto(`/ordenes-trabajo/${ordenId}`);
  await expect(page.getByRole("heading", { name: `Orden de trabajo N° ${ordenId}` })).toBeVisible();

  await page.getByLabel("Actualizar estado").selectOption({ label: "En progreso" });
  await page.getByRole("button", { name: "Confirmar estado" }).click();
  await expect(page.getByRole("heading", { name: "Historial de estados" })).toBeVisible();
  await expect(page.getByLabel("Actualizar estado")).toBeVisible();

  await page.getByRole("button", { name: "Registrar evidencia" }).click();
  await page.getByRole("button", { name: "Confirmar evidencia" }).click();
  await expect(page.locator("#archivoEvidencia-error")).toBeVisible();

  await page.locator("#archivoEvidencia").setInputFiles({ name: "falla.png", mimeType: "image/png", buffer: pngDeUnPixel });
  await page.getByLabel("Observación o descripción").fill("Filtro con desgaste visible");
  await page.getByRole("button", { name: "Confirmar evidencia" }).click();
  await expect(page.getByText("Evidencia registrada correctamente.")).toBeVisible();
  await expect(page.getByText("Filtro con desgaste visible")).toBeVisible();

  await page.getByLabel("Actualizar estado").selectOption({ label: "En revisión" });
  await page.getByRole("button", { name: "Confirmar estado" }).click();
  await expect(page.getByLabel("Actualizar estado").locator("option", { hasText: "Cerrado" })).toHaveCount(1);

  await page.getByLabel("Actualizar estado").selectOption({ label: "Cerrado" });
  await page.getByRole("button", { name: "Confirmar estado" }).click();
  await expect(page.getByText("No hay cambios de estado disponibles para esta orden.")).toBeVisible();

  expect(consola).toEqual([]);
});

test("la edición detecta que otra persona modificó la orden y no pisa sus cambios", async ({ page, request }) => {
  const { ordenId } = await crearOrdenAsignada(request);

  await page.goto(`/ordenes-trabajo/${ordenId}/editar`);
  await expect(page.getByRole("button", { name: "Confirmar modificación" })).toBeVisible();

  const vigente = await (await request.get(`${apiBase}/api/v1/ordenes-trabajo/${ordenId}`)).json();
  const ajena = await request.put(`${apiBase}/api/v1/ordenes-trabajo/${ordenId}`, {
    data: {
      clienteId: vigente.clienteId, activoId: vigente.activoId, tecnicoId: vigente.tecnicoId, tipo: vigente.tipo,
      prioridad: vigente.prioridad, descripcion: "Descripción cambiada por otra persona", observaciones: "",
      fechaPrevistaEjecucion: vigente.fechaPrevistaEjecucion, sugerencias: [], repuestos: [], estado: vigente.estado,
    },
  });
  expect(ajena.ok()).toBe(true);

  await page.getByLabel("Descripción").first().fill("Mi edición con datos viejos");
  await page.getByRole("button", { name: "Confirmar modificación" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Otra persona modificó la orden" })).toBeVisible();
  const final = await (await request.get(`${apiBase}/api/v1/ordenes-trabajo/${ordenId}`)).json();
  expect(final.descripcion).toBe("Descripción cambiada por otra persona");
});
