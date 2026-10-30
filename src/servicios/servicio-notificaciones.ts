import {
  apiContarNotificacionesNoLeidas,
  apiListarNotificaciones,
  apiMarcarNotificacionLeida,
  apiMarcarTodasLasNotificacionesLeidas,
} from "@/servicios/api/api-notificaciones";

export async function listarNotificaciones(tamanoPagina = 10) {
  return (await apiListarNotificaciones(tamanoPagina)).elementos;
}

export async function contarNotificacionesNoLeidas() {
  return (await apiContarNotificacionesNoLeidas()).total;
}

export const marcarNotificacionLeida = apiMarcarNotificacionLeida;
export const marcarTodasLasNotificacionesLeidas = apiMarcarTodasLasNotificacionesLeidas;
