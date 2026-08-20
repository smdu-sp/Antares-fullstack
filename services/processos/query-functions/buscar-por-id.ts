/** @format */

import { IProcesso, IRespostaProcesso } from "@/types/processo";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function buscarPorId(
  access_token: string,
  id: string,
  grupoAtivoId?: string,
): Promise<IRespostaProcesso> {
  const baseURL = getInternalApiUrl();
  try {
    const processo = await fetch(
      `${baseURL}processos/${id}?include=unidadeInteressada,unidadeRemetente`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        next: { tags: ["processos"], revalidate: 120 },
      },
    );
    const data = await processo.json();
    if (processo.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IProcesso,
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
      error: "Não foi possível buscar o processo: " + error,
      data: null,
      status: 400,
    };
  }
}
