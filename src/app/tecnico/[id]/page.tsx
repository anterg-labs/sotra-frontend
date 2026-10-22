import { unstable_rethrow } from "next/navigation";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { obtenerOrdenTrabajoServidor } from "@/servicios/servidor/ordenes-trabajo";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import { OrdenDelTecnico } from "./orden-del-tecnico";

type OrdenCargada = { orden: OrdenTrabajo } | { error: string };

const MENSAJE_ERROR = "No se pudo obtener la orden. Revisá tu conexión e intentá de nuevo.";

/** El técnico solo ve sus órdenes: una orden ajena llega como 403 de la API. */
async function cargarOrden(ordenId: number): Promise<OrdenCargada> {
  if (!Number.isInteger(ordenId) || ordenId <= 0) return { error: MENSAJE_ERROR };
  try {
    return { orden: await obtenerOrdenTrabajoServidor(ordenId) };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ErrorDeApi && error.estadoHttp === 403) return { error: "Esta orden no está asignada a vos." };
    if (error instanceof ErrorDeApi && error.estadoHttp === 404) return { error: "La orden no existe." };
    return { error: MENSAJE_ERROR };
  }
}

export default async function PaginaOrdenDelTecnico(props: { params: Promise<{ id: string }> }) {
  const resultado = await cargarOrden(Number((await props.params).id));
  if ("error" in resultado) {
    return <p className="form-error-banner" role="alert">{resultado.error}</p>;
  }
  return <OrdenDelTecnico ordenInicial={resultado.orden} />;
}
