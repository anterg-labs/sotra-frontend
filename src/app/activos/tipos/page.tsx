import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { AltaTipo } from "./alta-tipo";
import { BarraFiltrosTipos } from "./barra-filtros-tipos";
import { leerFiltrosTipos } from "./filtros";
import { ListadoTipos } from "./listado-tipos";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";

const ETIQUETA_CARGA = "Cargando tipos de máquina…";

export default async function PaginaTiposMaquina(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosTipos(await props.searchParams);
  const clave = [filtros.buscar, filtros.estado, filtros.pagina].join("|");

  return (
    <main className="page-content">
      <header className="page-heading">
        <h1>Tipos de máquina</h1>
      </header>
      <div className="mb-8">
        <header className="page-heading">
          <div>
            <h2>Tipos de máquina</h2>
          </div>
          <SiTienePermiso permiso="tipo_maquina.gestionar">
            <AltaTipo />
          </SiTienePermiso>
        </header>

        <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
          <BarraFiltrosTipos filtros={filtros} />

          <section className="panel">
            <ZonaListado>
              <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />} key={clave}>
                <ListadoTipos filtros={filtros} />
              </Suspense>
            </ZonaListado>
          </section>
        </ProveedorNavegacionListado>
      </div>
    </main>
  );
}
