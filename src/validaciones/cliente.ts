import { validarCorreo, validarTelefono } from "./usuario";

const LARGO_MAXIMO_RAZON_SOCIAL = 160;
const LARGO_MAXIMO_NOMBRE_CONTACTO = 120;
const LARGO_MAXIMO_DIRECCION = 255;

export type CamposValidablesCliente = {
  razonSocial: string;
  nombreContacto: string;
  correo: string;
  telefono: string;
  direccion: string;
};

export type ErroresCliente = Partial<Record<keyof CamposValidablesCliente, string>>;

function validarTextoObligatorio(valor: string, campo: string, largoMaximo: number): string | undefined {
  if (valor.trim() === "") return `El campo ${campo} es obligatorio.`;
  if (valor.length > largoMaximo) return `El campo ${campo} no puede superar los ${largoMaximo} caracteres.`;
  return undefined;
}

export function validarCliente(campos: CamposValidablesCliente): ErroresCliente {
  const errores: ErroresCliente = {
    razonSocial: validarTextoObligatorio(campos.razonSocial, "Nombre o razón social", LARGO_MAXIMO_RAZON_SOCIAL),
    nombreContacto: validarTextoObligatorio(
      campos.nombreContacto,
      "Nombre de contacto",
      LARGO_MAXIMO_NOMBRE_CONTACTO,
    ),
    correo: campos.correo.trim() === "" ? undefined : validarCorreo(campos.correo),
    telefono: campos.telefono.trim() === "" ? undefined : validarTelefono(campos.telefono),
    direccion:
      campos.direccion.length > LARGO_MAXIMO_DIRECCION
        ? `La dirección no puede superar los ${LARGO_MAXIMO_DIRECCION} caracteres.`
        : undefined,
  };

  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje !== undefined));
}
