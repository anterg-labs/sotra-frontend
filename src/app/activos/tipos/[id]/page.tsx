import Link from "next/link";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { listarModelosMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import { obtenerTipoMaquinaServidor } from "@/servicios/servidor/tipos-maquina";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

type DatosTipo = { tipoMaquina: TipoMaquina; modelos: ModeloMaquina[]; totalModelos: number };

async function cargarDatos(tipoMaquinaId: number): Promise<DatosTipo | null> {
  if (!Number.isInteger(tipoMaquinaId) || tipoMaquinaId <= 0) return null;
  try {
    const [tipoMaquina, paginaModelos] = await Promise.all([
      obtenerTipoMaquinaServidor(tipoMaquinaId),
      listarModelosMaquinaServidor({ buscar: "", tipoMaquinaId: String(tipoMaquinaId), estado: "", pagina: 1 }),
    ]);
    return { tipoMaquina, modelos: paginaModelos.elementos, totalModelos: paginaModelos.totalElementos };
  } catch {
    return null;
  }
}

export default async function PaginaDetalleTipoMaquina(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Tipos de máquina</p>
          <h1>{datos ? datos.tipoMaquina.nombre : "Detalle del tipo de máquina"}</h1>
        </div>
        <Link className="secondary-button" href="/activos/tipos">
          Volver a activos
        </Link>
      </header>

      {datos ? (
        <div className="mx-auto grid max-w-4xl items-start gap-4 md:grid-cols-2">
          <section className="panel detail-panel">
            <dl className="detail-list">
              <div>
                <dt>Nombre</dt>
                <dd>{datos.tipoMaquina.nombre}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd><EstadoRegistro estado={datos.tipoMaquina.estado} /></dd>
              </div>
            </dl>
            <div className="form-actions">
              <Link className="primary-button" href={"/activos/tipos/" + datos.tipoMaquina.id + "/editar"}>
                Modificar
              </Link>
            </div>
          </section>

          <section className="panel detail-panel">
            <h2>{"Modelos de este tipo (" + datos.totalModelos + ")"}</h2>
            <div className="mt-4">
              {datos.modelos.length === 0 ? (
                <p className="empty-state">No hay modelos registrados de este tipo.</p>
              ) : (
                <ul className="grid gap-2 text-sm">
                  {datos.modelos.map((modelo) => (
                    <li key={modelo.id}>
                      <Link className="text-link" href={"/activos/modelos/" + modelo.id}>{modelo.nombre}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del tipo de máquina solicitado.</p>
      )}
    </main>
  );
}
