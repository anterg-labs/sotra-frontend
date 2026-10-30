import { enviarPedidoApi, leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { Pagina } from "@/tipos/pagina";
import type { NoLeidas, Notificacion } from "@/tipos/notificacion";

const RUTA = "/api/v1/notificaciones";

export async function apiListarNotificaciones(tamanoPagina = 10, soloNoLeidas = false) {
  const parametros = new URLSearchParams({ pagina: "1", tamanoPagina: String(tamanoPagina) });
  if (soloNoLeidas) parametros.append("soloNoLeidas", "true");
  const pagina = await leerDatosApi(RUTA + "?" + parametros.toString(), { cache: "no-store" }, "No se pudieron obtener las notificaciones.");
  return pagina as Pagina<Notificacion>;
}

export async function apiContarNotificacionesNoLeidas() {
  const resultado = await leerDatosApi(RUTA + "/no-leidas", { cache: "no-store" }, "No se pudieron contar las notificaciones.");
  return resultado as NoLeidas;
}

export async function apiMarcarNotificacionLeida(notificacionId: number) {
  await enviarPedidoApi(RUTA + "/" + notificacionId + "/leida", { method: "PATCH" }, "No se pudo marcar la notificación como leída.");
}

export async function apiMarcarTodasLasNotificacionesLeidas() {
  await enviarPedidoApi(RUTA + "/marcar-leidas", { method: "POST" }, "No se pudieron marcar las notificaciones como leídas.");
}
