import Link from "next/link";
import { obtenerOrdenTrabajoServidor, listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";
import { DetalleOrdenTrabajo } from "./detalle-orden";

async function cargarOrden(ordenTrabajoId: number): Promise<OrdenTrabajo | null> {
  if (!Number.isInteger(ordenTrabajoId) || ordenTrabajoId <= 0) return null;
  try {
    return await obtenerOrdenTrabajoServidor(ordenTrabajoId);
  } catch {
    return null;
  }
}

/** Técnicos para asignar: el técnico actual de la orden va primero aunque ya no esté activo. */
async function cargarTecnicos(orden: OrdenTrabajo): Promise<Usuario[] | null> {
  try {
    const [tecnicos, actual] = await Promise.all([
      listarTecnicosServidor(),
      orden.tecnicoId === null ? Promise.resolve(null) : obtenerUsuarioServidor(orden.tecnicoId),
    ]);
    return actual ? [actual, ...tecnicos.filter((tecnico) => tecnico.id !== actual.id)] : tecnicos;
  } catch {
    return null;
  }
}

export default async function PaginaDetalleOrdenTrabajo(props: { params: Promise<{ id: string }> }) {
  const orden = await cargarOrden(Number((await props.params).id));
  if (orden === null) {
    return (
      <main className="page-content">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Órdenes de trabajo</p>
            <h1>Orden de trabajo</h1>
          </div>
          <Link className="secondary-button" href="/ordenes-trabajo">
            Volver al listado
          </Link>
        </header>
        <p className="form-error-banner">No se pudo obtener la información de la orden solicitada.</p>
      </main>
    );
  }

  const tecnicos = await cargarTecnicos(orden);
  return <DetalleOrdenTrabajo huboErrorTecnicos={tecnicos === null} ordenInicial={orden} tecnicosIniciales={tecnicos ?? []} />;
}
