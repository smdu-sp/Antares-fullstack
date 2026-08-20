/** @format */

import { IGrupoAtivo, IRespostaGrupoAtivo } from "@/types/grupo-ativo";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function atualizarGrupoAtivo(
  access_token: string,
  grupoId: string,
): Promise<IRespostaGrupoAtivo<IGrupoAtivo>> {
  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}grupo-ativo`, {
      method: "PATCH",
      headers: buildAuthHeaders(access_token, grupoId),
      body: JSON.stringify({ grupoId }),
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
      error: data?.message || "Erro ao atualizar grupo ativo",
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Não foi possível atualizar grupo ativo: ${error}`,
      data: null,
      status: 400,
    };
  }
}
