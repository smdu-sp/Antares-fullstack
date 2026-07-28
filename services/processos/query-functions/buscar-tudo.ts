/** @format */

import { IPaginadoProcesso, IRespostaProcesso } from "@/types/processo";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarTudo(
  access_token: string,
  pagina: number = 1,
  limite: number = 10,
  busca: string = "",
  vencendoHoje: boolean = false,
  atrasados: boolean = false,
  unidade?: string,
  grupoAtivoId?: string,
  interessado?: string,
  concluidos?: boolean,
  // Permite cache curto para chamadas que não dependem da busca do usuário
  // (ex.: total geral do dashboard). A busca do usuário deve sempre usar no-store.
  permitirCache: boolean = false,
): Promise<IRespostaProcesso> {
  const baseURL = getApiUrl();
  try {
    const params = new URLSearchParams({
      pagina: pagina.toString(),
      limite: limite.toString(),
      include: "unidadeInteressada,unidadeRemetente,unidadeDestino",
      ...(busca && { busca }),
      ...(vencendoHoje && { vencendoHoje: "true" }),
      ...(atrasados && { atrasados: "true" }),
      ...(unidade && { unidade }),
      ...(interessado && { interessado }),
      ...(concluidos && { concluidos: "true" }),
    });

    const processos = await fetch(`${baseURL}processos?${params.toString()}`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      ...(permitirCache
        ? { next: { tags: ["processos"], revalidate: 60 } }
        : { cache: "no-store" as const }),
    });
    const data = await processos.json();
    if (processos.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IPaginadoProcesso,
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
      error: "Não foi possível buscar a lista de processos: " + error,
      data: null,
      status: 400,
    };
  }
}
