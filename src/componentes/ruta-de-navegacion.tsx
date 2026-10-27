"use client";

import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";

type Migaja = { etiqueta: string; ruta: string };

const SECCIONES: Record<string, string> = {
  "ordenes-trabajo": "Órdenes de trabajo",
  clientes: "Clientes",
  activos: "Activos",
  repuestos: "Repuestos",
  usuarios: "Usuarios",
  "documentacion-tecnica": "Documentación",
  configuracion: "Configuración",
};

const SUBSECCIONES: Record<string, string> = {
  "activos/modelos": "Modelos de máquina",
  "activos/tipos": "Tipos de máquina",
  "repuestos/movimientos": "Movimientos de stock",
  "configuracion/terminos": "Términos y condiciones",
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
};

const ACCIONES: Record<string, string> = { nuevo: "Nuevo registro", editar: "Modificar" };

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
      migajas.push({ etiqueta: segmento === "nuevo" ? "Nuevo " + etiquetaDeAlta(clave) : prefijo, ruta: rutaAcumulada });
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
    "ordenes-trabajo": "orden",
    clientes: "cliente",
    activos: "activo",
    "activos/modelos": "modelo",
    "activos/tipos": "tipo",
    repuestos: "repuesto",
    usuarios: "usuario",
    "documentacion-tecnica": "documento",
  };
  return nombres[clave] ?? "registro";
}

/**
 * Dónde está la persona dentro de la aplicación («Órdenes de trabajo / Orden N° 8»), con cada nivel anterior como enlace
 * para volver. Se oculta mientras hay un modal abierto: la pantalla de fondo es otra.
 */
export function RutaDeNavegacion() {
  const ruta = usePathname();
  const hayModal = useSelectedLayoutSegment("modal") !== null;
  const migajas = hayModal ? [] : migajasDeRuta(ruta ?? "");
  if (migajas.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className="ruta-navegacion">
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
