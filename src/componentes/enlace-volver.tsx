import Link from "next/link";
import { IconoFlechaIzquierda } from "@/componentes/iconos";

type PropiedadesEnlaceVolver = {
  etiqueta: string;
  href: string;
};

/** Flecha a la izquierda del título para volver a la pantalla anterior; la etiqueta queda como nombre accesible. */
export function EnlaceVolver(props: PropiedadesEnlaceVolver) {
  return (
    <Link aria-label={props.etiqueta} className="enlace-volver" href={props.href} title={props.etiqueta}>
      <IconoFlechaIzquierda />
    </Link>
  );
}
