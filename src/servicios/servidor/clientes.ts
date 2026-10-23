import "server-only";
import { parametrosDeOrden } from "@/componentes/listado/url-listado";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { ActualizarClienteInput, Cliente, CrearClienteInput, EstadoCliente, FiltrosClientes } from "@/tipos/cliente";
import type { Pagina } from "@/tipos/pagina";

export function listarClientesServidor(filtros: FiltrosClientes) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.estado !== "") parametros.append("estado", filtros.estado);
  for (const [nombre, valor] of parametrosDeOrden(filtros, "desc")) parametros.append(nombre, valor);
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<Cliente>>("/api/v1/clientes?" + parametros.toString(), "No se pudo obtener el listado de clientes.");
}

export function obtenerClienteServidor(clienteId: number) {
  return leerJsonServidor<Cliente>("/api/v1/clientes/" + clienteId, "No se pudo obtener el cliente solicitado.");
}

export function crearClienteServidor(cliente: CrearClienteInput) {
  return leerJsonServidor<Cliente>("/api/v1/clientes", "No se pudo crear el cliente.", opcionesJsonServidor("POST", cliente));
}

export function actualizarClienteServidor(clienteId: number, cliente: ActualizarClienteInput) {
  return leerJsonServidor<Cliente>("/api/v1/clientes/" + clienteId, "No se pudo actualizar el cliente.", opcionesJsonServidor("PUT", cliente));
}

export function cambiarEstadoClienteServidor(clienteId: number, estado: EstadoCliente) {
  const mensaje = estado === "activo" ? "No se pudo reactivar el cliente." : "No se pudo desactivar el cliente.";
  return leerJsonServidor<Cliente>("/api/v1/clientes/" + clienteId, mensaje, opcionesJsonServidor("PATCH", { estado }));
}
