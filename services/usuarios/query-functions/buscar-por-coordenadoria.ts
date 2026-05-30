/** @format */

import { IPaginadoUsuario, IRespostaUsuario } from "@/types/usuario";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarPorCoordenadoria(
  access_token: string,
  coordenadoria: string,
  pagina: number = 1,
  limite: number = 10,
  busca: string = "",
  status: string = "",
  permissao: string = "",
  permissaoCoordenadoria: string = "",
  grupoAtivoId?: string,
): Promise<IRespostaUsuario> {
  const baseURL = getApiUrl();

  try {
    const query = new URLSearchParams({
      pagina: String(pagina),
      limite: String(limite),
      busca,
      status,
      permissao,
      permissaoCoordenadoria,
    });

    const response = await fetch(
      `${baseURL}usuarios/buscar-por-coordenadoria/${coordenadoria}?${query.toString()}`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        next: { tags: ["users"], revalidate: 120 },
      },
    );

    const data = await response.json();

    if (response.status === 200) {
      return {
        ok: true,
        error: null,
        data: data as IPaginadoUsuario,
        status: 200,
      };
    }

    return {
      ok: false,
      error: data.message,
      data: null,
      status: data.statusCode,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Não foi possível buscar usuários por coordenadoria: " + error,
      data: null,
      status: 400,
    };
  }
}
