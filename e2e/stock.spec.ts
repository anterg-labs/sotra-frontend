import { expect, test } from "@playwright/test";
import { crearRepuesto } from "./api";

test("un repuesto bajo el mínimo muestra aviso e insignia, y al ingresar stock vuelve a normal", async ({ page, request }) => {
  const repuesto = await crearRepuesto(request, 2, 5);

  await page.goto("/repuestos?stock=bajo");
  const fila = page.getByRole("row", { name: new RegExp(repuesto.codigo) });
  await expect(fila.getByText("Stock bajo")).toBeVisible();
  await expect(page.getByRole("status", { name: "Alerta de stock insuficiente" })).toBeVisible();
  await expect(page.locator(".insignia-menu").first()).toBeVisible();

  await page.goto(`/repuestos/${repuesto.id}?ingresar=1`);
  await page.getByLabel("Cantidad a ingresar").fill("10");
  await page.getByLabel("Motivo del ingreso").fill("Compra e2e");
  await page.getByRole("button", { name: "Confirmar ingreso" }).click();

  await expect(page.getByText("Ingreso registrado correctamente")).toBeVisible();
  await expect(page.locator(".insignia-stock").first()).toHaveText(/Stock normal/);
});

test("un egreso mayor al stock se rechaza junto al campo y uno válido descuenta", async ({ page, request }) => {
  const repuesto = await crearRepuesto(request, 3, 1);

  await page.goto(`/repuestos/${repuesto.id}`);
  await page.getByRole("button", { name: "Registrar egreso" }).click();
  await page.getByLabel("Cantidad a retirar").fill("9");
  await page.getByLabel("Motivo del egreso").fill("Uso e2e");
  await page.getByRole("button", { name: "Confirmar egreso" }).click();
  await expect(page.getByText("No hay stock suficiente: disponible 3.")).toBeVisible();
  await expect(page.getByLabel("Cantidad a retirar")).toBeFocused();

  await page.getByLabel("Cantidad a retirar").fill("2");
  await page.getByRole("button", { name: "Confirmar egreso" }).click();
  await expect(page.getByText("Egreso registrado correctamente")).toBeVisible();
  await expect(page.locator(".insignia-stock").first()).toHaveText(/Stock bajo|Stock normal/);
});
