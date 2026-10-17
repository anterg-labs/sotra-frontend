/** Resultado de guardar un registro: el registro guardado o los errores por campo y el mensaje general. */
export type ResultadoGuardar<T> =
  | { exito: true; registro: T }
  | { exito: false; errores: Record<string, string>; mensaje: string };

export type ResultadoCambiarEstado = { exito: true } | { exito: false; mensaje: string };
