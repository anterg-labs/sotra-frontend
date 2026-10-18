import { expect, test, type Page } from "@playwright/test";
import { apiBase, contarPorBusqueda, correrCaso, crearBase, crearTipo, sufijo, textoDeLargo } from "./ayudas";

async function abrirAlta(page: Page) {
  await page.goto("/activos/tipos");
  await page.getByRole("button", { name: "Registrar tipo", exact: true }).click();
  return page.getByRole("dialog");
}

async function buscarTipo(page: Page, texto: string) {
  await page.locator("#buscarTipo").fill(texto);
  await page.locator("#buscarTipo").press("Enter");
}

async function enviarAlta(page: Page, nombre: string) {
  const dialogo = page.getByRole("dialog");
  await dialogo.locator("#nombre").fill(nombre);
  await dialogo.getByRole("button", { name: "Confirmar registro" }).click();
}

test("TC601 Registro exitoso de tipo de máquina", async ({ page }) => {
  await correrCaso({
    caso: "TC601", escenario: "Registro exitoso de tipo de máquina con nombre válido", esperado: "Registra el tipo, figura en el listado y queda disponible para asociarlo a modelos.",
    ejecutar: async () => {
      const nombre = "qa-Tipo " + sufijo();
      await abrirAlta(page);
      await enviarAlta(page, nombre);
      await expect(page.getByText("Tipo de máquina registrado.")).toBeVisible();
      await buscarTipo(page, nombre);
      await expect(page.getByRole("row", { name: new RegExp(nombre) })).toBeVisible();
      await page.goto("/activos/modelos");
      await page.getByRole("button", { name: "Registrar modelo", exact: true }).click();
      await page.locator("#tipoMaquinaId").fill(nombre);
      await expect(page.getByRole("option", { name: nombre })).toBeVisible();
      return "Tipo registrado, visible en el listado y ofrecido en el selector de tipo del alta de modelo. Sin sesión: el rol no se verificó (sin Keycloak).";
    },
  });
});

test("TC602 Registro de tipo con Nombre vacío", async ({ page, request }) => {
  await correrCaso({
    caso: "TC602", escenario: "Registro fallido de tipo de máquina con Nombre vacío", esperado: "Impide el registro y muestra validación en Nombre.",
    ejecutar: async () => {
      const antes = (await contarPorBusqueda(request, "tipos-maquina", "")).total;
      await abrirAlta(page);
      await enviarAlta(page, "");
      await expect(page.getByRole("dialog").getByRole("alert").filter({ hasText: "El campo Nombre es obligatorio." })).toBeVisible();
      expect((await contarPorBusqueda(request, "tipos-maquina", "")).total).toBe(antes);
      return 'Muestra "El campo Nombre es obligatorio." y no se crea ningún tipo.';
    },
  });
});

test("TC603 Registro de tipo con Nombre de 60 caracteres", async ({ page, request }) => {
  await correrCaso({
    caso: "TC603", escenario: "Registro de tipo de máquina con Nombre de 60 caracteres", esperado: "Permite exactamente 60 caracteres.",
    ejecutar: async () => {
      const id = sufijo();
      await abrirAlta(page);
      await enviarAlta(page, textoDeLargo(60, id, "qa-T60-"));
      await expect(page.getByText("Tipo de máquina registrado.")).toBeVisible();
      expect((await contarPorBusqueda(request, "tipos-maquina", id)).total).toBe(1);
      return "Tipo de 60 caracteres registrado y presente en la API.";
    },
  });
});

test("TC604 Registro de tipo con Nombre de 61 caracteres", async ({ page, request }) => {
  await correrCaso({
    caso: "TC604", escenario: "Registro fallido de tipo de máquina con Nombre de 61 caracteres", esperado: "Rechaza 61 caracteres y no crea el registro.",
    ejecutar: async () => {
      const id = sufijo();
      await abrirAlta(page);
      await enviarAlta(page, textoDeLargo(61, id, "qa-T61-"));
      const alerta = page.getByRole("dialog").getByRole("alert").filter({ hasText: "no puede superar los 60 caracteres" });
      await expect(alerta).toBeVisible();
      expect((await contarPorBusqueda(request, "tipos-maquina", id)).total).toBe(0);
      return `Muestra "${await alerta.innerText()}" y no se crea el tipo.`;
    },
  });
});

test("TC605 Registro de tipo con nombre duplicado", async ({ page, request }) => {
  await correrCaso({
    caso: "TC605", escenario: "Registro fallido de tipo de máquina con nombre duplicado", esperado: "Rechaza el duplicado y conserva un único registro.",
    ejecutar: async () => {
      const id = sufijo();
      const tipo = await crearTipo(request, "qa-TipoDup " + id);
      await abrirAlta(page);
      await enviarAlta(page, tipo.nombre);
      const alerta = page.getByRole("dialog").getByRole("alert").first();
      await expect(alerta).toBeVisible();
      expect((await contarPorBusqueda(request, "tipos-maquina", id)).total).toBe(1);
      return `Rechazado con "${await alerta.innerText()}"; sigue habiendo un único tipo.`;
    },
  });
});

test("TC606 Listado y consulta de detalle de tipos", async ({ page, request }) => {
  await correrCaso({
    caso: "TC606", escenario: "Listado y consulta de detalle de tipos de máquina", esperado: "Muestra los tipos y su detalle con los modelos asociados; permite acceder a un modelo asociado.",
    ejecutar: async () => {
      const base = await crearBase(request);
      await page.goto("/activos/tipos");
      await buscarTipo(page, base.tipo.nombre);
      const fila = page.getByRole("row", { name: new RegExp(base.tipo.nombre) });
      await expect(fila).toBeVisible();
      await fila.getByRole("link", { name: "Ver detalle" }).click();
      const principal = page.getByRole("main");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(base.tipo.nombre);
      await expect(principal.getByRole("heading", { name: /Modelos de este tipo \(1\)/ })).toBeVisible();
      await principal.getByRole("link", { name: base.modelo.nombre }).click();
      await expect(page).toHaveURL(new RegExp(`/activos/modelos/${base.modelo.id}$`));
      return "Listado con el tipo, detalle con 1 modelo asociado y el enlace lleva al detalle del modelo.";
    },
  });
});

test("TC607 Modificación exitosa de tipo", async ({ page, request }) => {
  await correrCaso({
    caso: "TC607", escenario: "Modificación exitosa de tipo de máquina", esperado: "Guarda el nuevo nombre y lo refleja en detalle y listado.",
    ejecutar: async () => {
      const id = sufijo();
      const tipo = await crearTipo(request, "qa-TipoOrig " + id);
      const nuevo = "qa-TipoEd " + id;
      await page.goto(`/activos/tipos/${tipo.id}/editar`);
      await page.locator("#nombre").fill(nuevo);
      await page.getByRole("button", { name: "Confirmar modificación" }).click();
      await expect(page).toHaveURL(/\/activos\/tipos$/);
      await buscarTipo(page, nuevo);
      await expect(page.getByRole("row", { name: new RegExp(nuevo) })).toBeVisible();
      await page.goto(`/activos/tipos/${tipo.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(nuevo);
      return "Nombre actualizado en listado y detalle.";
    },
  });
});

test("TC608 Baja de tipo con confirmación", async ({ page, request }) => {
  await correrCaso({
    caso: "TC608", escenario: "Baja de tipo de máquina con confirmación", esperado: "Cambia a inactivo sin eliminar su información histórica.",
    ejecutar: async () => {
      const tipo = await crearTipo(request, "qa-TipoBaja " + sufijo());
      await page.goto("/activos/tipos");
      await buscarTipo(page, tipo.nombre);
      const fila = page.getByRole("row", { name: new RegExp(tipo.nombre) });
      await fila.getByRole("button", { name: "Dar de baja" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Dar de baja" }).click();
      await expect(fila.getByText("Inactivo")).toBeVisible();
      const r = await request.get(`${apiBase}/api/v1/tipos-maquina/${tipo.id}`);
      const cuerpo = await r.json();
      expect(cuerpo.estado).toBe("inactivo");
      expect(cuerpo.nombre).toBe(tipo.nombre);
      return "Fila en estado Inactivo; la API conserva el registro con su nombre.";
    },
  });
});

test("TC609 Cancelación de baja de tipo", async ({ page, request }) => {
  await correrCaso({
    caso: "TC609", escenario: "Cancelación de baja de tipo de máquina", esperado: "El tipo permanece activo.",
    ejecutar: async () => {
      const tipo = await crearTipo(request, "qa-TipoCanc " + sufijo());
      await page.goto("/activos/tipos");
      await buscarTipo(page, tipo.nombre);
      const fila = page.getByRole("row", { name: new RegExp(tipo.nombre) });
      await fila.getByRole("button", { name: "Dar de baja" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(fila.getByText("Activo", { exact: true })).toBeVisible();
      const r = await request.get(`${apiBase}/api/v1/tipos-maquina/${tipo.id}`);
      expect((await r.json()).estado).toBe("activo");
      return "Diálogo cerrado y el tipo sigue activo (UI y API).";
    },
  });
});
