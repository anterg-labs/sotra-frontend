import { test, type APIRequestContext, type Page } from "@playwright/test";
import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export const apiBase = process.env.SOTRA_API_URL ?? "http://localhost:8081";
export const carpetaResultados = path.resolve(__dirname, "..", "..", "resultados-pruebas-locales");
export const archivoParcial = path.join(carpetaResultados, "ui-usuarios-clientes.parcial.jsonl");

export type Resultado = { ok: boolean; observado: string; motivo?: string };
type Contexto = { page: Page; request: APIRequestContext };

export type Entrada = {
  caso: string;
  escenario: string;
  resultado: "PASS" | "FAIL" | "BLOQUEADO";
  observado: string;
  esperado: string;
  motivo: string;
};

function guardar(entrada: Entrada) {
  mkdirSync(carpetaResultados, { recursive: true });
  appendFileSync(archivoParcial, JSON.stringify(entrada) + "\n", "utf8");
}

/** Registra un caso ejecutado: el cuerpo devuelve si se cumplió el criterio y qué se observó. */
export function caso(
  tc: string,
  escenario: string,
  esperado: string,
  cuerpo: (contexto: Contexto) => Promise<Resultado>,
  motivoSiFalla = "bug del código",
) {
  test(`${tc} ${escenario}`, async ({ page, request }) => {
    page.on("dialog", (dialogo) => void dialogo.accept());
    const erroresConsola: string[] = [];
    page.on("pageerror", (e) => erroresConsola.push(e.message));
    let resultado: Resultado;
    try {
      resultado = await cuerpo({ page, request });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message.split("\n").slice(0, 3).join(" ") : String(error);
      resultado = { ok: false, observado: "Excepción al ejecutar: " + mensaje.slice(0, 400), motivo: motivoSiFalla };
    }
    const sufijoConsola = erroresConsola.length ? ` | errores de página: ${erroresConsola.slice(0, 2).join("; ")}` : "";
    guardar({
      caso: tc,
      escenario,
      resultado: resultado.ok ? "PASS" : "FAIL",
      observado: resultado.observado + sufijoConsola,
      esperado,
      motivo: resultado.ok ? "" : (resultado.motivo ?? motivoSiFalla),
    });
    test.info().annotations.push({ type: "observado", description: resultado.observado });
    if (!resultado.ok) throw new Error(`${tc} FAIL: ${resultado.observado}`);
  });
}

/** Caso que no puede ejecutarse hoy; queda registrado con el motivo concreto. */
export function bloqueado(tc: string, escenario: string, esperado: string, motivo: string, observado: string) {
  test(`${tc} ${escenario} [BLOQUEADO]`, async () => {
    guardar({ caso: tc, escenario, resultado: "BLOQUEADO", observado, esperado, motivo });
  });
}

export function sufijo() {
  return Math.random().toString(36).slice(2, 8);
}

let contadorTelefono = Math.floor(Math.random() * 4_000_000);
/** Teléfono de 9 dígitos que no se repite dentro de la ejecución. */
export function telefonoUnico() {
  contadorTelefono += 1 + Math.floor(Math.random() * 7);
  return "09" + String(1_000_000 + (contadorTelefono % 8_999_999));
}

/** Correo de exactamente `largo` caracteres, con partes dentro de los límites del RFC. */
export function correoDeLargo(largo: number, id: string) {
  const local = ("qa" + id).padEnd(60, "a");
  const resto = largo - local.length - 1;
  const sufijoDominio = ".test";
  let dominio = "";
  let faltan = resto - sufijoDominio.length;
  while (faltan > 0) {
    const tramo = Math.min(faltan - (faltan > 63 ? 1 : 0), 63);
    dominio += "d".repeat(tramo);
    faltan -= tramo;
    if (faltan > 0) {
      dominio += ".";
      faltan -= 1;
    }
  }
  const correo = `${local}@${dominio}${sufijoDominio}`;
  if (correo.length !== largo) throw new Error(`correoDeLargo generó ${correo.length} en vez de ${largo}`);
  return correo;
}

export async function textoDeAlertas(page: Page, ambito = "dialog") {
  const raiz = ambito === "dialog" ? page.getByRole("dialog") : page.locator("main");
  const textos = await raiz.getByRole("alert").allTextContents();
  return textos.map((t) => t.trim()).filter(Boolean);
}

export async function postApi<T>(request: APIRequestContext, ruta: string, datos: object): Promise<T> {
  const respuesta = await request.post(apiBase + ruta, { data: datos });
  if (!respuesta.ok()) throw new Error(`POST ${ruta} respondió ${respuesta.status()}: ${await respuesta.text()}`);
  return (await respuesta.json()) as T;
}

export type UsuarioApi = { id: number; nombre: string; apellido: string; correo: string; telefono: string; estado: string };
export type ClienteApi = {
  id: number; razonSocial: string; nombreContacto: string; correo: string | null; telefono: string | null;
  direccion: string | null; observaciones: string | null; estado: string;
};

export async function crearUsuarioApi(request: APIRequestContext, cambios: Record<string, unknown> = {}) {
  const id = sufijo();
  return postApi<UsuarioApi>(request, "/api/v1/usuarios", {
    nombre: "Juan" + id.replace(/[^a-z]/g, "x"), apellido: "Qa", correo: `qa-${id}@pruebas.test`,
    telefono: telefonoUnico(), contrasena: "Clave1234!", idsRol: [3], ...cambios,
  });
}

export async function crearClienteApi(request: APIRequestContext, cambios: Record<string, unknown> = {}) {
  const id = sufijo();
  return postApi<ClienteApi>(request, "/api/v1/clientes", {
    razonSocial: `qa-${id} Cliente`, nombreContacto: `qa-${id} Contacto`, correo: `qa-${id}@pruebas.test`,
    telefono: telefonoUnico(), direccion: "Av. Industria 1234", observaciones: "Cliente de prueba", ...cambios,
  });
}

/** Cliente con un activo y una orden asignada a un técnico, todo con datos únicos "qa-". */
export async function crearEscenarioApi(request: APIRequestContext) {
  const id = sufijo();
  const cliente = await crearClienteApi(request);
  const tipo = await postApi<{ id: number }>(request, "/api/v1/tipos-maquina", { nombre: "qa-tipo " + id });
  const modelo = await postApi<{ id: number }>(request, "/api/v1/modelos-maquina", {
    nombre: "qa-modelo " + id, tipoMaquinaId: tipo.id, descripcion: "",
  });
  const activo = await postApi<{ id: number; nombre: string }>(request, "/api/v1/activos", {
    clienteId: cliente.id, numSerie: "QA-" + id, modeloMaquinaId: modelo.id, nombre: "qa-activo " + id,
    ubicacion: "Planta", descripcion: "", anioFabricacion: 2021,
  });
  const tecnico = await crearUsuarioApi(request);
  const orden = await postApi<{ id: number }>(request, "/api/v1/ordenes-trabajo", {
    clienteId: cliente.id, activoId: activo.id, tecnicoId: tecnico.id, tipo: "correctivo", prioridad: "alta",
    descripcion: "qa-orden " + id, observaciones: "",
    fechaPrevistaEjecucion: new Date().toISOString().slice(0, 10), sugerencias: [], repuestosIds: [],
  });
  return { cliente, activo, tecnico, ordenId: orden.id };
}

export async function obtener<T>(request: APIRequestContext, ruta: string) {
  const respuesta = await request.get(apiBase + ruta);
  return { estado: respuesta.status(), cuerpo: (await respuesta.json().catch(() => null)) as T };
}

export async function totalPorBusqueda(request: APIRequestContext, recurso: "usuarios" | "clientes", termino: string) {
  const { cuerpo } = await obtener<{ totalElementos: number }>(request, `/api/v1/${recurso}?tamanoPagina=5&buscar=${encodeURIComponent(termino)}`);
  return cuerpo.totalElementos;
}
