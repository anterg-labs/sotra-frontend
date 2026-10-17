// Prueba de desborde y alcance de botones del formulario de evidencias en móvil.
// Requiere Chrome con depuración remota y SOTRA_URL_ORDEN apuntando a una orden existente.
const urlOrden = process.env.SOTRA_URL_ORDEN;
const puerto = Number(process.env.CHROME_CDP_PORT ?? 9226);
if (!urlOrden) throw new Error("Definí SOTRA_URL_ORDEN con una orden existente");
const paginas = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json();
const pagina = paginas.find((entrada) => entrada.type === "page");
if (!pagina) throw new Error("Chrome no tiene una página abierta");
const conexion = new WebSocket(pagina.webSocketDebuggerUrl);
await new Promise((resolver) => conexion.addEventListener("open", resolver, { once: true }));
let siguienteId = 0;
const pendientes = new Map();
conexion.addEventListener("message", ({ data }) => {
  const respuesta = JSON.parse(data);
  if (pendientes.has(respuesta.id)) {
    pendientes.get(respuesta.id)(respuesta);
    pendientes.delete(respuesta.id);
  }
});
function enviar(method, params = {}) {
  const id = ++siguienteId;
  return new Promise((resolver) => {
    pendientes.set(id, resolver);
    conexion.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluar(expression) {
  const respuesta = await enviar("Runtime.evaluate", { expression, returnByValue: true });
  if (respuesta.result?.exceptionDetails) throw new Error(JSON.stringify(respuesta.result.exceptionDetails));
  return respuesta.result?.result?.value;
}
try {
  for (const ancho of [320, 360, 375, 390]) {
    await enviar("Emulation.setDeviceMetricsOverride", { width: ancho, height: 568, deviceScaleFactor: 1, mobile: true });
    await enviar("Page.navigate", { url: urlOrden });
    let abierto = false;
    for (let intento = 0; intento < 30; intento += 1) {
      await new Promise((resolver) => setTimeout(resolver, 100));
      abierto = await evaluar(`(() => {
        const boton = [...document.querySelectorAll('button')].find((elemento) => elemento.textContent?.trim() === 'Registrar evidencia');
        if (!boton) return false;
        boton.click();
        return true;
      })()`);
      if (abierto) break;
    }
    if (!abierto) throw new Error(`No se abrió el formulario a ${ancho} px`);
    for (const altura of [568, 300]) {
      await enviar("Emulation.setDeviceMetricsOverride", { width: ancho, height: altura, deviceScaleFactor: 1, mobile: true });
      const resultado = await evaluar(`(() => {
        const formulario = document.querySelector('.formulario-evidencia');
        if (!formulario) return { error: 'Falta el formulario' };
        const fuera = [...formulario.querySelectorAll('input, select, textarea, button, label')].filter((elemento) => {
          const caja = elemento.getBoundingClientRect();
          return caja.left < -1 || caja.right > innerWidth + 1;
        }).map((elemento) => elemento.textContent?.trim() || elemento.id);
        const confirmar = formulario.querySelector('button[type="submit"]');
        confirmar.scrollIntoView({ block: 'center' });
        const caja = confirmar.getBoundingClientRect();
        const punto = document.elementFromPoint(caja.left + caja.width / 2, caja.top + caja.height / 2);
        return { anchoViewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, fuera,
          botonAlcanzable: caja.top >= 0 && caja.bottom <= innerHeight && (punto === confirmar || confirmar.contains(punto)) };
      })()`);
      if (resultado.error || resultado.scrollWidth > ancho || resultado.fuera.length || !resultado.botonAlcanzable) {
        throw new Error(`${ancho}x${altura}: ${JSON.stringify(resultado)}`);
      }
      console.log(`${ancho}x${altura}: sin desborde, controles y confirmación alcanzables`);
    }
  }
} finally {
  conexion.close();
}
