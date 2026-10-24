const LARGO_MAXIMO_NOMBRE = 100;
const LARGO_MAXIMO_CORREO = 254;
/** El teléfono tiene 8 dígitos, o 9 con el 0 inicial; la API conserva el formato ingresado. */
export const CANTIDAD_DIGITOS_TELEFONO = 8;
export const EJEMPLO_TELEFONO = "99123456";

const PATRON_NOMBRE_PERMITIDO = /^[\p{L} '’.-]+$/u;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CamposValidablesUsuario = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
};

export type ErroresUsuario = Partial<Record<keyof CamposValidablesUsuario, string>>;

export function validarNombrePersona(valor: string, campo: "Nombre" | "Apellido"): string | undefined {
  if (valor.trim() === "") return `El campo ${campo} es obligatorio.`;
  if (valor.length > LARGO_MAXIMO_NOMBRE) {
    return `El campo ${campo} no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres.`;
  }
  if (!PATRON_NOMBRE_PERMITIDO.test(valor)) {
    return `El campo ${campo} solo admite letras, espacios, apóstrofos, guiones y puntos.`;
  }
  if (!/\p{L}/u.test(valor)) return `El campo ${campo} debe contener al menos una letra.`;
  return undefined;
}

export function validarCorreo(valor: string): string | undefined {
  if (valor.trim() === "") return "El campo Correo es obligatorio.";
  if (valor.length > LARGO_MAXIMO_CORREO) {
    return `El correo no puede superar los ${LARGO_MAXIMO_CORREO} caracteres.`;
  }
  if (!PATRON_CORREO.test(valor)) return "El correo no tiene un formato válido.";
  return undefined;
}

export function validarTelefono(valor: string): string | undefined {
  if (valor.trim() === "") return "El campo teléfono es obligatorio.";
  if (!/^\d+$/.test(valor)) return "El campo teléfono solo admite dígitos.";
  const esCelularConCero = valor.length === CANTIDAD_DIGITOS_TELEFONO + 1 && valor.startsWith("0");
  if (valor.length !== CANTIDAD_DIGITOS_TELEFONO && !esCelularConCero) {
    return `El campo teléfono debe tener ${CANTIDAD_DIGITOS_TELEFONO} dígitos (o ${CANTIDAD_DIGITOS_TELEFONO + 1} si empieza con 0).`;
  }
  return undefined;
}

/** La contraseña no pasa por SOTRA: la elige el usuario en Keycloak, con el enlace que recibe por correo. */
export function validarUsuario(campos: CamposValidablesUsuario): ErroresUsuario {
  const errores: ErroresUsuario = {
    nombre: validarNombrePersona(campos.nombre, "Nombre"),
    apellido: validarNombrePersona(campos.apellido, "Apellido"),
    correo: validarCorreo(campos.correo),
    telefono: validarTelefono(campos.telefono),
  };

  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje !== undefined));
}
