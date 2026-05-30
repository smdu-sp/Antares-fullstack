/** @format */

import {
  ICoordenadoriaApiResponse,
  ICoordenadoriaConfiguracao,
} from "@/types/coordenadoria";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarConfiguracao(
  access_token: string,
  tela: "processos" | "andamentos",
  grupoAtivoId?: string,
): Promise<ICoordenadoriaApiResponse<ICoordenadoriaConfiguracao>> {
  const baseURL = (
    getApiUrl()
  ).replace(/\/$/, "");

  try {
    const response = await fetch(
      `${baseURL}/coordenadorias/configuracao?tela=${tela}`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (response.status === 200) {
      return { ok: true, error: null, data, status: 200 };
    }

    return {
      ok: false,
      error: data?.message || "Erro ao buscar configuração",
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Não foi possível buscar configuração: ${error}`,
      data: null,
      status: 400,
    };
  }
}
