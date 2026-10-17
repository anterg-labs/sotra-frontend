import { apiListarClientesPaginados, apiObtenerCliente } from "@/servicios/api/api-clientes";
import type { FiltrosClientes } from "@/tipos/cliente";

/** Lecturas desde el navegador (selectores de otros módulos). Las altas y modificaciones viven en las Server Actions de /clientes. */
export async function listarClientesPaginados(filtros: FiltrosClientes) {
  return apiListarClientesPaginados(filtros);
}

export async function obtenerDetalleCliente(clienteId: number) {
  return apiObtenerCliente(clienteId);
}
