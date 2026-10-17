import Link from "next/link";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { listarActivosServidor } from "@/servicios/servidor/activos";
import { obtenerModeloMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import { obtenerTipoMaquinaServidor } from "@/servicios/servidor/tipos-maquina";
import type { Activo } from "@/tipos/activo";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

type DatosModelo = { modelo: ModeloMaquina; nombreTipo: string; activos: Activo[]; totalActivos: number };

async function cargarDatos(modeloMaquinaId: number): Promise<DatosModelo | null> {
  if (!Number.isInteger(modeloMaquinaId) || modeloMaquinaId <= 0) return null;
  try {
    const [modelo, paginaActivos] = await Promise.all([
      obtenerModeloMaquinaServidor(modeloMaquinaId),
      listarActivosServidor({ buscar: "", clienteId: "", modeloMaquinaId: String(modeloMaquinaId), estado: "", pagina: 1 }),
    ]);
    const tipo = await obtenerTipoMaquinaServidor(modelo.tipoMaquinaId);
    return { modelo, nombreTipo: tipo.nombre, activos: paginaActivos.elementos, totalActivos: paginaActivos.totalElementos };
  } catch {
    return null;
  }
}

export default async function PaginaDetalleModeloMaquina(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Modelos de máquina</p>
          <h1>{datos ? datos.modelo.nombre : "Detalle del modelo de máquina"}</h1>
        </div>
        <Link className="secondary-button" href="/activos/modelos">
          Volver a activos
        </Link>
      </header>

      {datos ? (
        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="panel detail-panel">
            <dl className="detail-list">
              <div>
                <dt>Tipo de máquina</dt>
                <dd>
                  <Link className="text-link" href={"/activos/tipos/" + datos.modelo.tipoMaquinaId}>{datos.nombreTipo}</Link>
                </dd>
              </div>
              <div>
                <dt>Descripción</dt>
                <dd>{datos.modelo.descripcion ? datos.modelo.descripcion : "Sin descripción"}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd><EstadoRegistro estado={datos.modelo.estado} /></dd>
              </div>
            </dl>
            <div className="form-actions">
              <Link className="primary-button" href={"/activos/modelos/" + datos.modelo.id + "/editar"}>
                Modificar
              </Link>
            </div>
          </section>

          <section className="panel detail-panel">
            <h2>{"Activos de este modelo (" + datos.totalActivos + ")"}</h2>
            <div className="mt-4">
              {datos.activos.length === 0 ? (
                <p className="empty-state">No hay activos registrados con este modelo.</p>
              ) : (
                <ul className="grid gap-2 text-sm">
                  {datos.activos.map((activo) => (
                    <li key={activo.id}>
                      <Link className="text-link" href={"/activos/" + activo.id}>
                        {activo.nombre ? activo.nombre + " (" + activo.numSerie + ")" : activo.numSerie}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del modelo de máquina solicitado.</p>
      )}
    </main>
  );
}
