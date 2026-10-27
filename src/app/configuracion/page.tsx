import Link from "next/link";
import { IconoConfiguracion, IconoUsuarios } from "@/componentes/iconos";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";

export const metadata = { title: "Configuración" };

type OpcionConfiguracion = { ruta: string; titulo: string; descripcion: string; icono: React.ReactNode };

/** Panel de «Configuración»: cada opción abre su propia pantalla; la lista depende de lo que la persona puede hacer. */
export default async function PaginaConfiguracion() {
  const opciones: OpcionConfiguracion[] = [
    {
      ruta: "/configuracion/perfil",
      titulo: "Mi perfil",
      descripcion: "Consultá y cambiá tus datos personales.",
      icono: <IconoUsuarios />,
    },
  ];
  if (await tienePermisoServidor("configuracion.gestionar")) {
    opciones.push({
      ruta: "/configuracion/terminos",
      titulo: "Términos y condiciones",
      descripcion: "Editá el documento que se muestra a las personas usuarias.",
      icono: <IconoConfiguracion />,
    });
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Configuración</h1>
        </div>
      </header>

      <ul aria-label="Opciones de configuración" className="opciones-configuracion">
        {opciones.map((opcion) => (
          <li key={opcion.ruta}>
            <Link className="opcion-configuracion" href={opcion.ruta}>
              <span aria-hidden="true" className="opcion-configuracion-icono">{opcion.icono}</span>
              <span>
                <strong>{opcion.titulo}</strong>
                <small>{opcion.descripcion}</small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
