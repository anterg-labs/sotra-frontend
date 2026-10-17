import { leerIdFiltro, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarOrdenesTrabajoServidor, listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";
import { MiTrabajo } from "./mi-trabajo";

const estadosDelTrabajo = ["asignada", "en_ejecucion", "pausada"] as const;
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
      estadosDelTrabajo.map((estado) =>
        listarOrdenesTrabajoServidor({
          buscar: "", clienteId: "", activoId: "", tecnicoId, estado, prioridad: "", tipo: "",
          fechaDesde: "", fechaHasta: "", conSugerencias: false, pagina: 1,
        }),
      ),
    );
    return { ordenes: ordenarPorUrgencia(paginas.flatMap((pagina) => pagina.elementos)), error: "" };
  } catch {
    return { ordenes: null, error: "No se pudieron obtener tus órdenes. Revisá tu conexión e intentá de nuevo." };
  }
}

export default async function PaginaMiTrabajo(props: { searchParams: Promise<ParametrosBusqueda> }) {
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
      tecnicoId={tecnicoId}
      tecnicos={(tecnicos ?? []).map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }))}
    />
  );
}
