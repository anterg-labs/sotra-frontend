import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * Las pruebas dibujan las páginas de servidor llamando a su función. Cuando una página compone componentes de servidor
 * asíncronos (por ejemplo, el contenido de un formulario), React Testing Library no los resuelve: esta función los
 * ejecuta y devuelve el árbol ya resuelto.
 */
export async function resolverServidor(nodo: ReactElement): Promise<ReactElement>;
export async function resolverServidor(nodo: ReactNode): Promise<ReactNode>;
export async function resolverServidor(nodo: ReactNode): Promise<ReactNode> {
  if (Array.isArray(nodo)) return Promise.all(nodo.map(resolverServidor));
  if (!isValidElement(nodo)) return nodo;

  const elemento = nodo as React.ReactElement<{ children?: ReactNode }>;
  const { type } = elemento;
  if (typeof type === "function" && type.constructor.name === "AsyncFunction") {
    return resolverServidor(await (type as (props: unknown) => Promise<ReactNode>)(elemento.props));
  }

  const hijos = elemento.props.children;
  if (hijos === undefined) return elemento;
  const resueltos = await resolverServidor(hijos);
  return Array.isArray(resueltos) ? cloneElement(elemento, undefined, ...resueltos) : cloneElement(elemento, undefined, resueltos);
}
