import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { AltaCliente } from "./alta-cliente";
import { BarraFiltrosClientes } from "./barra-filtros-clientes";
import { leerFiltrosClientes } from "./filtros";
import { ListadoClientes } from "./listado-clientes";

const ETIQUETA_CARGA = "Cargando clientes…";

export default async function PaginaClientes(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosClientes(await props.searchParams);
  const clave = [filtros.buscar, filtros.estado, filtros.pagina].join("|");

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de clientes</h1>
        </div>
        <AltaCliente />
      </header>

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <BarraFiltrosClientes filtros={filtros} />

        <section className="panel">
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />} key={clave}>
              <ListadoClientes filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </section>
      </ProveedorNavegacionListado>
    </main>
  );
}
