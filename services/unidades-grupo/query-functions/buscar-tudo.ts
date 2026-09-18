/** @format */

import { IPaginadoUnidade, IRespostaUnidade } from "@/types/unidade";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

/** Espelha services/unidades/query-functions/buscar-tudo.ts, pra unidades-grupo (por grupo). */
export async function buscarTudo(
  access_token: string,
  pagina: number = 1,
  limite: number = 10,
  busca: string = "",
  grupoAtivoId?: string,
): Promise<IRespostaUnidade> {
  const baseURL = getInternalApiUrl();
  try {
    const unidades = await fetch(
      `${baseURL}unidades-grupo?pagina=${pagina}&limite=${limite}&busca=${busca}`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        next: { tags: ["unidades-grupo"], revalidate: 120 },
      },
    );
    const data = await unidades.json();
    if (unidades.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IPaginadoUnidade,
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
      error: "Não foi possível buscar a lista de unidades: " + error,
      data: null,
      status: 400,
    };
  }
}
