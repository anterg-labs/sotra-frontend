import { describe, expect, it } from "vitest";
import { estadosDePrueba } from "@/pruebas/estados-orden";
import { contarPorFase } from "./estados-orden";

const grupos = [
  { nombre: "creada", cantidad: 3 },
  { nombre: "asignada", cantidad: 2 },
  { nombre: "en_ejecucion", cantidad: 4 },
  { nombre: "cerrada", cantidad: 5 },
  { nombre: "sin_catalogo", cantidad: 9 },
];

describe("contarPorFase", () => {
  it("suma las órdenes de todos los estados de la fase según el catálogo", () => {
    expect(contarPorFase(grupos, estadosDePrueba, "pendiente")).toBe(5);
    expect(contarPorFase(grupos, estadosDePrueba, "pendiente", "en_curso")).toBe(9);
  });

  it("ignora los estados que el catálogo no conoce y devuelve cero sin catálogo", () => {
    expect(contarPorFase(grupos, estadosDePrueba, "cancelada")).toBe(0);
    expect(contarPorFase(grupos, [], "pendiente")).toBe(0);
  });
});
