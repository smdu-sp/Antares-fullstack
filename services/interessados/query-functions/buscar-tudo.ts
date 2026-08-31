/** @format */

import { IPaginadoInteressado } from "@/types/interessado";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

interface IRespostaInteressado {
  ok: boolean;
  error: string | null;
  data: IPaginadoInteressado | null;
  status: number;
}

export async function buscarTudo(
  access_token: string,
  pagina: number = 1,
  limite: number = 10,
  busca: string = "",
  grupoAtivoId?: string,
): Promise<IRespostaInteressado> {
  const baseURL = getInternalApiUrl();
  try {
    const response = await fetch(
      `${baseURL}interessados?pagina=${pagina}&limite=${limite}&busca=${busca}`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        cache: "no-store",
      },
    );
    const data = await response.json();
    if (response.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IPaginadoInteressado,
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
      error: "Não foi possível buscar a lista de interessados: " + error,
      data: null,
      status: 400,
    };
  }
}
