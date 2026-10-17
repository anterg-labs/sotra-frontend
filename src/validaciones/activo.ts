const LARGO_MAXIMO_NUMERO_SERIE = 100;
const LARGO_MAXIMO_NOMBRE = 100;
const LARGO_MAXIMO_UBICACION = 150;
const ANIO_MINIMO = 1900;
const ANIO_MAXIMO = 2100;

export type CamposValidablesActivo = {
  nombre: string;
  numSerie: string;
  clienteId: string;
  modeloMaquinaId: string;
  anioFabricacion: string;
  ubicacion: string;
};

export type ErroresActivo = Partial<Record<keyof CamposValidablesActivo, string>>;

function validarAnio(valor: string): string | undefined {
  if (valor.trim() === "") return undefined;
  const anio = Number(valor);
  if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    return `El año de fabricación debe estar entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`;
  }
  return undefined;
}

export function validarActivo(campos: CamposValidablesActivo): ErroresActivo {
  const errores: ErroresActivo = {
    numSerie:
      campos.numSerie.trim() === ""
        ? "El campo Número de serie es obligatorio."
        : campos.numSerie.length > LARGO_MAXIMO_NUMERO_SERIE
          ? `El campo Número de serie no puede superar los ${LARGO_MAXIMO_NUMERO_SERIE} caracteres.`
          : undefined,
    nombre:
      campos.nombre.length > LARGO_MAXIMO_NOMBRE
        ? `El campo Nombre interno no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres.`
        : undefined,
    clienteId: campos.clienteId === "" ? "Debe seleccionar un cliente." : undefined,
    modeloMaquinaId: campos.modeloMaquinaId === "" ? "Debe seleccionar un modelo de máquina." : undefined,
    anioFabricacion: validarAnio(campos.anioFabricacion),
    ubicacion:
      campos.ubicacion.length > LARGO_MAXIMO_UBICACION
        ? `El campo Ubicación no puede superar los ${LARGO_MAXIMO_UBICACION} caracteres.`
        : undefined,
  };

  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje !== undefined));
}
