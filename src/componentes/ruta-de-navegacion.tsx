"use client";

import Link from "next/link";
import { usePathname, useRouter, useSelectedLayoutSegment } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { IconoFlechaIzquierda } from "@/componentes/iconos";

type Migaja = { etiqueta: string; ruta: string };
const ContextoRutaAnterior = createContext<string | null>(null);

/** Comparte la última página interna con la ruta visible y los formularios abiertos como modal. */
export function ProveedorHistorialNavegacion(props: { children: React.ReactNode }) {
  const ruta = usePathname();
  const ultimaRuta = useRef(ruta);
  const [rutaAnterior, setRutaAnterior] = useState<string | null>(null);
  useEffect(() => {
    if (ultimaRuta.current !== ruta) {
      setRutaAnterior(ultimaRuta.current);
      ultimaRuta.current = ruta;
    }
  }, [ruta]);
  return <ContextoRutaAnterior.Provider value={rutaAnterior}>{props.children}</ContextoRutaAnterior.Provider>;
}

const SECCIONES: Record<string, string> = {
  "ordenes-trabajo": "Órdenes de trabajo",
  clientes: "Clientes",
  activos: "Activos",
  repuestos: "Repuestos",
  usuarios: "Usuarios",
  "documentacion-tecnica": "Documentación",
  configuracion: "Configuración",
  tecnico: "Mi trabajo",
};

const SUBSECCIONES: Record<string, string> = {
  "activos/modelos": "Modelos de máquina",
  "activos/tipos": "Tipos de máquina",
  "repuestos/movimientos": "Movimientos de stock",
  "configuracion/terminos": "Términos y condiciones",
  "configuracion/perfil": "Mi perfil",
  "configuracion/avisos": "Reglas de avisos",
  "configuracion/reportes": "Reportes",
  "configuracion/demoras-etapas": "Demoras por etapa",
};

const DETALLES: Record<string, (id: string) => string> = {
  "ordenes-trabajo": (id) => "Orden N° " + id,
  clientes: () => "Detalle del cliente",
  activos: () => "Detalle del activo",
  "activos/modelos": () => "Detalle del modelo",
  "activos/tipos": () => "Detalle del tipo",
  repuestos: () => "Detalle del repuesto",
  "repuestos/movimientos": (id) => "Movimiento N° " + id,
  usuarios: () => "Detalle del usuario",
  "documentacion-tecnica": () => "Detalle del documento",
  tecnico: (id) => "Orden N° " + id,
};

const ACCIONES: Record<string, string> = { nuevo: "Nuevo registro", editar: "Editar" };

/** Migajas de la ruta actual; vacío si la pantalla es de primer nivel o no está en el mapa. */
export function migajasDeRuta(ruta: string): Migaja[] {
  const segmentos = ruta.split("/").filter(Boolean);
  if (segmentos.length < 2 || !(segmentos[0] in SECCIONES)) return [];

  const migajas: Migaja[] = [{ etiqueta: SECCIONES[segmentos[0]], ruta: "/" + segmentos[0] }];
  let clave = segmentos[0];
  for (let indice = 1; indice < segmentos.length; indice += 1) {
    const segmento = segmentos[indice];
    const rutaAcumulada = "/" + segmentos.slice(0, indice + 1).join("/");
    const subseccion = SUBSECCIONES[clave + "/" + segmento];
    if (subseccion) {
      clave = clave + "/" + segmento;
      migajas.push({ etiqueta: subseccion, ruta: rutaAcumulada });
    } else if (segmento in ACCIONES) {
      const prefijo = ACCIONES[segmento];
      migajas.push({ etiqueta: segmento === "nuevo" ? etiquetaDeAlta(clave) : prefijo, ruta: rutaAcumulada });
    } else if (/^\d+$/.test(segmento) && DETALLES[clave]) {
      migajas.push({ etiqueta: DETALLES[clave](segmento), ruta: rutaAcumulada });
    } else {
      return [];
    }
  }
  return migajas;
}

function etiquetaDeAlta(clave: string) {
  const nombres: Record<string, string> = {
    "ordenes-trabajo": "Nueva orden",
    clientes: "Nuevo cliente",
    activos: "Nuevo activo",
    "activos/modelos": "Nuevo modelo",
    "activos/tipos": "Nuevo tipo",
    repuestos: "Nuevo repuesto",
    usuarios: "Nuevo usuario",
    "documentacion-tecnica": "Nuevo documento",
  };
  return nombres[clave] ?? "Nuevo registro";
}

/**
 * Dónde está la persona dentro de la aplicación («Órdenes de trabajo / Orden N° 8»), con cada nivel anterior como enlace
 * para volver. Se oculta mientras hay un modal abierto: la pantalla de fondo es otra.
 */
export function RutaDeNavegacion(props: { enModal?: boolean } = {}) {
  const ruta = usePathname();
  const enrutador = useRouter();
  const hayModal = useSelectedLayoutSegment("modal") !== null;
  const rutaAnterior = useContext(ContextoRutaAnterior);
  const migajas = hayModal && !props.enModal ? [] : migajasDeRuta(ruta ?? "");
  if (migajas.length === 0) return null;

  const rutaSuperior = migajas.at(-2)?.ruta ?? migajas[0].ruta;

  function volver() {
    if (rutaAnterior && rutaAnterior !== ruta) enrutador.back();
    else enrutador.push(rutaSuperior);
  }

  return (
    <nav aria-label="Ruta de navegación" className={"ruta-navegacion" + (props.enModal ? " ruta-navegacion-modal" : "")}>
      <button aria-label="Volver" className="enlace-volver" onClick={volver} title="Volver" type="button">
        <IconoFlechaIzquierda />
      </button>
      <ol>
        {migajas.map((migaja, indice) => {
          const esUltima = indice === migajas.length - 1;
          return (
            <li key={migaja.ruta}>
              {esUltima ? (
                <span aria-current="page">{migaja.etiqueta}</span>
              ) : (
                <Link href={migaja.ruta}>{migaja.etiqueta}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
