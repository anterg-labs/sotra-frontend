export const LARGO_MINIMO_TEXTO = 20;
export const LARGO_MAXIMO_TEXTO = 20_000;

export function validarTerminos(campos: { texto: string }): Partial<Record<"texto", string>> {
  if (campos.texto.trim().length < LARGO_MINIMO_TEXTO || campos.texto.length > LARGO_MAXIMO_TEXTO) {
    return { texto: "El texto debe tener entre 20 y 20000 caracteres." };
  }
  return {};
}
