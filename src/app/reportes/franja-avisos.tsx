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

function ListaDeAvisos({ avisos, titulo, severidad }: { avisos: Aviso[]; titulo: string; severidad: "critico" | "atencion" }) {
  if (avisos.length === 0) return null;
  return (
    <section aria-label={titulo}>
      <h3 className="franja-avisos-grupo">{titulo}</h3>
      <ul>
        {avisos.map((aviso, indice) => {
          const enlace = enlaceDelAviso(aviso);
          return (
            <li className={"aviso-" + severidad} key={aviso.regla + "-" + indice}>
              <strong>{aviso.titulo}</strong>
              <p>{aviso.detalle}</p>
              {enlace ? <Link className="text-link" href={enlace}>Ver las órdenes →</Link> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Franja con los avisos de ineficiencia: se despliega con un clic; si no hay ninguno, no ocupa lugar. */
export async function FranjaAvisos({ consulta }: { consulta: ConsultaAnticipada<Awaited<ReturnType<typeof obtenerAvisosServidor>>> }) {
  let avisos;
  try {
    avisos = await resolverConsulta(consulta);
  } catch {
    return null;
  }

  if (avisos.total === 0) return null;
  const criticos = avisos.avisos.filter((aviso) => aviso.severidad === "critico");
  const deAtencion = avisos.avisos.filter((aviso) => aviso.severidad !== "critico");
  return (
    <details className={"franja-avisos" + (criticos.length > 0 ? " franja-avisos-critica" : "")}>
      <summary>
        <svg aria-hidden="true" className="franja-avisos-icono" fill="none" height="22" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="22">
          <path d="M12 3 2.5 20h19L12 3Z" strokeLinejoin="round" />
          <path d="M12 10v4.5M12 17.5v.01" strokeLinecap="round" />
        </svg>
        <span className="franja-avisos-titulo">
          <strong>{avisos.total + (avisos.total === 1 ? " aviso" : " avisos")}</strong>
          <small>Cosas del mantenimiento que conviene revisar</small>
        </span>
        <span className="franja-avisos-chips">
          {criticos.length > 0 ? <span className="aviso-chip aviso-chip-critico">{criticos.length + (criticos.length === 1 ? " crítico" : " críticos")}</span> : null}
          {deAtencion.length > 0 ? <span className="aviso-chip">{deAtencion.length + " de atención"}</span> : null}
        </span>
        <span className="franja-avisos-accion">
          <span className="franja-avisos-abrir">Ver detalle</span>
          <span className="franja-avisos-cerrar">Ocultar</span>
          <svg aria-hidden="true" className="franja-avisos-flecha" fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="franja-avisos-cuerpo">
        <ListaDeAvisos avisos={criticos} severidad="critico" titulo="Críticos" />
        <ListaDeAvisos avisos={deAtencion} severidad="atencion" titulo="De atención" />
      </div>
    </details>
  );
}
