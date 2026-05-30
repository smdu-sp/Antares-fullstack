/** @format */

import { IGrupoAtivo, IRespostaGrupoAtivo } from "@/types/grupo-ativo";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarGrupoAtivo(
  access_token: string,
): Promise<IRespostaGrupoAtivo<IGrupoAtivo>> {
  const baseURL = getApiUrl();

  try {
    const response = await fetch(`${baseURL}grupo-ativo`, {
      method: "GET",
      headers: buildAuthHeaders(access_token),
      cache: "no-store",
    });

    const data = await response.json();

    if (response.status === 200) {
      return {
        ok: true,
        error: null,
        data: data as IGrupoAtivo,
        status: 200,
      };
    }

    return {
      ok: false,
      error: data?.message || "Erro ao buscar grupo ativo",
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Não foi possível buscar grupo ativo: ${error}`,
      data: null,
      status: 400,
    };
  }
}
