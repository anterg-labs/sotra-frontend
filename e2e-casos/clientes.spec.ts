import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { buscarEnVivo } from "../e2e/filtros";
import {
  apiBase, bloqueado, caso, correoDeLargo, crearClienteApi, crearEscenarioApi, obtener, sufijo, telefonoUnico,
  textoDeAlertas, totalPorBusqueda, type ClienteApi,
} from "./casos";

const SIN_KEYCLOAK = "sin Keycloak";

type Datos = {
  razonSocial: string; nombreContacto: string; correo: string; telefono: string; direccion: string; observaciones: string;
};

function base(id: string): Datos {
  return {
    razonSocial: `qa-${id} Maquinarias del Norte S.A.`, nombreContacto: `qa-${id} Contacto`,
    correo: `qa-${id}@pruebas.test`, telefono: telefonoUnico(), direccion: "Av. Industria 1234", observaciones: "Cliente de prueba",
  };
}

function relleno(prefijo: string, caracter: string, largo: number) {
  return prefijo + caracter.repeat(largo - prefijo.length);
}

async function abrirAlta(page: Page) {
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Registrar nuevo cliente" }).click();
  const formulario = page.getByRole("dialog");
  await expect(formulario.locator("#razonSocial")).toBeVisible();
  return formulario;
}

async function llenar(formulario: Locator, d: Datos) {
  await formulario.locator("#razonSocial").fill(d.razonSocial);
  await formulario.locator("#nombreContacto").fill(d.nombreContacto);
  await formulario.locator("#correo").fill(d.correo);
  await formulario.locator("#telefono").fill(d.telefono);
  await formulario.locator("#direccion").fill(d.direccion);
  await formulario.locator("#observaciones").fill(d.observaciones);
}

async function enviarAlta(page: Page, formulario: Locator) {
  await formulario.getByRole("button", { name: "Confirmar registro" }).click();
  const exito = page.getByText("Cliente registrado.");
  const error = formulario.getByRole("alert").first();
  await exito.or(error).first().waitFor({ timeout: 15_000 });
  if (await exito.isVisible()) return { creado: true, alertas: [] as string[] };
  return { creado: false, alertas: await textoDeAlertas(page) };
}

async function buscarEnListado(page: Page, termino: string) {
  await buscarEnVivo(page, page.getByLabel("Buscar"), termino);
}

async function clienteEnApi(request: APIRequestContext, termino: string) {
  const { cuerpo } = await obtener<{ elementos: ClienteApi[] }>(request, `/api/v1/clientes?tamanoPagina=5&buscar=${encodeURIComponent(termino)}`);
  return cuerpo.elementos[0];
}

async function clientePorId(request: APIRequestContext, id: number) {
  return (await obtener<ClienteApi>(request, `/api/v1/clientes/${id}`)).cuerpo;
}

function rechazoAlta(
  tc: string, escenario: string, esperado: string, patron: RegExp,
  cambios: (id: string) => Partial<Datos>,
  previo?: (request: APIRequestContext) => Promise<Partial<Datos>>,
) {
  caso(tc, escenario, esperado, async ({ page, request }) => {
    const id = sufijo();
    let d: Datos = { ...base(id), ...cambios(id) };
    if (previo) d = { ...d, ...(await previo(request)) };
    const formulario = await abrirAlta(page);
    await llenar(formulario, d);
    const r = await enviarAlta(page, formulario);
    const guardados = await totalPorBusqueda(request, "clientes", `qa-${id}`);
    const coincide = r.alertas.some((a) => patron.test(a));
    const observado = r.creado
      ? "El sistema registró el cliente (se esperaba rechazo)."
      : `Rechazó con mensaje(s): ${JSON.stringify(r.alertas)}; cliente ${guardados ? "GUARDADO" : "no guardado"}; modal ${(await formulario.isVisible()) ? "sigue abierto con los datos" : "cerrado"}.`;
    return { ok: !r.creado && guardados === 0 && coincide, observado: coincide || r.creado ? observado : observado + ` Mensaje no coincide con ${patron}.` };
  });
}

/** Alta exitosa; si el valor de 1 carácter ya existe (unicidad), prueba con otro. */
function exitoAlta(
  tc: string, escenario: string, esperado: string, cambios: (id: string, intento: number) => Partial<Datos>,
  comprobar?: (c: ClienteApi) => string | null, reintentarPorUnicidad = false,
) {
  caso(tc, escenario, esperado, async ({ page, request }) => {
    const id = sufijo();
    let r = { creado: false, alertas: [] as string[] };
    let d = base(id);
    for (let intento = 0; intento < (reintentarPorUnicidad ? 40 : 1); intento++) {
      d = { ...base(id), ...cambios(id, intento) };
      const formulario = await abrirAlta(page);
      await llenar(formulario, d);
      r = await enviarAlta(page, formulario);
      if (r.creado || !r.alertas.some((a) => /registrad|existe/i.test(a))) break;
    }
    if (!r.creado) return { ok: false, observado: `No se registró; mensajes: ${JSON.stringify(r.alertas)}` };
    await buscarEnListado(page, `qa-${id}`);
    const fila = page.getByRole("row").filter({ hasText: `qa-${id}` });
    const visible = await fila.first().waitFor({ timeout: 10_000 }).then(() => true, () => false);
    const guardado = await clienteEnApi(request, `qa-${id}`);
    const problema = guardado && comprobar ? comprobar(guardado) : null;
    return {
      ok: visible && !!guardado && !problema,
      observado: `Aviso "Cliente registrado." mostrado; fila en listado: ${visible}; guardado en API: ${!!guardado}${problema ? "; " + problema : ""}.`,
    };
  });
}

// Pool amplio de letras de 1 carácter: la base local conserva los datos de corridas anteriores y los nombres son únicos.
const alfabeto = [..."EFGHIJKLMNOPQRSTUVWXYZABCDαβγδεζηθικλμνξοπρστυφχψωабвгдежзиклмнопрстуфхцчшщ"];
const inicioDelPool = Math.floor(Math.random() * alfabeto.length);

exitoAlta("TC337", "Alta de cliente con datos válidos", "Registra, confirma, lo incorpora al listado y persiste los datos.", () => ({}),
  (c) => (c.direccion === "Av. Industria 1234" && c.observaciones === "Cliente de prueba" ? null : "datos persistidos distintos"));
rechazoAlta("TC338", "Alta con Nombre o razón social vacío", "Impide el alta; razón social obligatoria.", /razón social.*obligatorio/i, () => ({ razonSocial: "" }));
rechazoAlta("TC339", "Alta con Nombre o razón social ya registrado", "Impide el alta; razón social ya registrada.", /(razón social|registrad)/i, () => ({}),
  async (request) => ({ razonSocial: (await crearClienteApi(request)).razonSocial }));
exitoAlta("TC340", "Alta con Nombre o razón social de 1 carácter", "Permite el alta con 1 carácter.",
  (_id, n) => ({ razonSocial: alfabeto[(inicioDelPool + n) % alfabeto.length] }), undefined, true);
exitoAlta("TC341", "Alta con Nombre o razón social de 160 caracteres", "Permite el alta y guarda 160 caracteres.",
  (id) => ({ razonSocial: relleno(`qa-${id} `, "E", 160) }), (c) => (c.razonSocial.length === 160 ? null : `razón social persistida de ${c.razonSocial.length}`));
rechazoAlta("TC342", "Alta con Nombre o razón social de 161 caracteres", "Impide el alta; supera 160.", /razón social.*160/i,
  (id) => ({ razonSocial: relleno(`qa-${id} `, "E", 161) }));
rechazoAlta("TC343", "Alta con Nombre de contacto vacío", "Impide el alta; contacto obligatorio.", /contacto.*obligatorio/i, () => ({ nombreContacto: "" }));
exitoAlta("TC344", "Alta con Nombre de contacto de 1 carácter", "Permite el alta con 1 carácter.",
  (_id, n) => ({ nombreContacto: alfabeto[(inicioDelPool + n + 7) % alfabeto.length].toLowerCase() }), undefined, true);
exitoAlta("TC345", "Alta con Nombre de contacto de 120 caracteres", "Permite el alta y guarda 120 caracteres.",
  (id) => ({ nombreContacto: relleno(`qa-${id} `, "C", 120) }), (c) => (c.nombreContacto.length === 120 ? null : `contacto persistido de ${c.nombreContacto.length}`));
rechazoAlta("TC346", "Alta con Nombre de contacto de 121 caracteres", "Impide el alta; supera 120.", /contacto.*120/i,
  (id) => ({ nombreContacto: relleno(`qa-${id} `, "C", 121) }));
exitoAlta("TC347", "Alta con campos opcionales vacíos", "Permite el alta con correo, teléfono, dirección y observaciones vacíos.",
  () => ({ correo: "", telefono: "", direccion: "", observaciones: "" }),
  (c) => ((c.correo ?? "") === "" && (c.telefono ?? "") === "" ? null : "los opcionales no quedaron vacíos"));
rechazoAlta("TC348", "Alta con Correo de formato inválido", "Impide el alta; error de formato en correo.", /correo.*formato/i, () => ({ correo: "cliente.sotra" }));
rechazoAlta("TC349", "Alta con Correo ya registrado", "Impide el alta; correo ya registrado.", /(correo|registrad)/i, () => ({}),
  async (request) => ({ correo: (await crearClienteApi(request)).correo ?? "" }));
exitoAlta("TC350", "Alta con Correo de 254 caracteres", "Permite el alta y guarda 254 caracteres.",
  (id) => ({ correo: correoDeLargo(254, id) }), (c) => ((c.correo ?? "").length === 254 ? null : `correo persistido de ${(c.correo ?? "").length}`));
rechazoAlta("TC351", "Alta con Correo de 255 caracteres", "Impide el alta; supera 254.", /correo.*254/i, (id) => ({ correo: correoDeLargo(255, id) }));
rechazoAlta("TC352", "Alta con Teléfono solo letras", "Impide el alta; error de validación en teléfono.", /Tel[eé]fono.*d[ií]gitos/i, () => ({ telefono: "abcdef" }));
rechazoAlta("TC353", "Alta con Teléfono ya registrado", "Impide el alta; teléfono ya registrado.", /(tel[eé]fono|registrad)/i, () => ({}),
  async (request) => ({ telefono: (await crearClienteApi(request)).telefono ?? "" }));
exitoAlta("TC354", "Alta con Teléfono de 30 dígitos", "Permite el alta y guarda 30 caracteres.",
  () => ({ telefono: "1" + Array.from({ length: 29 }, () => Math.floor(Math.random() * 10)).join("") }),
  (c) => ((c.telefono ?? "").length === 30 ? null : `teléfono persistido de ${(c.telefono ?? "").length}`));
rechazoAlta("TC355", "Alta con Teléfono de 31 dígitos", "Impide el alta; supera 30.", /tel[eé]fono.*30/i, () => ({ telefono: "1".repeat(31) }));
exitoAlta("TC356", "Alta con Dirección de 255 caracteres", "Permite el alta y guarda 255 caracteres.",
  () => ({ direccion: "D".repeat(255) }), (c) => ((c.direccion ?? "").length === 255 ? null : `dirección persistida de ${(c.direccion ?? "").length}`));
rechazoAlta("TC357", "Alta con Dirección de 256 caracteres", "Impide el alta; supera 255.", /direcci[oó]n.*255/i, () => ({ direccion: "D".repeat(256) }));

caso("TC358", "Cancelación del alta de cliente", "No crea ni persiste el cliente.", async ({ page, request }) => {
  const id = sufijo();
  const formulario = await abrirAlta(page);
  await llenar(formulario, base(id));
  await formulario.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const guardados = await totalPorBusqueda(request, "clientes", `qa-${id}`);
  return { ok: guardados === 0, observado: `Modal cerrado tras Cancelar (se confirma el descarte); clientes guardados con ese dato: ${guardados}.` };
});

bloqueado("TC359", "Un Técnico no puede registrar clientes", "Impide el acceso al alta o rechaza por falta de permisos.", SIN_KEYCLOAK,
  "La app no tiene sesión ni roles: cualquier visitante ve el botón 'Registrar nuevo cliente'. Los permisos por rol (Técnico) dependen de Keycloak.");

async function abrirEdicion(page: Page, c: ClienteApi) {
  await page.goto(`/clientes/${c.id}/editar`);
  await expect(page.getByRole("button", { name: "Confirmar modificación" })).toBeVisible();
  await expect(page.locator("#razonSocial")).toHaveValue(c.razonSocial);
}

async function confirmarEdicion(page: Page) {
  await page.getByRole("button", { name: "Confirmar modificación" }).click();
  const salio = page.waitForURL("**/clientes", { timeout: 15_000 }).then(() => "redirige", () => "");
  const error = page.locator("main").getByRole("alert").first().waitFor({ timeout: 15_000 }).then(() => "error", () => "");
  return Promise.race([salio, error]);
}

caso("TC360", "Modificación exitosa de cliente con datos válidos", "Actualiza, muestra confirmación y refleja los cambios en listado y detalle.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  await abrirEdicion(page, c);
  await page.locator("#direccion").fill("Ruta 5 km 20");
  await page.locator("#observaciones").fill("Datos actualizados");
  const resultado = await confirmarEdicion(page);
  const avisos = await page.getByRole("status").allTextContents().catch(() => []);
  const persistido = await clientePorId(request, c.id);
  await page.goto(`/clientes/${c.id}`);
  await page.getByRole("heading", { name: c.razonSocial }).waitFor({ timeout: 10_000 });
  const detalle = (await page.locator("main").textContent()) ?? "";
  const reflejado = detalle.includes("Ruta 5 km 20") && detalle.includes("Datos actualizados");
  const hayAviso = avisos.some((t) => t.trim().length > 0);
  return {
    ok: resultado === "redirige" && persistido.direccion === "Ruta 5 km 20" && reflejado && hayAviso,
    observado: `Resultado de la edición: ${resultado}; API: dirección "${persistido.direccion}"; detalle refleja cambios: ${reflejado}; aviso de confirmación: ${hayAviso} ${JSON.stringify(avisos)}.`,
  };
});

caso("TC361", "Modificación con Razón social de otro cliente", "Rechaza; razón social ya registrada para otro cliente.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  const otro = await crearClienteApi(request);
  await abrirEdicion(page, c);
  await page.locator("#razonSocial").fill(otro.razonSocial);
  const resultado = await confirmarEdicion(page);
  const alertas = await textoDeAlertas(page, "main");
  const actual = await clientePorId(request, c.id);
  return { ok: resultado === "error" && actual.razonSocial === c.razonSocial && alertas.some((a) => /razón social|registrad/i.test(a)), observado: `${resultado}; mensajes ${JSON.stringify(alertas)}; razón social en API ${actual.razonSocial === c.razonSocial ? "original" : "CAMBIADA"}.` };
});

caso("TC362", "Modificación con Nombre de contacto de otro cliente", "Rechaza; contacto ya registrado.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  const otro = await crearClienteApi(request);
  await abrirEdicion(page, c);
  await page.locator("#nombreContacto").fill(otro.nombreContacto);
  const resultado = await confirmarEdicion(page);
  const alertas = await textoDeAlertas(page, "main");
  const actual = await clientePorId(request, c.id);
  return { ok: resultado === "error" && actual.nombreContacto === c.nombreContacto && alertas.some((a) => /contacto|registrad/i.test(a)), observado: `${resultado}; mensajes ${JSON.stringify(alertas)}; contacto en API ${actual.nombreContacto === c.nombreContacto ? "original" : "CAMBIADO"}.` };
}, "bug del código o caso mal escrito (regla de unicidad del contacto no documentada)");

caso("TC363", "Modificación con Correo de formato inválido", "Rechaza y mantiene el valor registrado.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  await abrirEdicion(page, c);
  await page.locator("#correo").fill("cliente.sotra");
  const resultado = await confirmarEdicion(page);
  const alertas = await textoDeAlertas(page, "main");
  const actual = await clientePorId(request, c.id);
  return { ok: resultado === "error" && actual.correo === c.correo, observado: `${resultado}; mensajes ${JSON.stringify(alertas)}; correo en API ${actual.correo === c.correo ? "original" : "CAMBIADO"}.` };
});

caso("TC364", "Modificación con Teléfono ya registrado", "Rechaza; teléfono ya registrado.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  const otro = await crearClienteApi(request);
  await abrirEdicion(page, c);
  await page.locator("#telefono").fill(otro.telefono ?? "");
  const resultado = await confirmarEdicion(page);
  const alertas = await textoDeAlertas(page, "main");
  const actual = await clientePorId(request, c.id);
  return { ok: resultado === "error" && actual.telefono === c.telefono && alertas.some((a) => /tel[eé]fono|registrad/i.test(a)), observado: `${resultado}; mensajes ${JSON.stringify(alertas)}; teléfono en API ${actual.telefono === c.telefono ? "original" : "CAMBIADO"}.` };
});

caso("TC365", "Modificación vaciando los campos opcionales", "Permite la modificación con opcionales vacíos y conserva los obligatorios.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  await abrirEdicion(page, c);
  for (const campo of ["correo", "telefono", "direccion", "observaciones"]) await page.locator("#" + campo).fill("");
  const resultado = await confirmarEdicion(page);
  const actual = await clientePorId(request, c.id);
  const vacios = ["correo", "telefono", "direccion", "observaciones"].every((k) => ((actual as unknown as Record<string, string | null>)[k] ?? "") === "");
  return {
    ok: resultado === "redirige" && vacios && actual.razonSocial === c.razonSocial && actual.nombreContacto === c.nombreContacto,
    observado: `Resultado: ${resultado}; opcionales vacíos en API: ${vacios}; obligatorios conservados: ${actual.razonSocial === c.razonSocial && actual.nombreContacto === c.nombreContacto}.`,
  };
});

caso("TC366", "Visualización del listado de clientes", "Muestra razón social, contacto, correo, teléfono y cantidad de activos.", async ({ page, request }) => {
  const e = await crearEscenarioApi(request);
  const c = e.cliente;
  await page.goto("/clientes");
  await buscarEnListado(page, c.correo ?? c.razonSocial);
  const fila = page.getByRole("row").filter({ hasText: c.razonSocial });
  await expect(fila).toBeVisible();
  const encabezados = await page.locator("thead th").allTextContents();
  const celdas = await fila.locator("td").allTextContents();
  const ok = ["Razón social", "Contacto", "Correo electrónico", "Teléfono", "Activos asociados"].every((h) => encabezados.includes(h))
    && celdas[0] === c.razonSocial && celdas[1] === c.nombreContacto && celdas[2] === c.correo && celdas[3] === c.telefono && celdas[4] === "1";
  return { ok, observado: `Columnas: ${encabezados.join(" | ")}. Celdas: ${JSON.stringify(celdas.slice(0, 6))}.` };
});

caso("TC367", "Búsqueda de clientes por Nombre de contacto", "Muestra los clientes que coinciden con el contacto.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  await page.goto("/clientes");
  await buscarEnListado(page, c.nombreContacto);
  const filas = page.locator("tbody tr");
  await expect(filas.first()).toBeVisible();
  const textos = await filas.allTextContents();
  return { ok: textos.length >= 1 && textos.every((t) => t.includes(c.nombreContacto)), observado: `${textos.length} fila(s) para "${c.nombreContacto}".` };
});

caso("TC368", "Búsqueda de clientes por Nombre o razón social", "Muestra el cliente correspondiente.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  await page.goto("/clientes");
  await buscarEnListado(page, c.razonSocial);
  const filas = page.locator("tbody tr");
  await expect(filas.first()).toBeVisible();
  const textos = await filas.allTextContents();
  return { ok: textos.length === 1 && textos[0].includes(c.razonSocial), observado: `${textos.length} fila(s) para "${c.razonSocial}".` };
});

caso("TC369", "Búsqueda de clientes sin coincidencias", "Estado sin resultados sin clientes que no coincidan.", async ({ page }) => {
  await page.goto("/clientes");
  await buscarEnListado(page, "Cliente Inexistente XYZ " + sufijo());
  const vacio = page.getByText("No se encontraron clientes");
  await expect(vacio).toBeVisible();
  return { ok: (await page.locator("tbody tr").count()) === 0, observado: `Mensaje: "${(await vacio.textContent())?.trim()}"; filas: 0.` };
});

caso("TC370", "Activos asociados a un cliente", "Muestra los activos del cliente seleccionado.", async ({ page, request }) => {
  const e = await crearEscenarioApi(request);
  await page.goto(`/clientes/${e.cliente.id}`);
  await expect(page.getByRole("heading", { name: "Activos del cliente (1)" })).toBeVisible({ timeout: 15_000 });
  const enlace = page.getByRole("link", { name: new RegExp(e.activo.nombre) });
  await expect(enlace).toBeVisible();
  return { ok: true, observado: `Detalle muestra 'Activos del cliente (1)' con el enlace al activo "${e.activo.nombre}".` };
});

caso("TC371", "Historial de mantenimientos de un cliente", "Muestra el historial de mantenimientos del cliente.", async ({ page, request }) => {
  const e = await crearEscenarioApi(request);
  await page.goto(`/clientes/${e.cliente.id}`);
  await expect(page.getByRole("heading", { name: /Actividad/ })).toBeVisible();
  const fila = page.locator("tbody tr").filter({ hasText: String(e.ordenId) });
  await expect(fila.first()).toBeVisible({ timeout: 15_000 });
  return { ok: true, observado: `Detalle del cliente lista la orden ${e.ordenId} en 'Actividad: órdenes de trabajo del cliente'.` };
});

async function filaDeCliente(page: Page, c: ClienteApi) {
  await page.goto("/clientes");
  await buscarEnListado(page, c.razonSocial);
  const fila = page.getByRole("row").filter({ hasText: c.razonSocial });
  await expect(fila).toBeVisible();
  return fila;
}

caso("TC372", "Confirmación al dar de baja un cliente", "Solicita confirmación antes de desactivar.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  const fila = await filaDeCliente(page, c);
  await fila.getByRole("button", { name: "Dar de baja" }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  const texto = (await dialogo.textContent()) ?? "";
  const actual = await clientePorId(request, c.id);
  return { ok: actual.estado === "activo" && /Confirm/.test(texto), observado: `Diálogo: "${texto.trim().slice(0, 150)}"; estado en API aún: ${actual.estado}.` };
});

caso("TC373", "Cancelación de la baja de un cliente", "El cliente permanece Activo.", async ({ page, request }) => {
  const c = await crearClienteApi(request);
  const fila = await filaDeCliente(page, c);
  await fila.getByRole("button", { name: "Dar de baja" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const actual = await clientePorId(request, c.id);
  const activoEnFila = ((await fila.textContent()) ?? "").includes("Activo");
  return { ok: actual.estado === "activo" && activoEnFila, observado: `Estado API: ${actual.estado}; fila muestra Activo: ${activoEnFila}.` };
});

caso("TC374", "Baja exitosa de cliente desde el listado", "Desactiva, impide nuevas órdenes de sus activos y conserva la consulta de datos y actividad.", async ({ page, request }) => {
  const e = await crearEscenarioApi(request);
  const c = e.cliente;
  const fila = await filaDeCliente(page, c);
  await fila.getByRole("button", { name: "Dar de baja" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Dar de baja" }).click();
  await expect(fila.getByText("Inactivo")).toBeVisible();
  const actual = await clientePorId(request, c.id);
  const intento = await request.post(`${apiBase}/api/v1/ordenes-trabajo`, {
    data: {
      clienteId: c.id, activoId: e.activo.id, tecnicoId: e.tecnico.id, tipo: "correctivo", prioridad: "alta",
      descripcion: "qa-orden tras baja", observaciones: "", fechaPrevistaEjecucion: new Date().toISOString().slice(0, 10),
      sugerencias: [], repuestosIds: [],
    },
  });
  await page.goto(`/clientes/${c.id}`);
  const detalleVisible = await page.getByRole("heading", { name: c.razonSocial }).waitFor({ timeout: 10_000 }).then(() => true, () => false);
  const actividad = await page.locator("tbody tr").filter({ hasText: String(e.ordenId) }).first().waitFor({ timeout: 10_000 }).then(() => true, () => false);
  const bloquea = intento.status() >= 400 && intento.status() < 500;
  return {
    ok: actual.estado === "inactivo" && bloquea && detalleVisible && actividad,
    observado: `Listado muestra Inactivo (API ${actual.estado}); crear orden para activo del cliente inactivo respondió HTTP ${intento.status()}; detalle consultable: ${detalleVisible}; actividad histórica visible: ${actividad}.`,
  };
});
