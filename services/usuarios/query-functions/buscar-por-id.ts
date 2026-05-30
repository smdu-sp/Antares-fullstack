/** @format */

import { IRespostaUsuario, IUsuario } from "@/types/usuario";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarPorId(
  id: string,
  access_token: string,
  grupoAtivoId?: string,
): Promise<IRespostaUsuario> {
  if (!id || id === "")
    return {
      ok: false,
      error: "Não foi possível buscar o usuário, ID vazio.",
      data: null,
      status: 400,
    };
  const baseURL = getApiUrl();
  try {
    const usuarios = await fetch(`${baseURL}usuarios/buscar-por-id/${id}`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      next: { tags: ["user-by-id"] },
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
