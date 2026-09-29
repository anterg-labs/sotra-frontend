import {
  apiActualizarCliente,
  apiCrearCliente,
  apiDesactivarCliente,
  apiListarClientes,
  apiObtenerCliente,
  apiReactivarCliente,
} from "@/servicios/cliente-api";
import type {
  ActualizarClienteInput,
  CrearClienteInput,
} from "@/tipos/cliente";

const patronFormatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCliente(input: CrearClienteInput) {
  if (!input.razonSocial.trim()) {
    throw new Error("La razón social es obligatoria.");
  }

  if (!input.nombreContacto.trim()) {
    throw new Error("El nombre de contacto es obligatorio.");
  }

  if (input.correo !== null) {
    const correoSinEspacios = input.correo.trim();
    if (correoSinEspacios !== "" && !patronFormatoCorreo.test(input.correo)) {
      throw new Error("El correo electrónico no tiene un formato válido.");
    }
  }
}

export async function listarClientes() {
  return apiListarClientes();
}

export async function obtenerDetalleCliente(clienteId: number) {
  return apiObtenerCliente(clienteId);
}

export async function crearCliente(input: CrearClienteInput) {
  validarCliente(input);
  return apiCrearCliente(input);
}

export async function actualizarCliente(clienteId: number, input: ActualizarClienteInput) {
  validarCliente(input);
  return apiActualizarCliente(clienteId, input);
}

export async function desactivarCliente(clienteId: number) {
  return apiDesactivarCliente(clienteId);
}

export async function reactivarCliente(clienteId: number) {
  return apiReactivarCliente(clienteId);
}
