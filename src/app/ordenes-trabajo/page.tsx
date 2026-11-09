import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarActivosServidor, obtenerActivoServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor, obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { listarEstadosOrdenTrabajoOVacio, listarOrdenesTrabajoServidor, listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { obtenerIndicadoresServidor } from "@/servicios/servidor/reportes";
import { obtenerEstadoSesion, tienePermisoServidor } from "@/servicios/servidor/sesion";
import { esSoloTecnico } from "@/seguridad/permisos";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { Usuario } from "@/tipos/usuario";
import { ETIQUETAS_FASE_ORDEN, type OpcionEstadoOrden } from "@/tipos/orden-trabajo";
import { contarPorFase } from "@/utilidades/estados-orden";
import { BarraFiltrosOrdenes } from "./barra-filtros-ordenes";
import { leerFiltrosOrdenes } from "./filtros";
import { CalendarioOrdenes } from "./calendario-ordenes";
import { ListadoOrdenes } from "./listado-ordenes";
import { SelectorDeVista } from "./selector-de-vista";

const ETIQUETA_CARGA = "Cargando órdenes de trabajo…";

const sinFiltrosDeIndicadores = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };

function TarjetaResumen(props: { etiqueta: string; valor: number }) {
  return (
    <div className="resumen-ordenes-dato">
      <dt>{props.etiqueta}</dt>
      <dd>{props.valor}</dd>
    </div>
  );
}

/**
 * Id del usuario en sesión para el botón «Mis tareas», o `null` si no corresponde mostrarlo: tiene que tener el rol
 * técnico junto con otro rol (al técnico puro la API ya le lista solo lo suyo) y al menos una orden asignada.
 * Si el filtro ya está aplicado se muestra igual, para poder quitarlo.
 */
async function idParaMisTareas(tecnicoIdFiltrado: string, estados: OpcionEstadoOrden[]): Promise<string | null> {
  const sesion = await obtenerEstadoSesion();
  if (sesion.estado !== "con-acceso") return null;
  const { roles, idUsuario } = sesion.usuario;
  if (idUsuario === null || !roles.includes("tecnico") || esSoloTecnico(roles)) return null;

  const id = String(idUsuario);
  if (tecnicoIdFiltrado === id) return id;
  const tieneAsignadas = await listarOrdenesTrabajoServidor(leerFiltrosOrdenes({ tecnicoId: id }, estados))
    .then((pagina) => pagina.totalElementos > 0)
    .catch(() => false);
  return tieneAsignadas ? id : null;
}

export default async function PaginaOrdenesTrabajo(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const estados = await listarEstadosOrdenTrabajoOVacio();
  const filtros = leerFiltrosOrdenes(await props.searchParams, estados);
  const esCalendario = filtros.vista === "calendario";
  const consulta = esCalendario ? null : anticiparConsulta(listarOrdenesTrabajoServidor(filtros));

  // El resumen sale de reportes y la lista de técnicos, de usuarios: solo se piden si el rol los puede ver.
  const [puedeVerResumen, puedeFiltrarPorTecnico, idTecnicoMisTareas] = await Promise.all([
    tienePermisoServidor("reporte.consultar"),
    tienePermisoServidor("usuario.listar"),
    idParaMisTareas(filtros.tecnicoId, estados),
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
        <SelectorDeVista filtros={filtros} />
        <SiTienePermiso permiso="ot.crear">
          <Link className="primary-button" href="/ordenes-trabajo/nuevo">
            Crear orden
          </Link>
        </SiTienePermiso>
      </header>

      {resumen !== null ? (
        <section aria-label="Resumen de órdenes de trabajo" className="mb-4"><dl className="panel resumen-ordenes">
          <TarjetaResumen etiqueta="Total de órdenes" valor={resumen.totalOrdenes} />
          <TarjetaResumen etiqueta={ETIQUETAS_FASE_ORDEN.pendiente} valor={contarPorFase(resumen.ordenesPorEstado, estados, "pendiente")} />
          <TarjetaResumen etiqueta={ETIQUETAS_FASE_ORDEN.en_curso} valor={contarPorFase(resumen.ordenesPorEstado, estados, "en_curso")} />
          <TarjetaResumen etiqueta={ETIQUETAS_FASE_ORDEN.cerrada} valor={contarPorFase(resumen.ordenesPorEstado, estados, "cerrada")} />
        </dl></section>
      ) : null}

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <BarraFiltrosOrdenes
          activos={activos}
          clientes={clientes}
          filtros={filtros}
          idTecnicoMisTareas={idTecnicoMisTareas}
          puedeFiltrarPorTecnico={puedeFiltrarPorTecnico}
          tecnicos={tecnicos}
        />

        {esCalendario || consulta === null ? (
          <CalendarioOrdenes filtros={filtros} />
        ) : (
          <section className="panel">
            <ZonaListado>
              <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />}>
                <ListadoOrdenes consulta={consulta} filtros={filtros} />
              </Suspense>
            </ZonaListado>
          </section>
        )}
      </ProveedorNavegacionListado>
    </main>
  );
}
