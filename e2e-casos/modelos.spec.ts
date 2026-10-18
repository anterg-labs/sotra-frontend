import { expect, test, type Page } from "@playwright/test";
import {
  apiBase, contarPorBusqueda, correrCaso, crearActivo, crearBase, crearTipo, elegirOpcion, sufijo, textoDeLargo,
} from "./ayudas";

async function abrirAlta(page: Page) {
  await page.goto("/activos/modelos");
  await page.getByRole("button", { name: "Registrar modelo", exact: true }).click();
  return page.getByRole("dialog");
}

async function buscarModelo(page: Page, texto: string) {
  await page.locator("#buscarModelo").fill(texto);
  await page.locator("#buscarModelo").press("Enter");
}

async function enviarAlta(page: Page, nombre: string, tipo: string | null, descripcion?: string) {
  const dialogo = page.getByRole("dialog");
  await dialogo.locator("#nombre").fill(nombre);
  if (tipo) await elegirOpcion(page, "tipoMaquinaId", tipo);
  if (descripcion) await dialogo.locator("#descripcion").fill(descripcion);
  await dialogo.getByRole("button", { name: "Confirmar registro" }).click();
}

test("TC610 Registro exitoso de modelo de máquina", async ({ page, request }) => {
  await correrCaso({
    caso: "TC610", escenario: "Registro exitoso de modelo de máquina", esperado: "Registra el modelo, lo asocia al tipo y lo deja disponible para nuevos activos.",
    ejecutar: async () => {
      const id = sufijo();
      const tipo = await crearTipo(request, "qa-Tipo " + id);
      const nombre = "qa-Modelo " + id;
      await abrirAlta(page);
      await enviarAlta(page, nombre, tipo.nombre, "Descripción qa");
      await expect(page.getByText("Modelo de máquina registrado.")).toBeVisible();
      await buscarModelo(page, nombre);
      await expect(page.getByRole("row", { name: new RegExp(nombre) })).toBeVisible();
      const { elementos } = await contarPorBusqueda(request, "modelos-maquina", nombre);
      expect(elementos[0].tipoMaquinaId).toBe(tipo.id);
      await page.goto("/activos");
      await page.getByRole("button", { name: "Registrar nuevo activo" }).click();
      await page.locator("#modeloMaquinaId").fill(nombre);
      await expect(page.getByRole("option", { name: nombre })).toBeVisible();
      return "Modelo creado y asociado al tipo (API), visible en el listado y ofrecido en el selector de modelo del alta de activo. Sin sesión: rol no verificado (sin Keycloak).";
    },
  });
});

test("TC611 Registro de modelo sin Tipo de máquina", async ({ page, request }) => {
  await correrCaso({
    caso: "TC611", escenario: "Registro fallido de modelo sin seleccionar Tipo de máquina", esperado: "Impide el registro si no se selecciona tipo.",
    ejecutar: async () => {
      const nombre = "qa-SinTipo " + sufijo();
      await abrirAlta(page);
      await enviarAlta(page, nombre, null);
      const alerta = page.getByRole("dialog").getByRole("alert").filter({ hasText: "Debe seleccionar un tipo de máquina." });
      await expect(alerta).toBeVisible();
      expect((await contarPorBusqueda(request, "modelos-maquina", nombre)).total).toBe(0);
      return 'Muestra "Debe seleccionar un tipo de máquina." y no se crea el modelo.';
    },
  });
});

test("TC612 Registro de modelo con Nombre vacío", async ({ page, request }) => {
  await correrCaso({
    caso: "TC612", escenario: "Registro fallido de modelo con Nombre vacío", esperado: "Impide el registro y muestra la validación.",
    ejecutar: async () => {
      const tipo = await crearTipo(request, "qa-Tipo " + sufijo());
      const antes = (await contarPorBusqueda(request, "modelos-maquina", "")).total;
      await abrirAlta(page);
      await enviarAlta(page, "", tipo.nombre);
      await expect(page.getByRole("dialog").getByRole("alert").filter({ hasText: "El campo Nombre es obligatorio." })).toBeVisible();
      expect((await contarPorBusqueda(request, "modelos-maquina", "")).total).toBe(antes);
      return 'Muestra "El campo Nombre es obligatorio." y no se crea ningún modelo.';
    },
  });
});

test("TC613 Registro de modelo con Nombre de 60 caracteres", async ({ page, request }) => {
  await correrCaso({
    caso: "TC613", escenario: "Registro de modelo con Nombre de 60 caracteres", esperado: "Permite exactamente 60 caracteres.",
    ejecutar: async () => {
      const id = sufijo();
      const tipo = await crearTipo(request, "qa-Tipo " + id);
      const nombre = textoDeLargo(60, id, "qa-M60-");
      await abrirAlta(page);
      await enviarAlta(page, nombre, tipo.nombre);
      await expect(page.getByText("Modelo de máquina registrado.")).toBeVisible();
      expect((await contarPorBusqueda(request, "modelos-maquina", id)).total).toBe(1);
      return "Modelo de 60 caracteres registrado y presente en la API.";
    },
  });
});

test("TC614 Registro de modelo con Nombre de 61 caracteres", async ({ page, request }) => {
  await correrCaso({
    caso: "TC614", escenario: "Registro fallido de modelo con Nombre de 61 caracteres", esperado: "Rechaza 61 caracteres.",
    ejecutar: async () => {
      const id = sufijo();
      const tipo = await crearTipo(request, "qa-Tipo " + id);
      await abrirAlta(page);
      await enviarAlta(page, textoDeLargo(61, id, "qa-M61-"), tipo.nombre);
      const alerta = page.getByRole("dialog").getByRole("alert").filter({ hasText: "no puede superar los 60 caracteres" });
      await expect(alerta).toBeVisible();
      expect((await contarPorBusqueda(request, "modelos-maquina", id)).total).toBe(0);
      return `Muestra "${await alerta.innerText()}" y no se crea el modelo.`;
    },
  });
});

test("TC615 Registro de modelo con nombre duplicado", async ({ page, request }) => {
  await correrCaso({
    caso: "TC615", escenario: "Registro fallido de modelo con nombre duplicado", esperado: "Rechaza el modelo duplicado.",
    ejecutar: async () => {
      const base = await crearBase(request);
      await abrirAlta(page);
      await enviarAlta(page, base.modelo.nombre, base.tipo.nombre);
      const alerta = page.getByRole("dialog").getByRole("alert").first();
      await expect(alerta).toBeVisible();
      expect((await contarPorBusqueda(request, "modelos-maquina", base.id)).total).toBe(1);
      return `Rechazado con "${await alerta.innerText()}"; sigue habiendo un único modelo.`;
    },
  });
});

test("TC616 Listado y consulta de detalle de modelos", async ({ page, request }) => {
  await correrCaso({
    caso: "TC616", escenario: "Listado y consulta de detalle de modelos de máquina", esperado: "Muestra modelos y su tipo, descripción, estado y activos asociados; permite acceder a un activo asociado.",
    ejecutar: async () => {
      const base = await crearBase(request);
      const activo = await crearActivo(request, { clienteId: base.cliente.id, modeloMaquinaId: base.modelo.id, numSerie: "qa-mdet-" + base.id, nombre: "qa-ActivoM " + base.id });
      await page.goto("/activos/modelos");
      await buscarModelo(page, base.modelo.nombre);
      const fila = page.getByRole("row", { name: new RegExp(base.modelo.nombre) });
      await expect(fila).toBeVisible();
      await fila.getByRole("link", { name: "Ver detalle" }).click();
      const principal = page.getByRole("main");
      await expect(principal).toContainText(base.tipo.nombre);
      await expect(principal).toContainText("Modelo de prueba qa");
      await expect(principal).toContainText("Activo");
      await expect(principal.getByRole("heading", { name: /Activos de este modelo \(1\)/ })).toBeVisible();
      await principal.getByRole("link", { name: new RegExp(activo.numSerie) }).click();
      await expect(page).toHaveURL(new RegExp(`/activos/${activo.id}$`));
      return "Listado con el modelo, detalle con tipo, descripción, estado y 1 activo asociado; el enlace lleva al detalle del activo.";
    },
  });
});

test("TC617 Modificación exitosa de modelo", async ({ page, request }) => {
  await correrCaso({
    caso: "TC617", escenario: "Modificación exitosa de modelo de máquina", esperado: "Guarda y refleja Nombre, Tipo y Descripción en el detalle.",
    ejecutar: async () => {
      const base = await crearBase(request);
      const otroTipo = await crearTipo(request, "qa-Tipo2 " + base.id);
      const nuevoNombre = "qa-ModEd " + base.id;
      await page.goto(`/activos/modelos/${base.modelo.id}/editar`);
      await page.locator("#nombre").fill(nuevoNombre);
      await elegirOpcion(page, "tipoMaquinaId", otroTipo.nombre);
      await page.locator("#descripcion").fill("Descripción editada qa");
      await page.getByRole("button", { name: "Confirmar modificación" }).click();
      await expect(page).toHaveURL(/\/activos\/modelos$/);
      await page.goto(`/activos/modelos/${base.modelo.id}`);
      const principal = page.getByRole("main");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(nuevoNombre);
      await expect(principal).toContainText(otroTipo.nombre);
      await expect(principal).toContainText("Descripción editada qa");
      return "Detalle con nombre, tipo y descripción actualizados.";
    },
  });
});

test("TC618 Baja de modelo de máquina", async ({ page, request }) => {
  await correrCaso({
    caso: "TC618", escenario: "Baja de modelo de máquina", esperado: "Queda inactivo, conserva su información y no está disponible para nuevos activos.",
    ejecutar: async () => {
      const base = await crearBase(request);
      await page.goto("/activos/modelos");
      await buscarModelo(page, base.modelo.nombre);
      const fila = page.getByRole("row", { name: new RegExp(base.modelo.nombre) });
      await fila.getByRole("button", { name: "Dar de baja" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Dar de baja" }).click();
      await expect(fila.getByText("Inactivo")).toBeVisible();
      const r = await request.get(`${apiBase}/api/v1/modelos-maquina/${base.modelo.id}`);
      const cuerpo = await r.json();
      expect(cuerpo.estado).toBe("inactivo");
      expect(cuerpo.nombre).toBe(base.modelo.nombre);
      await page.goto("/activos");
      await page.getByRole("button", { name: "Registrar nuevo activo" }).click();
      await page.locator("#modeloMaquinaId").fill(base.modelo.nombre);
      await expect(page.getByText("Sin resultados")).toBeVisible();
      const intento = await request.post(`${apiBase}/api/v1/activos`, {
        data: { clienteId: base.cliente.id, modeloMaquinaId: base.modelo.id, numSerie: "qa-inact-" + base.id, nombre: null, ubicacion: null, descripcion: null, anioFabricacion: null },
      });
      if (intento.ok()) throw new Error(`El modelo quedó inactivo y fuera del selector, pero la API aceptó crear un activo con ese modelo inactivo (HTTP ${intento.status()}).`);
      return `Fila Inactivo, datos conservados, ausente del selector de activos y la API rechaza crear activos con él (HTTP ${intento.status()}).`;
    },
  });
});
