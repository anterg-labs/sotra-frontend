import { apiObtenerIndicadores } from "@/servicios/api/api-reportes";

export async function obtenerIndicadores() {
  return apiObtenerIndicadores();
}
