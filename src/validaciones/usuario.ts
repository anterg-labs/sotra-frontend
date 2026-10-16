const LARGO_MAXIMO_NOMBRE = 100;
const LARGO_MAXIMO_CORREO = 254;
const LARGO_MAXIMO_TELEFONO = 30;
const LARGO_MINIMO_CONTRASENA = 8;

const PATRON_NOMBRE_PERMITIDO = /^[\p{L} '’.-]+$/u;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CamposValidablesUsuario = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  contrasena: string;
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
  if (valor.trim() === "") return "El campo Teléfono es obligatorio.";
  if (valor.length > LARGO_MAXIMO_TELEFONO) {
    return `El teléfono no puede superar los ${LARGO_MAXIMO_TELEFONO} caracteres.`;
  }
  if (!/^\d+$/.test(valor)) return "El campo Teléfono solo admite dígitos.";
  return undefined;
}

export function validarContrasena(valor: string): string | undefined {
  if (valor === "") return "El campo Contraseña es obligatorio.";
  if (valor.length < LARGO_MINIMO_CONTRASENA) {
    return `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`;
  }
  if (!/\p{Lu}/u.test(valor)) return "La contraseña debe contener al menos una letra mayúscula.";
  if (!/\p{Ll}/u.test(valor)) return "La contraseña debe contener al menos una letra minúscula.";
  if (!/[^\p{L}\p{N}\s]/u.test(valor)) return "La contraseña debe contener al menos un carácter especial.";
  return undefined;
}

export function validarUsuario(
  campos: CamposValidablesUsuario,
  opciones: { exigirContrasena: boolean },
): ErroresUsuario {
  const errores: ErroresUsuario = {
    nombre: validarNombrePersona(campos.nombre, "Nombre"),
    apellido: validarNombrePersona(campos.apellido, "Apellido"),
    correo: validarCorreo(campos.correo),
    telefono: validarTelefono(campos.telefono),
    contrasena: opciones.exigirContrasena ? validarContrasena(campos.contrasena) : undefined,
  };

  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje !== undefined));
}
