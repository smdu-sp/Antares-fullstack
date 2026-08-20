/** @format */

import { IRespostaUsuario, IUsuario } from "@/types/usuario";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function validaUsuario(
  access_token: string,
  grupoAtivoId?: string,
): Promise<IRespostaUsuario> {
  const baseURL = getInternalApiUrl();
  try {
    const usuario = await fetch(`${baseURL}usuarios/valida-usuario`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
    });
    const data = await usuario.json();
    if (usuario.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IUsuario,
        status: 200,
      };
    return {
      ok: false,
      error: data.message,
      data: null,
      status: data.statusCode,
    };
  } catch (error) {
    // Erro ao validar usuário
    return {
      ok: false,
      error: "Não foi possível validar o usuário:" + error,
      data: null,
      status: 500,
    };
  }
}
