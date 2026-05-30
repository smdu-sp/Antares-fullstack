/** @format */

import { IRespostaUsuario, IUsuarioTecnico } from "@/types/usuario";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarTecnicos(
  access_token: string,
  grupoAtivoId?: string,
): Promise<IRespostaUsuario> {
  const baseURL = getApiUrl();
  try {
    const usuarioNovo = await fetch(`${baseURL}usuarios/buscar-tecnicos`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
    });
    const data = await usuarioNovo.json();
    if (usuarioNovo.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IUsuarioTecnico[],
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
      error: "Não foi possível buscar o técnico:" + error,
      data: null,
      status: 400,
    };
  }
}
