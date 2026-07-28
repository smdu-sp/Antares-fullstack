/** @format */

import { IAndamento, IRespostaAndamento } from "@/types/processo";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarTudo(
  access_token: string,
  pagina: number = 1,
  limite: number = 100,
  grupoAtivoId?: string,
): Promise<IRespostaAndamento> {
  const baseURL = getApiUrl();

  const response = await fetch(
    `${baseURL}andamentos?pagina=${pagina}&limite=${limite}`,
    {
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      // Usado para métricas do dashboard, não depende da busca do usuário;
      // cache curto evita refazer essa consulta pesada a cada tecla digitada.
      next: { tags: ["andamentos"], revalidate: 60 },
    },
  );

  const data = await response.json();

  if (response.status === 200) {
    return {
      ok: true,
      error: null,
      data: data,
      status: 200,
    };
  }

  return {
    ok: false,
    error: data.message,
    data: null,
    status: response.status,
  };
}
