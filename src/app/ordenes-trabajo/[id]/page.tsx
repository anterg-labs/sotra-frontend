import { conTecnicoDeLaOrden, obtenerOrdenTrabajoServidor, listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { obtenerRepuestoServidor } from "@/servicios/servidor/repuestos";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";
import { DetalleOrdenTrabajo } from "./detalle-orden";
import { EnlaceVolver } from "@/componentes/enlace-volver";

async function cargarOrden(ordenTrabajoId: number): Promise<OrdenTrabajo | null> {
  if (!Number.isInteger(ordenTrabajoId) || ordenTrabajoId <= 0) return null;
  try {
    return await obtenerOrdenTrabajoServidor(ordenTrabajoId);
  } catch {
    return null;
  }
}

/** Técnicos para asignar, con el técnico actual de la orden primero. */
async function cargarTecnicos(orden: OrdenTrabajo): Promise<Usuario[] | null> {
  try {
    return conTecnicoDeLaOrden(orden, await listarTecnicosServidor());
  } catch {
    return null;
  }
}

/** Los repuestos de la orden con su stock actual, para el selector de cantidades; si falla, el detalle sigue sin editor completo. */
async function cargarRepuestos(orden: OrdenTrabajo) {
  try {
    return await Promise.all(orden.repuestos.map((repuesto) => obtenerRepuestoServidor(repuesto.id)));
  } catch {
    return [];
  }
}

export default async function PaginaDetalleOrdenTrabajo(props: { params: Promise<{ id: string }> }) {
  const orden = await cargarOrden(Number((await props.params).id));
  if (orden === null) {
    return (
      <main className="page-content">
        <header className="page-heading">
          <div className="encabezado-volver">
            <EnlaceVolver etiqueta="Volver al listado" href="/ordenes-trabajo" />
            <div>
              <p className="eyebrow">Órdenes de trabajo</p>
              <h1>Orden de trabajo</h1>
            </div>
          </div>
        </header>
        <p className="form-error-banner">No se pudo obtener la información de la orden solicitada.</p>
      </main>
    );
  }

  const tecnicos = (await tienePermisoServidor("ot.asignar_tecnico")) ? await cargarTecnicos(orden) : [];
  const repuestos = (await tienePermisoServidor("ot.gestionar_repuestos")) ? await cargarRepuestos(orden) : [];
  return (
    <DetalleOrdenTrabajo
      huboErrorTecnicos={tecnicos === null}
      ordenInicial={orden}
      repuestosDeLaOrden={repuestos}
      tecnicosIniciales={tecnicos ?? []}
    />
  );
}
