import { crearOpcionesJson, leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { ActualizarClienteInput, Cliente, CrearClienteInput } from "@/tipos/cliente";

export async function apiListarClientes() {
  const clientes = await leerDatosApi("/api/v1/clientes", { cache: "no-store" }, "No se pudo obtener el listado de clientes.");
  return clientes as Cliente[];
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
