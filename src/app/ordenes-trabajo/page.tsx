import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarActivosServidor, obtenerActivoServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor, obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { listarOrdenesTrabajoServidor, listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { obtenerIndicadoresServidor } from "@/servicios/servidor/reportes";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { Indicadores } from "@/tipos/reporte";
import type { Usuario } from "@/tipos/usuario";
import { BarraFiltrosOrdenes } from "./barra-filtros-ordenes";
import { leerFiltrosOrdenes } from "./filtros";
import { ListadoOrdenes } from "./listado-ordenes";

const ETIQUETA_CARGA = "Cargando órdenes de trabajo…";

const sinFiltrosDeIndicadores = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };

function contarPorEstado(resumen: Indicadores, nombreEstado: string) {
  return resumen.ordenesPorEstado.find((grupo) => grupo.nombre === nombreEstado)?.cantidad ?? 0;
}

function TarjetaResumen(props: { etiqueta: string; valor: number }) {
  return (
    <article className="panel flex items-center justify-between px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide texto-tenue">{props.etiqueta}</p>
      <p className="text-xl font-bold">{props.valor}</p>
    </article>
  );
}

export default async function PaginaOrdenesTrabajo(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosOrdenes(await props.searchParams);
  const consulta = anticiparConsulta(listarOrdenesTrabajoServidor(filtros));
  const clave = Object.values(filtros).join("|");

  // El resumen sale de reportes y la lista de técnicos, de usuarios: solo se piden si el rol los puede ver.
  const [puedeVerResumen, puedeFiltrarPorTecnico] = await Promise.all([
    tienePermisoServidor("reporte.consultar"),
    tienePermisoServidor("usuario.listar"),
  ]);
  const [resumen, clientes, activos, tecnicos] = await Promise.all([
    puedeVerResumen ? obtenerIndicadoresServidor(sinFiltrosDeIndicadores).catch(() => null) : null,
    listarClientesServidor({ buscar: "", estado: "", pagina: 1 })
      .then((pagina) => conSeleccionado<Cliente>(pagina.elementos, filtros.clienteId, obtenerClienteServidor))
      .catch(() => [] as Cliente[]),
    listarActivosServidor({ buscar: "", clienteId: filtros.clienteId, modeloMaquinaId: "", estado: "", pagina: 1 })
      .then((pagina) => conSeleccionado<Activo>(pagina.elementos, filtros.activoId, obtenerActivoServidor))
      .catch(() => [] as Activo[]),
    puedeFiltrarPorTecnico
      ? listarTecnicosServidor()
          .then((lista) => conSeleccionado<Usuario>(lista, filtros.tecnicoId, obtenerUsuarioServidor))
          .catch(() => [] as Usuario[])
      : ([] as Usuario[]),
  ]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Órdenes de trabajo</h1>
        </div>
        <SiTienePermiso permiso="ot.crear">
          <Link className="primary-button" href="/ordenes-trabajo/nuevo">
            Crear orden
          </Link>
        </SiTienePermiso>
      </header>

      {resumen !== null ? (
        <section aria-label="Resumen de órdenes de trabajo" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaResumen etiqueta="Total de órdenes" valor={resumen.totalOrdenes} />
          <TarjetaResumen etiqueta="Creadas" valor={contarPorEstado(resumen, "creada")} />
          <TarjetaResumen etiqueta="En ejecución" valor={contarPorEstado(resumen, "en_ejecucion")} />
          <TarjetaResumen etiqueta="Cerradas" valor={contarPorEstado(resumen, "cerrada")} />
        </section>
      ) : null}

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <BarraFiltrosOrdenes
          activos={activos}
          clientes={clientes}
          filtros={filtros}
          puedeFiltrarPorTecnico={puedeFiltrarPorTecnico}
          tecnicos={tecnicos}
        />

        <section className="panel">
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />} key={clave}>
              <ListadoOrdenes consulta={consulta} filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </section>
      </ProveedorNavegacionListado>
    </main>
  );
}
