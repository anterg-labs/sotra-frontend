/** Marca el campo que un modal enfoca al abrirse, para que un selector no despliegue su lista sin que la persona lo pida. */
export const ATRIBUTO_FOCO_INICIAL = "data-foco-inicial";

/** Indica si el foco lo puso el modal al abrirse (y no la persona) y quita la marca para el próximo foco. */
export function quitarFocoInicial(elemento: HTMLElement) {
  const esInicial = elemento.hasAttribute(ATRIBUTO_FOCO_INICIAL);
  elemento.removeAttribute(ATRIBUTO_FOCO_INICIAL);
  return esInicial;
}
