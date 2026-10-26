import { leerIdFiltro, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { tienePermiso } from "@/seguridad/permisos";
import { obtenerEstadoSesion } from "@/servicios/servidor/sesion";
import { listarOrdenesTrabajoServidor, listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";
import { MiTrabajo } from "./mi-trabajo";

// Trabajo vivo del técnico: lo que espera y lo que está en curso. Qué estados son los dicta la base (fase).
const fasesDelTrabajo = ["pendiente", "en_curso"] as const;
const pesoDePrioridad = { alta: 0, media: 1, baja: 2 } as const;

function ordenarPorUrgencia(ordenes: OrdenTrabajo[]) {
  return [...ordenes].sort(
    (a, b) =>
      pesoDePrioridad[a.prioridad] - pesoDePrioridad[b.prioridad] ||
      a.fechaPrevistaEjecucion.localeCompare(b.fechaPrevistaEjecucion) ||
      a.id - b.id,
  );
}

async function cargarOrdenes(tecnicoId: string) {
  if (tecnicoId === "") return { ordenes: null, error: "" };
  try {
    const paginas = await Promise.all(
      fasesDelTrabajo.map((fase) =>
        listarOrdenesTrabajoServidor({
          buscar: "", clienteId: "", activoId: "", tecnicoId, estado: "", fase, prioridad: "", tipo: "",
          fechaDesde: "", fechaHasta: "", conSugerencias: false, pagina: 1,
        }),
      ),
    );
    return { ordenes: ordenarPorUrgencia(paginas.flatMap((pagina) => pagina.elementos)), error: "" };
  } catch {
    return { ordenes: null, error: "No se pudieron obtener tus órdenes. Revisá tu conexión e intentá de nuevo." };
  }
}

/**
 * El técnico ve sus propias órdenes (el usuario de la sesión). Quien puede listar usuarios (administrador y jefe)
 * elige el técnico en un selector, para ver el trabajo de cualquiera.
 */
export default async function PaginaMiTrabajo(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const sesion = await obtenerEstadoSesion();
  const usuario = sesion.estado === "con-acceso" ? sesion.usuario : null;
  const puedeElegirTecnico = usuario !== null && tienePermiso(usuario.roles, "usuario.listar");

  if (!puedeElegirTecnico) {
    const tecnicoId = usuario?.idUsuario ? String(usuario.idUsuario) : "";
    const { ordenes, error } = await cargarOrdenes(tecnicoId);
    return <MiTrabajo error={error} ordenes={ordenes} puedeElegirTecnico={false} tecnicoId={tecnicoId} tecnicos={[]} />;
  }

  const tecnicoId = leerIdFiltro(await props.searchParams, "tecnicoId");
  const [{ ordenes, error }, tecnicos] = await Promise.all([
    cargarOrdenes(tecnicoId),
    listarTecnicosServidor()
      .then((lista) => conSeleccionado<Usuario>(lista, tecnicoId, obtenerUsuarioServidor))
      .catch(() => null),
  ]);

  return (
    <MiTrabajo
      error={tecnicos === null && error === "" ? "No se pudo obtener la lista de técnicos." : error}
      ordenes={ordenes}
      puedeElegirTecnico
      tecnicoId={tecnicoId}
      tecnicos={(tecnicos ?? []).map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }))}
    />
  );
}
