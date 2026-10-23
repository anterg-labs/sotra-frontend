import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { rolesAsignables } from "@/seguridad/permisos";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { listarUsuariosServidor, listarRolesServidor } from "@/servicios/servidor/usuarios";
import { AltaUsuarioModal } from "./alta-usuario-modal";
import { BarraFiltrosUsuarios } from "./barra-filtros-usuarios";
import { leerFiltrosUsuarios } from "./filtros";
import { ListadoUsuarios } from "./listado-usuarios";

const ETIQUETA_CARGA = "Cargando usuarios…";

export default async function PaginaUsuarios(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const parametros = await props.searchParams;
  const filtros = leerFiltrosUsuarios(parametros);
  const consulta = anticiparConsulta(listarUsuariosServidor(filtros));
  const [roles, puedeGestionarAdministradores] = await Promise.all([
    listarRolesServidor().catch(() => null),
    tienePermisoServidor("usuario.gestionar_administradores"),
  ]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de usuarios</h1>
        </div>
        <AltaUsuarioModal roles={roles === null ? null : rolesAsignables(roles, puedeGestionarAdministradores)} />
      </header>

      {roles === null ? <p className="form-error-banner">No se pudo obtener el listado de roles.</p> : null}

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <BarraFiltrosUsuarios filtros={filtros} roles={roles ?? []} />

        <section className="panel">
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />}>
              <ListadoUsuarios consulta={consulta} filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </section>
      </ProveedorNavegacionListado>
    </main>
  );
}
