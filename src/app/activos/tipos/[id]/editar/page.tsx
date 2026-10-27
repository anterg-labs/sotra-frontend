import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleTipoMaquina from "../page";
import { ContenidoEditarTipo } from "./contenido-editar-tipo";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarTipo(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleTipoMaquina params={props.params} />
      <ModalDeRuta descripcion="Gestión de tipos de máquina" rutaDeRetorno={"/activos/tipos/" + id} titulo="Modificar tipo de máquina">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarTipo params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
