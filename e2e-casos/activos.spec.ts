import { expect, test, type Page } from "@playwright/test";
import { buscarEnVivo } from "../e2e/filtros";
import {
  contarPorBusqueda, correrCaso, crearActivo, crearBase, apiBase, elegirOpcion, sufijo, textoDeLargo,
} from "./ayudas";

type Base = Awaited<ReturnType<typeof crearBase>>;
type Campos = { nombre?: string; serie?: string; anio?: string; ubicacion?: string; sinCliente?: boolean; sinModelo?: boolean };

async function abrirAlta(page: Page) {
  await page.goto("/activos");
  await page.getByRole("button", { name: "Registrar nuevo activo" }).click();
  return page.getByRole("dialog");
}

async function completarAlta(page: Page, base: Base, c: Campos) {
  const dialogo = page.getByRole("dialog");
  if (c.nombre !== undefined) await dialogo.locator("#nombre").fill(c.nombre);
  if (c.serie !== undefined) await dialogo.locator("#numeroSerie").fill(c.serie);
  if (!c.sinCliente) await elegirOpcion(page, "clienteId", base.cliente.razonSocial);
  if (!c.sinModelo) await elegirOpcion(page, "modeloMaquinaId", base.modelo.nombre);
  if (c.anio !== undefined) await dialogo.locator("#anioFabricacion").fill(c.anio);
  if (c.ubicacion !== undefined) await dialogo.locator("#ubicacion").fill(c.ubicacion);
  await dialogo.getByRole("button", { name: "Confirmar registro" }).click();
}

async function buscarEnListado(page: Page, texto: string) {
  await buscarEnVivo(page, page.locator("#buscarActivo"), texto);
}

const registroExitoso = [
  { caso: "TC620", escenario: "Registro de activo con solo campos obligatorios", campos: (id: string): Campos => ({ serie: "qa-ob-" + id }), esperado: "Permite registrar con Cliente, Modelo y Número de serie válidos." },
  { caso: "TC624", escenario: "Registro con Número de serie de 100 caracteres", campos: (id: string): Campos => ({ serie: textoDeLargo(100, id) }), esperado: "Permite un Número de serie de exactamente 100 caracteres." },
  { caso: "TC627", escenario: "Registro con año de fabricación 1900", campos: (id: string): Campos => ({ serie: "qa-1900-" + id, anio: "1900" }), esperado: "Acepta el año 1900." },
  { caso: "TC628", escenario: "Registro con año de fabricación 2100", campos: (id: string): Campos => ({ serie: "qa-2100-" + id, anio: "2100" }), esperado: "Acepta el año 2100." },
];

for (const c of registroExitoso) {
  test(`${c.caso} ${c.escenario}`, async ({ page, request }) => {
    await correrCaso({
      caso: c.caso, escenario: c.escenario, esperado: c.esperado,
      ejecutar: async () => {
        const base = await crearBase(request);
        const campos = c.campos(base.id);
        await abrirAlta(page);
        await completarAlta(page, base, campos);
        await expect(page.getByText("Activo registrado.")).toBeVisible();
        const { total } = await contarPorBusqueda(request, "activos", campos.serie!);
        expect(total).toBe(1);
        await buscarEnListado(page, campos.serie!);
        await expect(page.getByRole("row", { name: new RegExp(campos.serie!) })).toBeVisible();
        return `Aviso "Activo registrado.", un único activo en la API y visible en el listado (serie de ${campos.serie!.length} caracteres${campos.anio ? ", año " + campos.anio : ""}).`;
      },
    });
  });
}

const registroRechazado = [
  { caso: "TC621", escenario: "Registro sin cliente", campos: (id: string): Campos => ({ serie: "qa-sc-" + id, sinCliente: true }), mensaje: "Debe seleccionar un cliente.", esperado: "Impide el registro sin cliente." },
  { caso: "TC622", escenario: "Registro sin modelo", campos: (id: string): Campos => ({ serie: "qa-sm-" + id, sinModelo: true }), mensaje: "Debe seleccionar un modelo de máquina.", esperado: "Impide el registro sin modelo." },
  { caso: "TC623", escenario: "Registro con Número de serie vacío", campos: (): Campos => ({ serie: "" }), mensaje: "El campo Número de serie es obligatorio.", esperado: "Impide el registro con Número de serie vacío." },
  { caso: "TC625", escenario: "Registro con Número de serie de 101 caracteres", campos: (id: string): Campos => ({ serie: textoDeLargo(101, id) }), mensaje: "no puede superar los 100 caracteres", esperado: "Rechaza 101 caracteres." },
  { caso: "TC629", escenario: "Registro con año 1899", campos: (id: string): Campos => ({ serie: "qa-1899-" + id, anio: "1899" }), mensaje: "entre 1900 y 2100", esperado: "Rechaza el año 1899." },
  { caso: "TC630", escenario: "Registro con año 2101", campos: (id: string): Campos => ({ serie: "qa-2101-" + id, anio: "2101" }), mensaje: "entre 1900 y 2100", esperado: "Rechaza el año 2101." },
  { caso: "TC631", escenario: "Registro con Nombre interno de 101 caracteres", campos: (id: string): Campos => ({ serie: "qa-n101-" + id, nombre: textoDeLargo(101, id) }), mensaje: "no puede superar los 100 caracteres", esperado: "Rechaza Nombre interno de 101 caracteres." },
  { caso: "TC632", escenario: "Registro con Ubicación de 151 caracteres", campos: (id: string): Campos => ({ serie: "qa-u151-" + id, ubicacion: textoDeLargo(151, id) }), mensaje: "no puede superar los 150 caracteres", esperado: "Rechaza Ubicación de 151 caracteres." },
];

for (const c of registroRechazado) {
  test(`${c.caso} ${c.escenario}`, async ({ page, request }) => {
    await correrCaso({
      caso: c.caso, escenario: c.escenario, esperado: c.esperado,
      ejecutar: async () => {
        const base = await crearBase(request);
        const campos = c.campos(base.id);
        await abrirAlta(page);
        await completarAlta(page, base, campos);
        const dialogo = page.getByRole("dialog");
        const alerta = dialogo.getByRole("alert").filter({ hasText: c.mensaje });
        await expect(alerta.first()).toBeVisible();
        await expect(dialogo).toBeVisible();
        await expect(page.getByText("Activo registrado.")).toHaveCount(0);
        if (campos.serie) expect((await contarPorBusqueda(request, "activos", campos.serie)).total).toBe(0);
        const detalle = await alerta.first().innerText();
        return `El formulario no se envió y muestra "${detalle}"; no se creó el activo.`;
      },
    });
  });
}

test("TC626 Registro con Número de serie duplicado", async ({ page, request }) => {
  await correrCaso({
    caso: "TC626", escenario: "Registro con Número de serie duplicado", esperado: "Impide crear un segundo activo con el mismo Número de serie.",
    ejecutar: async () => {
      const base = await crearBase(request);
      const serie = "qa-dup-" + base.id;
      await crearActivo(request, { clienteId: base.cliente.id, modeloMaquinaId: base.modelo.id, numSerie: serie });
      await abrirAlta(page);
      await completarAlta(page, base, { serie });
      const dialogo = page.getByRole("dialog");
      await expect(dialogo.getByRole("alert").first()).toBeVisible();
      const texto = await dialogo.getByRole("alert").first().innerText();
      expect((await contarPorBusqueda(request, "activos", serie)).total).toBe(1);
      return `Rechazado con el mensaje "${texto}"; sigue habiendo un único activo con esa serie.`;
    },
  });
});

test("TC619 Registro exitoso de activo con todos los datos", async ({ page, request }) => {
  await correrCaso({
    caso: "TC619", escenario: "Registro exitoso de activo con datos válidos", esperado: "Registra el activo asociado al cliente y modelo elegidos y lo muestra en el listado.",
    ejecutar: async () => {
      const base = await crearBase(request);
      const serie = "qa-full-" + base.id;
      await abrirAlta(page);
      await page.getByRole("dialog").locator("#descripcion").fill("Descripción completa qa");
      await completarAlta(page, base, { serie, nombre: "qa-Activo " + base.id, anio: "2022", ubicacion: "Planta 3" });
      await expect(page.getByText("Activo registrado.")).toBeVisible();
      await buscarEnListado(page, serie);
      const fila = page.getByRole("row", { name: new RegExp(serie) });
      await expect(fila).toContainText(base.cliente.razonSocial);
      await expect(fila).toContainText(base.modelo.nombre);
      return "Activo registrado; en el listado aparece con el cliente y el modelo seleccionados. Sin sesión (no hay Keycloak): el rol Jefe de Mantenimiento no se pudo verificar.";
    },
  });
});

async function activoConBase(request: Parameters<typeof crearBase>[0], etiqueta: string) {
  const base = await crearBase(request);
  const activo = await crearActivo(request, { clienteId: base.cliente.id, modeloMaquinaId: base.modelo.id, numSerie: `qa-${etiqueta}-${base.id}`, nombre: `qa-Activo ${etiqueta} ${base.id}` });
  return { base, activo };
}

test("TC633 Listado y consulta de detalle de activos", async ({ page, request }) => {
  await correrCaso({
    caso: "TC633", escenario: "Listado y consulta de detalle de activos", esperado: "Muestra los activos y permite consultar datos, cliente, modelo, tipo y estado.",
    ejecutar: async () => {
      const { base, activo } = await activoConBase(request, "det");
      await page.goto("/activos");
      await buscarEnListado(page, activo.numSerie);
      const fila = page.getByRole("row", { name: new RegExp(activo.numSerie) });
      await expect(fila).toBeVisible();
      await fila.getByRole("link", { name: "Ver detalle" }).click();
      await expect(page).toHaveURL(/\/activos\/\d+$/);
      const principal = page.getByRole("main");
      await expect(principal).toContainText(base.modelo.nombre);
      await expect(principal).toContainText(activo.numSerie);
      await expect(principal).toContainText(base.cliente.razonSocial);
      await expect(principal).toContainText("Activo");
      const texto = await principal.innerText();
      if (!texto.includes(base.tipo.nombre)) {
        throw new Error(`El detalle del activo muestra serie, cliente, modelo y estado, pero no muestra el Tipo de máquina "${base.tipo.nombre}" (solo se llega al tipo navegando por el modelo).`);
      }
      return "Detalle con serie, cliente, modelo, tipo y estado.";
    },
  });
});

test("TC634 Modificación exitosa de activo", async ({ page, request }) => {
  await correrCaso({
    caso: "TC634", escenario: "Modificación exitosa de activo", esperado: "Guarda los cambios y los refleja en el detalle.",
    ejecutar: async () => {
      const { activo } = await activoConBase(request, "mod");
      const nuevoNombre = "qa-Editado " + sufijo();
      await page.goto(`/activos/${activo.id}/editar`);
      await page.locator("#nombre").fill(nuevoNombre);
      await page.locator("#ubicacion").fill("Ubicación editada qa");
      await page.locator("#anioFabricacion").fill("2018");
      await page.getByRole("button", { name: "Confirmar modificación" }).click();
      await expect(page).toHaveURL(/\/activos$/);
      await page.goto(`/activos/${activo.id}`);
      const principal = page.getByRole("main");
      await expect(principal).toContainText("Ubicación editada qa");
      await expect(principal).toContainText("2018");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(nuevoNombre);
      return "Tras confirmar vuelve al listado y el detalle refleja nombre, ubicación y año nuevos.";
    },
  });
});

test("TC635 Modificación con Número de serie duplicado", async ({ page, request }) => {
  await correrCaso({
    caso: "TC635", escenario: "Modificación fallida con Número de serie duplicado", esperado: "Rechaza el cambio si la serie pertenece a otro activo.",
    ejecutar: async () => {
      const a = await activoConBase(request, "ma");
      const b = await activoConBase(request, "mb");
      await page.goto(`/activos/${a.activo.id}/editar`);
      await page.locator("#numeroSerie").fill(b.activo.numSerie);
      await page.getByRole("button", { name: "Confirmar modificación" }).click();
      const alerta = page.locator("[role=alert]").filter({ hasText: /\S/ }).first();
      await expect(alerta).toBeVisible();
      const texto = await alerta.innerText();
      const r = await request.get(`${apiBase}/api/v1/activos/${a.activo.id}`);
      expect((await r.json()).numSerie).toBe(a.activo.numSerie);
      await expect(page).toHaveURL(/editar/);
      return `Rechazado con "${texto}"; el activo conserva su serie original.`;
    },
  });
});

test("TC636 Baja de activo con confirmación", async ({ page, request }) => {
  await correrCaso({
    caso: "TC636", escenario: "Baja de activo con confirmación", esperado: "Queda inactivo, conserva su historial y no está disponible para nuevas órdenes de trabajo.",
    ejecutar: async () => {
      const { base, activo } = await activoConBase(request, "baja");
      await page.goto("/activos");
      await buscarEnListado(page, activo.numSerie);
      const fila = page.getByRole("row", { name: new RegExp(activo.numSerie) });
      await fila.getByRole("button", { name: "Dar de baja" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Dar de baja" }).click();
      await expect(fila.getByText("Inactivo")).toBeVisible();
      const r = await request.get(`${apiBase}/api/v1/activos/${activo.id}`);
      const cuerpo = await r.json();
      expect(cuerpo.estado).toBe("inactivo");
      expect(cuerpo.numSerie).toBe(activo.numSerie);
      const orden = await request.post(`${apiBase}/api/v1/ordenes-trabajo`, {
        data: {
          clienteId: base.cliente.id, activoId: activo.id, tipo: "correctivo", prioridad: "alta", descripcion: "Orden qa sobre activo inactivo",
          observaciones: "", fechaPrevistaEjecucion: new Date().toISOString().slice(0, 10), sugerencias: [], repuestosIds: [],
        },
      });
      if (orden.ok()) throw new Error(`El activo quedó inactivo (datos conservados) pero la API aceptó crear una orden de trabajo sobre él (HTTP ${orden.status()}).`);
      return `Fila en estado Inactivo, datos conservados y la API rechaza nuevas órdenes (HTTP ${orden.status()}).`;
    },
  });
});

test("TC637 Cancelación de baja de activo", async ({ page, request }) => {
  await correrCaso({
    caso: "TC637", escenario: "Cancelación de baja de activo", esperado: "El activo permanece activo.",
    ejecutar: async () => {
      const { activo } = await activoConBase(request, "canc");
      await page.goto("/activos");
      await buscarEnListado(page, activo.numSerie);
      const fila = page.getByRole("row", { name: new RegExp(activo.numSerie) });
      await fila.getByRole("button", { name: "Dar de baja" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(fila.getByText("Activo", { exact: true })).toBeVisible();
      const r = await request.get(`${apiBase}/api/v1/activos/${activo.id}`);
      expect((await r.json()).estado).toBe("activo");
      return "Se cerró el diálogo y el activo sigue activo (UI y API).";
    },
  });
});
