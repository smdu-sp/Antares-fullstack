/** @format */

import { IRespostaUnidade, IUnidade } from "@/types/unidade";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

/** Espelha services/unidades/query-functions/buscar-por-id.ts, pra unidades-grupo. */
export async function buscarPorId(
  access_token: string,
  id: string,
  grupoAtivoId?: string,
): Promise<IRespostaUnidade> {
  const baseURL = getInternalApiUrl();
  try {
    const unidade = await fetch(`${baseURL}unidades-grupo/${id}`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      next: { tags: ["unidade-grupo-by-id"], revalidate: 120 },
    });
    const data = await unidade.json();
    if (unidade.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IUnidade,
        status: 200,
      };
    return {
      ok: false,
      error: data.message,
      data: null,
      status: data.statusCode,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Não foi possível buscar a unidade: " + error,
      data: null,
      status: 400,
    };
  }
}
