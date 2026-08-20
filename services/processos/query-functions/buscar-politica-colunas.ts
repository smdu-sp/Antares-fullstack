/** @format */

import {
  IPoliticaColunasProcesso,
  IRespostaPoliticaColunasProcesso,
} from "@/types/processo";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function buscarPoliticaColunas(
  access_token: string,
  grupoAtivoId?: string,
): Promise<IRespostaPoliticaColunasProcesso> {
  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}processos/colunas/politica`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      cache: "no-store",
    });

    const data = await response.json();

    if (response.status === 200) {
      return {
        ok: true,
        error: null,
        data: data as IPoliticaColunasProcesso,
        status: 200,
      };
    }

    return {
      ok: false,
      error: data?.message || "Erro ao buscar política de colunas",
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Não foi possível buscar política de colunas: " + error,
      data: null,
      status: 400,
    };
  }
}
