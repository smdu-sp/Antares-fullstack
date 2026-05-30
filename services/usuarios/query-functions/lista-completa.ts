/** @format */

import { IRespostaUsuario, IUsuario } from "@/types/usuario";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function listaCompleta(
  access_token: string,
  grupoAtivoId?: string,
): Promise<IRespostaUsuario> {
  const baseURL = getApiUrl();
  try {
    const alvaraTipos = await fetch(`${baseURL}usuarios/lista-completa`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
    });
    const data = await alvaraTipos.json();
    return {
      ok: true,
      error: null,
      data: data as IUsuario[],
      status: 200,
    };
  } catch (error) {
    // Erro ao buscar lista de usuários
    return {
      ok: false,
      error: "Não foi possível buscar a lista de usuários:" + error,
      data: null,
      status: 500,
    };
  }
}
