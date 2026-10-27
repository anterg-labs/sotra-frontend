import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleDocumentoTecnico from "../page";
import { ContenidoEditarDocumento } from "./contenido-editar-documento";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarDocumento(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleDocumentoTecnico params={props.params} />
      <ModalDeRuta descripcion="Documentación técnica" rutaDeRetorno={"/documentacion-tecnica/" + id} titulo="Modificar documento">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarDocumento params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
