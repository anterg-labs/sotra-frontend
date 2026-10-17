import { redirect } from "next/navigation";

/** «Configuración» agrupa pantallas de administración; hoy tiene una sola. */
export default function PaginaConfiguracion() {
  redirect("/configuracion/terminos");
}
