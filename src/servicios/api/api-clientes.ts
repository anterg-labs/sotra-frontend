import { crearOpcionesJson, leerDatosApi, leerPagina, leerTodasLasPaginas } from "@/servicios/api/solicitudes-http";
import type { ActualizarClienteInput, Cliente, CrearClienteInput, FiltrosClientes } from "@/tipos/cliente";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarClientes() {
  const clientes = await leerTodasLasPaginas("/api/v1/clientes", "No se pudo obtener el listado de clientes.");
  return clientes as Cliente[];
}

export async function apiListarClientesPaginados(filtros: FiltrosClientes) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  parametros.append("direccionOrden", "desc");
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/clientes", parametros, "No se pudo obtener el listado de clientes.");
  return pagina as Pagina<Cliente>;
}

export async function apiObtenerCliente(clienteId: number) {
  const cliente = await leerDatosApi("/api/v1/clientes/" + clienteId, { cache: "no-store" }, "No se pudo obtener el cliente solicitado.");
  return cliente as Cliente;
}

export async function apiCrearCliente(cliente: CrearClienteInput) {
  const opciones = crearOpcionesJson("POST", cliente);
  const clienteCreado = await leerDatosApi("/api/v1/clientes", opciones, "No se pudo crear el cliente.");
  return clienteCreado as Cliente;
}

export async function apiActualizarCliente(clienteId: number, cliente: ActualizarClienteInput) {
  const opciones = crearOpcionesJson("PUT", cliente);
  const clienteActualizado = await leerDatosApi("/api/v1/clientes/" + clienteId, opciones, "No se pudo actualizar el cliente.");
  return clienteActualizado as Cliente;
}

export async function apiDesactivarCliente(clienteId: number) {
  const opciones = crearOpcionesJson("PATCH", { estado: "inactivo" });
  const clienteActualizado = await leerDatosApi("/api/v1/clientes/" + clienteId, opciones, "No se pudo desactivar el cliente.");
  return clienteActualizado as Cliente;
}

export async function apiReactivarCliente(clienteId: number) {
  const opciones = crearOpcionesJson("PATCH", { estado: "activo" });
  const clienteActualizado = await leerDatosApi("/api/v1/clientes/" + clienteId, opciones, "No se pudo reactivar el cliente.");
  return clienteActualizado as Cliente;
}
