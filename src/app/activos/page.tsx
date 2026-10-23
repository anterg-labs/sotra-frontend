import { listarActivosServidor } from "@/servicios/servidor/activos";
import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { obtenerClienteServidor, listarClientesServidor } from "@/servicios/servidor/clientes";
import { listarModelosMaquinaServidor, obtenerModeloMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import { AltaActivoModal } from "./alta-activo-modal";
import { BarraFiltrosActivos } from "./barra-filtros-activos";
import { leerFiltrosActivos } from "./filtros";
import { ListadoActivos } from "./listado-activos";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";

const ETIQUETA_CARGA = "Cargando activos…";

export default async function PaginaActivos(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosActivos(await props.searchParams);
  const consulta = anticiparConsulta(listarActivosServidor(filtros));

  // El pañolero ve activos pero no modelos; los datos del alta solo hacen falta si el rol puede crear.
  const [puedeVerModelos, puedeCrear] = await Promise.all([tienePermisoServidor("modelo.consultar"), tienePermisoServidor("activo.crear")]);
  const [clientesFiltro, modelosFiltro, clientesAlta, modelosAlta] = await Promise.all([
    listarClientesServidor({ buscar: "", estado: "", pagina: 1 })
      .then((pagina) => conSeleccionado<Cliente>(pagina.elementos, filtros.clienteId, obtenerClienteServidor))
      .catch(() => [] as Cliente[]),
    puedeVerModelos
      ? listarModelosMaquinaServidor({ buscar: "", tipoMaquinaId: "", estado: "", pagina: 1 })
          .then((pagina) => conSeleccionado<ModeloMaquina>(pagina.elementos, filtros.modeloMaquinaId, obtenerModeloMaquinaServidor))
          .catch(() => [] as ModeloMaquina[])
      : ([] as ModeloMaquina[]),
    puedeCrear
      ? listarClientesServidor({ buscar: "", estado: "activo", pagina: 1 }).then((pagina) => pagina.elementos).catch(() => null)
      : null,
    puedeCrear
      ? listarModelosMaquinaServidor({ buscar: "", tipoMaquinaId: "", estado: "activo", pagina: 1 })
          .then((pagina) => pagina.elementos)
          .catch(() => null)
      : null,
  ]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de activos</h1>
        </div>
        <SiTienePermiso permiso="activo.crear">
          <AltaActivoModal clientes={clientesAlta} modelosMaquina={modelosAlta} />
        </SiTienePermiso>
      </header>

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <BarraFiltrosActivos clientes={clientesFiltro} filtros={filtros} modelosMaquina={modelosFiltro} />

        <section className="panel mb-8">
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />}>
              <ListadoActivos consulta={consulta} filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </section>
      </ProveedorNavegacionListado>
    </main>
  );
}
