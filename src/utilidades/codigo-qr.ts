/** Genera una matriz QR localmente; la biblioteca solo se carga al abrir el código. */
export async function generarCodigoQr(url: string) {
  const { default: crearQr } = await import("qrcode-generator");
  const codigo = crearQr(0, "M");
  codigo.addData(url, "Byte");
  codigo.make();
  const lado = codigo.getModuleCount();
  const margen = 4;
  const modulos: string[] = [];
  for (let fila = 0; fila < lado; fila++) {
    for (let columna = 0; columna < lado; columna++) {
      if (codigo.isDark(fila, columna)) modulos.push(`M${columna + margen} ${fila + margen}h1v1h-1z`);
    }
  }
  return { lado: lado + margen * 2, trazado: modulos.join("") };
}
