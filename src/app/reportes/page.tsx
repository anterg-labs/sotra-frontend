import { obtenerIndicadoresServidor } from "@/servicios/servidor/reportes";
import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarActivosServidor, obtenerActivoServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor, obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { Usuario } from "@/tipos/usuario";
import { leerFiltrosReportes } from "./filtros";
import { ResumenIndicadores } from "./resumen-indicadores";
import { TableroReportes } from "./tablero-reportes";

const ETIQUETA_CARGA = "Cargando indicadores…";

export default async function PaginaReportes(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosReportes(await props.searchParams);
  const consulta = anticiparConsulta(obtenerIndicadoresServidor(filtros));
  const clave = Object.values(filtros).join("|");

  const [tecnicos, clientes, activos] = await Promise.all([
    listarTecnicosServidor()
      .then((lista) => conSeleccionado<Usuario>(lista, filtros.tecnicoId, obtenerUsuarioServidor))
      .catch(() => [] as Usuario[]),
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
        <TableroReportes activos={activos} clientes={clientes} filtros={filtros} tecnicos={tecnicos}>
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />} key={clave}>
              <ResumenIndicadores consulta={consulta} filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </TableroReportes>
      </ProveedorNavegacionListado>
    </main>
  );
}
