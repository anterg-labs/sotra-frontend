import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleOrdenTrabajo from "../page";
import { ContenidoEditarOrden } from "./contenido-editar-orden";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarOrden(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleOrdenTrabajo params={props.params} />
      <ModalDeRuta descripcion="Órdenes de trabajo" tamano="amplio" rutaDeRetorno={"/ordenes-trabajo/" + id} titulo="Modificar orden de trabajo">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarOrden params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
