/** @format */

import { IPaginadoLog } from "@/types/log";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function buscarTudo(
  token: string,
  pagina?: number,
  limite?: number,
  tipoAcao?: string,
  entidadeTipo?: string,
  entidadeId?: string,
  usuario_id?: string,
  dataInicio?: string,
  dataFim?: string,
  grupoAtivoId?: string,
): Promise<{
  ok: boolean;
  data?: IPaginadoLog;
  error?: string;
  status: number;
}> {
  try {
    const params = new URLSearchParams();
    if (pagina) params.append("pagina", pagina.toString());
    if (limite) params.append("limite", limite.toString());
    if (tipoAcao) params.append("tipoAcao", tipoAcao);
    if (entidadeTipo) params.append("entidadeTipo", entidadeTipo);
    if (entidadeId) params.append("entidadeId", entidadeId);
    if (usuario_id) params.append("usuario_id", usuario_id);
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);

    const response = await fetch(
      `${getInternalApiUrl()}logs?${params.toString()}`,
      {
        method: "GET",
        headers: buildAuthHeaders(token, grupoAtivoId),
        next: { tags: ["logs"] },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.message || "Erro ao buscar logs",
        status: response.status,
      };
    }

    return {
      ok: true,
      data: data as IPaginadoLog,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      status: 500,
    };
  }
}
