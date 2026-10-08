export type ResultadoValidacion = "aceptada" | "rechazada" | "observada";

export type ValidacionRecomendacion = {
  resultado: ResultadoValidacion;
  observacion: string;
  fecha: string;
};

export type Recomendacion = {
  id: number;
  texto: string;
  estadoValidacion: "pendiente" | ResultadoValidacion;
  validaciones: ValidacionRecomendacion[];
};
