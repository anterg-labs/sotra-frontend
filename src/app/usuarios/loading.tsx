import { CargandoPagina } from "@/componentes/listado/cargando-pagina";

/** Aplica a toda la ruta /usuarios (listado, detalle, alta y edición) mientras el servidor prepara la pantalla. */
export default function CargandoUsuarios() {
  return <CargandoPagina />;
}
