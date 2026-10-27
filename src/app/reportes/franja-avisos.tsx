import Link from "next/link";
import { resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import type { obtenerAvisosServidor } from "@/servicios/servidor/reportes";
import type { Aviso } from "@/tipos/reporte";

/** Enlace al dato que respalda el aviso: las órdenes de la máquina o las de un estado. */
export function enlaceDelAviso(aviso: Aviso) {
  if (aviso.activoId !== null) return "/ordenes-trabajo?activoId=" + aviso.activoId + "&tipo=correctivo";
  if (aviso.enlaceEstado !== null) return "/ordenes-trabajo?estado=" + aviso.enlaceEstado;
  return null;
}

/** Banda delgada con los avisos de ineficiencia; si no hay ninguno, no ocupa lugar. */
export async function FranjaAvisos({ consulta }: { consulta: ConsultaAnticipada<Awaited<ReturnType<typeof obtenerAvisosServidor>>> }) {
  let avisos;
  try {
    avisos = await resolverConsulta(consulta);
  } catch {
    return null;
  }

  if (avisos.total === 0) return null;
  const hayCriticos = avisos.criticos > 0;
  return (
    <details className={"franja-avisos" + (hayCriticos ? " franja-avisos-critica" : "")}>
      <summary>
        {avisos.total} {avisos.total === 1 ? "aviso" : "avisos"}
        {hayCriticos ? " · " + avisos.criticos + (avisos.criticos === 1 ? " crítico" : " críticos") : ""}
      </summary>
      <ul>
        {avisos.avisos.map((aviso, indice) => {
          const enlace = enlaceDelAviso(aviso);
          return (
            <li key={aviso.regla + "-" + indice}>
              <strong>
                <span className={"aviso-severidad" + (aviso.severidad === "critico" ? " aviso-severidad-critico" : "")}>
                  {aviso.severidad === "critico" ? "Crítico" : "Atención"}
                </span>
                {aviso.titulo}
              </strong>
              <p>{aviso.detalle}</p>
              {enlace ? <Link className="text-link" href={enlace}>Ver las órdenes</Link> : null}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
