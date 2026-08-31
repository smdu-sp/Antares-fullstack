/** @format */

import { IPaginadoUsuario, IRespostaUsuario } from "@/types/usuario";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function buscarTudo(
  access_token: string,
  pagina: number = 1,
  limite: number = 10,
  busca: string = "",
  status: string = "",
  dev: string = "",
  grupoAtivoId?: string,
): Promise<IRespostaUsuario> {
  const baseURL = getInternalApiUrl();
  try {
    const query = new URLSearchParams({
      pagina: String(pagina),
      limite: String(limite),
      busca,
      status,
      dev,
    });

    const usuarios = await fetch(
      `${baseURL}usuarios/buscar-tudo?${query.toString()}`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        next: { tags: ["users"], revalidate: 120 },
      },
    );
    const data = await usuarios.json();
    if (usuarios.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IPaginadoUsuario,
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
      error: "Não foi possível buscar a lista de usuários:" + error,
      data: null,
      status: 400,
    };
  }
}
