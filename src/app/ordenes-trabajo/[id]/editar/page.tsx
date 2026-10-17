import { obtenerActivoServidor, listarActivosServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor, obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { listarTecnicosServidor, obtenerOrdenTrabajoServidor } from "@/servicios/servidor/ordenes-trabajo";
import { listarRepuestosServidor, obtenerRepuestoServidor } from "@/servicios/servidor/repuestos";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import { FormularioEditarOrden } from "../../formularios-orden";

/** La orden y sus selecciones actuales van primero en cada lista, aunque ya no estén activas. */
async function cargarDatos(ordenTrabajoId: number) {
  if (!Number.isInteger(ordenTrabajoId) || ordenTrabajoId <= 0) return null;
  try {
    const [orden, paginaClientes, tecnicos, paginaRepuestos] = await Promise.all([
      obtenerOrdenTrabajoServidor(ordenTrabajoId),
      listarClientesServidor({ buscar: "", estado: "activo", pagina: 1 }),
      listarTecnicosServidor(),
      listarRepuestosServidor({ buscar: "", estado: "activo", ubicacion: "", bajoStock: false, pagina: 1 }),
    ]);
    const [paginaActivos, cliente, activo, tecnicoActual, repuestosDeLaOrden] = await Promise.all([
      listarActivosServidor({ buscar: "", clienteId: String(orden.clienteId), modeloMaquinaId: "", estado: "activo", pagina: 1 }),
      obtenerClienteServidor(orden.clienteId),
      obtenerActivoServidor(orden.activoId),
      orden.tecnicoId === null ? Promise.resolve(null) : obtenerUsuarioServidor(orden.tecnicoId),
      Promise.all(orden.repuestos.map((repuesto) => obtenerRepuestoServidor(repuesto.id))),
    ]);
    const idsRepuestos = new Set(repuestosDeLaOrden.map((repuesto) => repuesto.id));
    return {
      orden,
      clientes: [cliente, ...paginaClientes.elementos.filter((otro) => otro.id !== cliente.id)],
      activos: [activo, ...paginaActivos.elementos.filter((otro) => otro.id !== activo.id)],
      tecnicos: tecnicoActual ? [tecnicoActual, ...tecnicos.filter((otro) => otro.id !== tecnicoActual.id)] : tecnicos,
      repuestos: [...repuestosDeLaOrden, ...paginaRepuestos.elementos.filter((repuesto) => !idsRepuestos.has(repuesto.id))],
    };
  } catch {
    return null;
  }
}

export default async function PaginaEditarOrdenTrabajo(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Órdenes de trabajo</p>
          <h1>Modificar orden de trabajo</h1>
        </div>
      </header>

      {datos === null ? (
        <p className="form-error-banner">No se pudo obtener la información de la orden solicitada.</p>
      ) : (
        <section className="panel form-panel">
          <FormularioEditarOrden {...datos} />
        </section>
      )}
    </main>
  );
}
