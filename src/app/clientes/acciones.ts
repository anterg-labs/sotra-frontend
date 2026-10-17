"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarClienteServidor,
  cambiarEstadoClienteServidor,
  crearClienteServidor,
} from "@/servicios/servidor/clientes";
import { ejecutarCambioEstado, resultadoFallido, textoOpcional } from "@/servicios/servidor/resultado-accion";
import type { Cliente, CrearClienteInput, EstadoCliente } from "@/tipos/cliente";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";
import { validarCliente } from "@/validaciones/cliente";

const MENSAJE_GENERAL = "No se pudo guardar la información del cliente.";

const campoPorCodigoDuplicado = {
  RAZON_SOCIAL_DUPLICADA: "razonSocial",
  NOMBRE_CONTACTO_DUPLICADO: "nombreContacto",
  CORREO_DUPLICADO: "correo",
  TELEFONO_DUPLICADO: "telefono",
};

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
function leerEntrada(datos: unknown): CrearClienteInput | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { razonSocial, nombreContacto, correo, telefono, direccion, observaciones } = datos as Record<string, unknown>;
  if (typeof razonSocial !== "string" || typeof nombreContacto !== "string") return null;
  const opcionales = [textoOpcional(correo), textoOpcional(telefono), textoOpcional(direccion), textoOpcional(observaciones)];
  if (opcionales.some((valor) => valor === undefined)) return null;
  const [correoLimpio, telefonoLimpio, direccionLimpia, observacionesLimpias] = opcionales as (string | null)[];
  return {
    razonSocial,
    nombreContacto,
    correo: correoLimpio,
    telefono: telefonoLimpio,
    direccion: direccionLimpia,
    observaciones: observacionesLimpias,
  };
}

async function guardarCliente(
  datos: unknown,
  guardar: (cliente: CrearClienteInput) => Promise<Cliente>,
): Promise<ResultadoGuardar<Cliente>> {
  const entrada = leerEntrada(datos);
  if (!entrada) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const errores = validarCliente({
    razonSocial: entrada.razonSocial,
    nombreContacto: entrada.nombreContacto,
    correo: entrada.correo ?? "",
    telefono: entrada.telefono ?? "",
    direccion: entrada.direccion ?? "",
  });
  if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };

  try {
    const registro = await guardar(entrada);
    revalidatePath("/clientes", "layout");
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido(error, campoPorCodigoDuplicado, MENSAJE_GENERAL);
  }
}

export async function crearClienteAccion(datos: CrearClienteInput) {
  return guardarCliente(datos, crearClienteServidor);
}

export async function actualizarClienteAccion(clienteId: number, datos: CrearClienteInput) {
  return guardarCliente(datos, (cliente) => actualizarClienteServidor(clienteId, cliente));
}

export async function cambiarEstadoClienteAccion(clienteId: number, estado: EstadoCliente): Promise<ResultadoCambiarEstado> {
  return ejecutarCambioEstado(
    clienteId,
    estado,
    cambiarEstadoClienteServidor,
    () => revalidatePath("/clientes", "layout"),
    { baja: "No se pudo dar de baja al cliente seleccionado.", reactivacion: "No se pudo reactivar al cliente seleccionado." },
  );
}
