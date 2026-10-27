/** URL de ejemplo para las pruebas de los títulos de columna. */
export function urlConOrden(columna: string, direccion: "asc" | "desc") {
  return "/x?ordenarPor=" + columna + "&direccionOrden=" + direccion;
}
