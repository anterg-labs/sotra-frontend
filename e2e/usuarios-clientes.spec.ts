import { expect, test } from "@playwright/test";
import { buscarEnVivo } from "./filtros";
import { sufijo } from "./api";

function telefonoNumerico() {
  return String(Math.floor(10_000_000 + Math.random() * 89_999_999));
}

test("un cliente se registra, rechaza el duplicado junto al campo y se da de baja", async ({ page }) => {
  const id = sufijo();
  const razonSocial = "Cliente e2e " + id;

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Registrar nuevo cliente" }).click();
  await page.getByRole("button", { name: "Confirmar registro" }).click();
  await expect(page.locator("#razonSocial")).toBeFocused();

  await page.getByLabel("Nombre o razón social").fill(razonSocial);
  await page.getByLabel("Nombre de contacto").fill("Contacto " + id);
  await page.getByLabel("Correo electrónico (opcional)").fill(`cliente.${id}@pruebas.test`);
  await page.getByLabel("Número de teléfono o celular (opcional)").fill(telefonoNumerico());
  await page.getByRole("button", { name: "Confirmar registro" }).click();
  await expect(page.getByText("Cliente registrado.")).toBeVisible();

  await buscarEnVivo(page, page.getByLabel("Buscar"), razonSocial);
  const fila = page.getByRole("row", { name: new RegExp(razonSocial) });
  await expect(fila).toBeVisible();

  await page.getByRole("button", { name: "Registrar nuevo cliente" }).click();
  await page.getByLabel("Nombre o razón social").fill(razonSocial);
  await page.getByLabel("Nombre de contacto").fill("Otro contacto");
  await page.getByLabel("Correo electrónico (opcional)").fill(`cliente.${id}@pruebas.test`);
  await page.getByRole("button", { name: "Confirmar registro" }).click();
  await expect(page.getByRole("dialog").getByRole("alert").first()).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

  await fila.getByRole("button", { name: "Dar de baja" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Dar de baja" }).click();
  await expect(fila.getByText(/inactivo/i)).toBeVisible();
  await expect(fila.getByRole("button", { name: "Reactivar cliente" })).toBeVisible();
});

test("un usuario se crea con rol, valida el teléfono numérico y se da de baja", async ({ page }) => {
  // El alta crea el usuario en Keycloak y le envía un correo real para elegir la contraseña.
  test.skip(!process.env.SOTRA_E2E_ENVIAR_CORREOS, "Envía un correo real: correr con SOTRA_E2E_ENVIAR_CORREOS=1.");
  const id = sufijo();
  const correo = `usuario.${id}@pruebas.test`;

  await page.goto("/usuarios");
  await page.getByRole("button", { name: "Crear nuevo usuario" }).click();
  const formulario = page.getByRole("dialog");
  await formulario.getByLabel("Nombre", { exact: true }).fill("Prueba");
  await formulario.getByLabel("Apellido").fill("Automatica");
  await formulario.getByLabel("Correo electrónico").fill(correo);
  await formulario.getByLabel("Número de teléfono o celular").fill("abc123");
  await formulario.getByRole("checkbox", { name: "Técnico", exact: true }).check();
  await page.keyboard.press("Escape");
  await formulario.getByRole("button", { name: /^Confirmar|^Crear|^Registrar/ }).click();
  await expect(formulario.getByRole("alert").first()).toBeVisible();
  await expect(formulario.getByLabel("Número de teléfono o celular")).toBeFocused();

  await formulario.getByLabel("Número de teléfono o celular").fill(telefonoNumerico());
  await formulario.getByRole("button", { name: /^Confirmar|^Crear|^Registrar/ }).click();
  await expect(page.getByText(/Usuario creado. Se envió un correo a/)).toBeVisible();

  await buscarEnVivo(page, page.getByLabel("Buscar"), correo);
  const fila = page.getByRole("row", { name: new RegExp(id) });
  await expect(fila).toBeVisible();
  await fila.getByRole("button", { name: "Dar de baja" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Dar de baja" }).click();
  await expect(fila.getByText(/inactivo/i)).toBeVisible();
});
