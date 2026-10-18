import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { archivoParcial, carpetaResultados, type Entrada } from "./casos";

const esperados = (() => {
  const origen = path.resolve(__dirname, "..", "..", "herramientas-plan", "salida", "casos-bugasura.json");
  const casos = JSON.parse(readFileSync(origen, "utf8")) as Array<Record<string, string>>;
  return casos
    .filter((c) => c.testing_type !== "API" && (c.feature_name === "Usuarios" || c.feature_name === "Clientes"))
    .map((c) => ({ caso: c.test_case_number, escenario: c.scenario, esperado: c.acceptance_criteria }));
})();

export default function cerrar() {
  const lineas = existsSync(archivoParcial)
    ? readFileSync(archivoParcial, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Entrada)
    : [];
  const porCaso = new Map<string, Entrada>();
  const archivoFinal = path.join(carpetaResultados, "ui-usuarios-clientes.json");
  if (existsSync(archivoFinal)) {
    for (const previa of JSON.parse(readFileSync(archivoFinal, "utf8")) as Entrada[]) porCaso.set(previa.caso, previa);
  }
  for (const entrada of lineas) porCaso.set(entrada.caso, entrada);
  for (const e of esperados) {
    if (!porCaso.has(e.caso)) {
      porCaso.set(e.caso, {
        ...e, resultado: "BLOQUEADO", observado: "No se ejecutó en esta corrida (spec no seleccionado o interrumpido).",
        motivo: "otro: ejecución incompleta",
      });
    }
  }
  const orden = (a: Entrada, b: Entrada) => Number(a.caso.slice(2)) - Number(b.caso.slice(2));
  const salida = [...porCaso.values()].sort(orden);
  writeFileSync(archivoFinal, JSON.stringify(salida, null, 2), "utf8");
  unlinkSync(archivoParcial);
}
