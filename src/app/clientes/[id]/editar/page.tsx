import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleCliente from "../page";
import { ContenidoEditarCliente } from "./contenido-editar-cliente";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarCliente(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleCliente params={props.params} />
      <ModalDeRuta descripcion="Gestión de clientes" rutaDeRetorno={"/clientes/" + id} titulo="Modificar cliente">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarCliente params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
