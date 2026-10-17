import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { buscarEnVivo, esperarListadoActualizado } from "../e2e/filtros";
import {
  bloqueado, caso, correoDeLargo, crearEscenarioApi, crearUsuarioApi, obtener, sufijo, telefonoUnico,
  textoDeAlertas, totalPorBusqueda, type UsuarioApi,
} from "./casos";

const SIN_KEYCLOAK = "sin Keycloak";

type Datos = { nombre: string; apellido: string; correo: string; telefono: string; contrasena: string; rol: string | null };

function letras(n = 6) {
  return Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
}

function base(id: string): Datos {
  return {
    nombre: "Juan" + letras(), apellido: "Perez", correo: `qa-${id}@pruebas.test`, telefono: telefonoUnico(),
    contrasena: "Temporal1!", rol: "Técnico",
  };
}

async function abrirAlta(page: Page) {
  await page.goto("/usuarios");
  await page.getByRole("button", { name: "Crear nuevo usuario" }).click();
  const formulario = page.getByRole("dialog");
  await expect(formulario.getByLabel("Nombre", { exact: true })).toBeVisible();
  return formulario;
}

async function llenar(formulario: Locator, page: Page, d: Datos) {
  await formulario.getByLabel("Nombre", { exact: true }).fill(d.nombre);
  await formulario.getByLabel("Apellido").fill(d.apellido);
  await formulario.getByLabel("Correo electrónico").fill(d.correo);
  await formulario.getByLabel("Número de teléfono").fill(d.telefono);
  await formulario.getByLabel("Contraseña").fill(d.contrasena);
  if (d.rol) {
    await formulario.getByRole("combobox", { name: "Roles" }).click();
    await page.locator("button.combobox-opcion", { hasText: d.rol }).click();
    await formulario.getByRole("heading").first().click();
  }
}

/** Envía el alta y espera el aviso de éxito o un error visible. Devuelve lo que se vio. */
async function enviarAlta(page: Page, formulario: Locator) {
  await formulario.getByRole("button", { name: /Confirmar creación/ }).click();
  const exito = page.getByText("Usuario creado.");
  const error = formulario.getByRole("alert").first();
  await exito.or(error).first().waitFor({ timeout: 15_000 });
  if (await exito.isVisible()) return { creado: true, alertas: [] as string[] };
  return { creado: false, alertas: await textoDeAlertas(page) };
}

async function buscarEnListado(page: Page, termino: string) {
  await buscarEnVivo(page, page.getByLabel("Buscar"), termino);
}

async function usuarioEnApi(request: APIRequestContext, correo: string) {
  const { cuerpo } = await obtener<{ elementos: UsuarioApi[] }>(request, `/api/v1/usuarios?buscar=${encodeURIComponent(correo)}`);
  return cuerpo.elementos.find((u) => u.correo === correo);
}

/** Alta que debe rechazarse: valida el mensaje junto al campo y que no se haya guardado el usuario. */
function rechazo(
  tc: string, escenario: string, esperado: string, patron: RegExp,
  cambios: (id: string) => Partial<Datos>,
  previo?: (request: APIRequestContext, d: Datos) => Promise<Partial<Datos> | void>,
) {
  caso(tc, escenario, esperado, async ({ page, request }) => {
    const id = sufijo();
    let d: Datos = { ...base(id), ...cambios(id) };
    let correoPrevio = false;
    if (previo) {
      const extra = (await previo(request, d)) ?? {};
      correoPrevio = "correo" in extra;
      d = { ...d, ...extra };
    }
    const formulario = await abrirAlta(page);
    await llenar(formulario, page, d);
    const r = await enviarAlta(page, formulario);
    const guardado = (await totalPorBusqueda(request, "usuarios", d.correo || d.nombre)) > (correoPrevio ? 1 : 0);
    const coincide = r.alertas.some((a) => patron.test(a));
    const observado = r.creado
      ? "El sistema creó el usuario (se esperaba rechazo)."
      : `Rechazó con mensaje(s): ${JSON.stringify(r.alertas)}; usuario ${guardado ? "GUARDADO" : "no guardado"}; modal ${(await formulario.isVisible()) ? "sigue abierto con los datos" : "cerrado"}.`;
    return { ok: !r.creado && !guardado && coincide, observado: coincide || r.creado ? observado : observado + ` Mensaje no coincide con ${patron}.` };
  });
}

/** Alta que debe aceptarse: verifica aviso, fila en el listado y persistencia. */
function exito(
  tc: string, escenario: string, esperado: string, cambios: (id: string) => Partial<Datos>,
  comprobar?: (u: UsuarioApi, d: Datos) => string | null,
) {
  caso(tc, escenario, esperado, async ({ page, request }) => {
    const id = sufijo();
    const d: Datos = { ...base(id), ...cambios(id) };
    const formulario = await abrirAlta(page);
    await llenar(formulario, page, d);
    const r = await enviarAlta(page, formulario);
    if (!r.creado) return { ok: false, observado: `No se creó; mensajes: ${JSON.stringify(r.alertas)}` };
    await buscarEnListado(page, d.correo);
    const fila = page.getByRole("row").filter({ hasText: d.correo.slice(0, 40) });
    const visible = await fila.first().waitFor({ timeout: 10_000 }).then(() => true, () => false);
    const guardado = await usuarioEnApi(request, d.correo);
    const problema = guardado && comprobar ? comprobar(guardado, d) : null;
    return {
      ok: visible && !!guardado && !problema,
      observado: `Aviso "Usuario creado." mostrado; fila en listado: ${visible}; guardado en API: ${!!guardado}${problema ? "; " + problema : ""}.`,
    };
  });
}


exito("TC211", "Alta de usuario con datos válidos", "Crea el usuario, confirma, lo muestra en el listado y lo persiste.",
  () => ({ nombre: "Roberto", apellido: "Pérez", contrasena: "PFL_Secure_2024!" }),
  (u, d) => (u.nombre === d.nombre && u.telefono === d.telefono ? null : "datos persistidos distintos"));

rechazo("TC213", "Alta con Nombre vacío", "No envía; mensaje claro de Nombre obligatorio.", /Nombre.*obligatorio/i, () => ({ nombre: "" }));
rechazo("TC275", "Alta con Nombre con caracteres no permitidos", "Impide el alta; mensaje de caracteres no permitidos en Nombre.", /Nombre.*(solo admite|no permitid)/i, () => ({ nombre: "Juan@#$%" }));
rechazo("TC276", "Alta con Nombre de 101 caracteres", "Impide el alta; Nombre excede el límite.", /Nombre.*(superar|excede).*100/i, () => ({ nombre: "a".repeat(101) }));
exito("TC277", "Alta con Nombre de 100 caracteres", "Permite el alta y persiste el nombre íntegro.", () => ({ nombre: "a".repeat(100) }),
  (u) => (u.nombre.length === 100 ? null : `nombre persistido de ${u.nombre.length} caracteres`));
exito("TC278", "Alta con Nombre de 1 carácter", "Permite el alta y lo muestra en el listado.", () => ({ nombre: "A" }));
rechazo("TC279", "Alta con Apellido vacío", "Impide el alta; Apellido requerido.", /Apellido.*obligatorio/i, () => ({ apellido: "" }));
rechazo("TC280", "Alta con Apellido con caracteres no permitidos", "Impide el alta; mensaje de caracteres no permitidos en Apellido.", /Apellido.*(solo admite|no permitid)/i, () => ({ apellido: "Pérez@#$%" }));
rechazo("TC282", "Alta con Apellido de 101 caracteres", "Impide el alta; supera el máximo de 100.", /Apellido.*(superar|excede).*100/i, () => ({ apellido: "B".repeat(101) }));
exito("TC283", "Alta con Apellido de 100 caracteres", "Permite el alta y guarda 100 caracteres.", () => ({ apellido: "B".repeat(100) }),
  (u) => (u.apellido.length === 100 ? null : `apellido persistido de ${u.apellido.length} caracteres`));
exito("TC284", "Alta con Apellido de 1 carácter", "Permite el alta y guarda 1 carácter.", () => ({ apellido: "B" }));
rechazo("TC285", "Alta con Correo vacío", "Impide el alta; Correo obligatorio.", /Correo.*obligatorio/i, () => ({ correo: "" }));
rechazo("TC286", "Alta con Correo de formato inválido", "Impide el alta; formato inválido.", /correo.*formato/i, () => ({ correo: "juan.sotra" }));
rechazo("TC287", "Alta con Correo ya registrado", "Impide el alta; correo ya registrado.", /(correo|registrad|existe)/i, () => ({}),
  async (request) => {
    const existente = await crearUsuarioApi(request);
    return { correo: existente.correo };
  });
exito("TC288", "Alta con Correo de 254 caracteres", "Permite el alta y persiste 254 caracteres.", (id) => ({ correo: correoDeLargo(254, id) }),
  (u) => (u.correo.length === 254 ? null : `correo persistido de ${u.correo.length}`));
rechazo("TC289", "Alta con Correo de 255 caracteres", "Impide el alta; supera 254.", /correo.*254/i, (id) => ({ correo: correoDeLargo(255, id) }));
rechazo("TC290", "Alta con Teléfono vacío", "Impide el alta; Teléfono obligatorio.", /Tel[eé]fono.*obligatorio/i, () => ({ telefono: "" }));
rechazo("TC291", "Alta con Teléfono solo letras", "Impide el alta; validación en Teléfono.", /Tel[eé]fono.*d[ií]gitos/i, () => ({ telefono: "abcdef" }));
rechazo("TC292", "Alta con Teléfono ya registrado", "Impide el alta; teléfono ya registrado.", /(tel[eé]fono|registrad)/i, () => ({}),
  async (request) => {
    const existente = await crearUsuarioApi(request);
    return { telefono: existente.telefono };
  });
exito("TC293", "Alta con Teléfono de 30 dígitos", "Permite el alta y guarda 30 caracteres.",
  () => ({ telefono: "1" + Array.from({ length: 29 }, () => Math.floor(Math.random() * 10)).join("") }),
  (u) => (u.telefono.length === 30 ? null : `teléfono persistido de ${u.telefono.length}`));
rechazo("TC294", "Alta con Teléfono de 31 dígitos", "Impide el alta; supera 30.", /tel[eé]fono.*30/i, () => ({ telefono: "1".repeat(31) }));
rechazo("TC295", "Alta con Contraseña temporal vacía", "Impide el alta; contraseña obligatoria.", /Contraseña.*obligatorio/i, () => ({ contrasena: "" }));
rechazo("TC296", "Alta con Contraseña de 7 caracteres", "Impide el alta; mínimo 8.", /8 caracteres/i, () => ({ contrasena: "Aa1!aaa" }));
rechazo("TC297", "Alta con Contraseña sin mayúscula", "Impide el alta; regla de mayúscula.", /may[uú]scula/i, () => ({ contrasena: "temporal1!" }));
rechazo("TC298", "Alta con Contraseña sin minúscula", "Impide el alta; regla de minúscula.", /min[uú]scula/i, () => ({ contrasena: "TEMPORAL1!" }));
rechazo("TC299", "Alta con Contraseña sin carácter especial", "Impide el alta; regla de carácter especial.", /especial/i, () => ({ contrasena: "Temporal1" }));
exito("TC300", "Alta con Contraseña de exactamente 8 caracteres válidos", "Permite el alta.", () => ({ contrasena: "Aa1!aaaa" }));
rechazo("TC301", "Alta sin seleccionar Rol", "Impide el alta, indica que debe elegirse un rol y no guarda el usuario.", /rol/i, () => ({ rol: null }));

caso("TC302", "Cancelación del alta de usuario", "No crea ni persiste el usuario.", async ({ page, request }) => {
  const d = base(sufijo());
  const formulario = await abrirAlta(page);
  await llenar(formulario, page, d);
  await formulario.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const guardado = await usuarioEnApi(request, d.correo);
  return { ok: !guardado, observado: `Modal cerrado tras Cancelar (se confirma el descarte); usuario ${guardado ? "GUARDADO" : "no guardado"}.` };
});

bloqueado("TC303", "Un Técnico no puede registrar usuarios", "Impide el acceso al alta o rechaza por falta de permisos.", SIN_KEYCLOAK,
  "La app no tiene sesión ni roles: cualquier visitante ve el botón 'Crear nuevo usuario'. Los permisos por rol (Técnico) dependen de Keycloak y no son comprobables aún.");

caso("TC304", "Visualización del listado de usuarios", "Muestra nombre y apellido, correo, rol y estado actualizados.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  await page.goto("/usuarios");
  await buscarEnListado(page, u.correo);
  const fila = page.getByRole("row").filter({ hasText: u.correo });
  await expect(fila).toBeVisible();
  const encabezados = await page.locator("thead th").allTextContents();
  const texto = (await fila.textContent()) ?? "";
  const ok = ["Nombre y apellido", "Correo electrónico", "Roles asignados", "Estado"].every((h) => encabezados.includes(h))
    && texto.includes(u.nombre) && texto.includes("Técnico") && texto.includes("Activo");
  return { ok, observado: `Columnas: ${encabezados.join(" | ")}. Fila: "${texto.trim().slice(0, 120)}".` };
});

caso("TC305", "Búsqueda de usuarios por Nombre", "Muestra los usuarios que coinciden con el Nombre.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  await page.goto("/usuarios");
  await buscarEnListado(page, u.nombre);
  const filas = page.locator("tbody tr");
  await expect(filas.first()).toBeVisible();
  const textos = await filas.allTextContents();
  return { ok: textos.length >= 1 && textos.every((t) => t.includes(u.nombre)), observado: `${textos.length} fila(s) para "${u.nombre}"; todas coinciden: ${textos.every((t) => t.includes(u.nombre))}.` };
});

caso("TC306", "Búsqueda de usuarios por Correo", "Muestra el usuario del correo buscado.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  await page.goto("/usuarios");
  await buscarEnListado(page, u.correo);
  const filas = page.locator("tbody tr");
  await expect(filas.first()).toBeVisible();
  const n = await filas.count();
  return { ok: n === 1 && ((await filas.first().textContent()) ?? "").includes(u.correo), observado: `${n} fila(s) para el correo buscado.` };
});

caso("TC307", "Filtrado de usuarios por Rol", "Muestra únicamente usuarios con el rol seleccionado.", async ({ page, request }) => {
  await crearUsuarioApi(request);
  await page.goto("/usuarios");
  await page.getByLabel("Rol", { exact: true }).selectOption({ label: "Técnico" });
  await page.waitForURL(/rolId=/);
  await esperarListadoActualizado(page);
  await expect(page.locator("tbody tr").first()).toBeVisible();
  const textos = await page.locator("tbody tr").allTextContents();
  const { cuerpo } = await obtener<{ totalElementos: number }>(request, "/api/v1/usuarios?rolId=3");
  const resumen = (await page.locator(".pagination span").textContent().catch(() => null)) ?? `${textos.length} filas`;
  const todos = textos.every((t) => t.includes("Técnico") || /\d+ roles/.test(t));
  return { ok: todos && resumen.includes(String(cuerpo.totalElementos)), observado: `Filas: ${textos.length}; todas con Técnico: ${todos}; resumen "${resumen}"; total API rolId=3: ${cuerpo.totalElementos}.` };
});

caso("TC308", "Búsqueda de usuarios sin coincidencias", "Estado sin resultados sin usuarios que no coincidan.", async ({ page }) => {
  await page.goto("/usuarios");
  await buscarEnListado(page, "usuario-inexistente-" + sufijo());
  const vacio = page.getByText("No se encontraron usuarios");
  await expect(vacio).toBeVisible();
  return { ok: (await page.locator("tbody tr").count()) === 0, observado: `Mensaje: "${(await vacio.textContent())?.trim()}"; filas: 0.` };
});

async function filaDeUsuario(page: Page, u: UsuarioApi) {
  await page.goto("/usuarios");
  await buscarEnListado(page, u.correo);
  const fila = page.getByRole("row").filter({ hasText: u.correo });
  await expect(fila).toBeVisible();
  return fila;
}

caso("TC309", "Confirmación al dar de baja un usuario", "Pide confirmación antes de modificar el estado.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  const fila = await filaDeUsuario(page, u);
  await fila.getByRole("button", { name: "Dar de baja" }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  const texto = (await dialogo.textContent()) ?? "";
  const { cuerpo } = await obtener<UsuarioApi>(request, `/api/v1/usuarios/${u.id}`);
  return { ok: cuerpo.estado === "activo" && /Confirm/.test(texto), observado: `Diálogo: "${texto.trim().slice(0, 140)}"; estado en API aún: ${cuerpo.estado}.` };
});

caso("TC310", "Cancelación de la baja de un usuario", "El usuario permanece Activo.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  const fila = await filaDeUsuario(page, u);
  await fila.getByRole("button", { name: "Dar de baja" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const { cuerpo } = await obtener<UsuarioApi>(request, `/api/v1/usuarios/${u.id}`);
  const activoEnFila = ((await fila.textContent()) ?? "").includes("Activo");
  return { ok: cuerpo.estado === "activo" && activoEnFila, observado: `Estado API: ${cuerpo.estado}; fila muestra Activo: ${activoEnFila}.` };
});

caso("TC311", "Baja exitosa de usuario desde el listado", "Pasa a Inactivo, se refleja en el listado, conserva el registro y bloquea inicios de sesión.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  const fila = await filaDeUsuario(page, u);
  await fila.getByRole("button", { name: "Dar de baja" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Dar de baja" }).click();
  await expect(fila.getByText("Inactivo")).toBeVisible();
  const { cuerpo, estado } = await obtener<UsuarioApi>(request, `/api/v1/usuarios/${u.id}`);
  return {
    ok: estado === 200 && cuerpo.estado === "inactivo",
    observado: `Listado muestra Inactivo; registro conservado (GET ${estado}) con estado ${cuerpo.estado}. El bloqueo de inicio de sesión no se pudo comprobar: no hay login (sin Keycloak).`,
  };
});

async function abrirEdicion(page: Page, u: UsuarioApi) {
  await page.goto(`/usuarios/${u.id}/editar`);
  await expect(page.getByRole("button", { name: "Confirmar modificación" })).toBeVisible();
}

caso("TC312", "Datos actuales en la pantalla de edición de usuario (sin Mi Perfil)", "Muestra nombre, apellido, correo y teléfono registrados.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  await abrirEdicion(page, u);
  const vistos = [await page.locator("#nombre").inputValue(), await page.locator("#apellido").inputValue(), await page.locator("#correo").inputValue(), await page.locator("#telefono").inputValue()];
  const ok = vistos.join("|") === [u.nombre, u.apellido, u.correo, u.telefono].join("|");
  return { ok, observado: `No existe pantalla 'Mi Perfil' (sin sesión); se ejercitó /usuarios/{id}/editar: ${vistos.join(" | ")}.` };
});

caso("TC313", "Modificación exitosa de datos de un usuario", "Valida, actualiza, muestra confirmación y persiste.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  await abrirEdicion(page, u);
  const nuevoNombre = "Maria" + letras(4);
  const nuevoTel = telefonoUnico();
  await page.locator("#nombre").fill(nuevoNombre);
  await page.locator("#apellido").fill("Silva");
  await page.locator("#telefono").fill(nuevoTel);
  await page.getByRole("button", { name: "Confirmar modificación" }).click();
  await page.waitForURL("**/usuarios", { timeout: 15_000 });
  const confirmacion = await page.getByRole("status").allTextContents().catch(() => []);
  const { cuerpo } = await obtener<UsuarioApi>(request, `/api/v1/usuarios/${u.id}`);
  const persistido = cuerpo.nombre === nuevoNombre && cuerpo.apellido === "Silva" && cuerpo.telefono === nuevoTel;
  const hayAviso = confirmacion.some((t) => t.trim().length > 0);
  return {
    ok: persistido && hayAviso,
    observado: `Persistido: ${persistido}; redirige a /usuarios; aviso de confirmación visible: ${hayAviso} ${JSON.stringify(confirmacion)}.`,
  };
});

caso("TC314", "Modificación con Correo ya registrado", "Rechaza, informa correo registrado y mantiene el original.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  const otro = await crearUsuarioApi(request);
  await abrirEdicion(page, u);
  await page.locator("#correo").fill(otro.correo);
  await page.getByRole("button", { name: "Confirmar modificación" }).click();
  await expect(page.locator("main").getByRole("alert").first()).toBeVisible({ timeout: 15_000 });
  const alertas = await textoDeAlertas(page, "main");
  const { cuerpo } = await obtener<UsuarioApi>(request, `/api/v1/usuarios/${u.id}`);
  return { ok: cuerpo.correo === u.correo && alertas.some((a) => /registrad|existe|correo/i.test(a)), observado: `Mensajes: ${JSON.stringify(alertas)}; correo en API: ${cuerpo.correo === u.correo ? "original" : "CAMBIADO"}.` };
});

caso("TC315", "Modificación con Teléfono ya registrado", "Rechaza, informa teléfono registrado y mantiene el original.", async ({ page, request }) => {
  const u = await crearUsuarioApi(request);
  const otro = await crearUsuarioApi(request);
  await abrirEdicion(page, u);
  await page.locator("#telefono").fill(otro.telefono);
  await page.getByRole("button", { name: "Confirmar modificación" }).click();
  await expect(page.locator("main").getByRole("alert").first()).toBeVisible({ timeout: 15_000 });
  const alertas = await textoDeAlertas(page, "main");
  const { cuerpo } = await obtener<UsuarioApi>(request, `/api/v1/usuarios/${u.id}`);
  return { ok: cuerpo.telefono === u.telefono && alertas.some((a) => /registrad|existe|tel/i.test(a)), observado: `Mensajes: ${JSON.stringify(alertas)}; teléfono en API: ${cuerpo.telefono === u.telefono ? "original" : "CAMBIADO"}.` };
});

bloqueado("TC316", "Confirmación de contraseña distinta en Mi Perfil", "Rechaza el cambio: las contraseñas deben coincidir.", SIN_KEYCLOAK,
  "No existe la pantalla Mi Perfil ni un cambio de contraseña en el frontend: el formulario de edición de usuario (/usuarios/{id}/editar) no tiene campos de contraseña. Depende de la sesión y de Keycloak.");

caso("TC317", "Actividad (órdenes) de un usuario", "Muestra las órdenes asociadas al usuario.", async ({ page, request }) => {
  const e = await crearEscenarioApi(request);
  await page.goto(`/usuarios/${e.tecnico.id}`);
  await expect(page.getByRole("heading", { name: /Actividad/ })).toBeVisible();
  const fila = page.locator("tbody tr").filter({ hasText: String(e.ordenId) });
  await expect(fila.first()).toBeVisible({ timeout: 15_000 });
  return { ok: true, observado: `Detalle del usuario lista la orden ${e.ordenId} en 'Actividad: órdenes de trabajo asignadas'.` };
});

caso("TC318", "Acceso al detalle de una orden desde la actividad del usuario", "Abre el detalle de la orden y mantiene la relación con el usuario.", async ({ page, request }) => {
  const e = await crearEscenarioApi(request);
  await page.goto(`/usuarios/${e.tecnico.id}`);
  const fila = page.locator("tbody tr").filter({ hasText: String(e.ordenId) }).first();
  await fila.getByRole("link", { name: /Ver detalle|Ver/ }).first().click();
  await page.waitForURL(`**/ordenes-trabajo/${e.ordenId}`);
  await expect(page.getByRole("heading", { name: `Orden de trabajo N° ${e.ordenId}` })).toBeVisible();
  const texto = (await page.locator("main").textContent()) ?? "";
  const relacion = texto.includes(e.tecnico.nombre);
  return { ok: relacion, observado: `Abrió /ordenes-trabajo/${e.ordenId}; el técnico ${e.tecnico.nombre} aparece en el detalle: ${relacion}.` };
});

const msgLogin = "La app no tiene pantalla de inicio de sesión, primer acceso ni restablecimiento: no hay rutas ni componentes de autenticación (la integración con Keycloak la hace otro integrante).";
const loginCasos: Array<[string, string, string]> = [
  ["TC319", "Inicio de sesión exitoso con credenciales válidas", "Autentica, identifica el rol y habilita las funciones."],
  ["TC320", "Inicio de sesión con contraseña incorrecta", "Rechaza el acceso con mensaje de credenciales inválidas."],
  ["TC321", "Inicio de sesión con correo no registrado", "Rechaza el acceso y no inicia sesión."],
  ["TC322", "Un usuario Inactivo no puede iniciar sesión", "Rechaza el inicio de sesión del Inactivo."],
  ["TC323", "Inicio de sesión con Correo vacío", "Impide el inicio e indica que el correo es obligatorio."],
  ["TC324", "Inicio de sesión con Contraseña vacía", "Impide el inicio e indica que la contraseña es obligatoria."],
  ["TC326", "Cambio de contraseña exitoso en el primer acceso", "Actualiza la contraseña y habilita el acceso."],
  ["TC327", "Primer acceso: nueva contraseña de menos de 8 caracteres", "Rechaza e indica el mínimo de 8."],
  ["TC328", "Primer acceso: nueva contraseña sin mayúscula", "Rechaza e indica la mayúscula requerida."],
  ["TC329", "Primer acceso: nueva contraseña sin minúscula", "Rechaza e indica la minúscula requerida."],
  ["TC330", "Primer acceso: nueva contraseña sin carácter especial", "Rechaza e indica el carácter especial requerido."],
  ["TC331", "Primer acceso: confirmación de contraseña distinta", "Rechaza e informa que no coinciden."],
  ["TC332", "Restablecimiento con correo registrado", "Envía el enlace o código de verificación."],
  ["TC333", "Restablecimiento con correo no registrado", "No inicia el restablecimiento y informa el resultado."],
  ["TC334", "Restablecimiento exitoso con nueva contraseña válida", "Actualiza la contraseña y redirige al inicio de sesión."],
];
for (const [tc, escenario, esperado] of loginCasos) bloqueado(tc, escenario, esperado, SIN_KEYCLOAK, msgLogin);
