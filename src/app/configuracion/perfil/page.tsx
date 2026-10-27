import { FormularioPerfil } from "@/componentes/formulario-perfil";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { obtenerPerfilServidor } from "@/servicios/servidor/perfil";
import { actualizarPerfilAccion } from "./acciones";

export const metadata = { title: "Mi perfil" };

export default async function PaginaMiPerfil() {
  let perfil;
  try {
    perfil = await obtenerPerfilServidor();
  } catch {
    perfil = null;
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>Mi perfil</h1>
        </div>
      </header>

      {perfil ? (
        <div className="detalle-con-actividad">
          <section className="panel detail-panel">
            <dl className="detail-list">
              <div>
                <dt>Roles asignados</dt>
                <dd>{perfil.roles.length > 0 ? perfil.roles.map((rol) => rol.nombre).join(", ") : "Sin roles"}</dd>
              </div>
              <div>
                <dt>Fecha de ingreso</dt>
                <dd>{perfil.fechaIngreso}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd><EstadoRegistro estado={perfil.estado} /></dd>
              </div>
            </dl>
            <p className="texto-tenue text-sm">Los roles y el estado los define la administración de usuarios.</p>
          </section>
          <section className="panel perfil-formulario">
            <FormularioPerfil accion={actualizarPerfilAccion} perfil={perfil} />
          </section>
        </div>
      ) : (
        <p className="form-error-banner" role="alert">
          No se pudo obtener tu perfil. Si tu usuario no está registrado en SOTRA, consultá con la administración.
        </p>
      )}
    </main>
  );
}
