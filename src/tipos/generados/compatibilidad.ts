import type { Cliente } from "@/tipos/cliente";
import type { Usuario } from "@/tipos/usuario";
import type { components } from "./api";

/**
 * Comprobaciones de compilación: los nombres de las propiedades de los contratos manuales del frontend deben ser los mismos
 * que publica la API en su documento OpenAPI (`npm run api:tipos` regenera `api.d.ts`). Si un contrato cambia en un
 * lado y no en el otro, `tsc` falla acá. Solo se comparan los nombres; los tipos de los números (`int64`) los publica
 * OpenAPI como número o texto y el frontend los usa como número.
 */
type Esquemas = components["schemas"];
type Igual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const usuarioCoincideConLaApi: Igual<keyof Usuario, keyof Esquemas["UsuarioListadoDto"]> = true;
export const clienteCoincideConLaApi: Igual<keyof Cliente, keyof Esquemas["ClienteListadoDto"]> = true;
