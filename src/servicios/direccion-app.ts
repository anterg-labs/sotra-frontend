/** En localhost reemplaza solo el host: conserva protocolo, puerto, ruta, consulta y fragmento. */
export async function obtenerDireccionParaApp(actual: string) {
  const direccion = new URL(actual);
  if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(direccion.hostname)) return direccion.href;
  const respuesta = await fetch("/api/direccion-local", { cache: "no-store" });
  if (!respuesta.ok) throw new Error("No se pudo obtener la IP de red del equipo.");
  const datos: unknown = await respuesta.json();
  if (typeof datos !== "object" || datos === null || !("ipLocal" in datos) || typeof datos.ipLocal !== "string"
    || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(datos.ipLocal) || datos.ipLocal.split(".").some(numero => Number(numero) > 255)
    || datos.ipLocal.startsWith("127.") || datos.ipLocal.startsWith("169.254.")) {
    throw new Error("La dirección de red del equipo no es válida.");
  }
  direccion.hostname = datos.ipLocal;
  return direccion.href;
}
