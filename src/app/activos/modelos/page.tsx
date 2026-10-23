import { listarModelosMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarTiposMaquinaServidor, obtenerTipoMaquinaServidor } from "@/servicios/servidor/tipos-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";
import { AltaModelo } from "./alta-modelo";
import { BarraFiltrosModelos } from "./barra-filtros-modelos";
import { leerFiltrosModelos } from "./filtros";
import { ListadoModelos } from "./listado-modelos";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";

const ETIQUETA_CARGA = "Cargando modelos de máquina…";

/** Opciones del filtro «Tipo»: la primera página y, si el filtro elegido no está, ese tipo al principio. */
async function cargarTiposParaFiltro(tipoMaquinaId: string) {
  const pagina = await listarTiposMaquinaServidor({ buscar: "", estado: "", pagina: 1 }).catch(() => null);
  const tipos: TipoMaquina[] = pagina?.elementos ?? [];
  if (tipoMaquinaId !== "" && !tipos.some((tipo) => String(tipo.id) === tipoMaquinaId)) {
    const elegido = await obtenerTipoMaquinaServidor(Number(tipoMaquinaId)).catch(() => null);
    if (elegido) tipos.unshift(elegido);
  }
  return tipos;
}

export default async function PaginaModelosMaquina(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosModelos(await props.searchParams);
  const consulta = anticiparConsulta(listarModelosMaquinaServidor(filtros));
  const [tiposFiltro, tiposAlta] = await Promise.all([
    cargarTiposParaFiltro(filtros.tipoMaquinaId),
    listarTiposMaquinaServidor({ buscar: "", estado: "activo", pagina: 1 }).then((pagina) => pagina.elementos).catch(() => null),
  ]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <h1>Modelos de máquina</h1>
      </header>
      <div className="mb-8">
        <header className="page-heading">
          <div>
            <h2>Modelos de máquina</h2>
          </div>
          <SiTienePermiso permiso="modelo.crear">
            <AltaModelo tiposMaquina={tiposAlta} />
          </SiTienePermiso>
        </header>

        <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
          <BarraFiltrosModelos filtros={filtros} tiposMaquina={tiposFiltro} />

          <section className="panel">
            <ZonaListado>
              <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />}>
                <ListadoModelos consulta={consulta} filtros={filtros} />
              </Suspense>
            </ZonaListado>
          </section>
        </ProveedorNavegacionListado>
      </div>
    </main>
  );
}
