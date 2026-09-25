import type { DocumentoTecnico } from "@/tipos/documento-tecnico";
import type { ActualizarActivoInput, Activo, CrearActivoInput } from "@/tipos/activo";
import type { ActualizarClienteInput, Cliente, CrearClienteInput } from "@/tipos/cliente";
import type { ActualizarUsuarioInput, CrearUsuarioInput, Rol, Usuario } from "@/tipos/usuario";

function obtenerUrlBaseApi(): string {
  const urlBaseApi = process.env.API_URL;

  if (!urlBaseApi) {
    throw new Error("La URL de la API no está configurada.");
  }

  return urlBaseApi.replace(/\/$/, "");
}

function verificarRespuesta(respuesta: Response, mensajeError: string) {
  if (!respuesta.ok) {
    throw new Error(mensajeError);
  }
}

export async function apiListarClientes() {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/clientes", { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el listado de clientes.");

  const clientes = await respuesta.json();
  return clientes as Cliente[];
}

export async function apiObtenerCliente(clienteId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/clientes/" + clienteId, { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el cliente solicitado.");

  const cliente = await respuesta.json();
  return cliente as Cliente;
}

export async function apiCrearCliente(cliente: CrearClienteInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
  verificarRespuesta(respuesta, "No se pudo crear el cliente.");

  const clienteCreado = await respuesta.json();
  return clienteCreado as Cliente;
}

export async function apiActualizarCliente(clienteId: number, cliente: ActualizarClienteInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/clientes/" + clienteId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
  verificarRespuesta(respuesta, "No se pudo actualizar el cliente.");

  const clienteActualizado = await respuesta.json();
  return clienteActualizado as Cliente;
}

export async function apiDesactivarCliente(clienteId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/clientes/" + clienteId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "inactivo" }),
  });
  verificarRespuesta(respuesta, "No se pudo desactivar el cliente.");

  const clienteActualizado = await respuesta.json();
  return clienteActualizado as Cliente;
}

export async function apiListarUsuarios() {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/usuarios", { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el listado de usuarios.");

  const usuarios = await respuesta.json();
  return usuarios as Usuario[];
}

export async function apiListarRoles() {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/roles", { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el listado de roles.");

  const roles = await respuesta.json();
  return roles as Rol[];
}

export async function apiObtenerUsuario(usuarioId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/usuarios/" + usuarioId, { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el usuario solicitado.");

  const usuario = await respuesta.json();
  return usuario as Usuario;
}

export async function apiCrearUsuario(usuario: CrearUsuarioInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });
  verificarRespuesta(respuesta, "No se pudo crear el usuario.");

  const usuarioCreado = await respuesta.json();
  return usuarioCreado as Usuario;
}

export async function apiActualizarUsuario(usuarioId: number, usuario: ActualizarUsuarioInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/usuarios/" + usuarioId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });
  verificarRespuesta(respuesta, "No se pudo actualizar el usuario.");

  const usuarioActualizado = await respuesta.json();
  return usuarioActualizado as Usuario;
}

export async function apiDesactivarUsuario(usuarioId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/usuarios/" + usuarioId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "inactivo" }),
  });
  verificarRespuesta(respuesta, "No se pudo desactivar el usuario.");

  const usuarioActualizado = await respuesta.json();
  return usuarioActualizado as Usuario;
}

export async function apiListarActivos() {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/activos", { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el listado de activos.");

  const activos = await respuesta.json();
  return activos as Activo[];
}

export async function apiObtenerActivo(activoId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/activos/" + activoId, { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el activo solicitado.");

  const activo = await respuesta.json();
  return activo as Activo;
}

export async function apiCrearActivo(activo: CrearActivoInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/activos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activo),
  });
  verificarRespuesta(respuesta, "No se pudo crear el activo.");

  const activoCreado = await respuesta.json();
  return activoCreado as Activo;
}

export async function apiActualizarActivo(activoId: number, activo: ActualizarActivoInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/activos/" + activoId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activo),
  });
  verificarRespuesta(respuesta, "No se pudo actualizar el activo.");

  const activoActualizado = await respuesta.json();
  return activoActualizado as Activo;
}

export async function apiDesactivarActivo(activoId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/activos/" + activoId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "inactivo" }),
  });
  verificarRespuesta(respuesta, "No se pudo desactivar el activo.");

  const activoActualizado = await respuesta.json();
  return activoActualizado as Activo;
}

export async function apiListarDocumentosTecnicos() {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/documentos-tecnicos", { cache: "no-store" });
  verificarRespuesta(respuesta, "No se pudo obtener el listado de documentos técnicos.");

  const documentos = await respuesta.json();
  return documentos as DocumentoTecnico[];
}

export async function apiCrearDocumentoTecnico(archivo: File, activoId: number | null, usaSugerenciasIA: boolean) {
  const urlBaseApi = obtenerUrlBaseApi();
  const datosFormulario = new FormData();
  datosFormulario.append("archivo", archivo);
  datosFormulario.append("usaSugerenciasIA", String(usaSugerenciasIA));
  if (activoId !== null) {
    datosFormulario.append("activoId", String(activoId));
  }

  const respuesta = await fetch(urlBaseApi + "/api/v1/documentos-tecnicos", {
    method: "POST",
    body: datosFormulario,
  });
  verificarRespuesta(respuesta, "No se pudo guardar el documento técnico.");

  const documentoCreado = await respuesta.json();
  return documentoCreado as DocumentoTecnico;
}

export function apiObtenerUrlDescargaDocumentoTecnico(documentoId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  return urlBaseApi + "/api/v1/documentos-tecnicos/" + documentoId + "/archivo";
}

export async function apiEliminarDocumentoTecnico(documentoId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + "/api/v1/documentos-tecnicos/" + documentoId, {
    method: "DELETE",
  });
  verificarRespuesta(respuesta, "No se pudo eliminar el documento técnico.");
}
