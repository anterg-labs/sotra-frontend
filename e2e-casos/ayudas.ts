import fs from "node:fs";
import path from "node:path";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const apiBase = process.env.SOTRA_API_URL ?? "http://localhost:8081";
const archivoResultados = path.resolve(__dirname, "../../resultados-pruebas-locales/ui-activos-modelos-tipos.json");

export type Resultado = {
  caso: string; escenario: string; resultado: "PASS" | "FAIL" | "BLOQUEADO";
  observado: string; esperado: string; motivo: string;
};

export function sufijo() {
  return Math.random().toString(36).slice(2, 8);
}

/** Texto de exactamente `largo` caracteres que contiene el sufijo único (para poder buscarlo). */
export function textoDeLargo(largo: number, id: string, prefijo = "qa-") {
  return (prefijo + id + "-").padEnd(largo, "x").slice(0, largo);
}

export function guardarResultado(r: Resultado) {
  fs.mkdirSync(path.dirname(archivoResultados), { recursive: true });
  let actuales: Resultado[] = [];
  try { actuales = JSON.parse(fs.readFileSync(archivoResultados, "utf-8")); } catch { /* primer uso */ }
  const otros = actuales.filter((x) => x.caso !== r.caso);
  otros.push(r);
  otros.sort((a, b) => a.caso.localeCompare(b.caso));
  fs.writeFileSync(archivoResultados, JSON.stringify(otros, null, 2), "utf-8");
}

type Cuerpo = {
  caso: string; escenario: string; esperado: string;
  /** Devuelve lo observado si todo es correcto; lanza un Error con lo observado si no. */
  ejecutar: () => Promise<string>;
  motivoSiFalla?: string;
};

/** Ejecuta un caso, lo registra y, si falla, relanza el error para que Playwright lo marque. */
export async function correrCaso(c: Cuerpo) {
  try {
    const observado = await c.ejecutar();
    guardarResultado({ caso: c.caso, escenario: c.escenario, resultado: "PASS", observado, esperado: c.esperado, motivo: "" });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message.split("\n").slice(0, 6).join(" | ") : String(error);
    guardarResultado({
      caso: c.caso, escenario: c.escenario, resultado: "FAIL", observado: mensaje, esperado: c.esperado,
      motivo: c.motivoSiFalla ?? "bug del código",
    });
    throw error;
  }
}

async function crear<T>(request: APIRequestContext, ruta: string, datos: object): Promise<T> {
  const r = await request.post(apiBase + ruta, { data: datos });
  if (!r.ok()) throw new Error(`POST ${ruta} respondió ${r.status()}: ${await r.text()}`);
  return (await r.json()) as T;
}

export function crearCliente(request: APIRequestContext, id: string) {
  return crear<{ id: number; razonSocial: string }>(request, "/api/v1/clientes", {
    razonSocial: "qa-Cliente " + id, nombreContacto: "Contacto " + id, correo: `qa.${id}@pruebas.test`,
    telefono: String(Math.floor(10_000_000 + Math.random() * 89_999_999)), direccion: "Calle 1", observaciones: "",
  });
}
export function crearTipo(request: APIRequestContext, nombre: string) {
  return crear<{ id: number; nombre: string }>(request, "/api/v1/tipos-maquina", { nombre });
}
export function crearModelo(request: APIRequestContext, nombre: string, tipoMaquinaId: number) {
  return crear<{ id: number; nombre: string }>(request, "/api/v1/modelos-maquina", { nombre, tipoMaquinaId, descripcion: "Modelo de prueba qa" });
}
export function crearActivo(request: APIRequestContext, d: { clienteId: number; modeloMaquinaId: number; numSerie: string; nombre?: string }) {
  return crear<{ id: number; numSerie: string; nombre: string | null }>(request, "/api/v1/activos", {
    clienteId: d.clienteId, modeloMaquinaId: d.modeloMaquinaId, numSerie: d.numSerie, nombre: d.nombre ?? null,
    ubicacion: "Planta qa", descripcion: "Activo de prueba qa", anioFabricacion: 2020,
  });
}

/** Contexto base: un cliente, un tipo y un modelo activos con sufijo único. */
export async function crearBase(request: APIRequestContext) {
  const id = sufijo();
  const cliente = await crearCliente(request, id);
  const tipo = await crearTipo(request, "qa-Tipo " + id);
  const modelo = await crearModelo(request, "qa-Modelo " + id, tipo.id);
  return { id, cliente, tipo, modelo };
}

export async function contarPorBusqueda(request: APIRequestContext, recurso: "activos" | "modelos-maquina" | "tipos-maquina", texto: string) {
  const r = await request.get(`${apiBase}/api/v1/${recurso}?buscar=${encodeURIComponent(texto)}&tamanoPagina=50`);
  const cuerpo = await r.json();
  return { total: cuerpo.totalElementos as number, elementos: cuerpo.elementos as Array<Record<string, unknown>> };
}

/** Elige una opción de un combobox escribiendo parte de la etiqueta. */
export async function elegirOpcion(page: Page, idCampo: string, texto: string) {
  const entrada = page.locator("#" + idCampo);
  await entrada.click();
  await entrada.fill(texto);
  const opcion = page.getByRole("option", { name: texto });
  await expect(opcion.first()).toBeVisible();
  await opcion.first().click();
}
