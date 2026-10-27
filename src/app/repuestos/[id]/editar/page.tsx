import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleRepuesto from "../page";
import { ContenidoEditarRepuesto } from "./contenido-editar-repuesto";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarRepuesto(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleRepuesto params={props.params} searchParams={Promise.resolve({})} />
      <ModalDeRuta descripcion="Gestión de repuestos" rutaDeRetorno={"/repuestos/" + id} titulo="Modificar repuesto">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarRepuesto params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
