import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleUsuario from "../page";
import { ContenidoEditarUsuario } from "./contenido-editar-usuario";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarUsuario(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleUsuario params={props.params} />
      <ModalDeRuta descripcion="Gestión de usuarios" rutaDeRetorno={"/usuarios/" + id} titulo="Modificar usuario">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarUsuario params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
