import { listarDocumentosTecnicosServidor } from "@/servicios/servidor/documentos-tecnicos";
import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarActivosServidor, obtenerActivoServidor } from "@/servicios/servidor/activos";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { listarModelosMaquinaServidor, obtenerModeloMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import type { Activo } from "@/tipos/activo";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import { BarraFiltrosDocumentos } from "./barra-filtros-documentos";
import { leerFiltrosDocumentos } from "./filtros";
import { ListadoDocumentos } from "./listado-documentos";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";

const ETIQUETA_CARGA = "Cargando documentación…";

export default async function PaginaDocumentacionTecnica(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosDocumentos(await props.searchParams);
  const consulta = anticiparConsulta(listarDocumentosTecnicosServidor(filtros));

  const activos = await listarActivosServidor({ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "", pagina: 1 })
    .then((pagina) => conSeleccionado<Activo>(pagina.elementos, filtros.activoId, obtenerActivoServidor))
    .catch(() => [] as Activo[]);
  const modelos = await listarModelosMaquinaServidor({ buscar: "", tipoMaquinaId: "", estado: "", pagina: 1 })
    .then((pagina) => conSeleccionado<ModeloMaquina>(pagina.elementos, filtros.modeloMaquinaId, obtenerModeloMaquinaServidor))
    .catch(() => [] as ModeloMaquina[]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Documentación</h1>
        </div>
        <SiTienePermiso permiso="documento.gestionar">
          <Link className="primary-button" href="/documentacion-tecnica/nuevo">
            Cargar documento
          </Link>
        </SiTienePermiso>
      </header>

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <BarraFiltrosDocumentos activos={activos} filtros={filtros} modelosMaquina={modelos} />

        <section className="panel">
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />}>
              <ListadoDocumentos consulta={consulta} filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </section>
      </ProveedorNavegacionListado>
    </main>
  );
}
