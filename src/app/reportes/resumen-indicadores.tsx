import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { obtenerIndicadoresServidor } from "@/servicios/servidor/reportes";
import type { CantidadPorGrupo, FiltrosIndicadores } from "@/tipos/reporte";
import { TablaCantidadesPorGrupo, TablaOrdenesResumen, TablaRepuestosBajoStock } from "@/componentes/tablas-ordenables";

function formatearHoras(horas: number | null) {
  return horas === null ? "Sin datos" : horas + " h";
}

function TablaGrupos(props: { titulo: string; columna: string; grupos: CantidadPorGrupo[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{props.titulo}</h2>
      </div>
      {props.grupos.length === 0 ? (
        <p className="empty-state">No hay datos registrados.</p>
      ) : (
        <TablaCantidadesPorGrupo columna={props.columna} grupos={props.grupos} titulo={props.titulo} />
      )}
    </section>
  );
}

/** Resumen del tablero: los indicadores se piden en el servidor con los filtros de la URL; si falla, el error queda en línea. */
export async function ResumenIndicadores(props: { filtros: FiltrosIndicadores; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof obtenerIndicadoresServidor>>> }) {
  let indicadores;
  try {
    indicadores = await resolverConsulta(props.consulta ?? anticiparConsulta(obtenerIndicadoresServidor(props.filtros)));
  } catch (error) {
    return (
      <p className="form-error-banner" role="alert">
        {error instanceof Error ? error.message : "No se pudieron obtener los indicadores."}
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel p-6">
        <h2>Órdenes de trabajo registradas</h2>
        <p className="mt-2 text-4xl font-bold">{indicadores.totalOrdenes}</p>
      </section>
      <section className="panel p-6">
        <h2>Atención necesaria</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          <li><strong>{indicadores.ordenesAltaPrioridadPendientes}</strong> órdenes de prioridad alta pendientes</li>
          <li><strong>{indicadores.ordenesPendientesDeValidacion}</strong> órdenes finalizadas pendientes de validación</li>
          <li><strong>{indicadores.repuestosBajoStock.length}</strong> repuestos con bajo stock</li>
        </ul>
      </section>
      <section className="panel p-6">
        <h2>Tiempo promedio hasta el inicio</h2>
        <p className="mt-2 text-3xl font-bold">{formatearHoras(indicadores.promedioHorasHastaInicio)}</p>
      </section>
      <section className="panel p-6">
        <h2>Tiempo promedio hasta el cierre</h2>
        <p className="mt-2 text-3xl font-bold">{formatearHoras(indicadores.promedioHorasHastaCierre)}</p>
      </section>
      <section className="panel lg:col-span-2">
        <div className="panel-heading">
          <h2>Órdenes recientes</h2>
          <Link className="text-link" href="/ordenes-trabajo">
            Ver todas
          </Link>
        </div>
        {indicadores.ordenesRecientes.length === 0 ? (
          <p className="empty-state">No hay órdenes de trabajo registradas.</p>
        ) : (
          <TablaOrdenesResumen etiqueta="Órdenes recientes" ordenes={indicadores.ordenesRecientes} />
        )}
      </section>
      <TablaGrupos columna="Estado" grupos={indicadores.ordenesPorEstado} titulo="Órdenes por estado" />
      <TablaGrupos columna="Prioridad" grupos={indicadores.ordenesPorPrioridad} titulo="Órdenes por prioridad" />
      <TablaGrupos columna="Tipo" grupos={indicadores.ordenesPorTipo} titulo="Órdenes por tipo de mantenimiento" />
      <TablaGrupos columna="Técnico" grupos={indicadores.ordenesPorTecnico} titulo="Órdenes asignadas por técnico" />
      <TablaGrupos columna="Activo" grupos={indicadores.activosConMasIntervenciones} titulo="Activos con más intervenciones" />
      <section className="panel">
        <div className="panel-heading">
          <h2>Repuestos con bajo stock</h2>
          <Link className="text-link" href="/repuestos?stock=alerta">Ver en Repuestos</Link>
        </div>
        {indicadores.repuestosBajoStock.length === 0 ? (
          <p className="empty-state">No hay repuestos con bajo stock.</p>
        ) : (
          <TablaRepuestosBajoStock repuestos={indicadores.repuestosBajoStock} />
        )}
      </section>
    </div>
  );
}
