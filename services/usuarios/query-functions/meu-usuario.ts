/** @format */

import { IRespostaUsuario, IUsuario } from "@/types/usuario";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarMeuUsuario(
  access_token: string,
  grupoAtivoId?: string,
): Promise<IRespostaUsuario> {
  if (!access_token || access_token === "")
    return {
      ok: false,
      error: "Não foi possível buscar o usuário, Token inválido.",
      data: null,
      status: 400,
    };
  const baseURL = getApiUrl();
  try {
    const usuarios = await fetch(`${baseURL}usuario-atual`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
    });
    const data = await usuarios.json();
    if (usuarios.status === 200)
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
    return {
      ok: false,
      error: "Não foi possível buscar o usuário:" + error,
      data: null,
      status: 400,
    };
  }
}
