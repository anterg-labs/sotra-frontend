import Link from "next/link";
import { TablaOrdenesResumen } from "@/componentes/tablas-ordenables";
import { obtenerAlertasMaquinariaServidor, obtenerIndicadoresServidor } from "@/servicios/servidor/reportes";
import type { FiltrosIndicadores, Indicadores } from "@/tipos/reporte";
import { armarAccesos, type Acceso } from "./accesos";

const SIN_FILTROS: FiltrosIndicadores = {
  fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "",
};

function TarjetaAcceso(props: { acceso: Acceso }) {
  const { acceso } = props;
  return (
    <Link
      className={"panel flex flex-col gap-1 p-5 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)]" + (acceso.destacado ? " border-[var(--acento)]" : "")}
      href={acceso.href}
    >
      <span className="text-sm font-medium text-[var(--texto-suave,inherit)]">{acceso.etiqueta}</span>
      <span className="text-4xl font-bold">{acceso.valor}</span>
      {acceso.detalle ? <span className="text-sm">{acceso.detalle}</span> : null}
    </Link>
  );
}

/** Pantalla principal tras el login: accesos directos a lo importante, calculados con los endpoints de Reportes. */
export default async function PaginaInicio() {
  let indicadores: Indicadores;
  try {
    indicadores = await obtenerIndicadoresServidor(SIN_FILTROS);
  } catch (error) {
    return (
      <main className="page-content">
        <header className="page-heading"><h1>Inicio</h1></header>
        <p className="form-error-banner" role="alert">
          {error instanceof Error ? error.message : "No se pudo cargar el inicio."}
        </p>
      </main>
    );
  }
  const alertas = await obtenerAlertasMaquinariaServidor(SIN_FILTROS).catch(() => null);
  const accesos = armarAccesos(indicadores, alertas);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Inicio</h1>
        </div>
        <Link className="primary-button" href="/ordenes-trabajo/nuevo">Nueva orden de trabajo</Link>
      </header>

      <section aria-label="Accesos directos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {accesos.map((acceso) => <TarjetaAcceso acceso={acceso} key={acceso.etiqueta} />)}
      </section>

      <section className="panel mt-6">
        <div className="panel-heading">
          <h2>Órdenes recientes</h2>
          <Link className="text-link" href="/ordenes-trabajo">Ver todas</Link>
        </div>
        {indicadores.ordenesRecientes.length === 0 ? (
          <p className="empty-state">No hay órdenes de trabajo registradas.</p>
        ) : (
          <TablaOrdenesResumen etiqueta="Órdenes recientes" ordenes={indicadores.ordenesRecientes} />
        )}
      </section>

      <section aria-label="Otros accesos" className="mt-6 flex flex-wrap gap-3">
        <Link className="text-link" href="/reportes">Reportes e indicadores</Link>
        <Link className="text-link" href="/documentacion-tecnica">Documentación técnica</Link>
        <Link className="text-link" href="/repuestos/movimientos">Movimientos de stock</Link>
        <Link className="text-link" href="/clientes">Clientes</Link>
      </section>
    </main>
  );
}
