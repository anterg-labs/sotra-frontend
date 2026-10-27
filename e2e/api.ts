import type { APIRequestContext } from "@playwright/test";

/** Los datos de prueba van por `/api/v1` del frontend, que agrega el token de la sesión guardada por «sesion». */
export const apiBase = process.env.SOTRA_URL ?? "http://localhost";

/** Técnico de prueba existente (en Keycloak y en SOTRA): dar de alta uno nuevo enviaría un correo real. */
const tecnicoId = Number(process.env.SOTRA_E2E_TECNICO_ID ?? 30);

export function sufijo() {
  return Math.random().toString(36).slice(2, 10);
}

function telefono() {
  return String(Math.floor(10_000_000 + Math.random() * 89_999_999));
}

async function crear<T>(request: APIRequestContext, ruta: string, datos: object): Promise<T> {
  const respuesta = await request.post(apiBase + ruta, { data: datos });
  if (!respuesta.ok()) throw new Error(`POST ${ruta} respondió ${respuesta.status()}: ${await respuesta.text()}`);
  return (await respuesta.json()) as T;
}

export async function crearRepuesto(request: APIRequestContext, cantidad: number, cantidadMinima: number) {
  return crear<{ id: number; codigo: string }>(request, "/api/v1/repuestos", {
    codigo: "E2E-" + sufijo(), nombre: "Repuesto e2e " + sufijo(), ubicacion: "Pañol e2e", cantidad, cantidadMinima,
  });
}

/** Crea un cliente, un activo y una orden pendiente asignada al técnico de prueba; devuelve sus identificadores. */
export async function crearOrdenAsignada(request: APIRequestContext) {
  const id = sufijo();
  const cliente = await crear<{ id: number }>(request, "/api/v1/clientes", {
    razonSocial: "Cliente e2e " + id, nombreContacto: "Contacto " + id, correo: `e2e.${id}@pruebas.test`,
    telefono: telefono(), direccion: "Calle 1", observaciones: "",
  });
  const tipo = await crear<{ id: number }>(request, "/api/v1/tipos-maquina", { nombre: "Tipo e2e " + id });
  const modelo = await crear<{ id: number }>(request, "/api/v1/modelos-maquina", {
    nombre: "Modelo e2e " + id, tipoMaquinaId: tipo.id, descripcion: "",
  });
  const activo = await crear<{ id: number; nombre: string }>(request, "/api/v1/activos", {
    clienteId: cliente.id, numSerie: "SN-" + id, modeloMaquinaId: modelo.id, nombre: "Activo e2e " + id,
    ubicacion: "Planta", descripcion: "", anioFabricacion: 2021,
  });
  const orden = await crear<{ id: number }>(request, "/api/v1/ordenes-trabajo", {
    clienteId: cliente.id, activoId: activo.id, tecnicoId, tipo: "correctivo", prioridad: "alta",
    descripcion: "Cambiar el filtro hidráulico (e2e)", observaciones: "",
    fechaPrevistaEjecucion: new Date().toISOString().slice(0, 10), sugerencias: [], repuestosIds: [],
  });
  return { ordenId: orden.id, tecnicoId, nombreActivo: activo.nombre };
}
