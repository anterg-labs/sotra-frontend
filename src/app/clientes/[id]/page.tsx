import Link from "next/link";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import { listarActivosServidor } from "@/servicios/servidor/activos";
import { obtenerClienteServidor } from "@/servicios/servidor/clientes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { EnlaceVolver } from "@/componentes/enlace-volver";

function mostrarTexto(valor: string | null) {
  return valor === null || valor === "" ? "Sin dato" : valor;
}

async function cargarCliente(clienteId: number): Promise<Cliente | null> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) return null;
  try {
    return await obtenerClienteServidor(clienteId);
  } catch {
    return null;
  }
}

/** Si los activos no se pueden traer, el detalle igual se muestra con la lista vacía. */
async function cargarActivos(clienteId: number): Promise<{ elementos: Activo[]; total: number }> {
  try {
    const pagina = await listarActivosServidor({
      buscar: "",
      clienteId: String(clienteId),
      modeloMaquinaId: "",
      estado: "",
      pagina: 1,
    });
    return { elementos: pagina.elementos, total: pagina.totalElementos };
  } catch {
    return { elementos: [], total: 0 };
  }
}

function ListaActivos(props: { activos: Activo[] }) {
  if (props.activos.length === 0) {
    return <p className="empty-state">Este cliente no tiene activos registrados.</p>;
  }

  return (
    <ul className="grid gap-2 text-sm">
      {props.activos.map((activo) => {
        const nombreActivo = activo.nombre ? activo.nombre + " (" + activo.numSerie + ")" : activo.numSerie;
        return (
          <li key={activo.id}>
            <Link className="text-link" href={"/activos/" + activo.id}>{nombreActivo}</Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function PaginaDetalleCliente(props: { params: Promise<{ id: string }> }) {
  const clienteId = Number((await props.params).id);
  const [cliente, activos] = await Promise.all([cargarCliente(clienteId), cargarActivos(clienteId)]);

  const estaActivo = cliente?.estado === "activo";

  return (
    <main className="page-content">
      <header className="page-heading">
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver al listado" href="/clientes" />
          <div>
            <p className="eyebrow">Gestión de clientes</p>
            <h1>{cliente ? cliente.razonSocial : "Detalle del cliente"}</h1>
          </div>
        </div>
      </header>

      {cliente ? (
        <div className="grid gap-6">
          <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="panel detail-panel">
              <dl className="detail-list">
                <div>
                  <dt>Contacto</dt>
                  <dd>{cliente.nombreContacto}</dd>
                </div>
                <div>
                  <dt>Correo electrónico</dt>
                  <dd>{mostrarTexto(cliente.correo)}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{mostrarTexto(cliente.telefono)}</dd>
                </div>
                <div className="detail-wide">
                  <dt>Dirección</dt>
                  <dd>{mostrarTexto(cliente.direccion)}</dd>
                </div>
                <div className="detail-wide">
                  <dt>Observaciones</dt>
                  <dd>{mostrarTexto(cliente.observaciones)}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>
                    <span className={estaActivo ? "status status-activo" : "status status-inactivo"}>
                      {estaActivo ? "Activo" : "Inactivo"}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="form-actions">
                <SiTienePermiso permiso="cliente.gestionar">
                  <Link className="primary-button" href={"/clientes/" + cliente.id + "/editar"}>
                    Modificar
                  </Link>
                </SiTienePermiso>
              </div>
            </section>

            <section className="panel detail-panel">
              <h2>{"Activos del cliente (" + activos.total + ")"}</h2>
              <div className="mt-4">
                <ListaActivos activos={activos.elementos} />
              </div>
            </section>
          </div>

          <OrdenesAsociadas
            activoId=""
            clienteId={String(cliente.id)}
            tecnicoId=""
            titulo="Actividad: órdenes de trabajo del cliente"
          />
        </div>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del cliente solicitado.</p>
      )}
    </main>
  );
}
