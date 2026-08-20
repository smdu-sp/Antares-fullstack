/** @format */

import { IRespostaUnidade, IUnidade } from "@/types/unidade";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function listaCompleta(
  access_token: string,
  grupoAtivoId?: string,
): Promise<IRespostaUnidade> {
  const baseURL = getInternalApiUrl();
  try {
    const unidades = await fetch(`${baseURL}unidades/lista-completa`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      next: { tags: ["unidades"], revalidate: 120 },
    });
    const data = await unidades.json();

    if (unidades.status === 200) {
      return {
        ok: true,
        error: null,
        data: data as IUnidade[],
        status: 200,
      };
    }

    return {
      ok: false,
      error: data.message,
      data: null,
      status: data.statusCode,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Não foi possível buscar a lista de unidades: " + error,
      data: null,
      status: 400,
    };
  }
}
