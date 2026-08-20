/** @format */

import { IAndamento, IRespostaAndamento } from "@/types/processo";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function buscarPorProcesso(
  access_token: string,
  processo_id: string,
  grupoAtivoId?: string,
): Promise<IRespostaAndamento> {
  const baseURL = getInternalApiUrl();
  try {
    const andamentos = await fetch(
      `${baseURL}andamentos/processo/${processo_id}`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        next: { tags: ["andamentos"], revalidate: 120 },
      },
    );
    const data = await andamentos.json();
    if (andamentos.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IAndamento[],
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
      error: "Não foi possível buscar os andamentos: " + error,
      data: null,
      status: 400,
    };
  }
}
