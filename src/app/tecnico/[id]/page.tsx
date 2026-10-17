import { obtenerOrdenTrabajoServidor } from "@/servicios/servidor/ordenes-trabajo";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import { OrdenDelTecnico } from "./orden-del-tecnico";

async function cargarOrden(ordenId: number): Promise<OrdenTrabajo | null> {
  if (!Number.isInteger(ordenId) || ordenId <= 0) return null;
  try {
    return await obtenerOrdenTrabajoServidor(ordenId);
  } catch {
    return null;
  }
}

export default async function PaginaOrdenDelTecnico(props: { params: Promise<{ id: string }> }) {
  const orden = await cargarOrden(Number((await props.params).id));
  if (orden === null) {
    return <p className="form-error-banner" role="alert">No se pudo obtener la orden. Revisá tu conexión e intentá de nuevo.</p>;
  }
  return <OrdenDelTecnico ordenInicial={orden} />;
}
