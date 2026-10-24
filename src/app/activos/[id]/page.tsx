import Link from "next/link";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import { apiObtenerUrlDescargaDocumentoTecnico } from "@/servicios/api/api-documentos-tecnicos";
import { listarDocumentosDeActivoServidor, obtenerActivoServidor } from "@/servicios/servidor/activos";
import { obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { obtenerModeloMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import type { Activo } from "@/tipos/activo";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { EnlaceVolver } from "@/componentes/enlace-volver";

type DatosActivo = {
  activo: Activo;
  nombreCliente: string;
  nombreModelo: string;
  /** `null` si el rol no ve modelos ni tipos de máquina (pañolero). */
  tipoMaquina: { id: number; nombre: string } | null;
};

/** El pañolero ve activos pero no modelos: en ese caso el modelo sale del nombre que trae el activo. */
async function cargarActivo(activoId: number): Promise<DatosActivo | null> {
  if (!Number.isInteger(activoId) || activoId <= 0) return null;
  try {
    const activo = await obtenerActivoServidor(activoId);
    const [cliente, modelo] = await Promise.all([
      obtenerClienteServidor(activo.clienteId),
      (await tienePermisoServidor("modelo.consultar")) ? obtenerModeloMaquinaServidor(activo.modeloMaquinaId) : null,
    ]);
    return {
      activo,
      nombreCliente: cliente.razonSocial,
      nombreModelo: modelo?.nombre ?? activo.nombreModeloMaquina ?? "Modelo " + activo.modeloMaquinaId,
      tipoMaquina: modelo ? { id: modelo.tipoMaquinaId, nombre: modelo.nombreTipoMaquina ?? "Tipo " + modelo.tipoMaquinaId } : null,
    };
  } catch {
    return null;
  }
}

/** Si la documentación no se puede traer (o el rol no la ve), el detalle igual se muestra con la lista vacía. */
async function cargarDocumentos(activoId: number): Promise<DocumentoTecnico[]> {
  if (!Number.isInteger(activoId) || activoId <= 0) return [];
  if (!(await tienePermisoServidor("documento.consultar"))) return [];
  try {
    return (await listarDocumentosDeActivoServidor(activoId)).elementos;
  } catch {
    return [];
  }
}

export default async function PaginaDetalleActivo(props: { params: Promise<{ id: string }> }) {
  const activoId = Number((await props.params).id);
  const [datos, documentos] = await Promise.all([cargarActivo(activoId), cargarDocumentos(activoId)]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver al listado" href="/activos" />
          <div>
            <p className="eyebrow">Activos</p>
            <h1>{datos ? (datos.activo.nombre ?? "Sin nombre") : "Detalle del activo"}</h1>
          </div>
        </div>
      </header>

      {datos ? (
        <div className="grid gap-6">
          <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="panel detail-panel">
              <dl className="detail-list">
                <div>
                  <dt>Número de serie</dt>
                  <dd>{datos.activo.numSerie}</dd>
                </div>
                <div>
                  <dt>Cliente</dt>
                  <dd>
                    <Link className="text-link" href={"/clientes/" + datos.activo.clienteId}>{datos.nombreCliente}</Link>
                  </dd>
                </div>
                <div>
                  <dt>Modelo</dt>
                  <dd>
                    {datos.tipoMaquina ? (
                      <Link className="text-link" href={"/activos/modelos/" + datos.activo.modeloMaquinaId}>{datos.nombreModelo}</Link>
                    ) : (
                      datos.nombreModelo
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Tipo de máquina</dt>
                  <dd>
                    {datos.tipoMaquina ? (
                      <Link className="text-link" href={"/activos/tipos/" + datos.tipoMaquina.id}>{datos.tipoMaquina.nombre}</Link>
                    ) : (
                      "No disponible"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Año de fabricación</dt>
                  <dd>{datos.activo.anioFabricacion !== null ? String(datos.activo.anioFabricacion) : "Sin dato"}</dd>
                </div>
                <div>
                  <dt>Ubicación</dt>
                  <dd>{datos.activo.ubicacion ? datos.activo.ubicacion : "Sin dato"}</dd>
                </div>
                <div>
                  <dt>Descripción</dt>
                  <dd>{datos.activo.descripcion ? datos.activo.descripcion : "Sin descripción"}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd><EstadoRegistro estado={datos.activo.estado} /></dd>
                </div>
              </dl>
              <div className="form-actions">
                <SiTienePermiso permiso="activo.editar">
                  <Link className="primary-button" href={"/activos/" + datos.activo.id + "/editar"}>
                    Modificar
                  </Link>
                </SiTienePermiso>
              </div>
            </section>

            <section className="panel detail-panel">
              <h2>Documentación técnica</h2>
              <div className="mt-4">
                {documentos.length === 0 ? (
                  <p className="empty-state">Este activo no tiene documentación técnica asociada.</p>
                ) : (
                  <ul className="grid gap-2 text-sm">
                    {documentos.map((documento) => (
                      <li key={documento.id}>
                        <a
                          className="text-link"
                          href={apiObtenerUrlDescargaDocumentoTecnico(documento.id)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {documento.nombreArchivo}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <OrdenesAsociadas activoId={String(datos.activo.id)} clienteId="" tecnicoId="" titulo="Historial de órdenes de trabajo" />
        </div>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del activo solicitado.</p>
      )}
    </main>
  );
}
