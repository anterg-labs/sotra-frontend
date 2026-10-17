const LARGO_MAXIMO_NOMBRE = 60;

export function validarNombreCatalogo(valor: string): string | undefined {
  if (valor.trim() === "") return "El campo Nombre es obligatorio.";
  if (valor.length > LARGO_MAXIMO_NOMBRE) {
    return `El campo Nombre no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres.`;
  }
  return undefined;
}

export function validarTipoMaquinaSeleccionado(valor: string): string | undefined {
  return valor === "" ? "Debe seleccionar un tipo de máquina." : undefined;
}
