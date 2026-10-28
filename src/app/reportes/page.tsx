import { obtenerAvisosServidor, obtenerComparativaServidor, obtenerIndicadoresServidor } from "@/servicios/servidor/reportes";
import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarActivosServidor, obtenerActivoServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor, obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { listarEstadosOrdenTrabajoOVacio } from "@/servicios/servidor/ordenes-trabajo";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { obtenerVisibilidadReportesServidor } from "@/servicios/servidor/visibilidad-reportes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { leerFiltrosReportes } from "./filtros";
import { FranjaAvisos } from "./franja-avisos";
import { ResumenIndicadores } from "./resumen-indicadores";
import { TarjetasKpi } from "./tarjetas-kpi";
import { TableroReportes } from "./tablero-reportes";

const ETIQUETA_CARGA = "Cargando indicadores…";

export default async function PaginaReportes(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosReportes(await props.searchParams, await listarEstadosOrdenTrabajoOVacio());
  const consulta = anticiparConsulta(obtenerIndicadoresServidor(filtros));
  const consultaKpi = anticiparConsulta(obtenerComparativaServidor(filtros));
  const consultaAvisos = anticiparConsulta(obtenerAvisosServidor());
  const visibilidad = await obtenerVisibilidadReportesServidor();
  const desactivados = visibilidad.filter(item => !item.visible).map(item => item.codigo);

  const [clientes, activos] = await Promise.all([
    listarClientesServidor({ buscar: "", estado: "", pagina: 1 })
      .then((pagina) => conSeleccionado<Cliente>(pagina.elementos, filtros.clienteId, obtenerClienteServidor))
      .catch(() => [] as Cliente[]),
    listarActivosServidor({ buscar: "", clienteId: filtros.clienteId, modeloMaquinaId: "", estado: "", pagina: 1 })
      .then((pagina) => conSeleccionado<Activo>(pagina.elementos, filtros.activoId, obtenerActivoServidor))
      .catch(() => [] as Activo[]),
  ]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Reportes e indicadores</h1>
        </div>
      </header>

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <TableroReportes
          desactivados={desactivados}
          activos={activos}
          avisos={
            <Suspense fallback={null}>
              <FranjaAvisos consulta={consultaAvisos} visible={!desactivados.includes("franja_avisos")} />
            </Suspense>
          }
          clientes={clientes}
          filtros={filtros}
          kpis={
            <Suspense fallback={<div aria-hidden="true" className="kpi-franja h-28 animate-pulse rounded bg-current opacity-10 motion-reduce:animate-none" />}>
              <TarjetasKpi consulta={consultaKpi} desactivados={desactivados} />
            </Suspense>
          }
        >
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />}>
              <ResumenIndicadores consulta={consulta} filtros={filtros} desactivados={desactivados} />
            </Suspense>
          </ZonaListado>
        </TableroReportes>
      </ProveedorNavegacionListado>
    </main>
  );
}
